import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth() 
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. call Login function 
      const user = await login(form.email, form.password)
      toast.success('Welcome back!')
      
      // 2. decide dashboard based on role
      if (user.role === 'TECHNICIAN') {
        navigate('/technician-dashboard') 
      } else {
        navigate('/dashboard')
      }

    } catch (err) {
      // Backend error message
      const msg = err.response?.data?.error || err.response?.data?.message || 'Invalid email or password'
      
      // 3. unverified emails get redirected to register
      if (msg.toLowerCase().includes('not verified')) {
        toast.error('Please verify your email first!')
        // send to register page with email pre-filled
        navigate('/register', { state: { email: form.email, autoShowOtp: true } })
      } else {
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      
      <div className="auth-glow auth-glow--left" />
      <div className="auth-glow auth-glow--right" />

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__logo">🏛️</span>
          <div>
            <h1 className="auth-brand__title text-gradient">Matrix Core</h1>
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
      
      {/* Oyaage <style> tag eka methana thiyenna ona */}
    </div>
  )
}