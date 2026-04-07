import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password'
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

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-brand__logo">🏛️</span>
          <div>
            <h1 className="auth-brand__title text-gradient">SmartCampus</h1>
            <p className="auth-brand__sub">Incident Hub</p>
          </div>
        </div>

        <h2 className="auth-heading">Sign in to your account</h2>
        <p className="auth-sub">Welcome back! Enter your credentials to continue.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@campus.edu"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--clr-text-3)', cursor: 'pointer'
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <><LogIn size={16} /> Sign In</>
            }
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
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
          width: 100%; max-width: 440px;
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-xl);
          padding: var(--space-10);
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.4s ease;
        }

        .auth-brand {
          display: flex; align-items: center; gap: var(--space-3);
          margin-bottom: var(--space-8);
        }
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
      `}</style>
    </div>
  )
}
