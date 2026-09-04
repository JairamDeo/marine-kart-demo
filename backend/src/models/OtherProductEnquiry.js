const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const enquiryProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true },
    modelSku: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    specification: { type: String, required: true, trim: true },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
  },
  { _id: true }
);

const otherProductEnquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Multi-product lines (preferred) */
    products: { type: [enquiryProductSchema], default: [] },
    /** Legacy single-product fields (kept for older enquiries) */
    productName: { type: String, default: '', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    categoryName: { type: String, default: '', trim: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    subcategoryName: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    address: { type: String, required: true, trim: true },
    deliveryAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    status: {
      type: String,
      enum: ['new', 'read', 'closed'],
      default: 'new',
    },
    ...auditFields,
  },
  { timestamps: true }
);

otherProductEnquirySchema.index({ createdAt: -1 });
otherProductEnquirySchema.index({ status: 1, createdAt: -1 });
otherProductEnquirySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('OtherProductEnquiry', otherProductEnquirySchema);
