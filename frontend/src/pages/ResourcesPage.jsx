import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Trash2 } from 'lucide-react'
import { createResource, deleteResource, getResources, updateResource } from '../api/resourceService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const emptyForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: 1,
  location: '',
  status: 'AVAILABLE',
}

const typeOptions = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'STUDY_ROOM', label: 'Study Room' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'AUDITORIUM', label: 'Auditorium' },
  { value: 'EQUIPMENT', label: 'Equipment' },
]

const statusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
]

const formatEnumLabel = (value) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const normalizeResourceStatus = (status) => {
  if (status === 'ACTIVE') return 'AVAILABLE'
  if (status === 'OUT_OF_SERVICE') return 'MAINTENANCE'
  return status
}

const normalizeResource = (resource) => ({
  ...resource,
  status: normalizeResourceStatus(resource.status),
})

const getStatusBadgeClass = (status) => {
  if (status === 'AVAILABLE' || status === 'ACTIVE') return 'badge-resolved'
  if (status === 'OCCUPIED') return 'badge-open'
  if (status === 'RETIRED') return 'badge-rejected'
  if (status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE') return 'badge-in_progress'
  return 'badge-closed'
}

const getStatusCardStyle = (status) => {
  if (status === 'AVAILABLE' || status === 'ACTIVE') {
    return {
      borderColor: 'rgba(16,185,129,0.38)',
      background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, var(--clr-surface) 46%)',
    }
  }

  if (status === 'OCCUPIED') {
    return {
      borderColor: 'rgba(245,158,11,0.38)',
      background: 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, var(--clr-surface) 46%)',
    }
  }

  if (status === 'RETIRED') {
    return {
      borderColor: 'rgba(239,68,68,0.42)',
      background: 'linear-gradient(180deg, rgba(239,68,68,0.09) 0%, var(--clr-surface) 46%)',
    }
  }

  if (status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE') {
    return {
      borderColor: 'rgba(99,102,241,0.4)',
      background: 'linear-gradient(180deg, rgba(99,102,241,0.09) 0%, var(--clr-surface) 46%)',
    }
  }

  return {
    borderColor: 'rgba(100,116,139,0.4)',
    background: 'linear-gradient(180deg, rgba(100,116,139,0.08) 0%, var(--clr-surface) 46%)',
  }
}

export default function ResourcesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [showRetired, setShowRetired] = useState(false)

  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    location: '',
    minCapacity: '',
  })

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const typeOk = filters.type === 'ALL' || resource.type === filters.type
      const statusOk = filters.status === 'ALL' || resource.status === filters.status
      const locationOk = !filters.location || (resource.location || '').toLowerCase().includes(filters.location.toLowerCase())
      const capacityOk = !filters.minCapacity || Number(resource.capacity) >= Number(filters.minCapacity)
      return typeOk && statusOk && locationOk && capacityOk
    })
  }, [resources, filters])

  const loadResources = async () => {
    setLoading(true)
    try {
      const response = await getResources(isAdmin && showRetired)

      const resourcesData = Array.isArray(response)
      ? response
      : response.data || response.content || []

      setResources(resourcesData.map(normalizeResource))
    } catch (error) {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [isAdmin, showRetired])

  const openCreateModal = () => {
    setEditingResource(null)
    setForm(emptyForm)
    setShowCreateModal(true)
  }

  const openEditModal = (resource) => {
    setEditingResource(resource)
    setForm({
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity ?? 1,
      location: resource.location || '',
      status: resource.status || 'AVAILABLE',
    })
    setShowCreateModal(true)
  }

  const closeResourceModal = () => {
    if (submitting) {
      return
    }

    setShowCreateModal(false)
    setEditingResource(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isAdmin) {
      toast.error('Only admins can manage resources')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        location: form.location.trim(),
        capacity: Number(form.capacity),
      }

      if (!payload.name || !payload.location || payload.capacity < 1) {
        toast.error('Please complete all required fields')
        return
      }

      if (editingResource) {
        const updated = await updateResource(editingResource.id, payload)
        const normalizedUpdated = normalizeResource(updated)
        setResources((prev) => prev.map((resource) => (resource.id === normalizedUpdated.id ? normalizedUpdated : resource)))
        toast.success('Resource updated')
      } else {
        const created = await createResource(payload)
        setResources((prev) => [normalizeResource(created), ...prev])
        toast.success('Resource created')
      }

      setForm(emptyForm)
      setEditingResource(null)
      setShowCreateModal(false)
    } catch (error) {
      const message = error.response?.data?.message || (editingResource ? 'Failed to update resource' : 'Failed to create resource')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (resource) => {
    if (!isAdmin) {
      toast.error('Only admins can manage resources')
      return
    }

    const confirmed = window.confirm(`Delete resource "${resource.name}"?`)
    if (!confirmed) {
      return
    }

    setDeletingId(resource.id)
    try {
      await deleteResource(resource.id)
      if (showRetired) {
        setResources((prev) => prev.map((item) => (item.id === resource.id ? { ...item, status: 'RETIRED' } : item)))
      } else {
        setResources((prev) => prev.filter((item) => item.id !== resource.id))
      }
      toast.success('Resource deleted')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete resource'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 className="heading-1 text-gradient">Resources Catalogue</h1>
        <p className="text-muted">Facilities and assets for booking integration.</p>
      </header>

      {isAdmin ? (
        <section style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--clr-text-2)', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={showRetired}
              onChange={(event) => setShowRetired(event.target.checked)}
            />
            Show Retired Resources
          </label>

          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            Create Resource
          </button>
        </section>
      ) : null}

      {isAdmin && showCreateModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingResource ? 'Edit Resource' : 'Create Resource'}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 30, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => {
            if (!submitting) {
              setShowCreateModal(false)
            }
          }}
        >
          <section
            className="card"
            style={{
              width: 'min(900px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              marginTop: '0',
              marginBottom: 0,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 className="heading-3">{editingResource ? 'Edit Resource' : 'Create Resource'}</h2>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closeResourceModal}
                disabled={submitting}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Engineering Lab A"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Capacity</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="Main Building - Floor 1"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-secondary" type="button" onClick={closeResourceModal} disabled={submitting}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? (editingResource ? 'Saving...' : 'Creating...') : (editingResource ? 'Save Changes' : 'Create Resource')}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="heading-3" style={{ marginBottom: '0.75rem' }}>Search & Filter</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="ALL">ALL</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="ALL">ALL</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location Contains</label>
            <input
              className="form-input"
              value={filters.location}
              onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Engineering Block"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Min Capacity</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={filters.minCapacity}
              onChange={(event) => setFilters((prev) => ({ ...prev, minCapacity: event.target.value }))}
              placeholder="20"
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="heading-3" style={{ marginBottom: '0.75rem' }}>Resources ({filteredResources.length})</h2>

        {loading ? <p className="text-muted">Loading resources...</p> : null}

        {!loading && filteredResources.length === 0 ? (
          <p className="text-muted">No resources found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
            {filteredResources.map((resource) => {
              const badgeClass = getStatusBadgeClass(resource.status)
              const statusCardStyle = getStatusCardStyle(resource.status)

              return (
              <article
                key={resource.id}
                className="card"
                style={{
                  padding: '1rem',
                  marginBottom: 0,
                  minHeight: '170px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  ...statusCardStyle,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="heading-3" style={{ fontSize: '1.05rem' }}>{resource.name}</h3>
                    <span className={`badge ${badgeClass}`} style={{ marginTop: '0.35rem' }}>
                      {formatEnumLabel(resource.status)}
                    </span>
                  </div>
                  {isAdmin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => openEditModal(resource)}
                        aria-label={`Edit ${resource.name}`}
                        title="Edit resource"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          minWidth: '2.6rem',
                          padding: '0.5rem',
                          background: 'rgba(37, 99, 235, 0.12)',
                          borderColor: 'rgba(37, 99, 235, 0.35)',
                          color: '#93c5fd',
                          boxShadow: 'none',
                        }}
                      >
                        <Pencil size={17} color="#93c5fd" />
                      </button>

                      <button
                        className="btn"
                        type="button"
                        onClick={() => handleDelete(resource)}
                        aria-label={`Delete ${resource.name}`}
                        title="Delete resource"
                        disabled={deletingId === resource.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          minWidth: '2.6rem',
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          borderColor: 'rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5',
                          boxShadow: 'none',
                          opacity: deletingId === resource.id ? 0.65 : 1,
                        }}
                      >
                        <Trash2 size={17} color="#fca5a5" />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  <p className="text-sm" style={{ color: 'var(--clr-text-2)' }}>
                    <strong style={{ color: 'var(--clr-text)' }}>Type:</strong> {formatEnumLabel(resource.type)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--clr-text-2)' }}>
                    <strong style={{ color: 'var(--clr-text)' }}>Capacity:</strong> {resource.capacity}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--clr-text-2)' }}>
                    <strong style={{ color: 'var(--clr-text)' }}>Location:</strong> {resource.location}
                  </p>
                </div>

                {!isAdmin && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => navigate(`/bookings/new?resourceId=${resource.id}`)}
                      disabled={resource.status !== 'AVAILABLE' && resource.status !== 'ACTIVE'}
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
