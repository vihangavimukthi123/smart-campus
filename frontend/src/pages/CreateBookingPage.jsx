import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getResources } from '../api/resourceService'
import { createBooking } from '../api/bookingService'
import toast from 'react-hot-toast'
import { Calendar, Clock, Users, MessageSquare, ChevronLeft, Send } from 'lucide-react'
import PopupModal from '../components/PopupModal'

export default function CreateBookingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const preSelectedResourceId = queryParams.get('resourceId')

  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    resourceId: preSelectedResourceId || '',
    startDateTime: '',
    endDateTime: '',
    purpose: '',
    attendees: ''
  })

  const [modal, setModal] = useState({ isOpen: false, message: '', type: 'error' })
  const [minDateTime, setMinDateTime] = useState('')

  const selectedResource = resources.find(r => String(r.id) === String(form.resourceId))
  const isEquipment = selectedResource?.type === 'EQUIPMENT'


  // Update minDateTime every minute to keep it current
  useEffect(() => {
    const updateMin = () => {
      const now = new Date()
      // Adjust to local ISO string format: YYYY-MM-DDTHH:mm
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    }

    updateMin()
    const interval = setInterval(updateMin, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources()
        const resourcesData = Array.isArray(data) ? data : data.data || []
        // Only show ACTIVE or AVAILABLE resources
        setResources(resourcesData.filter(r => r.status === 'AVAILABLE' || r.status === 'ACTIVE'))
      } catch (error) {
        toast.error('Failed to load resources catalogue')
      } finally {
        setLoadingResources(false)
      }
    }
    fetchResources()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (!form.resourceId) return toast.error('Please select a resource')
    if (!form.startDateTime) return toast.error('Please select a start time')
    if (!form.endDateTime) return toast.error('Please select an end time')
    if (!form.purpose.trim()) return toast.error('Please state the purpose of booking')

    const start = new Date(form.startDateTime)
    const end = new Date(form.endDateTime)

    if (end <= start) {
      return toast.error('End time must be later than start time')
    }

    const nowWithBuffer = new Date()
    nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() - 1)
    
    if (new Date(form.startDateTime) < nowWithBuffer) {
      return toast.error('Cannot select past date or time')
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        resourceId: Number(form.resourceId),
        attendees: form.attendees ? Number(form.attendees) : null
      }
      await createBooking(payload)
      setModal({
        isOpen: true,
        message: 'Booking request submitted successfully.',
        type: 'success'
      })
      // Navigate after the modal closes (4s)
      setTimeout(() => {
        navigate('/resources')
      }, 4000)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit booking request'
      const isConflict = message.includes('already booked')
      
      setModal({
        isOpen: true,
        message: message,
        type: isConflict ? 'warning' : 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="heading-1 text-gradient">Create Booking</h1>
        <p className="text-muted">Request use of campus facilities and resources.</p>
      </header>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Select Resource
            </label>
            <select
              className="form-select"
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
              disabled={loadingResources || preSelectedResourceId}
              required
            >
              <option value="">-- Select a resource --</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
              ))}
            </select>
            {loadingResources && <p className="text-xs text-muted">Loading resources...</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Start Date & Time
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.startDateTime}
                min={minDateTime}
                onChange={(e) => {
                  const val = e.target.value
                  if (val && new Date(val) < new Date()) {
                    toast.error('Cannot select past date or time')
                    setForm({ ...form, startDateTime: '' })
                    return
                  }
                  
                  // If new start time is after current end time, clear end time to maintain validity
                  if (form.endDateTime && val && new Date(val) >= new Date(form.endDateTime)) {
                    setForm({ ...form, startDateTime: val, endDateTime: '' })
                  } else {
                    setForm({ ...form, startDateTime: val })
                  }
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> End Date & Time
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.endDateTime}
                min={form.startDateTime || minDateTime}
                onChange={(e) => {
                  const val = e.target.value
                  if (val && new Date(val) < new Date()) {
                    toast.error('Cannot select past date or time')
                    setForm({ ...form, endDateTime: '' })
                    return
                  }
                  if (form.startDateTime && val && new Date(val) <= new Date(form.startDateTime)) {
                    toast.error('End time must be later than start time')
                    setForm({ ...form, endDateTime: '' })
                    return
                  }
                  setForm({ ...form, endDateTime: val })
                }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} /> Purpose of Booking
            </label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="e.g. Study group session, Club meeting"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> {isEquipment ? 'Quantity' : 'Expected Attendees'} (Optional)
            </label>
            <input
              type="number"
              min="1"
              className="form-input"
              placeholder={isEquipment ? 'e.g. 2' : 'e.g. 5'}
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : <><Send size={16} /> Submit Request</>}
            </button>
          </div>

        </form>
      </div>

      <PopupModal
        isOpen={modal.isOpen}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  )
}
