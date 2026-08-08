const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const env = require('../config/env');
const User = require('../models/User');

const FALLBACK_FILE = path.join(__dirname, '../../.vapid-keys.json');

function loadOrCreateVapid() {
  let publicKey = env.vapidPublicKey;
  let privateKey = env.vapidPrivateKey;

  if (publicKey && privateKey) {
    return { publicKey, privateKey, subject: env.vapidSubject };
  }

  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const saved = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      if (saved.publicKey && saved.privateKey) {
        return {
          publicKey: saved.publicKey,
          privateKey: saved.privateKey,
          subject: env.vapidSubject,
        };
      }
    }
  } catch (err) {
    console.warn('[push] Could not read fallback VAPID file:', err.message);
  }

  const generated = webpush.generateVAPIDKeys();
  try {
    fs.writeFileSync(
      FALLBACK_FILE,
      JSON.stringify(
        {
          publicKey: generated.publicKey,
          privateKey: generated.privateKey,
          note: 'Auto-generated. Prefer VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env for production.',
        },
        null,
        2
      )
    );
    console.warn('[push] Generated VAPID keys → backend/.vapid-keys.json (add to .env for production)');
  } catch (err) {
    console.warn('[push] Could not persist VAPID keys:', err.message);
  }

  return {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: env.vapidSubject,
  };
}

const vapid = loadOrCreateVapid();

webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

function getPublicVapidKey() {
  return vapid.publicKey;
}

async function sendPushToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    const status = err.statusCode || err.status;
    return { ok: false, status, message: err.message };
  }
}

async function removeDeadSubscription(userId, endpoint) {
  if (!userId || !endpoint) return;
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } }
  );
}

/**
 * Send web push to a user. Never throws.
 */
async function sendPushToUser(userOrId, payload) {
  try {
    const user =
      typeof userOrId === 'object' && userOrId?.pushSubscriptions
        ? userOrId
        : await User.findById(userOrId).select('pushSubscriptions');
    if (!user?.pushSubscriptions?.length) return { sent: 0 };

    let sent = 0;
    for (const sub of [...user.pushSubscriptions]) {
      const result = await sendPushToSubscription(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
        },
        payload
      );
      if (result.ok) {
        sent += 1;
      } else if (result.status === 404 || result.status === 410) {
        await removeDeadSubscription(user._id, sub.endpoint);
      }
    }
    return { sent };
  } catch (err) {
    console.error('[push] sendPushToUser failed:', err.message);
    return { sent: 0, error: err.message };
  }
}

/** Notify all active admins. Payload should stay short (order id, time, customer name). */
async function sendPushToAdmins(payload) {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select(
      'pushSubscriptions'
    );
    let sent = 0;
    for (const admin of admins) {
      const result = await sendPushToUser(admin, payload);
      sent += result.sent || 0;
    }
    return { sent };
  } catch (err) {
    console.error('[push] sendPushToAdmins failed:', err.message);
    return { sent: 0, error: err.message };
  }
}

module.exports = {
  getPublicVapidKey,
  sendPushToUser,
  sendPushToAdmins,
};
