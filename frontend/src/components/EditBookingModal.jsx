import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Clock, Users, FileText, AlertCircle } from 'lucide-react'

export default function EditBookingModal({ isOpen, onClose, onSave, booking }) {
  const [formData, setFormData] = useState({
    startDateTime: '',
    endDateTime: '',
    purpose: '',
    attendees: 0
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (booking) {
      setFormData({
        startDateTime: booking.startDateTime.substring(0, 16), // Format for datetime-local
        endDateTime: booking.endDateTime.substring(0, 16),
        purpose: booking.purpose || '',
        attendees: booking.attendees || 0
      })
    }
  }, [booking])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave(booking.id, formData)
      onClose()
    } catch (error) {
      // Error is handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  const modalContent = (
    <div style={{
      position: 'fixed', 
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 99999,
      backdropFilter: 'blur(12px)', 
      padding: '2rem'
    }}>
      <div className="card-glass fade-in" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '2.5rem',
        margin: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        maxHeight: 'min(90vh, 700px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3 className="heading-3" style={{ margin: 0 }}>Edit Booking</h3>
          <button className="btn btn-icon btn-secondary btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Calendar size={14} /> Start Date & Time
            </label>
            <input 
              type="datetime-local" 
              className="form-input" 
              required
              min={new Date().toISOString().substring(0, 16)}
              value={formData.startDateTime}
              onChange={(e) => setFormData({...formData, startDateTime: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Clock size={14} /> End Date & Time
            </label>
            <input 
              type="datetime-local" 
              className="form-input" 
              required
              min={formData.startDateTime || new Date().toISOString().substring(0, 16)}
              value={formData.endDateTime}
              onChange={(e) => setFormData({...formData, endDateTime: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Users size={14} /> Expected Attendees
            </label>
            <input 
              type="number" 
              className="form-input" 
              min="0"
              value={formData.attendees}
              onChange={(e) => setFormData({...formData, attendees: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="form-group">
            <label className="form-label flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <FileText size={14} /> Purpose
            </label>
            <textarea 
              className="form-textarea" 
              rows="3" 
              required
              placeholder="Explain the purpose of your booking..."
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            />
          </div>

          {booking?.status === 'APPROVED' && (
            <div style={{ 
              padding: '0.75rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.05)', 
              border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: '0.75rem'
            }}>
              <AlertCircle size={18} className="text-warning" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p className="text-xs text-muted" style={{ margin: 0 }}>
                <strong>Note:</strong> Editing an approved booking will move it back to <strong>PENDING</strong> status and require admin re-approval.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
