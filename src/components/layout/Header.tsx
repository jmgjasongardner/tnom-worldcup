import { Link } from 'react-router-dom';
import { Nav } from './Nav';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';

export function Header() {
  const { user, profile, loading } = useAuth();

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

        <div className="header-auth">
          {!loading && user ? (
            <div className="header-user">
              <span className="header-user-name">
                {profile?.display_name ?? user.email?.split('@')[0]}
              </span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={signOut}
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-size-xs)' }}
              >
                Sign out
              </button>
            </div>
          ) : !loading ? (
            <Link to="/pick" className="btn btn--secondary btn--sm" style={{ flexShrink: 0 }}>
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
