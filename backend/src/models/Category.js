const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

/** Main categories only — subcategories are in the Subcategory collection. */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Auto: cat-mm/yy-0001 — stored, hidden from storefront */
    code: { type: String, unique: true, sparse: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: String,
      description: String,
      keywords: String,
    },
    ...auditFields,
  },
  { timestamps: true }
);

categorySchema.index({ sortOrder: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
