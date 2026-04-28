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
        /* ... ඔයා ලියපු CSS ටික මෙතනට දාන්න ... */
        .notif-item--unread { background: rgba(79, 70, 229, 0.08); border-left: 3px solid var(--clr-primary); }
      `}</style>
    </div>
  )
}