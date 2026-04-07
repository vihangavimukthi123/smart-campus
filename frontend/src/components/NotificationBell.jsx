import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'

const TYPE_ICON = {
  STATUS_CHANGE: '🔄',
  NEW_COMMENT:   '💬',
  ASSIGNMENT:    '🔧',
}

/**
 * NotificationBell — dropdown bell with unread count badge and notification list.
 */
export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = () => {
    if (!open) fetchNotifications()
    setOpen(prev => !prev)
  }

  const handleClick = async (n) => {
    if (!n.read) await markAsRead(n.id)
    setOpen(false)
    navigate(`/tickets/${n.ticketId}`)
  }

  return (
    <div className="notif-bell" ref={ref}>
      {/* Trigger button */}
      <button className="notif-trigger" onClick={toggle} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="heading-3" style={{ fontSize: '0.975rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllAsRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-icon">{TYPE_ICON[n.type] || '📋'}</span>
                  <div className="notif-body">
                    <p className="notif-msg">{n.message}</p>
                    <span className="notif-time">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .notif-bell { position: relative; }

        .notif-trigger {
          position: relative;
          padding: 8px;
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          color: var(--clr-text-2);
          transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
        }
        .notif-trigger:hover { background: var(--clr-surface-3); color: var(--clr-text); }

        .notif-count {
          position: absolute;
          top: -4px; right: -4px;
          min-width: 18px; height: 18px;
          padding: 0 4px;
          background: var(--clr-error);
          color: #fff;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          animation: pulse 2s ease infinite;
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          animation: fadeIn 0.15s ease;
          overflow: hidden;
        }

        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--clr-border);
        }

        .notif-list { max-height: 420px; overflow-y: auto; }

        .notif-empty {
          text-align: center; padding: var(--space-10);
          color: var(--clr-text-3); font-size: 0.875rem;
        }

        .notif-item {
          display: flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 1px solid var(--clr-border);
          position: relative;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--clr-surface-2); }
        .notif-item--unread { background: rgba(99,102,241,0.05); }

        .notif-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 2px; }
        .notif-body { flex: 1; min-width: 0; }
        .notif-msg { font-size: 0.875rem; color: var(--clr-text); line-height: 1.4; margin-bottom: 4px; }
        .notif-time { font-size: 0.75rem; color: var(--clr-text-3); }
        .notif-dot {
          width: 8px; height: 8px;
          background: var(--clr-primary);
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}
