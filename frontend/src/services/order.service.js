import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const orderService = {
  place: (payload) => apiClient.post(API.ORDERS, payload),
  myOrders: (params) => apiClient.get(API.ORDERS_MY, { params }),
  getMyOrders: (params) => apiClient.get(API.ORDERS_MY, { params }),
  myOrder: (id) => apiClient.get(API.ORDER_MY(id)),
  cancel: (id) => apiClient.patch(API.ORDER_CANCEL(id)),
};
