const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    /** Auto-generated: prd-mm/yy-0001 — stored only, not shown in storefront UI */
    sku: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    specifications: [
      {
        key: String,
        value: String,
      },
    ],
    /** Max quantity a user may select for this product in one cart/order. 0 = unlimited. */
    maxOrderQty: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
      keywords: String,
    },
    ...auditFields,
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text', shortDescription: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ isFeatured: 1, isBestSeller: 1, isNewArrival: 1 });
productSchema.index({ name: 1 });

/**
 * Apply login-to-view-price rules.
 * Guest → price hidden. Logged-in → list/sale price × user multiplier.
 * SKU/stock are not exposed to storefront JSON.
 */
productSchema.methods.toPublicJSON = function toPublicJSON(user) {
  const base = {
    id: this._id,
    name: this.name,
    slug: this.slug,
    shortDescription: this.shortDescription,
    description: this.description,
    specifications: this.specifications,
    maxOrderQty: this.maxOrderQty || 0,
    images: this.images,
    category: this.category,
    subcategory: this.subcategory,
    isFeatured: this.isFeatured,
    isBestSeller: this.isBestSeller,
    isNewArrival: this.isNewArrival,
    relatedProducts: this.relatedProducts,
    priceVisible: Boolean(user),
  };

  if (!user) {
    return { ...base, price: null, salePrice: null, displayPrice: null };
  }

  const multiplier = user.priceMultiplier ?? 1;
  const listPrice = Math.round(this.price * multiplier * 100) / 100;
  const sale =
    this.salePrice != null
      ? Math.round(this.salePrice * multiplier * 100) / 100
      : null;

  return {
    ...base,
    price: listPrice,
    salePrice: sale,
    displayPrice: sale ?? listPrice,
  };
};

module.exports = mongoose.model('Product', productSchema);
