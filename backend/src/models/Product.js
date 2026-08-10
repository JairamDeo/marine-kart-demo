const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

/**
 * Specs are either markdown text OR a single image (mutually exclusive modes).
 * Legacy products may still have specifications as [{ key, value }] — normalized in toPublicJSON.
 */
const productSchema = new mongoose.Schema(
  {
    /** Catalog product id from sheet (e.g. MK4242) — primary display identifier */
    productId: { type: String, trim: true, default: '' },
    /** Kept for search/slug; typically mirrors productId when no separate name */
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    /** Auto-generated: prd-mm/yy-0001 — stored only, not shown in storefront UI */
    sku: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    /** Markdown text OR image. Legacy: [{ key, value }] arrays still normalize in toPublicJSON. */
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ mode: 'none', markdown: '', image: '' }),
    },
    /** Max quantity a user may select for this product in one cart/order. 0 = unlimited. */
    maxOrderQty: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    price: { type: Number, required: true, min: 0, default: 0 },
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

productSchema.index({ name: 'text', sku: 'text', productId: 'text', shortDescription: 'text', description: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ isFeatured: 1, isBestSeller: 1, isNewArrival: 1 });
productSchema.index({ name: 1 });
productSchema.index({ productId: 1 });

/** Normalize legacy key/value arrays or partial objects into the public shape. */
function normalizeSpecifications(raw) {
  if (!raw) {
    return { mode: 'none', markdown: '', image: '' };
  }
  if (Array.isArray(raw)) {
    const rows = raw
      .map((s) => ({
        key: String(s?.key || '').trim(),
        value: String(s?.value ?? '').trim(),
      }))
      .filter((s) => s.key);
    if (!rows.length) return { mode: 'none', markdown: '', image: '' };
    const markdown = rows.map((s) => `**${s.key}:** ${s.value}`).join('\n\n');
    return { mode: 'markdown', markdown, image: '' };
  }

  const mode = ['markdown', 'image', 'none'].includes(raw.mode) ? raw.mode : 'none';
  const markdown = String(raw.markdown || '').trim();
  const image = String(raw.image || '').trim();

  if (mode === 'image' && image) {
    return { mode: 'image', markdown: '', image };
  }
  if (mode === 'markdown' && markdown) {
    return { mode: 'markdown', markdown, image: '' };
  }
  if (image && !markdown) {
    return { mode: 'image', markdown: '', image };
  }
  if (markdown) {
    return { mode: 'markdown', markdown, image: '' };
  }
  return { mode: 'none', markdown: '', image: '' };
}

/** Sanitize write payload for specifications. */
function sanitizeSpecificationsInput(raw) {
  const normalized = normalizeSpecifications(raw);
  if (normalized.mode === 'none') {
    return { mode: 'none', markdown: '', image: '' };
  }
  if (normalized.mode === 'image') {
    return { mode: 'image', markdown: '', image: normalized.image.slice(0, 2000) };
  }
  return {
    mode: 'markdown',
    markdown: normalized.markdown.slice(0, 20000),
    image: '',
  };
}

/**
 * Apply login-to-view-price rules.
 * Guest → price hidden. Logged-in → list/sale price × user multiplier.
 * SKU/stock are not exposed to storefront JSON.
 */
productSchema.methods.toPublicJSON = function toPublicJSON(user) {
  const base = {
    id: this._id,
    productId: this.productId || '',
    name: this.name,
    slug: this.slug,
    shortDescription: this.shortDescription,
    description: this.description,
    specifications: normalizeSpecifications(this.specifications),
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
module.exports.normalizeSpecifications = normalizeSpecifications;
module.exports.sanitizeSpecificationsInput = sanitizeSpecificationsInput;
