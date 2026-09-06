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

/** Real gallery URLs from product (excludes placeholders / empty). */
export function realProductImages(product) {
  const list = Array.isArray(product?.images) ? product.images : [];
  return list.map((u) => String(u || '').trim()).filter(isUsableImage);
}

/** Product gallery main/thumbnail only — never uses specification/dummy as a real photo. */
export function productImageUrl(product, size = 600) {
  const real = realProductImages(product);
  if (real[0]) return real[0];
  return PRODUCT_PLACEHOLDER;
}

export function categoryImageUrl(category, size = 300) {
  if (isUsableImage(category?.image)) {
    return category.image;
  }
  return PRODUCT_PLACEHOLDER;
}
