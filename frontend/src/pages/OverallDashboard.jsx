import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAnalyticsSummary } from '../api/analyticsService'
import api from '../api/axiosInstance'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'
import {
  Users, Ticket, Clock, ArrowRight, BarChart3,
  Trophy, BarChart2, TrendingUp, RefreshCw, AlertCircle,
  CheckCircle, ShieldAlert, XCircle,
} from 'lucide-react'


// ── Colour palette for bar cells ────────────────────────────────────────────
const BAR_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

// ── Custom recharts tooltip ─────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(17,17,17,0.96)',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: 10, padding: '0.55rem 0.9rem',
      fontSize: '0.8rem', color: '#f5f5f5',
      boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
    }}>
      <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 3 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Skeleton block ──────────────────────────────────────────────────────────
const Skeleton = ({ h = 200 }) => (
  <div style={{
    height: h, borderRadius: 12,
    background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
)

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, subColor, onClick, accentColor = '#6366f1' }) => (
  <div
    className="card"
    onClick={onClick}
    style={{
      cursor: onClick ? 'pointer' : 'default',
      borderLeft: `4px solid ${accentColor}`,
      display: 'flex', alignItems: 'center', gap: '1rem',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' } }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
  >
    <div style={{ color: accentColor, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', marginTop: 2 }}>{label}</div>
      {sub && <small style={{ color: subColor || accentColor, fontSize: '0.78rem' }}>{sub}</small>}
    </div>
    {onClick && <ArrowRight size={16} style={{ color: 'var(--clr-text-3)', flexShrink: 0 }} />}
  </div>
)

// ── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
    {icon}
    <h2 className="heading-3" style={{ margin: 0 }}>{title}</h2>
    {badge && <span className={`badge badge-${badge.variant}`} style={{ marginLeft: 'auto' }}>{badge.label}</span>}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════════════════════
export default function OverallDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // ── General stats ─────────────────────────────────────────────────────
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0 })
  const [userCount,   setUserCount]   = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  // ── Analytics (admin only) ────────────────────────────────────────────
  const [analytics,        setAnalytics]        = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError,   setAnalyticsError]   = useState(null)
  const [refreshKey,       setRefreshKey]        = useState(0)

  // ── Load general stats ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setStatsLoading(true)
      try {
        // 1. Tickets data (Hamaotama ona)
        const tRes = await api.get('/tickets');
        const allTickets = tRes.data.content || [];
        setTicketStats({
          total: allTickets.length,
          open: allTickets.filter(t => t.status === 'OPEN').length
        });

        // 2. Users data (Admin nam vitharak gannawa)
        if (isAdmin) {
          const uRes = await api.get('/admin/users');
          setUserCount(uRes.data.length);
        }
      } catch (err) {
        console.error('Stats load failed', err)
      } finally {
        setStatsLoading(false)
      }
    }
    load()
  }, [isAdmin])

  // ── Load analytics (admin only) ───────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    if (!isAdmin) return
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const data = await getAnalyticsSummary()
      setAnalytics(data)
    } catch {
      setAnalyticsError('Could not load analytics data.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { loadAnalytics() }, [loadAnalytics, refreshKey])

  // ── Derived helpers ───────────────────────────────────────────────────
  const formatHour = (h) => {
    if (h == null) return ''
    const suffix = h < 12 ? 'AM' : 'PM'
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${d}:00 ${suffix}`
  }

  const peakHoursData = Array.from({ length: 24 }, (_, h) => {
    const found = analytics?.peakHours?.find(p => p.hour === h)
    return { hour: formatHour(h), bookingCount: found?.bookingCount ?? 0 }
  })

  const totalApproved = analytics?.topResources?.reduce((s, r) => s + r.totalBookings, 0) ?? 0
  const totalRejected = analytics?.rejectedBookingsCount ?? 0
  const peakEntry     = analytics?.peakHours?.reduce((best, h) => (!best || h.bookingCount > best.bookingCount ? h : best), null)
  const topResource   = analytics?.topResources?.[0]

  if (statsLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>

      {/* ── Page Header ── */}
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="heading-1 text-gradient">System Overview</h1>
            <p className="text-muted">Welcome back, <strong style={{ color: 'var(--clr-text)' }}>{user?.name}</strong>. Here is what's happening.</p>
          </div>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={analyticsLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} style={{ animation: analyticsLoading ? 'spin 0.7s linear infinite' : 'none' }} />
              {analyticsLoading ? 'Refreshing…' : 'Refresh Analytics'}
            </button>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          SECTION 1 — GENERAL STAT CARDS
          ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {isAdmin && (
          <StatCard
            icon={<Users size={24} />}
            label="Total System Users"
            value={userCount}
            sub="Click to manage users"
            onClick={() => navigate('/admin/users')}
            accentColor="#6366f1"
          />
        )}
        <StatCard
          icon={<Ticket size={24} />}
          label="Total Tickets"
          value={ticketStats.total}
          sub="View all incidents"
          onClick={() => navigate('/tickets')}
          accentColor="#f59e0b"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Active Issues"
          value={ticketStats.open}
          sub="Need attention"
          onClick={() => navigate('/tickets?status=OPEN')}
          accentColor="#ef4444"
        />
        {isAdmin && analytics && (
          <>
            <StatCard
              icon={<Trophy size={24} />}
              label="Approved Bookings"
              value={totalApproved}
              accentColor="#10b981"
            />
            <StatCard
              icon={<XCircle size={24} />}
              label="Rejected Bookings"
              value={totalRejected}
              accentColor="#ef4444"
            />
            <StatCard
              icon={<TrendingUp size={24} />}
              label="Top Booked Resource"
              value={topResource?.resourceName ?? 'N/A'}
              accentColor="#06b6d4"
            />
            <StatCard
              icon={<BarChart2 size={24} />}
              label="Peak Booking Hour"
              value={peakEntry ? formatHour(peakEntry.hour) : 'N/A'}
              accentColor="#a78bfa"
            />
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2 — ADMIN ANALYTICS (charts)
          Only visible to ADMIN
          ═══════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {analyticsError && (
            <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={16} /> {analyticsError}
            </div>
          )}

          {/* ── A. Top 5 Resources ── */}
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <SectionHeader
              icon={<Trophy size={18} color="#6366f1" />}
              title="Top 5 Most Booked Resources"
              badge={{ label: 'APPROVED only', variant: 'in_progress' }}
            />
            {analyticsLoading ? <Skeleton h={220} /> : !analytics?.topResources?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-3)', fontSize: '0.9rem' }}>
                <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} /><br />
                No approved booking data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.topResources} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="resourceName" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="totalBookings" name="Bookings" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {analytics.topResources.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* ── B & C side by side on wide screens ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* ── B. Peak Booking Hours ── */}
            <section className="card">
              <SectionHeader
                icon={<Clock size={18} color="#06b6d4" />}
                title="Peak Booking Hours"
                badge={{ label: 'Hour 0–23', variant: 'resolved' }}
              />
              {analyticsLoading ? <Skeleton h={200} /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={peakHoursData} margin={{ top: 4, right: 16, left: 0, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: '#a3a3a3', fontSize: 9 }}
                      angle={-45} textAnchor="end"
                      interval={1} axisLine={false} tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone" dataKey="bookingCount" name="Bookings"
                      stroke="#06b6d4" strokeWidth={2.5}
                      dot={{ r: 2.5, fill: '#06b6d4', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#67e8f9' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* ── C. Resource Usage Table ── */}
            <section className="card">
              <SectionHeader
                icon={<BarChart2 size={18} color="#f59e0b" />}
                title="Resource Usage"
                badge={{ label: 'All statuses', variant: 'open' }}
              />
              {analyticsLoading ? <Skeleton h={200} /> : !analytics?.resourceUsage?.length ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--clr-text-3)', fontSize: '0.9rem' }}>No data.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <th style={th}>#</th>
                        <th style={th}>Resource</th>
                        <th style={{ ...th, textAlign: 'right' }}>Bookings</th>
                        <th style={{ ...th, textAlign: 'right', minWidth: 120 }}>Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.resourceUsage.map((row, i) => {
                        const max = analytics.resourceUsage[0]?.totalBookings || 1
                        const pct = Math.round((row.totalBookings / max) * 100)
                        return (
                          <tr key={i}
                            style={{ borderBottom: '1px solid var(--clr-border)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ ...td, color: 'var(--clr-text-3)', fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: 500 }}>{row.resourceName}</td>
                            <td style={{ ...td, textAlign: 'right', color: '#a5b4fc', fontWeight: 700 }}>{row.totalBookings}</td>
                            <td style={{ ...td, textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                <div style={{ width: 80, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#6366f1,#06b6d4)' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-3)', width: 28, textAlign: 'right' }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 3 — QUICK ACTIONS
          ═══════════════════════════════════════════ */}
      <section className="card">
        <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} /> Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/tickets')}>View Tickets</button>
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>User Management</button>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/bookings')}>Manage Bookings</button>
            </>
          )}
          {!isAdmin && (
            <button className="btn btn-secondary" onClick={() => navigate('/tickets/new')}>New Ticket</button>
          )}
        </div>
      </section>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}

const th = { padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const td = { padding: '0.6rem 0.75rem', color: 'var(--clr-text)' }