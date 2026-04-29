import api from './axiosInstance'

export const getUserDashboardSummary = async () => {
  const response = await api.get('/user/dashboard/summary')
  return response.data
}

export const getUserUpcomingBookings = async () => {
  const response = await api.get('/user/dashboard/upcoming-bookings')
  return response.data
}

export const getUserRecentBookings = async () => {
  const response = await api.get('/user/dashboard/recent-bookings')
  return response.data
}

export const getUserActiveTickets = async () => {
  const response = await api.get('/user/dashboard/active-tickets')
  return response.data
}

export const getUserUsageStats = async () => {
  const response = await api.get('/user/dashboard/usage-stats')
  return response.data
}
