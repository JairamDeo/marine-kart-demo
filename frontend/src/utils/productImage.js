/** Stable placeholder when a product/category has no photo yet */
export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.webp';
export const SPEC_PLACEHOLDER = '/images/product-specification-placeholder.webp';

/** True for dummy / local placeholder assets (not real product photos). */
export function isPlaceholderImage(src) {
  const s = String(src || '').toLowerCase();
  if (!s) return true;
  return (
    s.includes('placehold.co') ||
    s.includes('154x154') ||
    s.includes('product-placeholder') ||
    s.includes('specification-placeholder') ||
    s.includes('dummy')
  );
}

function isUsableImage(src) {
  return Boolean(src) && !isPlaceholderImage(src);
}

/**
 * Resize/optimize Cloudinary delivery URLs for cards & thumbs.
 * Leaves non-Cloudinary and already-transformed URLs alone.
 */
export function cloudinaryThumb(url, size = 600) {
  const src = String(url || '').trim();
  if (!src || !isUsableImage(src)) return src;
  if (!src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;
  // Already has transforms between /upload/ and version or folder
  if (/\/upload\/[^/]*?(?:w_|c_|q_|f_)/.test(src)) return src;

  const w = Math.max(64, Math.min(1600, Math.round(Number(size) || 600)));
  const transform = `f_auto,q_auto:good,c_limit,w_${w}`;
  return src.replace('/upload/', `/upload/${transform}/`);
}

/** Real gallery URLs from product (excludes placeholders / empty). */
export function realProductImages(product) {
  const list = Array.isArray(product?.images) ? product.images : [];
  return list.map((u) => String(u || '').trim()).filter(isUsableImage);
}

/** Product gallery main/thumbnail — sized for cards; never uses dummy placeholders. */
export function productImageUrl(product, size = 400) {
  const real = realProductImages(product);
  if (real[0]) return cloudinaryThumb(real[0], size);
  return PRODUCT_PLACEHOLDER;
}

export function categoryImageUrl(category, size = 300) {
  if (isUsableImage(category?.image)) {
    return cloudinaryThumb(category.image, size);
  }
  return PRODUCT_PLACEHOLDER;
}
