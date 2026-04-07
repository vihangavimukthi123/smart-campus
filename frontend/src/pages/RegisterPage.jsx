import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

const ROLES = ['USER', 'TECHNICIAN']

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', department: '', role: 'USER'
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to SmartCampus.')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message
        || Object.values(err.response?.data?.fieldErrors || {}).join(', ')
        || 'Registration failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--left" />
      <div className="auth-glow auth-glow--right" />

      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-brand">
          <span className="auth-brand__logo">🏛️</span>
          <div>
            <h1 className="auth-brand__title text-gradient">SmartCampus</h1>
            <p className="auth-brand__sub">Incident Hub</p>
          </div>
        </div>

        <h2 className="auth-heading">Create your account</h2>
        <p className="auth-sub">Join the campus maintenance system.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <input className="form-input" placeholder="Jane Smith" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <input className="form-input" type="email" placeholder="you@campus.edu" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--clr-error)' }}>*</span></label>
            <input className="form-input" type="password" placeholder="Min 8 chars, upper + lower + digit"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 9876543210" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" placeholder="Engineering" value={form.department}
                onChange={e => set('department', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {ROLES.map(r => (
                <label key={r} className={`role-chip ${form.role === r ? 'role-chip--active' : ''}`}>
                  <input type="radio" name="role" value={r} checked={form.role === r}
                    onChange={() => set('role', r)} hidden />
                  {r === 'USER' ? '👤 Student / Staff' : '🔧 Technician'}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <><UserPlus size={16} /> Create Account</>
            }
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: var(--clr-bg);
          position: relative; overflow: hidden;
          padding: var(--space-6);
        }
        .auth-glow {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.12;
          pointer-events: none;
        }
        .auth-glow--left  { background: var(--clr-primary); top: -100px; left: -150px; }
        .auth-glow--right { background: var(--clr-secondary); bottom: -100px; right: -150px; }

        .auth-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 520px;
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-xl);
          padding: var(--space-10);
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.4s ease;
        }
        .auth-brand { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-8); }
        .auth-brand__logo { font-size: 2.5rem; }
        .auth-brand__title { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; }
        .auth-brand__sub   { font-size: 0.75rem; color: var(--clr-text-3); }
        .auth-heading { font-size: 1.375rem; font-weight: 700; margin-bottom: var(--space-2); }
        .auth-sub     { font-size: 0.875rem; color: var(--clr-text-2); margin-bottom: var(--space-6); }
        .auth-error {
          padding: var(--space-3) var(--space-4);
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-md);
          font-size: 0.875rem; color: var(--clr-error);
          margin-bottom: var(--space-4);
        }
        .auth-footer { text-align: center; font-size: 0.875rem; color: var(--clr-text-2); margin-top: var(--space-6); }
        .auth-link { color: var(--clr-primary); font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }

        .role-chip {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500;
          cursor: pointer; text-align: center;
          transition: var(--transition);
        }
        .role-chip:hover { border-color: var(--clr-primary); }
        .role-chip--active {
          border-color: var(--clr-primary);
          background: rgba(99,102,241,0.1);
          color: var(--clr-primary);
        }
      `}</style>
    </div>
  )
}
