import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { 
  CheckCircle, XCircle, Info, Search, Filter, Eye,
  ChevronLeft, ChevronRight, Calendar, User, Building2, MapPin, Users, Clock, AlertTriangle
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import ConflictResolutionModal from '../components/ConflictResolutionModal'
import { getAllBookings, updateBookingStatus, getConflictingBookings } from '../api/bookingService'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  
  const [filters, setFilters] = useState({
    status: 'ALL',
    resourceId: '',
    date: ''
  })

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  // Conflict Resolution State
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingConflict, setPendingConflict] = useState(null)
  const [rejectedConflict, setRejectedConflict] = useState(null)
  const [approvedConflict, setApprovedConflict] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC'
      }
      if (filters.status !== 'ALL') params.status = filters.status
      if (filters.resourceId) params.resourceId = filters.resourceId
      if (filters.date) params.date = filters.date

      const data = await getAllBookings(params)
      setBookings(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotal(data.totalElements || 0)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleApprove = async (id) => {
    try {
      const conflicts = await getConflictingBookings(id)
      
      // Find current booking in the list or from the conflicts
      const currentBooking = bookings.find(b => b.id === id) || selectedBooking
      
      // Look for a Pending/Rejected conflict combo
      const pending = conflicts.find(c => c.status === 'PENDING') || (currentBooking.status === 'PENDING' ? currentBooking : null)
      const rejected = conflicts.find(c => c.status === 'REJECTED') || (currentBooking.status === 'REJECTED' ? currentBooking : null)
      const approved = conflicts.find(c => c.status === 'APPROVED') || (currentBooking.status === 'APPROVED' ? currentBooking : null)

      if ((pending && rejected) || (approved && rejected)) {
        setPendingConflict(pending)
        setRejectedConflict(rejected)
        setApprovedConflict(approved)
        setShowConflictModal(true)
        return
      }

      // No complex conflict, just show normal confirm modal
      setConfirmId(id)
      setShowConfirmModal(true)
    } catch (error) {
      console.error('Error checking conflicts:', error)
      setConfirmId(id)
      setShowConfirmModal(true)
    }
  }

  const handleConflictResolution = async (resolution) => {
    setSubmitting(true)
    try {
      // Logic from prompt:
      // If admin selects Pending/Approved Booking: No changes (just close or simple update)
      // If admin selects Rejected Booking: Update rejected -> APPROVED, Update pending/approved -> REJECTED, Save reason
      
      if (resolution.type === 'PENDING' || resolution.type === 'APPROVED') {
        // If it's already approved, we don't need to do anything. 
        // If it's pending, we approve it.
        if (resolution.type === 'PENDING') {
          await updateBookingStatus(resolution.approveId, { status: 'APPROVED' })
          toast.success('Pending booking approved')
        } else {
          toast.success('Keeping current approved booking')
        }
      } else {
        await updateBookingStatus(resolution.approveId, { 
          status: 'APPROVED', 
          conflictingBookingId: resolution.rejectId,
          reason: resolution.reason 
        })
        toast.success(approvedConflict ? 'Rejected booking approved and existing approved booking cancelled' : 'Rejected booking approved and pending booking rejected')
      }
      
      setShowConflictModal(false)
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve conflict')
    } finally {
      setSubmitting(false)
    }
  }

  const executeApprove = async () => {
    try {
      await updateBookingStatus(confirmId, { status: 'APPROVED' })
      toast.success('Booking approved')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    setSubmitting(true)
    try {
      await updateBookingStatus(rejectId, { status: 'REJECTED', reason: rejectReason })
      toast.success('Booking rejected')
      setShowRejectModal(false)
      setRejectReason('')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-open">Pending</span>
      case 'APPROVED': return <span className="badge badge-resolved">Approved</span>
      case 'REJECTED': return <span className="badge badge-rejected">Rejected</span>
      case 'CANCELLED': return <span className="badge badge-closed">Cancelled</span>
      default: return <span className="badge">{status}</span>
    }
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="heading-1 text-gradient">Manage All Bookings</h1>
            <p className="text-muted">Review and process campus resource requests.</p>
          </div>
          <div className="text-sm text-muted">
            {total} total requests
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select 
              className="form-select" 
              value={filters.status}
              onChange={(e) => { setFilters({...filters, status: e.target.value}); setPage(0); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={filters.date}
              onChange={(e) => { setFilters({...filters, date: e.target.value}); setPage(0); }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Resource ID (Optional)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Filter by ID..."
              value={filters.resourceId}
              onChange={(e) => { setFilters({...filters, resourceId: e.target.value}); setPage(0); }}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '300px', flexDirection: 'column' }}>
          <Calendar size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <h3 className="heading-3">No bookings found</h3>
          <p className="text-muted">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--clr-surface-2)', borderBottom: '1px solid var(--clr-border)' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)' }}>ID</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)' }}>User</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)' }}>Resource</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)' }}>Time Slot</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-2)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>#{b.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{b.user?.name?.[0]}</div>
                        <div style={{ lineHeight: 1.2 }}>
                          <div style={{ fontSize: '0.9rem' }}>{b.user?.name}</div>
                          <div className="text-xs text-muted">ID: {b.user?.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{b.resource.name}</div>
                      <div className="text-xs text-muted">{b.resource.type}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>{formatDateTime(b.startDateTime)}</div>
                      <div className="text-xs text-muted">to {formatDateTime(b.endDateTime)}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{getStatusBadge(b.status)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button className="btn btn-secondary btn-icon btn-sm" title="View Details" 
                          onClick={() => { setSelectedBooking(b); setShowViewModal(true); }}>
                          <Eye size={16} />
                        </button>

                        {(b.status === 'PENDING' || b.status === 'REJECTED') && new Date(b.startDateTime) >= new Date() && (
                          <button className="btn btn-success btn-icon btn-sm" title="Approve" onClick={() => handleApprove(b.id)}>
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {(b.status === 'PENDING' || b.status === 'APPROVED') && new Date(b.startDateTime) >= new Date() && (
                          <button 
                            className="btn btn-danger btn-icon btn-sm" 
                            title="Reject" 
                            onClick={() => { setRejectId(b.id); setShowRejectModal(true); }}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--clr-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-sm text-muted">Page {page + 1} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card-glass" style={{ width: '500px', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="heading-3">Booking Details</h3>
              {getStatusBadge(selectedBooking.status)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="detail-item">
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '2px' }}>RESOURCE</label>
                <div className="flex" style={{ gap: '0.75rem' }}>
                  <Building2 size={18} className="text-muted" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedBooking.resource.name}</div>
                    <div className="text-sm text-muted flex" style={{ gap: '0.5rem' }}>
                      <MapPin size={12} /> {selectedBooking.resource.location} ({selectedBooking.resource.type})
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-item">
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '2px' }}>SCHEDULE</label>
                <div className="flex" style={{ gap: '0.75rem' }}>
                  <Calendar size={18} className="text-muted" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{new Date(selectedBooking.startDateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="text-sm text-muted flex" style={{ gap: '0.5rem' }}>
                      <Clock size={12} /> {new Date(selectedBooking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedBooking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-item">
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '2px' }}>REQUESTER</label>
                <div className="flex" style={{ gap: '0.75rem' }}>
                  <User size={18} className="text-muted" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedBooking.user.name}</div>
                    <div className="text-sm text-muted">{selectedBooking.user.email} (ID: {selectedBooking.user.id})</div>
                  </div>
                </div>
              </div>

              <div className="detail-item">
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>PURPOSE</label>
                <div className="card" style={{ background: 'var(--clr-surface-2)', padding: 'var(--space-3)', fontSize: '0.9rem' }}>
                  {selectedBooking.purpose}
                </div>
              </div>

              {selectedBooking.attendees > 0 && (
                <div className="detail-item flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                  <Users size={16} className="text-muted" />
                  <span className="text-sm"><strong>{selectedBooking.attendees}</strong> Expected Attendees</span>
                </div>
              )}

              {(selectedBooking.rejectionReason || selectedBooking.cancellationReason) && (
                <div className="detail-item">
                   <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>
                     {selectedBooking.status} REASON
                   </label>
                   <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 'var(--space-3)', fontSize: '0.9rem', color: 'var(--clr-error)' }}>
                     {selectedBooking.rejectionReason || selectedBooking.cancellationReason}
                   </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-8)' }}>
              {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'REJECTED') && new Date(selectedBooking.startDateTime) >= new Date() && (
                <button className="btn btn-success btn-sm" onClick={() => { handleApprove(selectedBooking.id); setShowViewModal(false); }}>
                  Approve Booking
                </button>
              )}
              {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'APPROVED') && new Date(selectedBooking.startDateTime) >= new Date() && (
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => { setRejectId(selectedBooking.id); setShowRejectModal(true); setShowViewModal(false); }}
                >
                  Reject Booking
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card-glass" style={{ width: '400px', padding: '2rem' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem' }}>Reject Booking</h3>
            <div className="form-group">
              <label className="form-label">Reason for rejection</label>
              <textarea 
                className="form-textarea" 
                rows="3" 
                placeholder="Explain why the booking is rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeApprove}
        title="Approve Booking"
        message="Are you sure you want to approve this booking request? This will reserve the resource for the selected time."
        confirmText="Approve"
        type="success"
      />

      {showConflictModal && (
        <ConflictResolutionModal 
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          onConfirm={handleConflictResolution}
          pendingBooking={pendingConflict}
          rejectedBooking={rejectedConflict}
          approvedBooking={approvedConflict}
        />
      )}

      <style>{`
        .btn-success {
           background: rgba(16, 185, 129, 0.15);
           color: var(--clr-resolved);
           border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .btn-success:hover { background: rgba(16, 185, 129, 0.25); }
      `}</style>
    </div>
  )
}
