import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react' // අනවශ්‍ය imports අයින් කළා
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'

const TYPE_ICON = {
  STATUS_CHANGE: '🔄',
  NEW_COMMENT:   '💬',
  ASSIGNMENT:    '🔧',
  NEW_TICKET:    '🎫' // new ticket icon
}

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount) // Sound logic එක සඳහා
  const ref = useRef(null)
  const navigate = useNavigate()

  // Sound Notification Logic 
  useEffect(() => {
    // can play sound if user has new unread notifications
    if (unreadCount > prevUnreadCount) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log("Sound play error (Interactions required)"));
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  // Outside click logic 
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
    
    // using relatedId
    if (n.relatedId) {
      navigate(`/tickets/${n.relatedId}`)
    }
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button className="notif-trigger" onClick={toggle} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="heading-3" style={{ fontSize: '0.975rem', fontWeight: 'bold' }}>Notifications</span>
            {unreadCount > 0 && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', cursor: 'pointer', border: 'none', background: 'none' }}
              >
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

      {/* CSS Styles (ඔයාගේ ස්ටයිල් ටිකම මෙතන තියෙන්න දෙන්න) */}
      <style>{`
        .notif-bell { position: relative; display: flex; align-items: center; }
        
        .notif-trigger {
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          color: var(--clr-text);
          padding: 8px;
          border-radius: var(--radius-md);
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .notif-trigger:hover {
          background: var(--clr-surface-2);
          color: var(--clr-primary);
        }

        .notif-count {
          position: absolute;
          top: 2px;
          right: 2px;
          background: var(--clr-error);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--clr-bg-2);
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 320px;
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
        }

        .notif-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--clr-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--clr-surface-2);
        }

        .notif-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notif-empty {
          padding: var(--space-8) var(--space-4);
          text-align: center;
          color: var(--clr-text-3);
        }

        .notif-item {
          padding: var(--space-4);
          display: flex;
          gap: var(--space-3);
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 1px solid var(--clr-border);
          position: relative;
        }

        .notif-item:hover {
          background: var(--clr-surface-2);
        }

        .notif-item--unread {
          background: rgba(79, 70, 229, 0.05);
        }
        
        html.light-theme .notif-item--unread {
          background: rgba(79, 70, 229, 0.03);
        }

        .notif-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .notif-body {
          flex: 1;
        }

        .notif-msg {
          font-size: 0.875rem;
          color: var(--clr-text);
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .notif-time {
          font-size: 0.75rem;
          color: var(--clr-text-3);
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          background: var(--clr-primary);
          border-radius: 50%;
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
      `}</style>
    </div>
  )
}