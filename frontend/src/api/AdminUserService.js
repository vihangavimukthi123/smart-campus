import axios from 'axios';

const API_URL = 'http://localhost:8080/api/admin/users';

const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const adminUserService = {
    getAllUsers: () => axios.get(API_URL, getHeaders()),
    createUser: (userData) => axios.post(API_URL, userData, getHeaders()),
    updateUser: (id, userData) => axios.put(`${API_URL}/${id}`, userData, getHeaders()),
    deleteUser: (id) => axios.delete(`${API_URL}/${id}`, getHeaders()),
};