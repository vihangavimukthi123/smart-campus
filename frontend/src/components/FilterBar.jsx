import { Search, SlidersHorizontal, X } from 'lucide-react'

const STATUSES   = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const CATEGORIES = ['Electrical', 'Plumbing', 'Network', 'HVAC', 'Cleaning', 'Security', 'Furniture', 'Other']

/**
 * FilterBar — search + status / priority / category dropdowns.
 */
export default function FilterBar({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  const hasFilters = filters.search || filters.status || filters.priority || filters.category

  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="filter-search">
        <Search size={16} className="filter-search__icon" />
        <input
          className="form-input filter-search__input"
          placeholder="Search tickets…"
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
        />
      </div>

      {/* Status */}
      <select
        className="form-select filter-select"
        value={filters.status || ''}
        onChange={e => set('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      {/* Priority */}
      <select
        className="form-select filter-select"
        value={filters.priority || ''}
        onChange={e => set('priority', e.target.value)}
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Category */}
      <select
        className="form-select filter-select"
        value={filters.category || ''}
        onChange={e => set('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ search: '', status: '', priority: '', category: '' })}
          title="Clear filters"
        >
          <X size={14} /> Clear
        </button>
      )}

      <style>{`
        .filter-bar {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
          margin-bottom: var(--space-6);
        }
        .filter-search {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .filter-search__icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--clr-text-3);
          pointer-events: none;
        }
        .filter-search__input {
          padding-left: 36px;
        }
        .filter-select {
          width: auto;
          min-width: 140px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
