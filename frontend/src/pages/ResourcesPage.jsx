import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createResource, getResources } from '../api/resourceService'
import { useAuth } from '../hooks/useAuth'

const emptyForm = {
  name: '',
  type: 'LAB',
  capacity: 1,
  location: '',
  status: 'ACTIVE',
}

export default function ResourcesPage() {
  const { isAdmin } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    type: 'ALL',
    location: '',
    minCapacity: '',
  })

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const typeOk = filters.type === 'ALL' || resource.type === filters.type
      const locationOk = !filters.location || resource.location.toLowerCase().includes(filters.location.toLowerCase())
      const capacityOk = !filters.minCapacity || Number(resource.capacity) >= Number(filters.minCapacity)
      return typeOk && locationOk && capacityOk
    })
  }, [resources, filters])

  const loadResources = async () => {
    setLoading(true)
    try {
      const data = await getResources()
      setResources(data)
    } catch (error) {
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()

    if (!isAdmin) {
      toast.error('Only admins can create resources')
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

      if (!payload.name || !payload.location || !payload.capacity) {
        toast.error('Please complete all required fields')
        return
      }

      const created = await createResource(payload)
      setResources((prev) => [created, ...prev])
      setForm(emptyForm)
      toast.success('Resource created')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create resource'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 className="heading-1 text-gradient">Resources Catalogue</h1>
        <p className="text-muted">Facilities and assets for booking integration.</p>
      </header>

      {isAdmin ? (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <h2 className="heading-3" style={{ marginBottom: '0.75rem' }}>Create Resource</h2>
          <form onSubmit={handleCreate}>
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
                  <option value="LAB">LAB</option>
                  <option value="ROOM">ROOM</option>
                  <option value="EQUIPMENT">EQUIPMENT</option>
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
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                </select>
              </div>

            </div>

            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Resource'}
              </button>
            </div>
          </form>
        </section>
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
              <option value="LAB">LAB</option>
              <option value="ROOM">ROOM</option>
              <option value="EQUIPMENT">EQUIPMENT</option>
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
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredResources.map((resource) => (
              <article key={resource.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="heading-3" style={{ fontSize: '1.05rem' }}>{resource.name}</h3>
                    <p className="text-muted text-sm">
                      {resource.type} | Capacity: {resource.capacity} | {resource.location}
                    </p>
                  </div>
                  <span className={`badge ${resource.status === 'ACTIVE' ? 'badge-resolved' : 'badge-rejected'}`}>
                    {resource.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
