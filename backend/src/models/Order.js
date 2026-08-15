const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
});

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const quotationItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, default: '' },
    sku: { type: String, default: '' },
    categoryName: { type: String, default: '' },
    subcategoryName: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    amount: { type: Number, default: 0, min: 0 },
    discountType: {
      type: String,
      enum: ['none', 'percent', 'amount'],
      default: 'none',
    },
    discountValue: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['none', 'draft', 'sent'],
      default: 'none',
    },
    items: [quotationItemSchema],
    courierCharges: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 0, enum: [0, 5, 12, 18, 28] },
    itemsSubtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    savedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    billingAddress: addressSnapshotSchema,
    shippingAddress: addressSnapshotSchema,
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'card', 'upi', 'bank_transfer'],
      default: 'cod',
    },
    orderStatus: {
      type: String,
      enum: [
        'enquiry_received',
        'quotation_sent',
        'confirmed',
        'order_received',
        'cancelled',
        // legacy (kept for migration compatibility)
        'pending',
        'shipped',
        'delivered',
      ],
      default: 'enquiry_received',
    },
    quotation: {
      type: quotationSchema,
      default: () => ({ status: 'none', items: [], courierCharges: 0, gstPercent: 0 }),
    },
    notes: { type: String, default: '' },
    cancelledBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      mobile: { type: String, default: '' },
      role: { type: String, default: '' },
      at: { type: Date, default: null },
      note: { type: String, default: '' },
    },
    statusHistory: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
        byName: String,
        byEmail: String,
        byMobile: String,
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        byRole: { type: String, default: '' },
        fromStatus: { type: String, default: '' },
      },
    ],
    ...auditFields,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
