import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Button } from '../components/ui/Button';
import { TierBadge } from '../components/ui/Badge';
import { TeamFlag } from '../components/teams/TeamFlag';
import { fetchMyEntry } from '../lib/entriesApi';
import { TEAM_MAP } from '../data/teams';
import type { Team } from '../types/domain';

const LS_EMAIL = 'tnom_wc_email';

export function MyPortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [hasEntry, setHasEntry] = useState(false);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Try to load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_EMAIL);
    if (saved) {
      setEmail(saved);
      loadPortfolio(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPortfolio(e: string) {
    setLoading(true);
    const entry = await fetchMyEntry(e);
    if (entry) {
      setHasEntry(true);
      setDisplayName(entry.displayName);
      setTotalCost(entry.totalCost);
      const entryTeams = entry.teamIds
        .map((id) => TEAM_MAP[id])
        .filter(Boolean) as Team[];
      setTeams(entryTeams);
    } else {
      setHasEntry(false);
    }
    setLoading(false);
  }

  const handleLookup = () => {
    const trimmed = emailInput.trim().toLowerCase();
    setEmail(trimmed);
    localStorage.setItem(LS_EMAIL, trimmed);
    loadPortfolio(trimmed);
  };

  if (loading) {
    return <PageContainer width="narrow"><LoadingState /></PageContainer>;
  }

  // No saved email — show lookup prompt
  if (!email) {
    return (
      <PageContainer width="narrow">
        <div className="page-header">
          <h1 className="page-title">My Portfolio</h1>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Enter your Technomics email to view your picks.
            </p>
            <input
              type="email"
              className="input"
              placeholder="you@technomics.net"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              autoFocus
            />
            <Button variant="primary" onClick={handleLookup} disabled={!emailInput.includes('@technomics.net')}>
              View Portfolio
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!hasEntry) {
    return (
      <PageContainer width="narrow">
        <div className="page-header">
          <h1 className="page-title">My Portfolio</h1>
        </div>
        <EmptyState
          icon="📋"
          title="No portfolio yet"
          description={`No portfolio found for ${email}. Build one before the opening kickoff on June 11.`}
          action={<Link to="/pick"><Button variant="primary">Build Portfolio</Button></Link>}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            className="btn btn--ghost"
            style={{ fontSize: 'var(--font-size-sm)' }}
            onClick={() => { setEmail(''); localStorage.removeItem(LS_EMAIL); }}
          >
            Try a different email
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{displayName}'s Portfolio</h1>
          <p className="page-subtitle">${totalCost} spent · {teams.length} teams selected</p>
        </div>
        <Link to="/pick">
          <Button variant="secondary" size="sm">Edit Portfolio</Button>
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {teams.map((team) => (
          <div key={team.id} className="card card--flat" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>{team.country}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Group {team.groupLetter} · {team.keyPlayer}
                </div>
              </div>
              <TierBadge tier={team.tier} />
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-navy-900)', minWidth: '2rem', textAlign: 'right' }}>
                ${team.cost}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Scoring and leaderboard unlock after the opening kickoff on June 11.
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button
          className="btn btn--ghost"
          style={{ fontSize: 'var(--font-size-sm)' }}
          onClick={() => { setEmail(''); localStorage.removeItem(LS_EMAIL); }}
        >
          Switch account
        </button>
      </div>
    </PageContainer>
  );
}
