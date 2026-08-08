import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getActiveToken } from '../utils/authSession';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const headers = config.headers || {};
  const hasAuth =
    headers.Authorization || headers.authorization || (typeof headers.get === 'function' && headers.get('Authorization'));

  if (!hasAuth) {
    const token = getActiveToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Let the browser set multipart boundary for FormData uploads
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
    } else {
      delete headers['Content-Type'];
    }
  }

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
      return Promise.reject(error);
    }
    const payload = error.response?.data;
    const message = payload?.message || error.message || 'Something went wrong';
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = payload?.data;
    err.response = error.response;
    return Promise.reject(err);
  }
);

export default apiClient;
