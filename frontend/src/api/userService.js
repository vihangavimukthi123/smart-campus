import api from './axiosInstance'

export const userService = {
  getTechnicians: () => api.get('/users/technicians'),
  getMe: () => api.get('/users/me'),
}
