import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../api/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate and verify session from localStorage on app boot
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('user')
      const token  = localStorage.getItem('token')

      if (stored && token) {
        try {
          // Verify token with backend
          console.log('[AuthContext] Verifying token with getMe()...')
          const { data } = await authService.getMe()
          console.log('[AuthContext] getMe() succeeded:', data)
          // Update user data with latest from backend
          setUser(data)
        } catch (err) {
          console.error('[AuthContext] Session verification failed:', err)
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    initAuth()

    const handleUnauthorized = () => {
      setUser(null);
    }
    window.addEventListener('auth_unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password })
    //saves data if login is successful
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authService.register(payload)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAdmin      = user?.role === 'ADMIN'
  const isTechnician = user?.role === 'TECHNICIAN'
  const isUser       = user?.role === 'USER'

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAdmin, isTechnician, isUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

export default AuthContext
