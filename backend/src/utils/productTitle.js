/**
 * Display title: "Subcategory - PartNumber"
 * Used in orders, quotations, and emails.
 */
function formatProductTitle(input) {
  if (!input) return 'Product';

  const sub = String(
    (input.subcategory && input.subcategory.name) || input.subcategoryName || ''
  ).trim();
  const part = String(input.productId || input.partNumber || '').trim();
  const rawName = String(input.name || '').trim();

  let partNumber = part;
  if (!partNumber && rawName) {
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

module.exports = { formatProductTitle };
