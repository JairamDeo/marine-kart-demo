/** Product max qty per cart line. 0 / missing = unlimited. */
export function getMaxOrderQty(product) {
  const n = Number(product?.maxOrderQty);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export function clampOrderQty(qty, product) {
  const q = Math.max(1, Number(qty) || 1);
  const max = getMaxOrderQty(product);
  if (max == null) return q;
  return Math.min(q, max);
}
