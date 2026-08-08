const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    link: { type: String, default: '' },
    position: {
      type: String,
      enum: ['hero', 'side_top', 'side_bottom', 'promo'],
      default: 'hero',
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ...auditFields,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
