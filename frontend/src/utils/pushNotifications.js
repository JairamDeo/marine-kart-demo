import apiClient from '../api/client';
import { API } from '../api/endpoints';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function ensureServiceWorker() {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

/**
 * Ask permission + subscribe + save to backend. Safe to call repeatedly.
 */
export async function enablePushNotifications() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const { data } = await apiClient.get(API.NOTIFICATIONS_VAPID);
    const publicKey = data?.data?.publicKey;
    if (!publicKey) return { ok: false, reason: 'no-vapid' };

    const reg = await ensureServiceWorker();
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await apiClient.post(API.NOTIFICATIONS_SUBSCRIBE, {
      subscription: subscription.toJSON(),
    });
    return { ok: true };
  } catch (err) {
    console.warn('[push] enable failed:', err?.message || err);
    return { ok: false, reason: 'error', error: err };
  }
}
