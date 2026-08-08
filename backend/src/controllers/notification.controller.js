const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { getPublicVapidKey } = require('../utils/push');

exports.getVapidPublicKey = asyncHandler(async (_req, res) => {
  const publicKey = getPublicVapidKey();
  if (!publicKey) {
    return res.status(503).json({ success: false, message: 'Push notifications are not configured.' });
  }
  res.json({ success: true, data: { publicKey } });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const sub = req.body?.subscription || req.body;
  const endpoint = String(sub?.endpoint || '').trim();
  const p256dh = String(sub?.keys?.p256dh || '').trim();
  const auth = String(sub?.keys?.auth || '').trim();

  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({
      success: false,
      message: 'Invalid push subscription.',
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.pushSubscriptions = (user.pushSubscriptions || []).filter(
    (s) => s.endpoint !== endpoint
  );
  user.pushSubscriptions.push({
    endpoint,
    keys: { p256dh, auth },
    userAgent: String(req.headers['user-agent'] || '').slice(0, 240),
  });

  // Cap subscriptions per user
  if (user.pushSubscriptions.length > 8) {
    user.pushSubscriptions = user.pushSubscriptions.slice(-8);
  }

  await user.save();
  res.json({ success: true, message: 'Push notifications enabled.' });
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const endpoint = String(req.body?.endpoint || '').trim();
  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'Endpoint is required.' });
  }
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { pushSubscriptions: { endpoint } } }
  );
  res.json({ success: true, message: 'Push notifications disabled for this device.' });
});
