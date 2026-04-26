import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  Shield,
  Wrench,
  User,
  Users,
  Building2,
  Calendar,
  ClipboardCheck
} from 'lucide-react'

// Navigation links configuration
const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/tickets',   icon: <Ticket size={18} />,          label: 'Tickets' },
  { to: '/tickets/new', icon: <PlusCircle size={18} />,    label: 'New Ticket', roles: ['USER', 'ADMIN'] },
  // Admin ta vitharak pena User Management link eka
  { to: '/admin/users', icon: <Users size={18} />,         label: 'User Management', roles: ['ADMIN'] },
  { to: '/resources', icon: <Building2 size={18} />,       label: 'Resources', roles: ['USER', 'ADMIN'] },
  { to: '/bookings/my', icon: <Calendar size={18} />,      label: 'My Bookings', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/admin/bookings', icon: <ClipboardCheck size={18} />, label: 'Manage Bookings', roles: ['ADMIN'] },
]

const ROLE_ICON = { 
  ADMIN: <Shield size={14} />, 
  TECHNICIAN: <Wrench size={14} />, 
  USER: <User size={14} /> 
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { 
    logout()
    navigate('/login') 
  }

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Methana thama role eka anuwa filter wenne
  const navItems = NAV.filter(n => !n.roles || n.roles.includes(user?.role))

  return (
    <aside className="sidebar">
      {/* Brand Section */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">🏛️</div>
        <div>
          <div className="sidebar__brand-name">SmartCampus</div>
          <div className="sidebar__brand-sub">Incident Hub</div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="sidebar__nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/tickets'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer - Push footer to bottom */}
      <div style={{ flex: 1 }} />

      {/* User profile / Footer Section */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="avatar">{initials(user?.name)}</div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.name}</span>
            <span className="sidebar__user-role">
              {ROLE_ICON[user?.role]}
              {user?.role}
            </span>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon sidebar__logout" onClick={handleLogout} title="Log out">
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--clr-surface);
          border-right: 1px solid var(--clr-border);
          display: flex; flex-direction: column;
          z-index: 100;
          padding: var(--space-6) 0;
        }

        .sidebar__brand {
          display: flex; align-items: center; gap: var(--space-3);
          padding: 0 var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--clr-border);
          margin-bottom: var(--space-4);
        }
        .sidebar__logo { font-size: 1.75rem; }
        .sidebar__brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 1rem;
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-secondary));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sidebar__brand-sub { font-size: 0.7rem; color: var(--clr-text-3); margin-top: 1px; }

        .sidebar__nav {
          display: flex; flex-direction: column; gap: var(--space-1);
          padding: 0 var(--space-3);
        }

        .sidebar__link {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: 0.9rem; font-weight: 500;
          color: var(--clr-text-2);
          transition: var(--transition);
        }
        .sidebar__link:hover { background: var(--clr-surface-2); color: var(--clr-text); }
        .sidebar__link--active {
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1));
          color: var(--clr-primary);
          border: 1px solid rgba(99,102,241,0.2);
        }
        .sidebar__link-icon { width: 20px; flex-shrink: 0; }

        .sidebar__footer {
          margin-top: var(--space-4);
          padding: var(--space-4) var(--space-3) 0;
          border-top: 1px solid var(--clr-border);
          display: flex; align-items: center; gap: var(--space-2);
        }
        .sidebar__user { display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0; }
        .sidebar__user-info { min-width: 0; }
        .sidebar__user-name {
          display: block; font-size: 0.875rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sidebar__user-role {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.7rem; color: var(--clr-text-3); text-transform: uppercase; letter-spacing: 0.04em;
        }
        .sidebar__logout { color: var(--clr-text-3); cursor: pointer; transition: 0.2s; background: none; border: none; }
        .sidebar__logout:hover { color: #ef4444; }
        
        .avatar {
          width: 32px; height: 32px; background: var(--clr-primary); color: white;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: bold;
        }
      `}</style>
    </aside>
  )
}