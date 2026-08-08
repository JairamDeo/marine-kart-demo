import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const productService = {
  list: (params, config = {}) => apiClient.get(API.PRODUCTS, { params, ...config }),
  getBySlug: (slug) => apiClient.get(API.PRODUCT_BY_SLUG(slug)),
  create: (payload) => apiClient.post(API.PRODUCTS, payload),
  update: (id, payload) => apiClient.put(API.PRODUCT_BY_ID(id), payload),
  remove: (id) => apiClient.delete(API.PRODUCT_BY_ID(id)),
};
