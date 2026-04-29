import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, Phone, Building, Mail, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  
  // Local state for editing
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call for now (Frontend only)
    setTimeout(() => {
      const updatedUser = { ...user, ...form }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully!')
      setLoading(false)
    }, 800)
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', paddingBottom: '2rem' }}>
      <header className="page-header">
        <h1 className="heading-1 text-gradient">Profile Management</h1>
        <p className="text-muted">Update your personal details and preferences.</p>
      </header>

      <div className="card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.8rem' }}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address (Read Only)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.8rem', opacity: 0.7, cursor: 'not-allowed' }}
                  value={user?.email || ''}
                  disabled
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '2.8rem' }}
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="e.g. +1 234 567 890"
                />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.8rem' }}
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role (Read Only)</label>
              <div style={{ position: 'relative' }}>
                <Shield size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.8rem', opacity: 0.7, cursor: 'not-allowed', textTransform: 'capitalize' }}
                  value={user?.role?.toLowerCase() || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ minWidth: '160px', justifyContent: 'center' }}
            >
              {loading 
                ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> 
                : <><Save size={18} /> Save Changes</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
