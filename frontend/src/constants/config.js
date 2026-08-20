/** Backend API base URL — change only here */
const raw = import.meta.env.VITE_API_BASE_URL;

/**
 * Local: http://localhost:5000/api
 * Vercel Services (same domain): /api
 */
export const API_BASE_URL =
  (raw && String(raw).trim()) ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const SITE = {
  name: 'MarineKart',
  phone: '+91-992-302-6865',
  email: 'info@marinekartindia.com',
  address: 'Your address goes here.',
};

/** @deprecated use authSession role keys — kept for migration references */
export const TOKEN_KEY = 'mk_token';
export const USER_KEY = 'mk_user';
export const GUEST_CART_KEY = 'mk_guest_cart';
