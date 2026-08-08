import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const categoryService = {
  list: () => apiClient.get(API.CATEGORIES),
  getBySlug: (slug) => apiClient.get(API.CATEGORY_BY_SLUG(slug)),
  create: (payload) => apiClient.post(API.CATEGORIES, payload),
  update: (id, payload) => apiClient.put(API.CATEGORY_BY_ID(id), payload),
  remove: (id) => apiClient.delete(API.CATEGORY_BY_ID(id)),
};
