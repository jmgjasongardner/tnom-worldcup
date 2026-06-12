import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const INFO_ITEMS = [
  { to: '/info',         label: 'Information',    emoji: '🏠' },
  { to: '/pick',         label: 'Build Portfolio', emoji: '✏️' },
  { to: '/my-portfolio', label: 'My Portfolio',    emoji: '📋' },
];
const INFO_PATHS = INFO_ITEMS.map((i) => i.to);

export function Nav() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const infoActive = INFO_PATHS.some((p) => location.pathname === p);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <nav className="nav" aria-label="Main navigation">
      <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <span aria-hidden="true">🏆</span>{' '}<span>Leaderboard</span>
      </NavLink>
      <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <span aria-hidden="true">📅</span>{' '}<span>Schedule</span>
      </NavLink>
      <NavLink to="/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        end={false}>
        <span aria-hidden="true">🌍</span>{' '}<span>Teams</span>
      </NavLink>

      {/* Information dropdown */}
      <div className="nav-dropdown" ref={dropdownRef}>
        <button
          className={`nav-link nav-dropdown-trigger ${infoActive ? 'active' : ''} ${open ? 'open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span aria-hidden="true">ℹ️</span>{' '}
          <span>Information</span>{' '}
          <span className="nav-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>

        {open && (
          <div className="nav-dropdown-menu" role="menu">
            {INFO_ITEMS.map(({ to, label, emoji }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">{emoji}</span>{' '}<span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
