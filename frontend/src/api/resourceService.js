import api from './axiosInstance'

//get all resources
export const getResources = async (includeRetired = false) => {
  const res = await api.get('/resources', {
    params: { includeRetired }
  })
  return res.data
}

//create resource(admin)
export const createResource = async (payload) => {
  const res = await api.post('/resources', payload)
  return res.data
}

//update resource(admin)
export const updateResource = async (id, payload) => {
  const res = await api.put(`/resources/${id}`, payload)
  return res.data
}

//delete resource(admin)
export const deleteResource = async (id) => {
  await api.delete(`/resources/${id}`)
}
