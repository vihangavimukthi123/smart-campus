import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ticketService } from '../api/ticketService'
import { useAuth } from '../hooks/useAuth'
import TicketCard from '../components/TicketCard'
import FilterBar from '../components/FilterBar'
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function TicketListPage() {
  const { isAdmin, isTechnician, isUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tickets,    setTickets]    = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(0)

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    status:   searchParams.get('status')   || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
  })

  const fetchTickets = useCallback(async (f, p) => {
    setLoading(true)
    try {
      const params = {
        page: p,
        size: 10,
        sortBy: 'createdAt',
        direction: 'desc',
      }
      if (f.search)   params.search   = f.search
      if (f.status)   params.status   = f.status
      if (f.priority) params.priority = f.priority
      if (f.category) params.category = f.category

      const { data } = await ticketService.getAll(params)
      setTickets(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotal(data.totalElements || 0)
    } catch {}
    finally { setLoading(false) }
  }, [])

  // Fetch on filter/page change
  useEffect(() => {
    fetchTickets(filters, page)
    // Sync URL params
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) sp.set(k, v) })
    setSearchParams(sp, { replace: true })
  }, [filters, page, fetchTickets])

  const onFilterChange = (f) => {
    setFilters(f)
    setPage(0)
  }

  const canCreate = isUser;

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="heading-2">
            {isAdmin ? 'All Tickets' : isTechnician ? 'My Assigned Tickets' : 'My Tickets'}
          </h2>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            {total} ticket{total !== 1 ? 's' : ''} found
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
            <PlusCircle size={16} /> New Ticket
          </button>
        )}
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} />

      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🎫</div>
          <h3 className="heading-3" style={{ marginBottom: 'var(--space-2)' }}>No tickets found</h3>
          <p className="text-muted text-sm">
            {Object.values(filters).some(Boolean)
              ? 'Try adjusting your filters.'
              : canCreate
              ? 'Submit your first ticket to get started!'
              : 'No tickets have been assigned to you yet.'}
          </p>
          {canCreate && !Object.values(filters).some(Boolean) && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-5)' }}
              onClick={() => navigate('/tickets/new')}
            >
              <PlusCircle size={16} /> Create Ticket
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ticket-grid">
            {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <span className="pagination__info">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .ticket-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: var(--space-4);
          margin-top: var(--space-8);
        }
        .pagination__info { font-size: 0.875rem; color: var(--clr-text-2); }
      `}</style>
    </div>
  )
}
