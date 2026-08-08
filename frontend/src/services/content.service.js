import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const contentService = {
  getBanners: () => apiClient.get(API.BANNERS),
  getPage: (slug) => apiClient.get(API.PAGE(slug)),
  contact: (payload) => apiClient.post(API.CONTACT, payload),
  getBlogs: () => apiClient.get(API.BLOGS),
  getBlog: (slug) => apiClient.get(API.BLOG_BY_SLUG(slug)),
};
