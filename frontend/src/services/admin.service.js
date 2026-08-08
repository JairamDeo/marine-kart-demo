import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const adminService = {
  dashboard: () => apiClient.get(API.ADMIN_DASHBOARD),
  customers: () => apiClient.get(API.ADMIN_CUSTOMERS),
  updateCustomer: (id, payload) => apiClient.patch(API.ADMIN_CUSTOMER(id), payload),
  salesReport: () => apiClient.get(API.ADMIN_SALES_REPORT),
  products: () => apiClient.get(API.ADMIN_PRODUCTS),
  createProduct: (payload) => apiClient.post(API.ADMIN_PRODUCT_CREATE, payload),
  updateProduct: (id, payload) => apiClient.put(API.ADMIN_PRODUCT_UPDATE(id), payload),
  deleteProduct: (id) => apiClient.delete(API.ADMIN_PRODUCT_DELETE(id)),
  bulkProducts: (products) => apiClient.post(API.ADMIN_PRODUCTS_BULK, { products }),
  categories: () => apiClient.get(API.ADMIN_CATEGORIES),
  createCategory: (payload) => apiClient.post(API.ADMIN_CATEGORY_CREATE, payload),
  updateCategory: (id, payload) => apiClient.put(API.ADMIN_CATEGORY_UPDATE(id), payload),
  deleteCategory: (id) => apiClient.delete(API.ADMIN_CATEGORY_DELETE(id)),
  bulkCategories: (categories) => apiClient.post(API.ADMIN_CATEGORIES_BULK, { categories }),
  subcategories: (params) => apiClient.get(API.ADMIN_SUBCATEGORIES, { params }),
  createSubcategory: (payload) => apiClient.post(API.ADMIN_SUBCATEGORY_CREATE, payload),
  bulkSubcategories: (subcategories) =>
    apiClient.post(API.ADMIN_SUBCATEGORIES_BULK, { subcategories }),
  orders: (params) => apiClient.get(API.ADMIN_ORDERS, { params }),
  getOrder: (id) => apiClient.get(API.ADMIN_ORDER_GET(id)),
  updateOrder: (id, payload) => apiClient.patch(API.ADMIN_ORDER_UPDATE(id), payload),

  uploadImage: (file, section = 'products') => {
    const form = new FormData();
    form.append('image', file);
    form.append('section', section);
    return apiClient.post(API.ADMIN_UPLOAD, form, {
      headers: { 'Content-Type': undefined },
      transformRequest: [(data, headers) => {
        if (headers && typeof headers.set === 'function') {
          headers.set('Content-Type', undefined);
        } else if (headers) {
          delete headers['Content-Type'];
        }
        return data;
      }],
    });
  },

  uploadImages: (files, section = 'products') => {
    const form = new FormData();
    [...files].forEach((f) => form.append('images', f));
    form.append('section', section);
    return apiClient.post(API.ADMIN_UPLOAD_MANY, form, {
      headers: { 'Content-Type': undefined },
      transformRequest: [(data, headers) => {
        if (headers && typeof headers.set === 'function') {
          headers.set('Content-Type', undefined);
        } else if (headers) {
          delete headers['Content-Type'];
        }
        return data;
      }],
    });
  },
};
