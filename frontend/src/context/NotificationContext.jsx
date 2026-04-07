import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notificationService } from '../api/notificationService'
import { useAuthContext } from './AuthContext'

const NotificationContext = createContext(null)

const POLL_INTERVAL = 30_000 // 30 seconds

export function NotificationProvider({ children }) {
  const { user } = useAuthContext()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationService.getUnreadCount()
      setUnreadCount(data.count)
    } catch {}
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await notificationService.getAll({ page: 0, size: 20 })
      setNotifications(data.content || [])
      const unread = (data.content || []).filter(n => !n.read).length
      setUnreadCount(unread)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }, [])

  // Start polling when user logs in, stop when they log out
  useEffect(() => {
    if (user) {
      fetchNotifications()
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)
    } else {
      setNotifications([])
      setUnreadCount(0)
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [user, fetchNotifications, fetchUnreadCount])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      fetchNotifications, markAsRead, markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider')
  return ctx
}

export default NotificationContext
