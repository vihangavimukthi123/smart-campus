import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Wraps children with an auth check.
 * Redirects to /login if unauthenticated.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Optional role restriction
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
