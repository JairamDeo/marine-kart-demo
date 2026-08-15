const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { auditFields } = require('../utils/audit');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true, default: '' },
    /** Storefront: one email = normal OR corporate (not both). Admin may reuse that email. */
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    altPhone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      // dealer kept for legacy docs; treat as corporate in app
      enum: ['customer', 'corporate', 'dealer', 'admin'],
      default: 'customer',
    },
    /** 1 = list price; lower = corporate custom rate (admin-set). Kept for legacy; not driven by display discount UI. */
    priceMultiplier: { type: Number, default: 1, min: 0.1, max: 1 },
    /**
     * Admin display-only corporate discount (not applied to storefront pricing).
     * type: percent | cash
     */
    corporateDiscountType: {
      type: String,
      enum: ['percent', 'cash', ''],
      default: '',
    },
    corporateDiscountValue: { type: Number, default: 0, min: 0 },
    companyName: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, default: '' },
    annualVolume: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    companyAddress: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
    /** Explicit false = must verify email OTP. Missing/true = verified (legacy). */
    emailVerified: { type: Boolean, default: true },
    /**
     * Storefront accounts need admin approval after email OTP.
     * Legacy / admin users default to approved so existing logins keep working.
     */
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    emailOtpHash: { type: String, select: false, default: '' },
    emailOtpExpires: { type: Date, select: false, default: null },
    /** Forgot-password OTP — separate from registration email OTP. */
    passwordResetOtpHash: { type: String, select: false, default: '' },
    passwordResetOtpExpires: { type: Date, select: false, default: null },
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
        },
        userAgent: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    ...auditFields,
  },
  { timestamps: true }
);

/** One storefront account per email (normal or corporate — not both). Admin emails are separate. */
userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: 'email_1_storefront_unique',
    partialFilterExpression: { role: { $in: ['customer', 'corporate', 'dealer'] } },
  }
);
userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: 'email_1_admin_unique',
    partialFilterExpression: { role: 'admin' },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const role = this.role === 'dealer' ? 'corporate' : this.role;
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    altPhone: this.altPhone || '',
    role,
    priceMultiplier: this.priceMultiplier,
    corporateDiscountType: this.corporateDiscountType || '',
    corporateDiscountValue: this.corporateDiscountValue || 0,
    companyName: this.companyName || '',
    gstNumber: this.gstNumber || '',
    annualVolume: this.annualVolume || '',
    designation: this.designation || '',
    companyAddress: this.companyAddress || {},
    addresses: this.addresses,
    isActive: this.isActive,
    emailVerified: this.emailVerified !== false,
    approvalStatus: this.approvalStatus || 'approved',
    approvedAt: this.approvedAt || null,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
