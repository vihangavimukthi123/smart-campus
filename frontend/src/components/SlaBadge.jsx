import React from 'react'

const SlaBadge = ({ status }) => {
  if (!status) return null

  const isBreached = status === 'BREACHED'
  
  return (
    <span className={`sla-badge ${isBreached ? 'breach' : 'within'}`}>
      {isBreached ? 'SLA BREACHED' : 'WITHIN SLA'}
      <style>{`
        .sla-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sla-badge.within {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .sla-badge.breach {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </span>
  )
}

export default SlaBadge
