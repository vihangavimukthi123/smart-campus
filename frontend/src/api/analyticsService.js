import api from './axiosInstance'

/**
 * Fetch all three analytics datasets in a single request.
 * Returns { topResources, peakHours, resourceUsage }
 */
export const getAnalyticsSummary = async () => {
  const res = await api.get('/admin/analytics/summary')
  return res.data
}

export const getTopResources = async () => {
  const res = await api.get('/admin/analytics/top-resources')
  return res.data
}

export const getPeakHours = async () => {
  const res = await api.get('/admin/analytics/peak-hours')
  return res.data
}

export const getResourceUsage = async () => {
  const res = await api.get('/admin/analytics/resource-usage')
  return res.data
}
