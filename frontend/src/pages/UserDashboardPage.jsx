import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyBookings } from '../api/bookingService'
import { ticketService } from '../api/ticketService'
import {
  getUserActiveTickets,
  getUserDashboardSummary,
  getUserRecentBookings,
  getUserUpcomingBookings,
  getUserUsageStats,
} from '../api/userDashboardService'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Ticket,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  ListChecks,
  Wrench,
} from 'lucide-react'

const statusClass = (status) => {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'APPROVED') return 'status-pill status-pill--approved'
  if (normalized === 'PENDING') return 'status-pill status-pill--pending'
  if (normalized === 'REJECTED') return 'status-pill status-pill--rejected'
  if (normalized === 'OPEN') return 'status-pill status-pill--open'
  if (normalized === 'IN_PROGRESS') return 'status-pill status-pill--in-progress'
  return 'status-pill'
}

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.bookings)) return value.bookings
  if (Array.isArray(value?.tickets)) return value.tickets
  return []
}

const getResourceName = (booking) => booking?.resourceName || booking?.resource?.name || 'Unknown resource'
const getBookingDate = (booking) => booking?.date || booking?.startDateTime || booking?.startTime || null
const getBookingStart = (booking) => booking?.startDateTime || booking?.startTime || booking?.date || null
const getBookingTime = (booking) => {
  const start = booking?.time || booking?.startDateTime || booking?.startTime
  const end = booking?.endDateTime || booking?.endTime
  if (!start) return '-'
  const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (!end) return startTime
  const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${startTime} - ${endTime}`
}

const isActiveTicket = (ticketItem) => ['OPEN', 'IN_PROGRESS'].includes((ticketItem?.status || '').toUpperCase())

const getWeekStart = (now) => {
  const date = new Date(now)
  const day = date.getDay() // 0 = Sunday
  const diffToMonday = (day + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - diffToMonday)
  return date
}

const deriveBookingData = (bookings) => {
  const now = new Date()
  const list = [...bookings]

  const sortedDesc = list.sort((a, b) => new Date(getBookingStart(b) || 0) - new Date(getBookingStart(a) || 0))
  const sortedAsc = [...list].sort((a, b) => new Date(getBookingStart(a) || 0) - new Date(getBookingStart(b) || 0))

  const upcoming = sortedAsc.filter((booking) => {
    const start = getBookingStart(booking)
    const status = (booking?.status || '').toUpperCase()
    return start && new Date(start) > now && status !== 'CANCELLED' && status !== 'REJECTED'
  })

  const recent = sortedDesc.slice(0, 5)

  const summary = {
    totalBookings: list.length,
    approvedBookings: list.filter((booking) => booking.status === 'APPROVED').length,
    pendingBookings: list.filter((booking) => booking.status === 'PENDING').length,
    rejectedBookings: list.filter((booking) => booking.status === 'REJECTED').length,
  }

  const weekStart = getWeekStart(now)
  const totalBookingsThisWeek = list.filter((booking) => {
    const start = getBookingStart(booking)
    return start && new Date(start) >= weekStart
  }).length

  const resourceCounts = list.reduce((acc, booking) => {
    const resourceName = getResourceName(booking)
    acc[resourceName] = (acc[resourceName] || 0) + 1
    return acc
  }, {})

  let mostUsedResource = '-'
  let highestCount = 0
  Object.entries(resourceCounts).forEach(([name, count]) => {
    if (count > highestCount) {
      mostUsedResource = name
      highestCount = count
    }
  })

  return {
    upcoming,
    recent,
    summary,
    usage: {
      totalBookingsThisWeek,
      mostUsedResource,
    },
  }
}

export default function UserDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [summary, setSummary] = useState({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
  })
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [activeTickets, setActiveTickets] = useState([])
  const [usageStats, setUsageStats] = useState({
    totalBookingsThisWeek: 0,
    mostUsedResource: '-',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      const [summaryRes, upcomingRes, recentRes, ticketsRes, usageRes, myBookingsRes, myTicketsRes] = await Promise.allSettled([
        getUserDashboardSummary(),
        getUserUpcomingBookings(),
        getUserRecentBookings(),
        getUserActiveTickets(),
        getUserUsageStats(),
        getMyBookings(),
        ticketService.getAll({ page: 0, size: 100 }),
      ])

      const failures = [summaryRes, upcomingRes, recentRes, ticketsRes, usageRes].filter(
        (result) => result.status === 'rejected'
      )

      const myBookings = myBookingsRes.status === 'fulfilled' ? toArray(myBookingsRes.value) : []
      const derived = deriveBookingData(myBookings)

      const fallbackTickets =
        myTicketsRes.status === 'fulfilled'
          ? toArray(myTicketsRes.value?.data || myTicketsRes.value).filter(isActiveTicket)
          : []

      if (summaryRes.status === 'fulfilled') {
        const data = summaryRes.value || {}
        const apiSummary = {
          totalBookings: data.totalBookings || data.total || 0,
          approvedBookings: data.approvedBookings || data.approved || 0,
          pendingBookings: data.pendingBookings || data.pending || 0,
          rejectedBookings: data.rejectedBookings || data.rejected || 0,
        }

        const apiSummaryLooksEmpty = Object.values(apiSummary).every((value) => value === 0)
        setSummary(apiSummaryLooksEmpty && derived.summary.totalBookings > 0 ? derived.summary : apiSummary)
      } else if (myBookings.length > 0) {
        setSummary(derived.summary)
      }

      if (upcomingRes.status === 'fulfilled') {
        const apiUpcoming = toArray(upcomingRes.value)
        setUpcomingBookings(apiUpcoming.length > 0 ? apiUpcoming : derived.upcoming)
      } else {
        setUpcomingBookings(derived.upcoming)
      }

      if (recentRes.status === 'fulfilled') {
        const apiRecent = toArray(recentRes.value).slice(0, 5)
        setRecentBookings(apiRecent.length > 0 ? apiRecent : derived.recent)
      } else {
        setRecentBookings(derived.recent)
      }

      if (ticketsRes.status === 'fulfilled') {
        const apiTickets = toArray(ticketsRes.value)
        setActiveTickets(apiTickets.length > 0 ? apiTickets : fallbackTickets)
      } else {
        setActiveTickets(fallbackTickets)
      }

      if (usageRes.status === 'fulfilled') {
        const data = usageRes.value || {}
        const apiUsage = {
          totalBookingsThisWeek: data.totalBookingsThisWeek || data.bookingsThisWeek || 0,
          mostUsedResource: data.mostUsedResource || data.topResource || '-',
        }

        const apiUsageLooksEmpty =
          apiUsage.totalBookingsThisWeek === 0 && (!apiUsage.mostUsedResource || apiUsage.mostUsedResource === '-')

        setUsageStats(apiUsageLooksEmpty && derived.summary.totalBookings > 0 ? derived.usage : apiUsage)
      } else if (myBookings.length > 0) {
        setUsageStats(derived.usage)
      }

      const hasFallbackData = myBookings.length > 0 || fallbackTickets.length > 0
      if (failures.length > 0 && !hasFallbackData) {
        setError('Some dashboard data could not be loaded. Please retry.')
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const summaryCards = useMemo(
    () => [
      {
        key: 'total',
        title: 'Total Bookings',
        value: summary.totalBookings,
        icon: <CalendarDays size={20} />,
        className: 'summary-card summary-card--total',
      },
      {
        key: 'approved',
        title: 'Approved Bookings',
        value: summary.approvedBookings,
        icon: <CheckCircle2 size={20} />,
        className: 'summary-card summary-card--approved',
      },
      {
        key: 'pending',
        title: 'Pending Bookings',
        value: summary.pendingBookings,
        icon: <Clock3 size={20} />,
        className: 'summary-card summary-card--pending',
      },
      {
        key: 'rejected',
        title: 'Rejected Bookings',
        value: summary.rejectedBookings,
        icon: <XCircle size={20} />,
        className: 'summary-card summary-card--rejected',
      },
    ],
    [summary]
  )

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="user-dashboard fade-in">
      <header className="user-dashboard__header">
        <div>
          <h1 className="heading-1">My Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name?.split(' ')[0] || 'User'}.</p>
        </div>

        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
            <Plus size={16} />
            Book Resource
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/bookings/my')}>
            <ListChecks size={16} />
            View Bookings
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/tickets/new')}>
            <Wrench size={16} />
            Report Issue
          </button>
        </div>
      </header>

      {error ? (
        <div className="auth-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="summary-grid" aria-label="Booking summary">
        {summaryCards.map((card) => (
          <article key={card.key} className={card.className}>
            <div className="summary-card__icon">{card.icon}</div>
            <div>
              <p className="summary-card__label">{card.title}</p>
              <p className="summary-card__value">{card.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">Upcoming Bookings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings/my')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="text-muted">No upcoming bookings.</p>
          ) : (
            <div className="dashboard-list">
              {upcomingBookings.map((booking) => (
                <div key={booking.id || `${getResourceName(booking)}-${getBookingDate(booking)}`} className="dashboard-list__item">
                  <div>
                    <p className="dashboard-list__title">{getResourceName(booking)}</p>
                    <p className="text-sm text-muted">
                      {getBookingDate(booking)
                        ? new Date(getBookingDate(booking)).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                      {' | '}
                      {getBookingTime(booking)}
                    </p>
                  </div>
                  <span className={statusClass(booking.status)}>{booking.status || 'UNKNOWN'}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">Recent Bookings</h2>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-muted">No recent bookings.</p>
          ) : (
            <div className="dashboard-list">
              {recentBookings.map((booking) => (
                <div key={booking.id || `${getResourceName(booking)}-${getBookingDate(booking)}`} className="dashboard-list__item">
                  <div>
                    <p className="dashboard-list__title">{getResourceName(booking)}</p>
                    <p className="text-sm text-muted">
                      {getBookingDate(booking)
                        ? new Date(getBookingDate(booking)).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                      {' | '}
                      {getBookingTime(booking)}
                    </p>
                  </div>
                  <span className={statusClass(booking.status)}>{booking.status || 'UNKNOWN'}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">Active Tickets</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {activeTickets.length === 0 ? (
            <p className="text-muted">No active tickets.</p>
          ) : (
            <div className="dashboard-list">
              {activeTickets.map((ticketItem) => (
                <div key={ticketItem.id || `${ticketItem.title}-${ticketItem.createdAt}`} className="dashboard-list__item">
                  <div>
                    <p className="dashboard-list__title">{ticketItem.title || `Ticket #${ticketItem.id}`}</p>
                    <p className="text-sm text-muted">{ticketItem.category || ticketItem.location || 'Ticket in progress'}</p>
                  </div>
                  <span className={statusClass(ticketItem.status)}>{ticketItem.status || 'OPEN'}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">Usage Stats</h2>
          </div>
          <div className="usage-stats">
            <div className="usage-stat-box">
              <p className="text-xs text-muted">Total Bookings This Week</p>
              <p className="usage-stat-box__value">{usageStats.totalBookingsThisWeek}</p>
            </div>
            <div className="usage-stat-box">
              <p className="text-xs text-muted">Most Used Resource</p>
              <p className="usage-stat-box__value usage-stat-box__value--resource">{usageStats.mostUsedResource}</p>
            </div>
          </div>
        </article>
      </section>

      <style>{`
        .user-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-dashboard__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.875rem;
        }

        .summary-card {
          border-radius: var(--radius-lg);
          border: 1px solid var(--clr-border);
          background: var(--clr-surface);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .summary-card__icon {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 0.75rem;
          display: grid;
          place-items: center;
        }

        .summary-card__label {
          font-size: 0.8rem;
          color: var(--clr-text-2);
          margin-bottom: 0.2rem;
        }

        .summary-card__value {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1;
          margin: 0;
        }

        .summary-card--total .summary-card__icon {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.15);
        }

        .summary-card--approved .summary-card__icon {
          color: #16a34a;
          background: rgba(22, 163, 74, 0.15);
        }

        .summary-card--pending .summary-card__icon {
          color: #eab308;
          background: rgba(234, 179, 8, 0.15);
        }

        .summary-card--rejected .summary-card__icon {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .dashboard-section {
          min-height: 250px;
        }

        .dashboard-section__title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .dashboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .dashboard-list__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          background: var(--clr-surface-2);
        }

        .dashboard-list__title {
          font-size: 0.92rem;
          font-weight: 600;
          margin: 0;
        }

        .status-pill {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          border-radius: 999px;
          padding: 0.2rem 0.55rem;
          text-transform: uppercase;
          white-space: nowrap;
          border: 1px solid var(--clr-border);
        }

        .status-pill--approved {
          color: #16a34a;
          background: rgba(22, 163, 74, 0.14);
          border-color: rgba(22, 163, 74, 0.3);
        }

        .status-pill--pending {
          color: #ca8a04;
          background: rgba(234, 179, 8, 0.14);
          border-color: rgba(234, 179, 8, 0.3);
        }

        .status-pill--rejected {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .status-pill--open {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.14);
          border-color: rgba(14, 165, 233, 0.3);
        }

        .status-pill--in-progress {
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.14);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .usage-stats {
          display: grid;
          gap: 0.7rem;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .usage-stat-box {
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          background: var(--clr-surface-2);
        }

        .usage-stat-box__value {
          margin-top: 0.35rem;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .usage-stat-box__value--resource {
          font-size: 1rem;
          line-height: 1.35;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
