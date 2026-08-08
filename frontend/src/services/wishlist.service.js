import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const wishlistService = {
  get: () => apiClient.get(API.WISHLIST),
  toggle: (productId) => apiClient.post(API.WISHLIST_TOGGLE, { productId }),
};
