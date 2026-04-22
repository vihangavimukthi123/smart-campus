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
