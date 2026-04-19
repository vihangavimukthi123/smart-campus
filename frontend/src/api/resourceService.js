import api from './axiosInstance'

export const getResources = async () => {
  const response = await api.get('/resources')
  return response.data
}

export const createResource = async (payload) => {
  const response = await api.post('/resources', payload)
  return response.data
}
