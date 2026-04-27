import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TicketListPage from './pages/TicketListPage'
import CreateTicketPage from './pages/CreateTicketPage'
import TicketDetailPage from './pages/TicketDetailPage'
import ResourcesPage from './pages/ResourcesPage'
import CreateBookingPage from './pages/CreateBookingPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminBookingsPage from './pages/AdminBookingsPage'
import OverallDashboard from './pages/OverallDashboard'
import AdminUserPage from './pages/AdminUserPage'
import BookingDetailsPublicPage from './pages/BookingDetailsPublicPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* 1. Public routes - Log wela nathnam witharai yanna puluwan */}
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/booking-details/:token"
        element={<BookingDetailsPublicPage />}
      />

      {/* 2. Protected routes - Login wechcha aya layout ekath ekka meka athule inne */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        
        {/* Main Dashboard */}
        <Route path="/dashboard" element={<OverallDashboard />} />

        {/* Tickets and Other Services */}
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/dashboard" element={<DashboardPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        
        {/* Resources & Bookings */}
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/bookings/new" element={<CreateBookingPage />} />
        <Route path="/bookings/my" element={<MyBookingsPage />} />

        {/* Admin Specific Routes */}
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUserPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['ADMIN']}><AdminBookingsPage /></ProtectedRoute>} />
      </Route>

      {/* 3. Default Redirects */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}