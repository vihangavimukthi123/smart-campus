import api from './axiosInstance'

export const ticketService = {
  create: (data) =>
    api.post('/tickets', data),

  getAll: (params) =>
    api.get('/tickets', { params }),

  getById: (id) =>
    api.get(`/tickets/${id}`),

  updateStatus: (id, data) =>
    api.patch(`/tickets/${id}/status`, data),

  assignTechnician: (id, data) =>
    api.put(`/tickets/${id}/assign`, data),

  uploadAttachments: (id, files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    return api.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id) =>
    api.delete(`/tickets/${id}`),

  getAttachmentUrl: (ticketId, attachmentId) =>
    `/api/tickets/${ticketId}/attachments/${attachmentId}`,
}
