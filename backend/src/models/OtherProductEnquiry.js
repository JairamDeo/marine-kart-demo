const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const otherProductEnquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    categoryName: { type: String, default: '', trim: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    subcategoryName: { type: String, default: '', trim: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
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
