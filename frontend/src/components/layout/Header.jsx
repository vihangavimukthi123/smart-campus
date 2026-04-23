import { useLocation } from 'react-router-dom'
import NotificationBell from '../NotificationBell'

const PAGE_TITLES = {
  '/dashboard':   '📊 Dashboard',
  '/tickets':     '🎫 Tickets',
  '/tickets/new': '➕ New Ticket',
  '/admin/users':    '👥 User Management'
}

export default function Header() {
  const { pathname } = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || (path !== '/tickets' && pathname.startsWith(path))
  )?.[1] || '🎫 Ticket Details'

  return (
    <header className="top-header">
      <h1 className="top-header__title">{title}</h1>
      <div className="top-header__actions">
        <NotificationBell />
      </div>

      <style>{`
        .top-header {
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 var(--space-8);
          background: var(--clr-bg-2);
          border-bottom: 1px solid var(--clr-border);
          position: sticky; top: 0; z-index: 50;
        }
        .top-header__title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem; font-weight: 600;
          color: var(--clr-text);
        }
        .top-header__actions { display: flex; align-items: center; gap: var(--space-3); }
      `}</style>
    </header>
  )
}
