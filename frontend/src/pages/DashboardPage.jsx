import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '../api/ticketService'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import {
  Ticket, CheckCircle, Clock, XCircle,
  TrendingUp, PlusCircle, ArrowRight
} from 'lucide-react'

const STAT_CONFIGS = {
  ADMIN: [
    { key: 'OPEN',        label: 'Open',        icon: <Ticket size={22} />,       color: '#f59e0b' },
    { key: 'IN_PROGRESS', label: 'In Progress',  icon: <Clock size={22} />,        color: '#6366f1' },
    { key: 'RESOLVED',    label: 'Resolved',     icon: <CheckCircle size={22} />,  color: '#10b981' },
    { key: 'REJECTED',    label: 'Rejected',     icon: <XCircle size={22} />,      color: '#ef4444' },
  ],
  USER: [
    { key: 'OPEN',        label: 'My Open',      icon: <Ticket size={22} />,       color: '#f59e0b' },
    { key: 'IN_PROGRESS', label: 'In Progress',  icon: <Clock size={22} />,        color: '#6366f1' },
    { key: 'RESOLVED',    label: 'Resolved',     icon: <CheckCircle size={22} />,  color: '#10b981' },
    { key: 'CLOSED',      label: 'Closed',       icon: <XCircle size={22} />,      color: '#64748b' },
  ],
  TECHNICIAN: [
    { key: 'IN_PROGRESS', label: 'Assigned',     icon: <Clock size={22} />,        color: '#6366f1' },
    { key: 'RESOLVED',    label: 'Resolved',     icon: <CheckCircle size={22} />,  color: '#10b981' },
  ],
}

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const navigate = useNavigate()
  const [tickets,  setTickets]  = useState([])
  const [counts,   setCounts]   = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await ticketService.getAll({ page: 0, size: 100 })
        const all = data.content || []
        setTickets(all.slice(0, 5))  // recent 5
        const c = {}
        all.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
        setCounts(c)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const role      = user?.role || 'USER'
  const statCards = STAT_CONFIGS[role] || STAT_CONFIGS.USER

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="fade-in">
      {/* Welcome banner */}
      <div className="dashboard-banner">
        <div className="dashboard-banner__glow" />
        <div className="dashboard-banner__content">
          <div>
            <h2 className="dashboard-banner__title">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="dashboard-banner__sub">
              {isAdmin
                ? 'You have full oversight of all campus incidents.'
                : isTechnician
                ? 'Check your assigned tickets and update their status.'
                : 'Submit and track your maintenance requests here.'}
            </p>
          </div>
          {!isTechnician && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/tickets/new')}
            >
              <PlusCircle size={16} />
              New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div
            key={s.key}
            className="stat-card"
            onClick={() => navigate(`/tickets?status=${s.key}`)}
            style={{ '--accent': s.color }}
          >
            <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}18` }}>
              {s.icon}
            </div>
            <div className="stat-card__body">
              <div className="stat-card__number">{counts[s.key] || 0}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
            <ArrowRight size={16} className="stat-card__arrow" />
          </div>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 className="heading-3">
            <TrendingUp size={18} style={{ display: 'inline', marginRight: 8 }} />
            Recent Activity
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}>
            View all <ArrowRight size={14} />
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <p style={{ marginBottom: 'var(--space-4)' }}>No tickets yet</p>
            {!isTechnician && (
              <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
                Submit Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="recent-list">
            {tickets.map(t => (
              <div
                key={t.id}
                className="recent-item"
                onClick={() => navigate(`/tickets/${t.id}`)}
              >
                <div className="recent-item__id">#{t.id}</div>
                <div className="recent-item__body">
                  <div className="recent-item__title">{t.title}</div>
                  <div className="recent-item__meta">
                    {t.location} &middot; {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={t.priority} type="priority" />
                  <StatusBadge value={t.status}   type="status" />
                </div>
                <ArrowRight size={14} style={{ color: 'var(--clr-text-3)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-banner {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08));
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: var(--radius-xl);
          padding: var(--space-8) var(--space-10);
          margin-bottom: var(--space-6);
        }
        .dashboard-banner__glow {
          position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px;
          background: var(--clr-primary);
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
        }
        .dashboard-banner__content {
          position: relative;
          display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
          flex-wrap: wrap;
        }
        .dashboard-banner__title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem; font-weight: 700;
          margin-bottom: var(--space-2);
        }
        .dashboard-banner__sub { color: var(--clr-text-2); font-size: 0.9375rem; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .stat-card {
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex; align-items: center; gap: var(--space-4);
          cursor: pointer; transition: var(--transition);
          position: relative; overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--clr-border-hover);
        }
        .stat-card:hover::after { opacity: 1; }
        .stat-card__icon {
          width: 48px; height: 48px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-card__body { flex: 1; }
        .stat-card__number {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.875rem; font-weight: 700;
          line-height: 1;
        }
        .stat-card__label { font-size: 0.8125rem; color: var(--clr-text-2); margin-top: 4px; }
        .stat-card__arrow { color: var(--clr-text-3); flex-shrink: 0; transition: var(--transition); }
        .stat-card:hover .stat-card__arrow { color: var(--clr-primary); transform: translateX(4px); }

        .recent-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .recent-item {
          display: flex; align-items: center; gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer; transition: var(--transition);
        }
        .recent-item:hover { background: var(--clr-surface-2); }
        .recent-item__id { font-size: 0.75rem; color: var(--clr-text-3); font-family: monospace; width: 32px; flex-shrink: 0; }
        .recent-item__body { flex: 1; min-width: 0; }
        .recent-item__title { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-item__meta { font-size: 0.75rem; color: var(--clr-text-3); margin-top: 2px; }
      `}</style>
    </div>
  )
}
