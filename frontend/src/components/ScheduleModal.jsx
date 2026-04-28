import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { getBookingsForResource } from '../api/bookingService'

function formatTimeRange(booking) {
  const start = booking?.startDateTime || booking?.startTime || booking?.date
  const end = booking?.endDateTime || booking?.endTime
  if (!start) return '-'
  const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (!end) return s
  const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${s} - ${e}`
}

export default function ScheduleModal({ resource, onClose }) {
  const [date, setDate] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!resource) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const isoDate = date.toISOString().slice(0, 10)
        const res = await getBookingsForResource(resource.id, isoDate)
        const data = Array.isArray(res) ? res : res.data || res.content || []
        if (mounted) setBookings(data)
      } catch (err) {
        setError('Failed to load bookings')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [resource, date])

  if (!resource) return null

  const prevDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  const goToday = () => setDate(new Date())

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}
    >
      <section className="card" style={{ width: 'min(680px, 96%)', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} />
            <div>
              <h3 className="heading-3" style={{ margin: 0 }}>{resource.name}</h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-2)' }}>{format(date, 'EEEE, MMM d, yyyy')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn" type="button" onClick={prevDay} aria-label="Previous day"><ChevronLeft size={16} /></button>
            <button className="btn" type="button" onClick={goToday} aria-label="Today">Today</button>
            <button className="btn" type="button" onClick={nextDay} aria-label="Next day"><ChevronRight size={16} /></button>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
        </div>

        <div>
          {loading ? <p className="text-muted">Loading schedule...</p> : null}
          {error ? <p className="text-danger">{error}</p> : null}

          {!loading && !error && bookings.length === 0 ? (
            <p className="text-muted">No bookings for today</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {bookings.sort((a, b) => new Date(a.startDateTime || a.startTime || 0) - new Date(b.startDateTime || b.startTime || 0)).map((booking) => (
                <li key={booking.id} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--clr-text)' }}>{formatTimeRange(booking)}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-text-2)' }}>{(booking.status || '').toUpperCase() === 'APPROVED' ? 'Booked' : (booking.status || 'Occupied')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
