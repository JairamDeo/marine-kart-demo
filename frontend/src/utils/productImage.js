/** Stable placeholder when a product/category has no photo yet */
export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.webp';

export function productImageUrl(product, size = 600) {
  const src = product?.images?.[0];
  if (src && !String(src).includes('placehold.co') && !String(src).includes('154x154')) {
    return src;
  }
  return PRODUCT_PLACEHOLDER;
}

export function categoryImageUrl(category, size = 300) {
  if (
    category?.image &&
    !String(category.image).includes('placehold.co') &&
    !String(category.image).includes('154x154')
  ) {
    return category.image;
  }
  return PRODUCT_PLACEHOLDER;
}
