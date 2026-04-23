import api from './axiosInstance';

const API_URL = '/admin/users';

export const adminUserService = {
    getAllUsers: () => api.get(API_URL),
    createUser: (userData) => api.post(API_URL, userData),
    updateUser: (id, userData) => api.put(`${API_URL}/${id}`, userData),
    deleteUser: (id) => api.delete(`${API_URL}/${id}`),
};