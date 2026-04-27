import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning' 
}) {
  if (!isOpen) return null

  const isDanger = type === 'danger'
  const isWarning = type === 'warning'
  const isSuccess = type === 'success'

  const getThemeColor = () => {
    if (isDanger) return 'var(--clr-error)'
    if (isWarning) return 'var(--clr-warning)'
    if (isSuccess) return 'var(--clr-success)'
    return 'var(--clr-primary)'
  }

  const getThemeBg = () => {
    if (isDanger) return 'rgba(239, 68, 68, 0.1)'
    if (isWarning) return 'rgba(245, 158, 11, 0.1)'
    if (isSuccess) return 'rgba(16, 185, 129, 0.1)'
    return 'var(--clr-primary-glow)'
  }

  const themeColor = getThemeColor()
  const themeBg = getThemeBg()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card-glass"
        style={{
          width: '400px',
          maxWidth: '100%',
          backgroundColor: 'var(--clr-surface)',
          border: `1px solid var(--clr-border)`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
          animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn-ghost btn-icon"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: themeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor,
            marginBottom: '0.5rem'
          }}
        >
          <AlertTriangle size={30} />
        </div>

        <div>
          <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>
            {title}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            width: '100%',
            marginTop: '0.5rem'
          }}
        >
          <button
            className="btn btn-secondary"
            style={{ justifyContent: 'center' }}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            style={{ 
              justifyContent: 'center',
              backgroundColor: !isDanger ? themeColor : undefined,
              color: !isDanger ? 'var(--clr-btn-text)' : undefined
            }}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
