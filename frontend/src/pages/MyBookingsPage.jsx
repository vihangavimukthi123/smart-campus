import { useEffect, useState } from 'react'
import { getMyBookings, cancelBooking } from '../api/bookingService'
import toast from 'react-hot-toast'
import { Calendar, Clock, MapPin, Users, AlertCircle, Trash2, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await getMyBookings()
      const list = Array.isArray(data) ? data : data.data || []
      const sorted = list.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime))
      setBookings(sorted)
    } catch (error) {
      toast.error('Failed to load your bookings')
    } finally {
      setLoading(false)
    }
  }

  const initiateCancel = (id) => {
    setCancellingId(id)
    setCancelReason('')
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async () => {
    try {
      await cancelBooking(cancellingId, { reason: cancelReason })
      toast.success('Booking cancelled successfully')
      setShowCancelDialog(false)
      fetchBookings()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel booking'
      toast.error(message)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-open' // Yellow
      case 'APPROVED': return 'badge-resolved' // Green
      case 'REJECTED': return 'badge-rejected' // Red
      case 'CANCELLED': return 'badge-closed' // Grey
      default: return 'btn-secondary'
    }
  }

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString([], { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    })
  }

  const filteredBookings = filterStatus === 'ALL' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="heading-1 text-gradient">My Bookings</h1>
            <p className="text-muted">Manage your resource requests and reservations.</p>
          </div>
          <Link to="/resources" className="btn btn-primary">
            Request New Booking
          </Link>
        </div>
      </header>

      {/* Filters */}
      <section className="card-glass" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--clr-text-2)' }}>
          <Filter size={18} />
          <span className="text-sm font-medium">Filter by Status:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 1rem' }}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'var(--clr-surface-2)', color: 'var(--clr-text-3)' }}>
            <Calendar size={40} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 className="heading-3">No bookings found</h3>
            <p className="text-muted">
              {filterStatus === 'ALL' 
                ? "You have no bookings yet." 
                : `You have no ${filterStatus.toLowerCase()} bookings.`}
            </p>
          </div>
          {filterStatus === 'ALL' && (
            <Link to="/resources" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
              Browse Resources
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredBookings.map(booking => (
            <article key={booking.id} className="card fade-in" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h3 className="heading-3" style={{ margin: 0 }}>{booking.resource.name}</h3>
                  <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                  <span className="text-xs text-muted">ID: #{booking.id}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--clr-text-2)' }}>
                      <Calendar size={14} />
                      <span className="text-sm">{formatDateTime(booking.startDateTime)} —</span>
                    </div>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--clr-text-2)', paddingLeft: '1.25rem' }}>
                      <span className="text-sm">{formatDateTime(booking.endDateTime)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <MapPin size={14} className="text-muted" />
                      <span className="text-sm text-muted">{booking.resource.location}</span>
                    </div>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <Users size={14} className="text-muted" />
                      <span className="text-sm text-muted">{booking.attendees || 0} Attendees</span>
                    </div>
                  </div>
                </div>

                <div className="card-glass" style={{ padding: '0.75rem 1rem', background: 'var(--clr-surface-2)' }}>
                  <div className="text-xs text-muted" style={{ marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>Purpose</div>
                  <p className="text-sm">{booking.purpose}</p>
                </div>

                {booking.status === 'REJECTED' && booking.rejectionReason && (
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    borderLeft: '3px solid var(--clr-error)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                  }}>
                    <div className="text-xs" style={{ color: 'var(--clr-error)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Admin Reason</div>
                    <p className="text-sm" style={{ color: 'var(--clr-text)' }}>{booking.rejectionReason}</p>
                  </div>
                )}

                {booking.status === 'CANCELLED' && (
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(100, 116, 139, 0.05)', 
                    borderLeft: '3px solid var(--clr-closed)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                  }}>
                    <div className="text-xs" style={{ color: 'var(--clr-closed)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cancellation Details</div>
                    <p className="text-sm">
                      {booking.cancellationReason ? `Reason: ${booking.cancellationReason}` : 'No reason provided'}
                    </p>
                    {booking.cancelledAt && (
                      <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                        Cancelled on: {formatDateTime(booking.cancelledAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div className="text-xs text-muted" style={{ textAlign: 'right' }}>
                  Requested on<br />
                  {formatDateTime(booking.createdAt)}
                </div>
                
                {booking.status === 'APPROVED' && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: 'auto' }}
                    onClick={() => initiateCancel(booking.id)}
                  >
                    <Trash2 size={14} />
                    Cancel Booking
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Cancellation Dialog Overlay */}
      {showCancelDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: 'min(450px, 100%)', animation: 'fadeIn 0.3s ease' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem' }}>Cancel Booking</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="form-group">
              <label className="form-label">Reason for cancellation (Optional)</label>
              <textarea 
                className="form-textarea" 
                rows="3" 
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCancelDialog(false)}>
                Go Back
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
