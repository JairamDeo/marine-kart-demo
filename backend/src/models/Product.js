const mongoose = require('mongoose');
const { auditFields } = require('../utils/audit');

/**
 * Specs are an optional single image (markdown mode removed from admin).
 * Legacy markdown / key-value arrays still normalize in toPublicJSON.
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
    /** Image-only specs. Legacy markdown still normalizes for old docs. */
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ mode: 'none', markdown: '', image: '' }),
    },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    /** Available In Stock | Out Of Stock — default all available */
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
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
productSchema.index({ stockStatus: 1 });

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
  if (image && !markdown) {
    return { mode: 'image', markdown: '', image };
  }
  // Legacy markdown kept for old documents only
  if (mode === 'markdown' && markdown) {
    return { mode: 'markdown', markdown, image: '' };
  }
  if (markdown) {
    return { mode: 'markdown', markdown, image: '' };
  }
  return { mode: 'none', markdown: '', image: '' };
}

/** Sanitize write payload — image or none only (markdown no longer accepted from admin). */
function sanitizeSpecificationsInput(raw) {
  const normalized = normalizeSpecifications(raw);
  const image = String(normalized.image || '').trim();
  if (image) {
    return { mode: 'image', markdown: '', image: image.slice(0, 2000) };
  }
  return { mode: 'none', markdown: '', image: '' };
}

/**
 * Storefront public product JSON.
 * Prices removed from catalog — Ask For Price flow.
 */
productSchema.methods.toPublicJSON = function toPublicJSON(user) {
  const specs = normalizeSpecifications(this.specifications);
  const PLACEHOLDER_RE = /product-placeholder|specification-placeholder|placehold\.co|dummy/i;
  const images = (Array.isArray(this.images) ? this.images : [])
    .map((u) => String(u || '').trim())
    .filter((u) => u && !PLACEHOLDER_RE.test(u));

  // Don't expose dummy specification image as if it were a real asset
  if (specs?.image && PLACEHOLDER_RE.test(String(specs.image))) {
    specs.image = '';
    if (specs.mode === 'image' && !specs.markdown) {
      specs.mode = 'none';
    }
  }

  const stockStatus = this.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';

  return {
    id: this._id,
    productId: this.productId || '',
    name: this.name,
    slug: this.slug,
    shortDescription: this.shortDescription,
    description: this.description,
    specifications: specs,
    images,
    category: this.category,
    subcategory: this.subcategory,
    stockStatus,
    inStock: stockStatus === 'in_stock',
    isFeatured: this.isFeatured,
    isBestSeller: this.isBestSeller,
    isNewArrival: this.isNewArrival,
    relatedProducts: this.relatedProducts,
    priceVisible: false,
    price: null,
    salePrice: null,
    displayPrice: null,
    maxOrderQty: 0,
  };
};

module.exports = mongoose.model('Product', productSchema);
module.exports.normalizeSpecifications = normalizeSpecifications;
module.exports.sanitizeSpecificationsInput = sanitizeSpecificationsInput;
