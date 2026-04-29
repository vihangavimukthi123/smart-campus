import axios from 'axios'

/**
 * Axios instance pre-configured with the API base URL and JWT interceptor.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[Axios] Caught 401 Unauthorized from:', error.config?.url);
      // Don't redirect if the error is from the login endpoint itself
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        console.warn('[Axios] Redirecting to /login and clearing session.');
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Dispatch a custom event instead of hard-reloading, so React can handle the redirect without clearing logs
        window.dispatchEvent(new Event('auth_unauthorized'))
      }
    }
    return Promise.reject(error)
  }
)

export default api;
