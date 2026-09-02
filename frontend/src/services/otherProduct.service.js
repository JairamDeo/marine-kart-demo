import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const otherProductService = {
  submit: (payload) => apiClient.post(API.OTHER_PRODUCTS, payload),
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return apiClient.post(API.OTHER_PRODUCT_UPLOADS, form, {
      headers: { 'Content-Type': undefined },
      transformRequest: [
        (data, headers) => {
          if (headers && typeof headers.set === 'function') {
            headers.set('Content-Type', undefined);
          } else if (headers) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    });
  },
};
