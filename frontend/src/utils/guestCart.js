import { GUEST_CART_KEY } from '../constants/config';
import { clampOrderQty, getMaxOrderQty } from './maxOrderQty';

/**
 * Guest cart in localStorage — merged into server cart after login.
 * Shape: { items: [{ productId, quantity, product }] }
 */

function readRaw() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function writeRaw(data) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(data));
}

export function getGuestCartRaw() {
  return readRaw();
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function formatGuestCart() {
  const { items } = readRaw();
  const mapped = items.map((line) => {
    const product = line.product || {};
    const qty = Math.max(1, Number(line.quantity) || 1);
    const priceVisible = Boolean(product.priceVisible && product.displayPrice != null);
    return {
      product: {
        id: line.productId || product.id,
        _id: line.productId || product.id,
        name: product.name || 'Product',
        slug: product.slug,
        images: product.images || [],
        priceVisible,
        price: product.price ?? null,
        salePrice: product.salePrice ?? null,
        displayPrice: product.displayPrice ?? null,
        shortDescription: product.shortDescription,
        maxOrderQty: product.maxOrderQty || 0,
      },
      quantity: qty,
      lineTotal: priceVisible ? (product.displayPrice || 0) * qty : null,
    };
  });

  return {
    id: 'guest',
    isGuest: true,
    items: mapped,
    itemCount: mapped.reduce((s, i) => s + i.quantity, 0),
    subtotal: mapped.every((i) => i.lineTotal != null)
      ? mapped.reduce((s, i) => s + (i.lineTotal || 0), 0)
      : null,
    priceVisible: mapped.some((i) => i.product.priceVisible),
  };
}

function snapshotProduct(product) {
  return {
    id: product.id || product._id,
    name: product.name,
    slug: product.slug,
    images: product.images || [],
    priceVisible: Boolean(product.priceVisible),
    price: product.price ?? null,
    salePrice: product.salePrice ?? null,
    displayPrice: product.displayPrice ?? null,
    shortDescription: product.shortDescription,
    maxOrderQty: product.maxOrderQty || 0,
  };
}

/** Add / increase guest cart line. Returns { ok, message, cart } */
export function guestAddItem(product, quantity = 1) {
  const productId = String(product.id || product._id);
  const addQty = Math.max(1, Number(quantity) || 1);
  const max = getMaxOrderQty(product);

  const data = readRaw();
  const existing = data.items.find((i) => String(i.productId) === productId);
  const current = existing ? Number(existing.quantity) || 0 : 0;
  const next = current + addQty;

  if (max != null && next > max) {
    return {
      ok: false,
      message: `You can select up to ${max} of this product at a time.`,
      cart: formatGuestCart(),
    };
  }

  if (existing) {
    existing.quantity = next;
    existing.product = snapshotProduct(product);
  } else {
    data.items.push({
      productId,
      quantity: addQty,
      product: snapshotProduct(product),
    });
  }

  writeRaw(data);
  return { ok: true, message: 'Added to cart', cart: formatGuestCart() };
}

export function guestUpdateItem(productId, quantity) {
  const data = readRaw();
  const id = String(productId);
  const item = data.items.find((i) => String(i.productId) === id);
  if (!item) {
    return { ok: false, message: 'Item not in cart.', cart: formatGuestCart() };
  }

  if (Number(quantity) <= 0) {
    data.items = data.items.filter((i) => String(i.productId) !== id);
    writeRaw(data);
    return { ok: true, cart: formatGuestCart() };
  }

  const max = getMaxOrderQty(item.product);
  const desired = Math.max(1, Number(quantity) || 1);
  if (max != null && desired > max) {
    return {
      ok: false,
      message: `You can select up to ${max} of this product at a time.`,
      cart: formatGuestCart(),
    };
  }

  item.quantity = clampOrderQty(desired, item.product);
  writeRaw(data);
  return { ok: true, cart: formatGuestCart() };
}

export function guestRemoveItem(productId) {
  const data = readRaw();
  data.items = data.items.filter((i) => String(i.productId) !== String(productId));
  writeRaw(data);
  return { ok: true, cart: formatGuestCart() };
}

export function guestCartPayloadForMerge() {
  return readRaw().items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
  }));
}
