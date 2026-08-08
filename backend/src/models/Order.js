const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    billingAddress: addressSnapshotSchema,
    shippingAddress: addressSnapshotSchema,
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
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
        'pending',
        'quotation_sent',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    /** Snapshot of who cancelled (admin or customer) — set only when cancelled */
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
        /** Previous status value before this change */
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
