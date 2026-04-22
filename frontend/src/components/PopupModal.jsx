import { useEffect } from 'react'
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react'

export default function PopupModal({ message, isOpen, onClose, type = 'error' }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isError = type === 'error'
  const isWarning = type === 'warning'
  const isSuccess = type === 'success'

  const getThemeColor = () => {
    if (isError) return 'var(--clr-error)'
    if (isWarning) return 'var(--clr-warning)'
    return 'var(--clr-success)'
  }

  const getThemeBg = () => {
    if (isError) return 'rgba(239, 68, 68, 0.1)'
    if (isWarning) return 'rgba(245, 158, 11, 0.1)'
    return 'rgba(16, 185, 129, 0.1)'
  }

  const themeColor = getThemeColor()
  const themeBg = getThemeBg()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
        style={{
          width: '400px',
          maxWidth: '100%',
          backgroundColor: 'var(--clr-surface)',
          border: `1px solid ${themeColor}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
          animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--clr-text-3)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: themeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor,
          }}
        >
          {isError && <AlertCircle size={32} />}
          {isWarning && <AlertTriangle size={32} />}
          {isSuccess && <CheckCircle size={32} />}
        </div>

        <h3 className="heading-3" style={{ color: themeColor }}>
          {isError && 'Error Occurred'}
          {isWarning && 'Availability Conflict'}
          {isSuccess && 'Success'}
        </h3>

        <p className="text-muted" style={{ fontSize: '1rem' }}>
          {message}
        </p>

        <div
          style={{
            height: '4px',
            backgroundColor: themeBg,
            borderRadius: '2px',
            width: '100%',
            marginTop: '1rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: themeColor,
              width: '100%',
              animation: 'progressShrink 4s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
