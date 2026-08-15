/**
 * Quotation line / totals helpers (server-side source of truth).
 */

const Product = require('../models/Product');

const ALLOWED_GST = [0, 5, 12, 18, 28];

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function lineDiscount(amount, quantity, discountType, discountValue) {
  const base = round2((Number(amount) || 0) * (Number(quantity) || 0));
  const type = discountType || 'none';
  const val = Math.max(0, Number(discountValue) || 0);
  if (type === 'percent') {
    return round2(Math.min(base, (base * Math.min(val, 100)) / 100));
  }
  if (type === 'amount') {
    return round2(Math.min(base, val));
  }
  return 0;
}

function normalizeQuotationPayload(body, orderItems = []) {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((row, idx) => {
    const fallback = orderItems[idx] || {};
    const quantity = Math.max(1, Math.floor(Number(row.quantity) || Number(fallback.quantity) || 1));
    const amount = Math.max(0, Number(row.amount) || 0);
    let discountType = row.discountType || 'none';
    if (!['none', 'percent', 'amount'].includes(discountType)) discountType = 'none';
    const discountValue = Math.max(0, Number(row.discountValue) || 0);
    const discount = lineDiscount(amount, quantity, discountType, discountValue);
    const lineTotal = round2(amount * quantity - discount);
    return {
      product: row.product || fallback.product || null,
      name: String(row.name || fallback.name || '').trim(),
      sku: String(row.sku || fallback.sku || '').trim(),
      categoryName: String(row.categoryName || fallback.categoryName || '').trim(),
      subcategoryName: String(row.subcategoryName || fallback.subcategoryName || '').trim(),
      quantity,
      amount,
      discountType,
      discountValue,
      lineTotal,
    };
  });

  const courierCharges = Math.max(0, Number(body.courierCharges) || 0);
  let gstPercent = Number(body.gstPercent);
  if (!ALLOWED_GST.includes(gstPercent)) gstPercent = 0;

  const itemsGross = round2(items.reduce((s, i) => s + i.amount * i.quantity, 0));
  const discountTotal = round2(items.reduce((s, i) => s + (i.amount * i.quantity - i.lineTotal), 0));
  const itemsSubtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const taxableAmount = round2(itemsSubtotal + courierCharges);
  const gstAmount = round2((taxableAmount * gstPercent) / 100);
  const grandTotal = round2(taxableAmount + gstAmount);

  return {
    items,
    courierCharges,
    gstPercent,
    itemsSubtotal,
    discountTotal,
    taxableAmount,
    gstAmount,
    grandTotal,
    itemsGross,
  };
}

function validateQuotationForSend(normalized) {
  if (!normalized.items.length) {
    return { ok: false, message: 'Quotation must include at least one item.' };
  }
  for (const item of normalized.items) {
    if (!item.name) {
      return { ok: false, message: 'Each quotation item needs a name.' };
    }
    if (!(item.amount > 0)) {
      return { ok: false, message: `Enter an amount for "${item.name}".` };
    }
  }
  return { ok: true };
}

function seedQuotationItemsFromOrder(order) {
  return (order.items || []).map((item) => {
    const product = item.product && typeof item.product === 'object' ? item.product : null;
    const categoryName =
      item.categoryName ||
      product?.category?.name ||
      (typeof product?.category === 'string' ? '' : '') ||
      '';
    const subcategoryName =
      item.subcategoryName || product?.subcategory?.name || '';
    return {
      product: product?._id || item.product || null,
      name: item.name || product?.name || '',
      sku: item.sku || product?.sku || '',
      categoryName,
      subcategoryName,
      quantity: item.quantity || 1,
      amount: 0,
      discountType: 'none',
      discountValue: 0,
      lineTotal: 0,
    };
  });
}

/** Attach category names onto order line items from Product refs. */
async function enrichOrderItemsWithCategories(order) {
  const productIds = (order.items || [])
    .map((i) => i.product?._id || i.product)
    .filter(Boolean);
  if (!productIds.length) return order;

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name sku category subcategory')
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  order.items = (order.items || []).map((item) => {
    const plain = item.toObject?.() || item;
    const p = byId.get(String(plain.product?._id || plain.product));
    return {
      ...plain,
      categoryName: p?.category?.name || plain.categoryName || '',
      subcategoryName: p?.subcategory?.name || plain.subcategoryName || '',
    };
  });
  return order;
}

module.exports = {
  ALLOWED_GST,
  round2,
  normalizeQuotationPayload,
  validateQuotationForSend,
  seedQuotationItemsFromOrder,
  enrichOrderItemsWithCategories,
};
