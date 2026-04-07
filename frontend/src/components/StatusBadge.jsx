/**
 * StatusBadge — color-coded pill displaying ticket status or priority.
 *
 * @param {string} status  - e.g. 'OPEN', 'IN_PROGRESS', etc.
 * @param {string} type    - 'status' | 'priority'
 */
export default function StatusBadge({ value, type = 'status' }) {
  const key = (value || '').toLowerCase()

  const STATUS_DOT = {
    open:        '🟡',
    in_progress: '🔵',
    resolved:    '🟢',
    closed:      '⚫',
    rejected:    '🔴',
  }

  const PRIORITY_DOT = {
    critical: '🔴',
    high:     '🟠',
    medium:   '🟡',
    low:      '🔵',
  }

  const dot  = type === 'status' ? STATUS_DOT[key] : PRIORITY_DOT[key]
  const label = (value || '').replace('_', ' ')

  return (
    <span className={`badge badge-${key}`} title={`${type}: ${label}`}>
      {dot && <span style={{ fontSize: '0.6rem' }}>{dot}</span>}
      {label}
    </span>
  )
}
