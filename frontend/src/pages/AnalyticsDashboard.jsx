import { useEffect, useState, useCallback } from 'react'
import { getAnalyticsSummary } from '../api/analyticsService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts'
import { Trophy, Clock, BarChart2, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'

// ── Colour palette for bar chart cells ─────────────────────────────────────
const BAR_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

// ── Custom recharts tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(17,17,17,0.95)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 10,
      padding: '0.6rem 1rem',
      fontSize: '0.82rem',
      color: '#f5f5f5',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i}>{p.name}: <strong>{p.value}{unit}</strong></p>
      ))}
    </div>
  )
}

// ── Skeleton loader ─────────────────────────────────────────────────────────
const Skeleton = ({ height = 220 }) => (
  <div style={{
    height, borderRadius: 12,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
)

// ── Empty-state placeholder ─────────────────────────────────────────────────
const EmptyState = ({ message = 'No data available yet.' }) => (
  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--clr-text-3)' }}>
    <AlertCircle size={36} style={{ marginBottom: '0.6rem', opacity: 0.4 }} />
    <p style={{ fontSize: '0.9rem' }}>{message}</p>
  </div>
)

// ── Stat summary card ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = '#6366f1' }) => (
  <div className="card" style={{
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '1.1rem 1.4rem',
    background: `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, var(--clr-surface) 100%)`,
    borderColor: 'rgba(99,102,241,0.2)',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--clr-text)', lineHeight: 1.1 }}>{value}</p>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════
// Main Analytics Dashboard Component
// ═══════════════════════════════════════════════════════════════════════════
export default function AnalyticsDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await getAnalyticsSummary()
      setData(summary)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  // ── Derived stats ─────────────────────────────────────────────────────
  const totalApprovedBookings = data?.topResources?.reduce((s, r) => s + r.totalBookings, 0) ?? 0
  const peakHour = data?.peakHours?.reduce(
    (best, h) => (!best || h.bookingCount > best.bookingCount ? h : best), null
  )
  const topResource = data?.topResources?.[0]

  // ── Hour label helper ─────────────────────────────────────────────────
  const formatHour = (h) => {
    if (h === undefined || h === null) return ''
    const suffix = h < 12 ? 'AM' : 'PM'
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${display}:00 ${suffix}`
  }

  // Fill all 24 hours so line chart has no gaps
  const peakHoursData = Array.from({ length: 24 }, (_, h) => {
    const found = data?.peakHours?.find(p => p.hour === h)
    return { hour: formatHour(h), bookingCount: found?.bookingCount ?? 0 }
  })

  return (
    <div className="fade-in">
      {/* ── Page Header ── */}
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="heading-1 text-gradient">Analytics Dashboard</h1>
            <p className="text-muted">Resource booking insights and usage patterns.</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── Global error ── */}
      {error && (
        <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
      )}

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard
          icon={<Trophy size={20} color="#6366f1" />}
          label="Approved Bookings"
          value={loading ? '—' : totalApprovedBookings}
          color="#6366f1"
        />
        <StatCard
          icon={<Clock size={20} color="#06b6d4" />}
          label="Peak Hour"
          value={loading ? '—' : (peakHour ? formatHour(peakHour.hour) : 'N/A')}
          color="#06b6d4"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#10b981" />}
          label="Top Resource"
          value={loading ? '—' : (topResource?.resourceName ?? 'N/A')}
          color="#10b981"
        />
        <StatCard
          icon={<BarChart2 size={20} color="#f59e0b" />}
          label="Resources Tracked"
          value={loading ? '—' : (data?.resourceUsage?.length ?? 0)}
          color="#f59e0b"
        />
      </div>

      {/* ── Section A: Top 5 Resources ── */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Trophy size={18} color="#6366f1" />
          <h2 className="heading-3" style={{ margin: 0 }}>Top 5 Most Booked Resources</h2>
          <span className="badge badge-in_progress" style={{ marginLeft: 'auto' }}>APPROVED only</span>
        </div>

        {loading ? <Skeleton /> : !data?.topResources?.length ? (
          <EmptyState message="No approved bookings recorded yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topResources} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="resourceName" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip unit=" bookings" />} />
              <Bar dataKey="totalBookings" name="Bookings" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {data.topResources.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Section B: Peak Booking Hours ── */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Clock size={18} color="#06b6d4" />
          <h2 className="heading-3" style={{ margin: 0 }}>Peak Booking Hours</h2>
          <span className="badge badge-resolved" style={{ marginLeft: 'auto' }}>Hour 0–23</span>
        </div>

        {loading ? <Skeleton height={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={peakHoursData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={1}
                axisLine={false} tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip unit=" bookings" />} />
              <Line
                type="monotone"
                dataKey="bookingCount"
                name="Bookings"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#67e8f9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Section C: Resource Usage Table ── */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <BarChart2 size={18} color="#f59e0b" />
          <h2 className="heading-3" style={{ margin: 0 }}>Resource Usage Overview</h2>
          <span className="badge badge-open" style={{ marginLeft: 'auto' }}>All statuses</span>
        </div>

        {loading ? <Skeleton height={180} /> : !data?.resourceUsage?.length ? (
          <EmptyState message="No booking data found for any resource." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Resource</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total Bookings</th>
                  <th style={{ ...thStyle, textAlign: 'right', minWidth: 160 }}>Usage Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.resourceUsage.map((row, i) => {
                  const max = data.resourceUsage[0]?.totalBookings || 1
                  const pct = Math.round((row.totalBookings / max) * 100)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--clr-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, color: 'var(--clr-text-3)', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{row.resourceName}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#a5b4fc' }}>
                        {row.totalBookings}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <div style={{ width: 100, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', width: 30, textAlign: 'right' }}>{pct}%</span>
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

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

const thStyle = {
  padding: '0.6rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--clr-text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--clr-text)',
}
