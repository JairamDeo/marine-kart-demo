const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/helpers');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: [{ path: 'category', select: 'name slug' }],
  });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: [{ path: 'category', select: 'name slug' }],
    });
  }
  return cart;
};

const formatCart = (cart, user) => {
  const items = (cart.items || [])
    .filter((item) => item.product)
    .map((item) => {
      const pub = item.product.toPublicJSON(user);
      return {
        product: pub,
        quantity: item.quantity,
        lineTotal: pub.priceVisible ? (pub.displayPrice || 0) * item.quantity : null,
      };
    });

  const subtotal = user
    ? items.reduce((sum, i) => sum + (i.lineTotal || 0), 0)
    : null;

  return {
    id: cart._id,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    priceVisible: Boolean(user),
  };
};

const productIdOf = (item) => String(item.product?._id || item.product);

/** 0 / null / undefined = unlimited */
function maxAllowedQty(product) {
  const n = Number(product?.maxOrderQty);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function clampToMax(qty, max) {
  const q = Math.max(1, Number(qty) || 1);
  if (max == null) return q;
  return Math.min(q, max);
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, data: { cart: formatCart(cart, req.user) } });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const addQty = Math.max(1, Number(quantity) || 1);
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const max = maxAllowedQty(product);
  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => productIdOf(i) === String(productId));
  const current = existing ? Number(existing.quantity) || 0 : 0;
  const next = current + addQty;

  if (max != null && next > max) {
    return res.status(400).json({
      success: false,
      message: `You can select up to ${max} of this product at a time.`,
      data: { maxOrderQty: max, currentQty: current },
    });
  }

  if (existing) {
    existing.quantity = next;
  } else {
    cart.items.push({ product: productId, quantity: addQty });
  }

  await cart.save();
  const refreshed = await getOrCreateCart(req.user._id);
  res.json({ success: true, data: { cart: formatCart(refreshed, req.user) } });
});

exports.updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => productIdOf(i) === String(productId));

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not in cart.' });
  }

  if (Number(quantity) <= 0) {
    cart.items = cart.items.filter((i) => productIdOf(i) !== String(productId));
  } else {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const max = maxAllowedQty(product);
    const desired = Math.max(1, Number(quantity) || 1);
    if (max != null && desired > max) {
      return res.status(400).json({
        success: false,
        message: `You can select up to ${max} of this product at a time.`,
        data: { maxOrderQty: max },
      });
    }
    item.quantity = clampToMax(desired, max);
  }

  await cart.save();
  const refreshed = await getOrCreateCart(req.user._id);
  res.json({ success: true, data: { cart: formatCart(refreshed, req.user) } });
});

/** Merge guest cart lines into the authenticated user's cart. */
exports.mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await getOrCreateCart(req.user._id);
  const warnings = [];

  for (const line of incoming) {
    const productId = line.productId || line.product?.id || line.product?._id;
    if (!productId) continue;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      warnings.push('Some products were unavailable and skipped.');
      continue;
    }

    const max = maxAllowedQty(product);
    const addQty = Math.max(1, Number(line.quantity) || 1);
    const existing = cart.items.find((i) => productIdOf(i) === String(productId));
    const current = existing ? Number(existing.quantity) || 0 : 0;
    let next = current + addQty;
    if (max != null && next > max) {
      next = max;
      warnings.push(`Quantity for "${product.name}" was limited to ${max}.`);
    }

    if (existing) {
      existing.quantity = Math.max(1, next);
    } else {
      cart.items.push({ product: productId, quantity: Math.max(1, next) });
    }
  }

  await cart.save();
  const refreshed = await getOrCreateCart(req.user._id);
  res.json({
    success: true,
    data: {
      cart: formatCart(refreshed, req.user),
      warnings: [...new Set(warnings)],
    },
  });
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => productIdOf(i) !== String(req.params.productId));
  await cart.save();
  const refreshed = await getOrCreateCart(req.user._id);
  res.json({ success: true, data: { cart: formatCart(refreshed, req.user) } });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, data: { cart: formatCart(cart, req.user) } });
});
