import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', emoji: '🏠' },
  { to: '/pick', label: 'Build Portfolio', emoji: '✏️' },
  { to: '/teams', label: 'Teams', emoji: '🌍' },
  { to: '/schedule', label: 'Schedule', emoji: '📅' },
  { to: '/leaderboard', label: 'Leaderboard', emoji: '🏆' },
  { to: '/my-portfolio', label: 'My Portfolio', emoji: '📋' },
];

export function Nav() {
  return (
    <nav className="nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, label, emoji }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span aria-hidden="true">{emoji}</span>{' '}
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
