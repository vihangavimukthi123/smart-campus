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
  const prevUnreadCountRef = useRef(0)

  const playNotificationSound = useCallback(() => {
    if (!user?.soundNotify) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Sound playback failed', e);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationService.getUnreadCount()
      if (data.count > prevUnreadCountRef.current) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = data.count;
      setUnreadCount(data.count)
    } catch {}
  }, [user, playNotificationSound])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await notificationService.getAll({ page: 0, size: 20 })
      setNotifications(data.content || [])
      const unread = (data.content || []).filter(n => !n.read).length
      
      if (unread > prevUnreadCountRef.current) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = unread;
      setUnreadCount(unread)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [user, playNotificationSound])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        prevUnreadCountRef.current = newCount;
        return newCount;
      })
    } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      prevUnreadCountRef.current = 0;
      setUnreadCount(0)
    } catch {}
  }, [])

  const dismissNotification = useCallback(async (id) => {
    try {
      await notificationService.delete(id)
      setNotifications(prev => {
        const item = prev.find(n => n.id === id)
        if (item && !item.read) {
          setUnreadCount(count => Math.max(0, count - 1))
        }
        return prev.filter(n => n.id !== id)
      })
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
      fetchNotifications, markAsRead, markAllAsRead, dismissNotification
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
