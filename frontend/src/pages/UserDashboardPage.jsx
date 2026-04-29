import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyBookings } from '../api/bookingService'
import { ticketService } from '../api/ticketService'
import {
  getUserActiveTickets,
  getUserDashboardSummary,
  getUserUpcomingBookings,
  getUserUsageStats,
} from '../api/userDashboardService'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Ticket,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  ListChecks,
  Wrench,
  Bell,
  Building2,
  FlaskConical,
  Boxes,
  BarChart3,
  PieChart,
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

const inferResourceType = (booking) => {
  const rawType = (booking?.resourceType || booking?.resource?.type || '').toString().toUpperCase()
  const name = getResourceName(booking).toUpperCase()

  if (rawType.includes('LAB') || name.includes('LAB')) return 'labs'
  if (rawType.includes('ROOM') || rawType.includes('HALL') || name.includes('ROOM') || name.includes('HALL')) return 'rooms'
  return 'equipment'
}

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

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

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

  const current = sortedAsc.filter((booking) => {
    const start = booking?.startDateTime || booking?.startTime
    const end = booking?.endDateTime || booking?.endTime
    const status = (booking?.status || '').toUpperCase()

    if (!start || !end) return false
    if (status !== 'APPROVED') return false

    const startDate = new Date(start)
    const endDate = new Date(end)
    return startDate <= now && endDate > now
  })

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

  const hourCounts = list.reduce((acc, booking) => {
    const start = getBookingStart(booking)
    if (!start) return acc
    const hour = new Date(start).getHours()
    if (Number.isNaN(hour)) return acc
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {})

  let peakHour = null
  let peakHourCount = 0
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > peakHourCount) {
      peakHour = Number(hour)
      peakHourCount = count
    }
  })

  const peakBookingTime =
    peakHour === null
      ? '-'
      : `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`

  return {
    current,
    upcoming,
    recent,
    summary,
    usage: {
      totalBookingsThisWeek,
      mostUsedResource,
      peakBookingTime,
    },
    resourceCounts,
  }
}

const deriveResourceOverview = (bookings, currentBookings, apiResourceStats = {}) => {
  const resourceTypes = bookings.reduce(
    (acc, booking) => {
      const type = inferResourceType(booking)
      acc[type] += 1
      return acc
    },
    { labs: 0, rooms: 0, equipment: 0 }
  )

  const uniqueResources = new Set(bookings.map(getResourceName).filter(Boolean))

  const totalResources =
    apiResourceStats.totalResources > 0 ? apiResourceStats.totalResources : Math.max(uniqueResources.size, currentBookings.length)

  const occupiedResources =
    apiResourceStats.occupiedResources > 0
      ? apiResourceStats.occupiedResources
      : Math.min(Math.max(currentBookings.length, 0), totalResources)

  const availableResources =
    apiResourceStats.availableResources > 0
      ? apiResourceStats.availableResources
      : Math.max(totalResources - occupiedResources, 0)

  return {
    totalResources,
    occupiedResources,
    availableResources,
    resourceTypes,
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

  const [currentBookings, setCurrentBookings] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [activeTickets, setActiveTickets] = useState([])
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [resourceOverview, setResourceOverview] = useState({
    totalResources: 0,
    occupiedResources: 0,
    availableResources: 0,
    resourceTypes: {
      labs: 0,
      rooms: 0,
      equipment: 0,
    },
  })
  const [usageStats, setUsageStats] = useState({
    totalBookingsThisWeek: 0,
    mostUsedResource: '-',
    peakBookingTime: '-',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      const [summaryRes, upcomingRes, ticketsRes, usageRes, myBookingsRes, myTicketsRes] = await Promise.allSettled([
        getUserDashboardSummary(),
        getUserUpcomingBookings(),
        getUserActiveTickets(),
        getUserUsageStats(),
        getMyBookings(),
        ticketService.getAll({ page: 0, size: 100 }),
      ])

      const failures = [summaryRes, upcomingRes, ticketsRes, usageRes].filter((result) => result.status === 'rejected')

      const myBookings = myBookingsRes.status === 'fulfilled' ? toArray(myBookingsRes.value) : []
      const derived = deriveBookingData(myBookings)
      const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value || {} : {}
      const apiSummary = {
        totalBookings: summaryData.totalBookings || summaryData.total || 0,
        approvedBookings: summaryData.approvedBookings || summaryData.approved || 0,
        pendingBookings: summaryData.pendingBookings || summaryData.pending || 0,
        rejectedBookings: summaryData.rejectedBookings || summaryData.rejected || 0,
      }
      const summaryLooksEmpty = Object.values(apiSummary).every((value) => value === 0)
      const resolvedSummary = summaryLooksEmpty && derived.summary.totalBookings > 0 ? derived.summary : apiSummary

      const apiResourceStats = {
        totalResources:
          summaryData.totalResources ||
          summaryData.resourcesTotal ||
          summaryData.totalResourceCount ||
          summaryData.totalAvailableResources ||
          0,
        occupiedResources: summaryData.occupiedResources || summaryData.resourcesOccupied || summaryData.activeResources || 0,
        availableResources: summaryData.availableResources || summaryData.resourcesAvailable || summaryData.freeResources || 0,
      }

      const resolvedResourceOverview = deriveResourceOverview(myBookings, derived.current, apiResourceStats)

      const resolvedUpcoming =
        upcomingRes.status === 'fulfilled'
          ? (() => {
              const apiUpcoming = toArray(upcomingRes.value)
              return apiUpcoming.length > 0 ? apiUpcoming : derived.upcoming
            })()
          : derived.upcoming

      const fallbackTickets =
        myTicketsRes.status === 'fulfilled'
          ? toArray(myTicketsRes.value?.data || myTicketsRes.value).filter(isActiveTicket)
          : []
      const resolvedTickets =
        ticketsRes.status === 'fulfilled'
          ? (() => {
              const apiTickets = toArray(ticketsRes.value)
              return apiTickets.length > 0 ? apiTickets : fallbackTickets
            })()
          : fallbackTickets

      const resolvedUsage =
        usageRes.status === 'fulfilled'
          ? (() => {
              const data = usageRes.value || {}
              const apiUsage = {
                totalBookingsThisWeek: data.totalBookingsThisWeek || data.bookingsThisWeek || 0,
                mostUsedResource: data.mostUsedResource || data.topResource || '-',
                peakBookingTime: data.peakBookingTime || data.peakHour || '-',
              }

              const apiUsageLooksEmpty =
                apiUsage.totalBookingsThisWeek === 0 &&
                (!apiUsage.mostUsedResource || apiUsage.mostUsedResource === '-') &&
                (!apiUsage.peakBookingTime || apiUsage.peakBookingTime === '-')

              return apiUsageLooksEmpty && derived.summary.totalBookings > 0 ? derived.usage : apiUsage
            })()
          : myBookings.length > 0
            ? derived.usage
            : {
                totalBookingsThisWeek: 0,
                mostUsedResource: '-',
                peakBookingTime: '-',
              }

      const notificationsFallback = resolvedTickets.length + resolvedSummary.pendingBookings
      const resolvedNotifications =
        summaryData.notificationsCount ||
        summaryData.notificationCount ||
        summaryData.unreadNotifications ||
        notificationsFallback

      setSummary(resolvedSummary)
      setCurrentBookings(derived.current)
      setUpcomingBookings(resolvedUpcoming)
      setActiveTickets(resolvedTickets)
      setUsageStats(resolvedUsage)
      setResourceOverview(resolvedResourceOverview)
      setNotificationsCount(resolvedNotifications)

      const hasFallbackData = myBookings.length > 0 || fallbackTickets.length > 0
      if (failures.length > 0 && !hasFallbackData) {
        setError('Some dashboard data could not be loaded. Please retry.')
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const occupancyPercent = useMemo(() => {
    if (!resourceOverview.totalResources) return 0
    return clampPercent((resourceOverview.occupiedResources / resourceOverview.totalResources) * 100)
  }, [resourceOverview])

  const resourceTypeMeta = useMemo(() => {
    const total =
      (resourceOverview.resourceTypes?.labs || 0) +
      (resourceOverview.resourceTypes?.rooms || 0) +
      (resourceOverview.resourceTypes?.equipment || 0)

    const entries = [
      {
        key: 'labs',
        label: 'Labs',
        count: resourceOverview.resourceTypes?.labs || 0,
        color: '#0ea5e9',
      },
      {
        key: 'rooms',
        label: 'Rooms',
        count: resourceOverview.resourceTypes?.rooms || 0,
        color: '#16a34a',
      },
      {
        key: 'equipment',
        label: 'Equipment',
        count: resourceOverview.resourceTypes?.equipment || 0,
        color: '#f59e0b',
      },
    ]

    return entries.map((entry) => ({
      ...entry,
      percent: total > 0 ? clampPercent((entry.count / total) * 100) : 0,
    }))
  }, [resourceOverview])

  const usageDistribution = useMemo(
    () => [
      {
        key: 'approved',
        label: 'Approved',
        value: summary.approvedBookings,
        color: '#16a34a',
      },
      {
        key: 'pending',
        label: 'Pending',
        value: summary.pendingBookings,
        color: '#f59e0b',
      },
      {
        key: 'rejected',
        label: 'Rejected',
        value: summary.rejectedBookings,
        color: '#ef4444',
      },
    ],
    [summary]
  )

  const distributionMax = useMemo(
    () => Math.max(1, ...usageDistribution.map((item) => item.value || 0)),
    [usageDistribution]
  )

  const resourcePieBackground = useMemo(() => {
    const [labs, rooms, equipment] = resourceTypeMeta
    const labsEnd = labs.percent
    const roomsEnd = labs.percent + rooms.percent
    const equipmentEnd = roomsEnd + equipment.percent

    return `conic-gradient(
      #0ea5e9 0% ${labsEnd}%,
      #16a34a ${labsEnd}% ${roomsEnd}%,
      #f59e0b ${roomsEnd}% ${equipmentEnd}%,
      #e2e8f0 ${equipmentEnd}% 100%
    )`
  }, [resourceTypeMeta])

  const summaryCards = useMemo(
    () => [
      {
        key: 'resources',
        title: 'Total Resources Available',
        value: resourceOverview.availableResources,
        icon: <DoorOpen size={20} />,
        className: 'summary-card summary-card--resources',
      },
      {
        key: 'my-bookings',
        title: 'My Bookings',
        value: summary.totalBookings,
        icon: <CalendarDays size={20} />,
        className: 'summary-card summary-card--bookings',
      },
      {
        key: 'tickets',
        title: 'Active Tickets',
        value: activeTickets.length,
        icon: <Ticket size={20} />,
        className: 'summary-card summary-card--tickets',
      },
      {
        key: 'upcoming',
        title: 'Upcoming Bookings',
        value: upcomingBookings.length,
        icon: <Clock3 size={20} />,
        className: 'summary-card summary-card--upcoming',
      },
      {
        key: 'notifications',
        title: 'Notifications',
        value: notificationsCount,
        icon: <Bell size={20} />,
        className: 'summary-card summary-card--notifications',
      },
    ],
    [resourceOverview, summary, activeTickets, upcomingBookings, notificationsCount]
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
          <h1 className="heading-1">Smart Campus Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name?.split(' ')[0] || 'User'}.</p>
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

      <section className="summary-grid" aria-label="Campus summary cards">
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
            <h2 className="heading-3">
              <Building2 size={18} /> Resources Overview
            </h2>
          </div>

          <div className="resource-status">
            <div className="resource-metric">
              <span className="text-sm text-muted">Available</span>
              <strong>{resourceOverview.availableResources}</strong>
            </div>
            <div className="resource-metric">
              <span className="text-sm text-muted">Occupied</span>
              <strong>{resourceOverview.occupiedResources}</strong>
            </div>
          </div>

          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(occupancyPercent)}>
            <div className="progress-track__fill" style={{ width: `${occupancyPercent}%` }} />
          </div>
          <p className="text-xs text-muted">Occupancy rate: {Math.round(occupancyPercent)}%</p>

          <div className="resource-types">
            {resourceTypeMeta.map((item) => (
              <div key={item.key} className="resource-type-item">
                <div className="resource-type-item__meta">
                  <p className="dashboard-list__title">
                    {item.key === 'labs' ? <FlaskConical size={15} /> : item.key === 'rooms' ? <Building2 size={15} /> : <Boxes size={15} />}
                    {item.label}
                  </p>
                  <span className="text-sm text-muted">{item.count}</span>
                </div>
                <div className="resource-type-item__bar">
                  <div style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">
              <CalendarDays size={18} /> Booking Section
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings/my')}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          <div className="booking-columns">
            <div>
              <h3 className="dashboard-subtitle">Current Active</h3>
              {currentBookings.length === 0 ? (
                <p className="text-muted">No bookings active right now.</p>
              ) : (
                <div className="dashboard-list">
                  {currentBookings.slice(0, 4).map((booking) => (
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
            </div>

            <div>
              <h3 className="dashboard-subtitle">Upcoming</h3>
              {upcomingBookings.length === 0 ? (
                <p className="text-muted">No upcoming bookings.</p>
              ) : (
                <div className="dashboard-list">
                  {upcomingBookings.slice(0, 4).map((booking) => (
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
            </div>
          </div>
        </article>

        <article className="card dashboard-section">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">
              <Wrench size={18} /> Ticket / Incident
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tickets/new')}>
              <Plus size={14} /> Report Issue
            </button>
          </div>

          {activeTickets.length === 0 ? (
            <p className="text-muted">No active tickets.</p>
          ) : (
            <div className="dashboard-list">
              {activeTickets.slice(0, 6).map((ticketItem) => (
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
            <h2 className="heading-3">
              <Activity size={18} /> Usage Analytics
            </h2>
          </div>

          <div className="usage-stats">
            <div className="usage-stat-box">
              <p className="text-xs text-muted">Most Used Resource</p>
              <p className="usage-stat-box__value usage-stat-box__value--resource">{usageStats.mostUsedResource}</p>
            </div>
            <div className="usage-stat-box">
              <p className="text-xs text-muted">Peak Booking Time</p>
              <p className="usage-stat-box__value usage-stat-box__value--resource">{usageStats.peakBookingTime}</p>
            </div>
            <div className="usage-stat-box">
              <p className="text-xs text-muted">Total Bookings This Week</p>
              <p className="usage-stat-box__value">{usageStats.totalBookingsThisWeek}</p>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="analytics-block">
              <p className="analytics-block__title">
                <BarChart3 size={15} /> Booking Status Mix
              </p>
              <div className="mini-bars">
                {usageDistribution.map((item) => (
                  <div key={item.key} className="mini-bars__row">
                    <span className="text-xs text-muted">{item.label}</span>
                    <div className="mini-bars__track">
                      <div
                        className="mini-bars__fill"
                        style={{
                          width: `${clampPercent((item.value / distributionMax) * 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-block">
              <p className="analytics-block__title">
                <PieChart size={15} /> Resource Type Share
              </p>
              <div className="resource-pie-wrap">
                <div className="resource-pie" style={{ background: resourcePieBackground }} />
                <div className="resource-pie-legend">
                  {resourceTypeMeta.map((item) => (
                    <p key={item.key}>
                      <span style={{ background: item.color }} />
                      {item.label} ({Math.round(item.percent)}%)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="card dashboard-section quick-actions-panel">
          <div className="dashboard-section__title-row">
            <h2 className="heading-3">
              <ListChecks size={18} /> Quick Actions
            </h2>
          </div>

          <div className="quick-actions quick-actions--panel">
            <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
              <Plus size={16} /> Book Resource
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/bookings/my')}>
              <ListChecks size={16} /> View My Bookings
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/tickets/new')}>
              <Wrench size={16} /> Report Issue
            </button>
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
          margin-bottom: 0.25rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.9rem;
        }

        .summary-card {
          border-radius: 16px;
          border: 1px solid var(--clr-border);
          background: linear-gradient(140deg, var(--clr-surface), color-mix(in srgb, var(--clr-surface) 84%, #ffffff));
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: transform 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-2px);
        }

        .summary-card__icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          display: grid;
          place-items: center;
        }

        .summary-card__label {
          font-size: 0.79rem;
          color: var(--clr-text-2);
          margin-bottom: 0.25rem;
        }

        .summary-card__value {
          font-size: 1.55rem;
          font-weight: 700;
          line-height: 1;
          margin: 0;
        }

        .summary-card--resources .summary-card__icon {
          color: #0f766e;
          background: rgba(15, 118, 110, 0.14);
        }

        .summary-card--bookings .summary-card__icon {
          color: #0369a1;
          background: rgba(14, 116, 144, 0.14);
        }

        .summary-card--tickets .summary-card__icon {
          color: #b45309;
          background: rgba(245, 158, 11, 0.16);
        }

        .summary-card--upcoming .summary-card__icon {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.14);
        }

        .summary-card--notifications .summary-card__icon {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.14);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .dashboard-section {
          min-height: 280px;
        }

        .quick-actions-panel {
          min-height: auto;
          grid-column: 1 / -1;
        }

        .dashboard-section__title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .dashboard-section__title-row .heading-3 {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0;
        }

        .dashboard-subtitle {
          margin: 0 0 0.45rem;
          font-size: 0.9rem;
          color: var(--clr-text-2);
        }

        .dashboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
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
          display: flex;
          align-items: center;
          gap: 0.35rem;
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
          color: #15803d;
          background: rgba(22, 163, 74, 0.14);
          border-color: rgba(22, 163, 74, 0.3);
        }

        .status-pill--pending {
          color: #b45309;
          background: rgba(245, 158, 11, 0.14);
          border-color: rgba(245, 158, 11, 0.35);
        }

        .status-pill--rejected {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .status-pill--open {
          color: #0369a1;
          background: rgba(14, 165, 233, 0.14);
          border-color: rgba(14, 165, 233, 0.3);
        }

        .status-pill--in-progress {
          color: #9a3412;
          background: rgba(251, 146, 60, 0.14);
          border-color: rgba(251, 146, 60, 0.3);
        }

        .resource-status {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.7rem;
        }

        .resource-metric {
          padding: 0.75rem;
          border-radius: 12px;
          border: 1px solid var(--clr-border);
          background: var(--clr-surface-2);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .resource-metric strong {
          font-size: 1.35rem;
        }

        .progress-track {
          width: 100%;
          height: 0.65rem;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
          margin: 0.5rem 0 0.35rem;
        }

        .progress-track__fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0891b2, #0ea5e9);
        }

        .resource-types {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .resource-type-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .resource-type-item__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .resource-type-item__bar {
          height: 0.5rem;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .resource-type-item__bar > div {
          height: 100%;
          border-radius: inherit;
        }

        .booking-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .usage-stats {
          display: grid;
          gap: 0.7rem;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          margin-bottom: 0.85rem;
        }

        .usage-stat-box {
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          padding: 0.8rem;
          background: var(--clr-surface-2);
        }

        .usage-stat-box__value {
          margin-top: 0.35rem;
          font-size: 1.35rem;
          font-weight: 700;
        }

        .usage-stat-box__value--resource {
          font-size: 0.98rem;
          line-height: 1.35;
        }

        .analytics-charts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .analytics-block {
          border: 1px solid var(--clr-border);
          border-radius: 12px;
          background: var(--clr-surface-2);
          padding: 0.75rem;
        }

        .analytics-block__title {
          margin: 0 0 0.6rem;
          font-size: 0.84rem;
          color: var(--clr-text-2);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .mini-bars {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mini-bars__row {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          align-items: center;
          gap: 0.4rem;
        }

        .mini-bars__track {
          width: 100%;
          height: 0.45rem;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .mini-bars__fill {
          height: 100%;
          border-radius: inherit;
        }

        .resource-pie-wrap {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }

        .resource-pie {
          width: 84px;
          aspect-ratio: 1;
          border-radius: 999px;
          box-shadow: inset 0 0 0 10px var(--clr-surface-2);
        }

        .resource-pie-legend {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.77rem;
          color: var(--clr-text-2);
        }

        .resource-pie-legend p {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .resource-pie-legend span {
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 999px;
          display: inline-block;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .quick-actions--panel .btn {
          min-width: 160px;
        }

        @media (max-width: 1080px) {
          .analytics-charts,
          .booking-columns {
            grid-template-columns: 1fr;
          }
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
