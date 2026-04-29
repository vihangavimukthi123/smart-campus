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
                className="btn-mark-all" 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
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

      <style>{`
        .notif-bell { position: relative; }
        
        .notif-trigger {
          position: relative;
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          color: var(--clr-text);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          cursor: pointer;
        }
        
        .notif-trigger:hover {
          background: var(--clr-surface-3);
          border-color: var(--clr-primary);
          transform: translateY(-1px);
        }
        
        .notif-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--clr-bg-2);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 340px;
          max-height: 500px;
          background: var(--clr-surface);
          backdrop-filter: blur(12px);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideInNotif 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInNotif {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .notif-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--clr-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.02);
        }

        .btn-mark-all {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--clr-primary);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          opacity: 0.8;
        }
        .btn-mark-all:hover {
          opacity: 1;
          background: var(--clr-surface-2);
        }

        .notif-list {
          overflow-y: auto;
          max-height: 400px;
          scrollbar-width: thin;
          scrollbar-color: var(--clr-border) transparent;
        }

        .notif-item {
          padding: var(--space-4);
          display: flex;
          gap: var(--space-3);
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 1px solid rgba(255,255,255,0.03);
          position: relative;
        }

        .notif-item:hover {
          background: var(--clr-surface-2);
        }

        .notif-item--unread {
          background: rgba(99, 102, 241, 0.05);
        }

        .notif-item--unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--clr-primary);
        }

        .notif-icon {
          width: 36px;
          height: 36px;
          background: var(--clr-surface-3);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .notif-body {
          flex: 1;
          min-width: 0;
        }

        .notif-msg {
          font-size: 0.875rem;
          color: var(--clr-text);
          line-height: 1.4;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notif-empty {
          padding: var(--space-8) var(--space-4);
          text-align: center;
          color: var(--clr-text-3);
        }

        /* Scrollbar */
        .notif-list::-webkit-scrollbar { width: 4px; }
        .notif-list::-webkit-scrollbar-track { background: transparent; }
        .notif-list::-webkit-scrollbar-thumb { background: var(--clr-border); border-radius: 2px; }
      `}</style>
    </div>
  )
}