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

// --- MEWA KATUTH ADD KARANNA (MEWA NATHTHAM WHITE SCREEN ENNA PULUWAN) ---
import OverallDashboard from './pages/OverallDashboard'
import AdminUserPage from './pages/AdminUserPage'

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
      {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />

      {/* Protected routes - Hama pituwakma me Layout eka athule thiyenna ona */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        
        {/* Main Dashboard - Admin tath Userslatath denatama meka thamai penne */}
        <Route path="/dashboard" element={<OverallDashboard />} />

        {/* Parana Ticket Dashboard eka balanna ona nam meka */}
        <Route path="/tickets/dashboard" element={<DashboardPage />} />

        {/* Admin ge usersla manage karana thana */}
        <Route path="/admin/users" element={<AdminUserPage />} />
        
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Route>

      {/* Default redirect - Meka thamai gedara main door eka */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}