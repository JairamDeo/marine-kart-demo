import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const orderService = {
  place: (payload) => apiClient.post(API.ORDERS, payload),
  myOrders: (params) => apiClient.get(API.ORDERS_MY, { params }),
  getMyOrders: (params) => apiClient.get(API.ORDERS_MY, { params }),
  myOrder: (id) => apiClient.get(API.ORDER_MY(id)),
  cancel: (id, payload = {}) => apiClient.patch(API.ORDER_CANCEL(id), payload),
  downloadQuotationPdf: async (id) => {
    try {
      const res = await apiClient.get(API.ORDER_MY_QUOTATION_PDF(id), {
        responseType: 'blob',
      });
      const disposition = res.headers?.['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] || `MarineKart-Quotation-${id}.pdf`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return filename;
    } catch (err) {
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const json = JSON.parse(text);
          const e = new Error(json.message || 'Could not download quotation');
          e.status = err.status;
          throw e;
        } catch (parseErr) {
          if (parseErr.message && parseErr.status) throw parseErr;
        }
      }
      throw err;
    }
  },
};
