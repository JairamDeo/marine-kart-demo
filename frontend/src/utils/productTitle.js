/**
 * Display title: "Subcategory - PartNumber"
 * Used site-wide (cart, shop, wishlist, orders, admin, search).
 */
export function formatProductTitle(input) {
  if (!input) return 'Product';

  const sub = String(
    input.subcategory?.name || input.subcategoryName || ''
  ).trim();
  const part = String(
    input.productId || input.partNumber || ''
  ).trim();
  const rawName = String(input.name || '').trim();

  // Prefer explicit part number; fall back to stored name
  let partNumber = part;
  if (!partNumber && rawName) {
    // Strip leading "Subcategory - " if name was already formatted
    if (sub && rawName.toLowerCase().startsWith(`${sub.toLowerCase()} - `)) {
      partNumber = rawName.slice(sub.length + 3).trim();
    } else {
      partNumber = rawName;
    }
  }

  if (sub && partNumber) {
    if (partNumber.toLowerCase().startsWith(`${sub.toLowerCase()} - `)) {
      return partNumber;
    }
    return `${sub} - ${partNumber}`;
  }

  return partNumber || rawName || 'Product';
}
