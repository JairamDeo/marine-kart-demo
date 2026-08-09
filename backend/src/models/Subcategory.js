const mongoose = require('mongoose');
const { auditFields, actorStampSchema } = require('../utils/audit');

/**
 * Subcategories live in their own collection.
 * Mapped to a main category via `category` ObjectId (no parent tree on Category).
 */
const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Internal code e.g. sub-mm/yy-0001 — not shown on storefront */
    code: { type: String, unique: true, sparse: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    /** Main category this subcategory belongs to */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: String,
      description: String,
      keywords: String,
    },
    ...auditFields,
    deletedBy: { type: actorStampSchema, default: () => ({}) },
  },
  { timestamps: true }
);

subcategorySchema.index({ category: 1, sortOrder: 1 });
subcategorySchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('Subcategory', subcategorySchema);
