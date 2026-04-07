import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, MessageSquare, Paperclip, User } from 'lucide-react'

/**
 * TicketCard — compact list item shown in TicketListPage.
 */
export default function TicketCard({ ticket }) {
  const navigate = useNavigate()

  const timeAgo = ticket.createdAt
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
    : ''

  return (
    <div
      className="card ticket-card"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="ticket-card__header">
        <div className="ticket-card__id">#{ticket.id}</div>
        <div className="flex gap-2">
          <StatusBadge value={ticket.priority} type="priority" />
          <StatusBadge value={ticket.status}   type="status" />
        </div>
      </div>

      <h3 className="ticket-card__title">{ticket.title}</h3>

      <p className="ticket-card__desc">
        {ticket.description.length > 120
          ? ticket.description.slice(0, 120) + '…'
          : ticket.description}
      </p>

      <div className="ticket-card__meta">
        <span className="ticket-card__meta-item">
          <MapPin size={13} />
          {ticket.location}
        </span>
        <span className="ticket-card__meta-item">
          <User size={13} />
          {ticket.createdBy?.name}
        </span>
        <span className="ticket-card__meta-item">
          <MessageSquare size={13} />
          {ticket.commentCount}
        </span>
        {ticket.attachments?.length > 0 && (
          <span className="ticket-card__meta-item">
            <Paperclip size={13} />
            {ticket.attachments.length}
          </span>
        )}
        <span className="ticket-card__meta-item" style={{ marginLeft: 'auto' }}>
          {timeAgo}
        </span>
      </div>

      <style>{`
        .ticket-card {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .ticket-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--clr-primary);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .ticket-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--clr-border-hover);
        }
        .ticket-card:hover::before { opacity: 1; }
        .ticket-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }
        .ticket-card__id {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--clr-text-3);
          font-family: 'Space Grotesk', monospace;
        }
        .ticket-card__title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-2);
          color: var(--clr-text);
          line-height: 1.4;
        }
        .ticket-card__desc {
          font-size: 0.875rem;
          color: var(--clr-text-2);
          margin-bottom: var(--space-4);
          line-height: 1.5;
        }
        .ticket-card__meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--clr-border);
        }
        .ticket-card__meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--clr-text-3);
        }
      `}</style>
    </div>
  )
}
