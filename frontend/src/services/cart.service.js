import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const cartService = {
  get: () => apiClient.get(API.CART),
  addItem: (payload) => apiClient.post(API.CART_ITEMS, payload),
  updateItem: (payload) => apiClient.put(API.CART_ITEMS, payload),
  removeItem: (productId) => apiClient.delete(API.CART_ITEM(productId)),
  clear: () => apiClient.delete(API.CART),
  merge: (items) => apiClient.post(API.CART_MERGE, { items }),
};
