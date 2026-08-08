const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/helpers');

exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' },
    ],
  });
  const products = (user.wishlist || [])
    .filter((p) => p && typeof p.toPublicJSON === 'function')
    .map((p) => p.toPublicJSON(req.user));
  res.json({ success: true, data: { products } });
});

exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const user = await User.findById(req.user._id);
  const idx = user.wishlist.findIndex((id) => String(id) === String(productId));
  let added = false;

  if (idx >= 0) {
    user.wishlist.splice(idx, 1);
  } else {
    user.wishlist.push(productId);
    added = true;
  }

  await user.save();
  res.json({
    success: true,
    message: added ? 'Added to wishlist.' : 'Removed from wishlist.',
    data: { added, count: user.wishlist.length },
  });
});
