import api from './axiosInstance'

export const commentService = {
  getAll: (ticketId) =>
    api.get(`/tickets/${ticketId}/comments`),

  add: (ticketId, data) =>
    api.post(`/tickets/${ticketId}/comments`, data),

  update: (ticketId, commentId, data) =>
    api.put(`/tickets/${ticketId}/comments/${commentId}`, data),

  delete: (ticketId, commentId) =>
    api.delete(`/tickets/${ticketId}/comments/${commentId}`),
}
