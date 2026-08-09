import apiClient from '../api/client';
import { API } from '../api/endpoints';

export const authService = {
  register: (payload) => apiClient.post(API.AUTH_REGISTER, payload),
  login: (payload) => apiClient.post(API.AUTH_LOGIN, payload),
  verifyEmail: (payload) => apiClient.post(API.AUTH_VERIFY_EMAIL, payload),
  resendOtp: (payload) => apiClient.post(API.AUTH_RESEND_OTP, payload),
  forgotPassword: (payload) => apiClient.post(API.AUTH_FORGOT_PASSWORD, payload),
  verifyResetOtp: (payload) => apiClient.post(API.AUTH_VERIFY_RESET_OTP, payload),
  resetPassword: (payload) => apiClient.post(API.AUTH_RESET_PASSWORD, payload),
  /** Optional token override so portal boot can validate the correct JWT. */
  me: (token) =>
    apiClient.get(API.AUTH_ME, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
  updateProfile: (payload) => apiClient.put(API.AUTH_PROFILE, payload),
  addAddress: (payload) => apiClient.post(API.AUTH_ADDRESSES, payload),
  setDefaultAddress: (id) => apiClient.patch(API.AUTH_ADDRESS_DEFAULT(id)),
};
