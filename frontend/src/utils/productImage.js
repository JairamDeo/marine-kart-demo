/** Stable placeholder image when a product has no photo yet (gray 154x154-style) */
export function productImageUrl(product, size = 600) {
  const src = product?.images?.[0];
  if (src) return src;
  return `https://placehold.co/${size}x${size}/e5e7eb/111111?text=154x154`;
}

export function categoryImageUrl(category, size = 300) {
  if (category?.image) return category.image;
  return `https://placehold.co/${size}x${size}/e5e7eb/111111?text=154x154`;
}
