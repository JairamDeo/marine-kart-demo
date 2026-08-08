/** Stable placeholder image when a product has no photo yet */
export function productImageUrl(product, size = 600) {
  const src = product?.images?.[0];
  if (src) return src;
  const seed = encodeURIComponent(product?.sku || product?.slug || product?.name || 'marine');
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}

export function categoryImageUrl(category, size = 300) {
  if (category?.image) return category.image;
  const seed = encodeURIComponent(category?.slug || category?.name || 'category');
  return `https://picsum.photos/seed/cat-${seed}/${size}/${size}`;
}
