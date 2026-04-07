import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketService } from '../api/ticketService'
import { userService } from '../api/userService'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import StateMachineActions from '../components/StateMachineActions'
import CommentSection from '../components/CommentSection'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'
import {
  ChevronLeft, MapPin, User, Tag, Calendar,
  Paperclip, Download, UserCheck, Wrench, AlertTriangle, CheckCircle
} from 'lucide-react'

export default function TicketDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user, isAdmin } = useAuth()

  const [ticket,      setTicket]      = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [assignId,    setAssignId]    = useState('')
  const [assigning,   setAssigning]   = useState(false)
  const [showAssign,  setShowAssign]  = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await ticketService.getById(id)
        setTicket(data)
        if (isAdmin) {
          const { data: techs } = await userService.getTechnicians()
          setTechnicians(techs)
          setAssignId(data.assignedTo?.id || '')
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load ticket')
        navigate('/tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAssign = async () => {
    if (!assignId) { toast.error('Select a technician'); return }
    setAssigning(true)
    try {
      const { data } = await ticketService.assignTechnician(id, { technicianId: Number(assignId) })
      setTicket(data)
      toast.success('Technician assigned successfully!')
      setShowAssign(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!ticket) return null

  const timeAgo = ticket.createdAt
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
    : ''
  const fullDate = ticket.createdAt
    ? format(new Date(ticket.createdAt), 'MMM d, yyyy · h:mm a')
    : ''

  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="fade-in ticket-detail">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}
        style={{ marginBottom: 'var(--space-4)' }}>
        <ChevronLeft size={15} /> Back to Tickets
      </button>

      <div className="detail-layout">
        {/* ── LEFT: Main content ── */}
        <div className="detail-main">

          {/* Header card */}
          <div className="card detail-header">
            <div className="detail-header__top">
              <span className="detail-id">#{ticket.id}</span>
              <div className="flex gap-2">
                <StatusBadge value={ticket.priority} type="priority" />
                <StatusBadge value={ticket.status}   type="status" />
              </div>
            </div>
            <h1 className="detail-title">{ticket.title}</h1>

            <div className="detail-meta-row">
              <MetaChip icon={<Tag size={13} />}      label={ticket.category} />
              <MetaChip icon={<MapPin size={13} />}   label={ticket.location} />
              <MetaChip icon={<User size={13} />}     label={ticket.createdBy?.name} />
              <MetaChip icon={<Calendar size={13} />} label={timeAgo} title={fullDate} />
            </div>

            {/* State machine action buttons */}
            <StateMachineActions ticket={ticket} onUpdated={setTicket} />
          </div>

          {/* Description */}
          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)' }}>📄 Description</h3>
            <p className="detail-desc">{ticket.description}</p>

            {ticket.contactDetails && (
              <div className="contact-box">
                <span className="text-xs text-muted">Contact</span>
                <span>{ticket.contactDetails}</span>
              </div>
            )}
          </div>

          {/* Resolution / Rejection info */}
          {ticket.resolutionNotes && (
            <div className="card info-box info-box--success" style={{ marginTop: 'var(--space-4)' }}>
              <div className="info-box__header">
                <CheckCircle size={16} />
                <strong>Resolution Notes</strong>
              </div>
              <p>{ticket.resolutionNotes}</p>
            </div>
          )}
          {ticket.rejectionReason && (
            <div className="card info-box info-box--danger" style={{ marginTop: 'var(--space-4)' }}>
              <div className="info-box__header">
                <AlertTriangle size={16} />
                <strong>Rejection Reason</strong>
              </div>
              <p>{ticket.rejectionReason}</p>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
              <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)' }}>
                <Paperclip size={16} style={{ display: 'inline', marginRight: 6 }} />
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="attachments-grid">
                {ticket.attachments.map(a => (
                  <a
                    key={a.id}
                    href={ticketService.getAttachmentUrl(ticket.id, a.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="attachment-item"
                  >
                    {a.contentType?.startsWith('image/') ? (
                      <img
                        src={ticketService.getAttachmentUrl(ticket.id, a.id)}
                        alt={a.originalFileName}
                        className="attachment-thumb"
                      />
                    ) : (
                      <div className="attachment-icon"><Paperclip size={24} /></div>
                    )}
                    <div className="attachment-info">
                      <span className="attachment-name">{a.originalFileName}</span>
                      <span className="attachment-size text-xs text-muted">
                        {(a.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <Download size={14} style={{ color: 'var(--clr-text-3)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <CommentSection ticketId={id} />
          </div>
        </div>

        {/* ── RIGHT: Sidebar info ── */}
        <aside className="detail-sidebar">

          {/* Assigned technician */}
          <div className="card">
            <h4 className="detail-sidebar__title">
              <Wrench size={15} /> Assigned To
            </h4>
            {ticket.assignedTo ? (
              <div className="assigned-user">
                <div className="avatar avatar-lg">{initials(ticket.assignedTo.name)}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{ticket.assignedTo.name}</div>
                  <div className="text-xs text-muted">{ticket.assignedTo.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Not yet assigned</p>
            )}

            {isAdmin && (
              <>
                {!showAssign ? (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-3)', width: '100%' }}
                    onClick={() => setShowAssign(true)}>
                    <UserCheck size={13} />
                    {ticket.assignedTo ? 'Reassign' : 'Assign Technician'}
                  </button>
                ) : (
                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <select className="form-select" value={assignId} onChange={e => setAssignId(e.target.value)}>
                      <option value="">— Select technician —</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.assignedTickets} active)
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={assigning} style={{ flex: 1 }}>
                        {assigning ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ticket metadata */}
          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <h4 className="detail-sidebar__title">
              <Tag size={15} /> Details
            </h4>
            <dl className="meta-list">
              <MetaDt label="Status">
                <StatusBadge value={ticket.status} type="status" />
              </MetaDt>
              <MetaDt label="Priority">
                <StatusBadge value={ticket.priority} type="priority" />
              </MetaDt>
              <MetaDt label="Category">{ticket.category}</MetaDt>
              <MetaDt label="Submitted">{fullDate}</MetaDt>
              {ticket.updatedAt && (
                <MetaDt label="Updated">
                  {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}
                </MetaDt>
              )}
            </dl>
          </div>
        </aside>
      </div>

      <style>{`
        .ticket-detail { max-width: 1100px; margin: 0 auto; }

        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: var(--space-6);
          align-items: start;
        }
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr; }
          .detail-sidebar { order: -1; }
        }

        .detail-header__top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--space-3);
        }
        .detail-id { font-size: 0.75rem; color: var(--clr-text-3); font-family: monospace; font-weight: 600; }
        .detail-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem; font-weight: 700;
          line-height: 1.3;
          margin-bottom: var(--space-4);
        }
        .detail-meta-row {
          display: flex; flex-wrap: wrap; gap: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--clr-border);
        }
        .meta-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.8125rem; color: var(--clr-text-2);
        }

        .detail-desc {
          font-size: 0.9375rem; color: var(--clr-text-2);
          line-height: 1.7; white-space: pre-wrap;
        }
        .contact-box {
          display: flex; flex-direction: column; gap: 4px;
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--clr-surface-2);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }

        .info-box { border-left: 3px solid; }
        .info-box p { font-size: 0.9rem; color: var(--clr-text-2); line-height: 1.6; }
        .info-box--success { border-left-color: var(--clr-resolved); }
        .info-box--danger  { border-left-color: var(--clr-rejected);  }
        .info-box__header {
          display: flex; align-items: center; gap: var(--space-2);
          margin-bottom: var(--space-3); font-size: 0.9rem;
        }
        .info-box--success .info-box__header { color: var(--clr-resolved); }
        .info-box--danger  .info-box__header { color: var(--clr-rejected);  }

        .attachments-grid { display: flex; flex-direction: column; gap: var(--space-3); }
        .attachment-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .attachment-item:hover { border-color: var(--clr-primary); }
        .attachment-thumb {
          width: 60px; height: 60px; object-fit: cover;
          border-radius: var(--radius-sm); flex-shrink: 0;
        }
        .attachment-icon {
          width: 60px; height: 60px;
          background: var(--clr-surface-3);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--clr-text-3);
        }
        .attachment-info { flex: 1; min-width: 0; }
        .attachment-name {
          display: block; font-size: 0.875rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .detail-sidebar__title {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 0.875rem; font-weight: 600; color: var(--clr-text-2);
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: var(--space-4);
        }

        .assigned-user { display: flex; align-items: center; gap: var(--space-3); }

        .meta-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .meta-dt { display: flex; flex-direction: column; gap: 3px; }
        .meta-dt-label { font-size: 0.75rem; color: var(--clr-text-3); }
        .meta-dt-value { font-size: 0.875rem; font-weight: 500; }
      `}</style>
    </div>
  )
}

function MetaChip({ icon, label, title }) {
  return (
    <span className="meta-chip" title={title}>
      {icon} {label}
    </span>
  )
}

function MetaDt({ label, children }) {
  return (
    <div className="meta-dt">
      <span className="meta-dt-label">{label}</span>
      <span className="meta-dt-value">{children}</span>
    </div>
  )
}
