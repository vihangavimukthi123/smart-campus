import { useState } from 'react'
import { ticketService } from '../api/ticketService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { ChevronRight, AlertCircle } from 'lucide-react'

const STATUS_TRANSITIONS = {
  OPEN:        { ADMIN: ['IN_PROGRESS', 'REJECTED'], TECHNICIAN: [], USER: [] },
  IN_PROGRESS: { ADMIN: ['REJECTED'],                TECHNICIAN: ['RESOLVED'], USER: [] },
  RESOLVED:    { ADMIN: ['CLOSED'],                  TECHNICIAN: [], USER: ['CLOSED'] },
  CLOSED:      { ADMIN: [], TECHNICIAN: [], USER: [] },
  REJECTED:    { ADMIN: [], TECHNICIAN: [], USER: [] },
}

const ACTION_LABELS = {
  IN_PROGRESS: '▶ Mark In Progress',
  RESOLVED:    '✅ Mark Resolved',
  CLOSED:      '🔒 Close Ticket',
  REJECTED:    '❌ Reject Ticket',
}

/**
 * StateMachineActions — renders the correct action buttons based on
 * current ticket status and the authenticated user's role.
 */
export default function StateMachineActions({ ticket, onUpdated }) {
  const { user, isAdmin, isTechnician } = useAuth()
  const [loading,   setLoading]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState('')
  const [reason, setReason]     = useState('')
  const [notes,  setNotes]      = useState('')

  const role = user?.role || 'USER'
  const allowedTransitions = STATUS_TRANSITIONS[ticket.status]?.[role] || []

  if (allowedTransitions.length === 0) return null

  const handleAction = (status) => {
    setTargetStatus(status)
    setReason('')
    setNotes('')
    setShowModal(true)
  }

  const confirm = async () => {
    if (targetStatus === 'REJECTED' && !reason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    if (targetStatus === 'RESOLVED' && !notes.trim()) {
      toast.error('Resolution notes are required')
      return
    }
    setLoading(true)
    try {
      const payload = { newStatus: targetStatus }
      if (targetStatus === 'REJECTED') payload.rejectionReason = reason
      if (targetStatus === 'RESOLVED') payload.resolutionNotes = notes
      const { data } = await ticketService.updateStatus(ticket.id, payload)
      toast.success(`Ticket status updated to ${targetStatus.replace('_', ' ')}`)
      setShowModal(false)
      onUpdated(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const btnClass = (s) => {
    if (s === 'REJECTED') return 'btn btn-danger'
    if (s === 'RESOLVED') return 'btn btn-primary'
    return 'btn btn-secondary'
  }

  return (
    <>
      <div className="actions-bar">
        <span className="text-sm text-muted">Actions:</span>
        {allowedTransitions.map(s => (
          <button key={s} className={btnClass(s)} onClick={() => handleAction(s)}>
            {ACTION_LABELS[s] || s}
            <ChevronRight size={14} />
          </button>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)' }}>
              {targetStatus === 'REJECTED' ? '❌ Reject Ticket' :
               targetStatus === 'RESOLVED' ? '✅ Resolve Ticket' :
               targetStatus === 'CLOSED'   ? '🔒 Close Ticket'  : 'Update Status'}
            </h3>

            {targetStatus === 'REJECTED' && (
              <div className="form-group">
                <label className="form-label">
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Explain why this ticket is being rejected…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            )}

            {targetStatus === 'RESOLVED' && (
              <div className="form-group">
                <label className="form-label">
                  Resolution Notes <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe what was done to resolve this issue…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            )}

            {(targetStatus === 'IN_PROGRESS' || targetStatus === 'CLOSED') && (
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                {targetStatus === 'IN_PROGRESS'
                  ? 'This will move the ticket to In Progress status.'
                  : 'This will permanently close the ticket.'}
              </p>
            )}

            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={btnClass(targetStatus)} onClick={confirm} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .actions-bar {
          display: flex; align-items: center; gap: var(--space-3);
          flex-wrap: wrap;
          padding: var(--space-4);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          margin-top: var(--space-4);
        }
        .required { color: var(--clr-error); }
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.15s ease;
        }
        .modal-box {
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          width: 100%; max-width: 500px;
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.2s ease;
        }
      `}</style>
    </>
  )
}
