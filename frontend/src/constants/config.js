/** Backend API base URL — change only here */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const SITE = {
  name: 'MarineKart',
  phone: '0123456789',
  email: 'info@marinekart.com',
  address: 'Your address goes here.',
};

/** @deprecated use authSession role keys — kept for migration references */
export const TOKEN_KEY = 'mk_token';
export const USER_KEY = 'mk_user';
export const GUEST_CART_KEY = 'mk_guest_cart';
