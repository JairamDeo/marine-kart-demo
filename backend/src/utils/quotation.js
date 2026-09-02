/**
 * Quotation line / totals helpers (server-side source of truth).
 */

const Product = require('../models/Product');

const ALLOWED_GST = [0, 5, 12, 18, 28];

const BANK_DETAILS = [
  ['Bank name', 'BANK OF BARODA'],
  ['Account name', 'MARINEKART INDIA'],
  ['Account no.', '26080400000547'],
  ['IFSC & branch', 'BARB0PONDAX & PONDA BRANCH'],
];

function normalizeTermsAndConditions(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      label: String(row?.label || '').trim(),
      value: String(row?.value || '').trim(),
    }))
    .filter((row) => row.label || row.value);
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Per-line discount using shared enquiry type (% or ₹). */
function lineDiscount(amount, quantity, discountType, discountValue) {
  const base = round2((Number(amount) || 0) * (Number(quantity) || 0));
  const val = Math.max(0, Number(discountValue) || 0);
  const type = discountType || 'none';
  if (!val || type === 'none') return 0;
  if (type === 'percent') {
    return round2(Math.min(base, (base * Math.min(val, 100)) / 100));
  }
  if (type === 'amount') {
    return round2(Math.min(base, val));
  }
  return 0;
}

function normalizeQuotationPayload(body, orderItems = []) {
  const { formatProductTitle } = require('./productTitle');

  // Shared type for all lines — admin picks % or ₹ once
  let discountType = body.discountType || 'percent';
  if (!['percent', 'amount'].includes(discountType)) discountType = 'percent';

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((row, idx) => {
    const fallback = orderItems[idx] || {};
    const quantity = Math.max(1, Math.floor(Number(row.quantity) || Number(fallback.quantity) || 1));
    const amount = Math.max(0, Number(row.amount) || 0);
    const subcategoryName = String(row.subcategoryName || fallback.subcategoryName || '').trim();
    const discountValue = Math.max(0, Number(row.discountValue) || 0);
    const itemType = discountValue > 0 ? discountType : 'none';
    const gross = round2(amount * quantity);
    const disc = lineDiscount(amount, quantity, itemType, discountValue);
    const lineTotal = round2(gross - disc);
    return {
      product: row.product || fallback.product || null,
      name: formatProductTitle({
        name: row.name || fallback.name || '',
        productId: row.productId || fallback.productId || '',
        subcategoryName,
      }),
      sku: String(row.sku || fallback.sku || '').trim(),
      categoryName: String(row.categoryName || fallback.categoryName || '').trim(),
      subcategoryName,
      image: String(row.image || fallback.image || '').trim(),
      quantity,
      amount,
      discountType: itemType,
      discountValue,
      lineTotal,
    };
  });

  const courierCharges = Math.max(0, Number(body.courierCharges) || 0);
  const otherCharges = Math.max(0, Number(body.otherCharges) || 0);
  let gstPercent = Number(body.gstPercent);
  if (!ALLOWED_GST.includes(gstPercent)) gstPercent = 0;

  const termsAndConditions = normalizeTermsAndConditions(body.termsAndConditions);

  const itemsGross = round2(items.reduce((s, i) => s + round2(i.amount * i.quantity), 0));
  const discountTotal = round2(
    items.reduce(
      (s, i) => s + lineDiscount(i.amount, i.quantity, i.discountType, i.discountValue),
      0
    )
  );
  const itemsSubtotal = round2(itemsGross - discountTotal);
  const taxableAmount = round2(itemsSubtotal + courierCharges + otherCharges);
  const gstAmount = round2((taxableAmount * gstPercent) / 100);
  const grandTotal = round2(taxableAmount + gstAmount);

  return {
    items,
    courierCharges,
    otherCharges,
    gstPercent,
    termsAndConditions,
    // Persist shared type for UI; per-item values live on items
    discountType,
    discountValue: 0,
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
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: 'Amount is required for every item.' };
    }
  }
  return { ok: true };
}

function seedQuotationItemsFromOrder(order) {
  const { formatProductTitle } = require('./productTitle');
  return (order.items || []).map((item) => {
    const product = item.product && typeof item.product === 'object' ? item.product : null;
    const categoryName =
      item.categoryName ||
      product?.category?.name ||
      (typeof product?.category === 'string' ? '' : '') ||
      '';
    const subcategoryName =
      item.subcategoryName || product?.subcategory?.name || '';
    const image =
      item.image ||
      (Array.isArray(product?.images) && product.images[0] ? product.images[0] : '') ||
      '';
    return {
      product: product?._id || item.product || null,
      name: formatProductTitle({
        name: item.name || product?.name || '',
        productId: product?.productId || '',
        subcategoryName,
        subcategory: product?.subcategory,
      }),
      sku: item.sku || product?.sku || '',
      categoryName,
      subcategoryName,
      image,
      quantity: item.quantity || 1,
      amount: 0,
      discountType: 'none',
      discountValue: 0,
      lineTotal: 0,
    };
  });
}

/** Attach category names + main image onto order line items from Product refs. */
async function enrichOrderItemsWithCategories(order) {
  const { formatProductTitle } = require('./productTitle');
  const rawItems = order.items || [];
  const productIds = rawItems.map((i) => i.product?._id || i.product).filter(Boolean);
  if (!productIds.length) {
    order._enrichedItems = rawItems.map((item) => item.toObject?.() || item);
    return order;
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name productId sku category subcategory images')
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const enriched = rawItems.map((item) => {
    const plain = item.toObject?.() || (typeof item === 'object' ? { ...item } : {});
    const p = byId.get(String(plain.product?._id || plain.product));
    const subcategoryName = p?.subcategory?.name || plain.subcategoryName || '';
    // Prefer live product gallery image so admin/customer always see current main photo
    const image =
      (Array.isArray(p?.images) && p.images[0] ? p.images[0] : '') ||
      plain.image ||
      '';
    return {
      product: plain.product?._id || plain.product || null,
      name: formatProductTitle({
        name: plain.name,
        productId: p?.productId || plain.productId || '',
        subcategoryName,
        subcategory: p?.subcategory,
      }),
      sku: plain.sku || p?.sku || '',
      categoryName: p?.category?.name || plain.categoryName || '',
      subcategoryName,
      productId: p?.productId || plain.productId || '',
      image,
      quantity: plain.quantity,
      unitPrice: plain.unitPrice,
      totalPrice: plain.totalPrice,
    };
  });

  if (typeof order.set === 'function') {
    order.set('items', enriched);
  } else {
    order.items = enriched;
  }
  order._enrichedItems = enriched;
  return order;
}

/** Serialize order for API with enriched line items (images kept in JSON). */
function orderWithEnrichedItems(order) {
  const base = order.toObject ? order.toObject({ virtuals: true }) : { ...order };
  if (Array.isArray(order._enrichedItems)) {
    base.items = order._enrichedItems;
  }
  return base;
}

/** Attach product main images onto quotation line items. */
async function attachProductImagesToQuotationItems(items = []) {
  const productIds = items.map((i) => i.product?._id || i.product).filter(Boolean);
  if (!productIds.length) return items;

  const products = await Product.find({ _id: { $in: productIds } })
    .select('images')
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return items.map((item) => {
    const plain = item.toObject?.() || item;
    if (plain.image) return plain;
    const p = byId.get(String(plain.product?._id || plain.product));
    const image = Array.isArray(p?.images) && p.images[0] ? p.images[0] : '';
    return { ...plain, image };
  });
}

function buildQuotationDocument(normalized, { status = 'draft', existing = null, sentBy = null } = {}) {
  return {
    status,
    items: normalized.items,
    courierCharges: normalized.courierCharges,
    otherCharges: normalized.otherCharges,
    gstPercent: normalized.gstPercent,
    discountType: normalized.discountType,
    discountValue: normalized.discountValue,
    termsAndConditions: normalized.termsAndConditions,
    itemsSubtotal: normalized.itemsSubtotal,
    discountTotal: normalized.discountTotal,
    taxableAmount: normalized.taxableAmount,
    gstAmount: normalized.gstAmount,
    grandTotal: normalized.grandTotal,
    savedAt: new Date(),
    sentAt: status === 'sent' ? new Date() : existing?.sentAt || null,
    sentBy: status === 'sent' ? sentBy : existing?.sentBy || null,
  };
}

module.exports = {
  ALLOWED_GST,
  BANK_DETAILS,
  round2,
  lineDiscount,
  normalizeQuotationPayload,
  normalizeTermsAndConditions,
  buildQuotationDocument,
  validateQuotationForSend,
  seedQuotationItemsFromOrder,
  enrichOrderItemsWithCategories,
  orderWithEnrichedItems,
  attachProductImagesToQuotationItems,
};
