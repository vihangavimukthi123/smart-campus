import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ticketService } from '../api/ticketService'
import { useAuth } from '../hooks/useAuth'
import ImageUploader from '../components/ImageUploader'
import toast from 'react-hot-toast'
import { Send, ChevronLeft, Info } from 'lucide-react'

const CATEGORIES = ['Electrical', 'Plumbing', 'Network', 'HVAC', 'Cleaning', 'Security', 'Furniture', 'Other']
const PRIORITIES = [
  { value: 'LOW',      label: '🔵 Low',      desc: 'Non-urgent, convenient fix' },
  { value: 'MEDIUM',   label: '🟡 Medium',   desc: 'Affects productivity, not urgent' },
  { value: 'HIGH',     label: '🟠 High',     desc: 'Significant impact on operations' },
  { value: 'CRITICAL', label: '🔴 Critical', desc: 'Safety hazard or complete outage' },
]

const STEPS = ['Details', 'Location & Contact', 'Priority & Images', 'Review']

const INITIAL = {
  title: '', description: '', category: '', location: '',
  contactDetails: '', priority: 'MEDIUM'
}

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const { isUser } = useAuth()
  
  const [step,    setStep]    = useState(0)
  const [form,    setForm]    = useState(INITIAL)
  const [files,   setFiles]   = useState([])
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  // Per-step validation
  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.title.trim() || form.title.length < 5)         e.title = 'Title must be at least 5 characters'
      if (!form.description.trim() || form.description.length < 20) e.description = 'Description must be at least 20 characters'
      if (!form.category)                                       e.category = 'Please select a category'
    }
    if (step === 1) {
      if (!form.location.trim())  e.location = 'Location is required'
    }
    if (step === 2) {
      if (!form.priority)         e.priority = 'Please select a priority'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    setLoading(true)
    try {
      const { data: ticket } = await ticketService.create(form)

      // Upload files if any
      if (files.length > 0) {
        try {
          await ticketService.uploadAttachments(ticket.id, files)
        } catch {
          toast.error('Ticket created, but image upload failed.')
        }
      }

      toast.success('Ticket submitted successfully!')
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      const msg = err.response?.data?.message
        || Object.values(err.response?.data?.fieldErrors || {}).join('. ')
        || 'Failed to create ticket'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!isUser) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="fade-in create-ticket-page">
      {/* Back button */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}
        style={{ marginBottom: 'var(--space-4)' }}>
        <ChevronLeft size={15} /> Back to Tickets
      </button>

      <div className="create-card">
        {/* Step indicator */}
        <div className="step-bar">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-item ${i < step ? 'step-item--done' : ''} ${i === step ? 'step-item--active' : ''}`}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'step-line--done' : ''}`} />}
            </div>
          ))}
        </div>

        <hr className="divider" />

        {/* ── Step 0: Details ── */}
        {step === 0 && (
          <div className="step-content fade-in">
            <h3 className="step-title">📝 Incident Details</h3>

            <div className="form-group">
              <label className="form-label">Title <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <input id="ticket-title" className={`form-input ${errors.title ? 'form-input--err' : ''}`}
                placeholder="e.g. Air conditioning not working in Room 204"
                value={form.title} onChange={e => set('title', e.target.value)} />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <select id="ticket-category" className={`form-select ${errors.category ? 'form-input--err' : ''}`}
                value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <textarea id="ticket-description" className={`form-textarea ${errors.description ? 'form-input--err' : ''}`}
                rows={5}
                placeholder="Describe the issue in detail — when it started, what you observed, any safety concerns…"
                value={form.description} onChange={e => set('description', e.target.value)} />
              <span className="text-xs text-muted" style={{ alignSelf: 'flex-end' }}>
                {form.description.length} / 20 min
              </span>
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>
          </div>
        )}

        {/* ── Step 1: Location & Contact ── */}
        {step === 1 && (
          <div className="step-content fade-in">
            <h3 className="step-title">📍 Location & Contact</h3>

            <div className="form-group">
              <label className="form-label">Location / Room <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <input id="ticket-location" className={`form-input ${errors.location ? 'form-input--err' : ''}`}
                placeholder="e.g. Block A, Floor 2, Room 204"
                value={form.location} onChange={e => set('location', e.target.value)} />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Details</label>
              <input className="form-input"
                placeholder="Phone or alternate email (optional)"
                value={form.contactDetails} onChange={e => set('contactDetails', e.target.value)} />
              <span className="text-xs text-muted">If different from your registered email</span>
            </div>
          </div>
        )}

        {/* ── Step 2: Priority & Images ── */}
        {step === 2 && (
          <div className="step-content fade-in">
            <h3 className="step-title">⚡ Priority & Evidence</h3>

            <div className="form-group">
              <label className="form-label">Priority Level <span style={{ color: 'var(--clr-error)' }}>*</span></label>
              <div className="priority-grid">
                {PRIORITIES.map(p => (
                  <label key={p.value}
                    className={`priority-chip ${form.priority === p.value ? 'priority-chip--active' : ''}`}>
                    <input type="radio" name="priority" value={p.value}
                      checked={form.priority === p.value}
                      onChange={() => set('priority', p.value)} hidden />
                    <span className="priority-chip__label">{p.label}</span>
                    <span className="priority-chip__desc">{p.desc}</span>
                  </label>
                ))}
              </div>
              {errors.priority && <span className="form-error">{errors.priority}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Attach Images <span className="text-muted text-xs">(optional, max 3)</span>
              </label>
              <ImageUploader files={files} onChange={setFiles} />
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="step-content fade-in">
            <h3 className="step-title">👁 Review & Submit</h3>

            <div className="review-grid">
              <ReviewRow label="Title"    value={form.title} />
              <ReviewRow label="Category" value={form.category} />
              <ReviewRow label="Location" value={form.location} />
              <ReviewRow label="Priority" value={form.priority} />
              {form.contactDetails && <ReviewRow label="Contact" value={form.contactDetails} />}
              <div className="review-row review-row--full">
                <span className="review-label">Description</span>
                <p className="review-value">{form.description}</p>
              </div>
              {files.length > 0 && (
                <div className="review-row review-row--full">
                  <span className="review-label">Attachments</span>
                  <span className="review-value">{files.length} image{files.length > 1 ? 's' : ''} selected</span>
                </div>
              )}
            </div>

            <div className="tip-box">
              <Info size={14} />
              By submitting, you agree that this information is accurate.
              Your ticket will be reviewed by the facilities team.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-nav">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={back}>
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button id="next-step" className="btn btn-primary" onClick={next}>
              Next →
            </button>
          ) : (
            <button id="submit-ticket" className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading
                ? <span className="spinner" style={{ width: 16, height: 16 }} />
                : <><Send size={15} /> Submit Ticket</>
              }
            </button>
          )}
        </div>
      </div>

      <style>{`
        .create-ticket-page { max-width: 720px; margin: 0 auto; }
        .create-card {
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
        }

        /* Step bar */
        .step-bar {
          display: flex; align-items: center;
          gap: 0;
          margin-bottom: var(--space-6);
        }
        .step-item {
          display: flex; align-items: center; gap: var(--space-2);
          flex: 1; position: relative;
        }
        .step-item:last-child { flex: none; }
        .step-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid var(--clr-border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700;
          flex-shrink: 0;
          transition: var(--transition);
          color: var(--clr-text-3);
        }
        .step-item--active .step-dot {
          border-color: var(--clr-primary);
          background: rgba(99,102,241,0.15);
          color: var(--clr-primary);
          box-shadow: 0 0 0 4px var(--clr-primary-glow);
        }
        .step-item--done .step-dot {
          border-color: var(--clr-resolved);
          background: rgba(16,185,129,0.15);
          color: var(--clr-resolved);
        }
        .step-label {
          font-size: 0.8125rem; font-weight: 500;
          color: var(--clr-text-3);
        }
        .step-item--active .step-label { color: var(--clr-text); }
        .step-item--done  .step-label  { color: var(--clr-resolved); }
        .step-line {
          flex: 1; height: 2px;
          background: var(--clr-border);
          margin: 0 var(--space-2);
          transition: background 0.3s;
        }
        .step-line--done { background: var(--clr-resolved); }

        .step-content { min-height: 280px; }
        .step-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.125rem; font-weight: 600;
          margin-bottom: var(--space-6);
        }
        .form-input--err { border-color: var(--clr-error) !important; }

        .step-nav {
          display: flex; align-items: center; gap: var(--space-3);
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid var(--clr-border);
        }

        /* Priority grid */
        .priority-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);
        }
        .priority-chip {
          padding: var(--space-4);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          cursor: pointer; transition: var(--transition);
          display: flex; flex-direction: column; gap: 4px;
        }
        .priority-chip:hover { border-color: var(--clr-primary); }
        .priority-chip--active {
          border-color: var(--clr-primary);
          background: rgba(99,102,241,0.08);
        }
        .priority-chip__label { font-size: 0.9375rem; font-weight: 600; }
        .priority-chip__desc  { font-size: 0.75rem; color: var(--clr-text-3); }

        /* Review */
        .review-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
          margin-bottom: var(--space-5);
        }
        .review-row {
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
        }
        .review-row--full { grid-column: 1 / -1; }
        .review-label { display: block; font-size: 0.75rem; color: var(--clr-text-3); margin-bottom: 4px; }
        .review-value { font-size: 0.9rem; font-weight: 500; word-break: break-word; }

        .tip-box {
          display: flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: var(--radius-md);
          font-size: 0.8125rem; color: var(--clr-text-2);
        }
      `}</style>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className="review-value">{value}</span>
    </div>
  )
}
