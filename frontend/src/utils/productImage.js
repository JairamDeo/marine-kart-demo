/** Stable placeholder when a product/category has no photo yet */
export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.webp';

function isUsableImage(src) {
  return (
    Boolean(src) &&
    !String(src).includes('placehold.co') &&
    !String(src).includes('154x154')
  );
}

/** Product gallery main/thumbnail only — never uses specification image as fallback. */
export function productImageUrl(product, size = 600) {
  const src = product?.images?.[0];
  if (isUsableImage(src)) return src;
  return PRODUCT_PLACEHOLDER;
}

export function categoryImageUrl(category, size = 300) {
  if (isUsableImage(category?.image)) {
    return category.image;
  }
  return PRODUCT_PLACEHOLDER;
}
