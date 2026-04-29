import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, XCircle, User, Calendar, Clock, AlertCircle } from 'lucide-react'

export default function ConflictResolutionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pendingBooking, 
  rejectedBooking 
}) {
  const [selection, setSelection] = useState('PENDING') // 'PENDING' or 'REJECTED'
  const [rejectionReason, setRejectionReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selection === 'REJECTED' && !rejectionReason.trim()) {
      return // Should show an error toast here, but for now just prevent
    }
    onConfirm({
      approveId: selection === 'PENDING' ? pendingBooking.id : rejectedBooking.id,
      rejectId: selection === 'REJECTED' ? pendingBooking.id : null,
      reason: selection === 'REJECTED' ? rejectionReason : null,
      type: selection // To tell the caller which option was chosen
    })
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      backdropFilter: 'blur(8px)', padding: '1rem'
    }}>
      <div className="card-glass fade-in" style={{ 
        width: '100%', maxWidth: '550px', padding: '2rem', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'rgba(245, 158, 11, 0.1)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' 
          }}>
            <AlertTriangle size={32} color="#f59e0b" />
          </div>
          <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>⚠️ Booking Conflict Detected</h2>
          <p className="text-muted">Two bookings exist for the same resource, date, and time slot.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          
          {/* Option 1: Pending (Recommended) */}
          <div 
            onClick={() => setSelection('PENDING')}
            style={{
              padding: '1.25rem', borderRadius: '12px', cursor: 'pointer',
              border: `2px solid ${selection === 'PENDING' ? 'var(--clr-resolved)' : 'transparent'}`,
              background: selection === 'PENDING' ? 'rgba(16, 185, 129, 0.05)' : 'var(--clr-surface-2)',
              transition: 'all 0.2s ease', position: 'relative'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
              <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle size={18} color={selection === 'PENDING' ? 'var(--clr-resolved)' : 'var(--clr-text-3)'} />
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>Approve Pending Booking</span>
              </div>
              <span style={{ 
                fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', 
                color: 'var(--clr-resolved)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600
              }}>RECOMMENDED</span>
            </div>
            
            <div className="flex" style={{ gap: '1rem', paddingLeft: '1.6rem' }}>
              <div style={{ flex: 1 }}>
                <div className="flex" style={{ gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <User size={14} className="text-muted" />
                  <span>{pendingBooking.user.name}</span>
                  <span className="text-xs text-muted">#{pendingBooking.id}</span>
                </div>
                <div className="flex" style={{ gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', marginTop: '4px' }}>
                  <Clock size={14} className="text-muted" />
                  <span className="text-muted">{formatTime(pendingBooking.startDateTime)} - {formatTime(pendingBooking.endDateTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Previously Rejected */}
          <div 
            onClick={() => setSelection('REJECTED')}
            style={{
              padding: '1.25rem', borderRadius: '12px', cursor: 'pointer',
              border: `2px solid ${selection === 'REJECTED' ? 'var(--clr-resolved)' : 'transparent'}`,
              background: selection === 'REJECTED' ? 'rgba(16, 185, 129, 0.05)' : 'var(--clr-surface-2)',
              transition: 'all 0.2s ease'
            }}
          >
            <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <RefreshCw size={18} color={selection === 'REJECTED' ? 'var(--clr-resolved)' : 'var(--clr-text-3)'} />
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>Approve Previously Rejected Booking</span>
            </div>

            <div className="flex" style={{ gap: '1rem', paddingLeft: '1.6rem' }}>
              <div style={{ flex: 1 }}>
                <div className="flex" style={{ gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <User size={14} className="text-muted" />
                  <span>{rejectedBooking.user.name}</span>
                  <span className="text-xs text-muted">#{rejectedBooking.id}</span>
                </div>
                <div className="flex" style={{ gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', marginTop: '4px' }}>
                  <Clock size={14} className="text-muted" />
                  <span className="text-muted">{formatTime(rejectedBooking.startDateTime)} - {formatTime(rejectedBooking.endDateTime)}</span>
                </div>
              </div>
            </div>

            {selection === 'REJECTED' && (
              <div className="fade-in" style={{ marginTop: '1rem', paddingLeft: '1.6rem' }}>
                <div style={{ 
                  padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.1)', marginBottom: '1rem'
                }}>
                  <div className="flex" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={14} color="#ef4444" style={{ marginTop: '2px' }} />
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                      This will automatically reject the currently pending booking (#{pendingBooking.id}).
                    </p>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Reason for rejecting the pending booking:</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="Enter rejection reason here..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            style={{ 
              flex: 1.5, 
              background: selection === 'PENDING' ? 'var(--clr-resolved)' : '#3b82f6',
              borderColor: selection === 'PENDING' ? 'var(--clr-resolved)' : '#3b82f6'
            }} 
            onClick={handleConfirm}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}
