import { Link } from 'react-router-dom';
import { Nav } from './Nav';

const LS_EMAIL = 'tnom_wc_email';
const LS_NAME  = 'tnom_wc_display_name';

export function Header() {
  const savedEmail = localStorage.getItem(LS_EMAIL);
  const savedName  = localStorage.getItem(LS_NAME);
  const displayLabel = savedName ?? savedEmail?.split('@')[0] ?? null;

  const handleSignOut = () => {
    localStorage.removeItem(LS_EMAIL);
    localStorage.removeItem(LS_NAME);
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-brand">
          <span className="header-brand-icon">⚽</span>
          <div className="header-brand-text">
            <span className="header-brand-title">Technomics 2026</span>
            <span className="header-brand-subtitle">World Cup Challenge</span>
          </div>
        </Link>

        <Nav />

        {displayLabel && (
          <div className="header-auth">
            <div className="header-user">
              <span className="header-user-name">{displayLabel}</span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={handleSignOut}
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-size-xs)' }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
