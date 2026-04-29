import api from './axiosInstance'

/**
 * Creates a new booking request.
 * @param {Object} payload { resourceId, startDateTime, endDateTime, purpose, attendees }
 */
export const createBooking = async (payload) => {
  const res = await api.post('/bookings', payload)
  return res.data
}

/**
 * Fetches the current user's bookings.
 */
export const getMyBookings = async () => {
  const res = await api.get('/bookings/my')
  return res.data
}

/**
 * Fetches details of a specific booking.
 */
export const getBookingById = async (id) => {
  const res = await api.get(`/bookings/${id}`)
  return res.data
}

/**
 * Cancels a specific booking.
 */
export const cancelBooking = async (id, data) => {
  const response = await api.patch(`/bookings/${id}/cancel`, data)
  return response.data
}

/** Admin Endpoints */
export const getAllBookings = async (params) => {
  const response = await api.get('/bookings', { params })
  return response.data
}

export const updateBookingStatus = async (id, data) => {
  const response = await api.put(`/bookings/${id}/status`, data)
  return response.data
}

export const getConflictingBookings = async (id) => {
  const response = await api.get(`/bookings/${id}/conflicts`)
  return response.data
}

/**
 * Fetch bookings for a specific resource and date.
 * @param {string|number} resourceId
 * @param {string} date - ISO date (yyyy-MM-dd) or Date object
 */
export const getBookingsForResource = async (resourceId, date) => {
  const params = {}
  if (date) params.date = typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10)
  const response = await api.get(`/bookings/resource/${resourceId}`, { params })
  return response.data
}
