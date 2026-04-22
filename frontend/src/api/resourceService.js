import axios from 'axios'

//get all resources
export const getResources = async () => {
  const res = await axios.get('/api/resources')
  return res.data
}

//create resource(admin)
export const createResource = async (payload) => {
  const token = localStorage.getItem('token')

  const res = await axios.post('/api/resources',payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return res.data
}
