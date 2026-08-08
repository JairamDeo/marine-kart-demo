/**
 * Central API endpoint map.
 * Always import from here — never hardcode URLs in components.
 *
 * Format: "api_name": "api url path"
 */
export const API = {
  // Health
  HEALTH: '/health',

  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
  AUTH_RESEND_OTP: '/auth/resend-otp',
  AUTH_ME: '/auth/me',
  AUTH_PROFILE: '/auth/profile',
  AUTH_ADDRESSES: '/auth/addresses',
  AUTH_ADDRESS_DEFAULT: (id) => `/auth/addresses/${id}/default`,

  // Notifications / Web Push
  NOTIFICATIONS_VAPID: '/notifications/vapid-public-key',
  NOTIFICATIONS_SUBSCRIBE: '/notifications/subscribe',
  NOTIFICATIONS_UNSUBSCRIBE: '/notifications/unsubscribe',

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_SLUG: (slug) => `/products/${slug}`,
  PRODUCT_BY_ID: (id) => `/products/${id}`,

  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_SLUG: (slug) => `/categories/${slug}`,
  CATEGORY_BY_ID: (id) => `/categories/${id}`,

  // Cart
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  CART_ITEM: (productId) => `/cart/items/${productId}`,
  CART_MERGE: '/cart/merge',

  // Wishlist
  WISHLIST: '/wishlist',
  WISHLIST_TOGGLE: '/wishlist/toggle',

  // Orders
  ORDERS: '/orders',
  ORDERS_MY: '/orders/my',
  ORDER_MY: (id) => `/orders/my/${id}`,
  ORDER_CANCEL: (id) => `/orders/my/${id}/cancel`,
  ORDER_ADMIN: (id) => `/orders/${id}`,
  ADMIN_ORDER_GET: (id) => `/orders/${id}`,

  // Content
  BANNERS: '/content/banners',
  PAGE: (slug) => `/content/pages/${slug}`,
  CONTACT: '/content/contact',
  BLOGS: '/content/blogs',
  BLOG_BY_SLUG: (slug) => `/content/blogs/${slug}`,

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_CUSTOMER: (id) => `/admin/customers/${id}`,
  ADMIN_SALES_REPORT: '/admin/reports/sales',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products',
  ADMIN_PRODUCT_UPDATE: (id) => `/admin/products/${id}`,
  ADMIN_PRODUCT_DELETE: (id) => `/admin/products/${id}`,
  ADMIN_PRODUCTS_BULK: '/admin/products/bulk',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_CREATE: '/admin/categories',
  ADMIN_CATEGORY_UPDATE: (id) => `/admin/categories/${id}`,
  ADMIN_CATEGORY_DELETE: (id) => `/admin/categories/${id}`,
  ADMIN_CATEGORIES_BULK: '/admin/categories/bulk',
  ADMIN_SUBCATEGORIES: '/admin/subcategories',
  ADMIN_SUBCATEGORY_CREATE: '/admin/subcategories',
  ADMIN_SUBCATEGORIES_BULK: '/admin/subcategories/bulk',
  ADMIN_ORDERS: '/orders',
  ADMIN_ORDER_UPDATE: (id) => `/orders/${id}`,
  ADMIN_UPLOAD: '/admin/uploads',
  ADMIN_UPLOAD_MANY: '/admin/uploads/many',
};
