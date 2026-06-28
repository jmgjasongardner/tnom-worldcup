import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Button } from '../components/ui/Button';
import { TierBadge } from '../components/ui/Badge';
import { TeamFlag } from '../components/teams/TeamFlag';
import { fetchMyEntry } from '../lib/entriesApi';
import { fetchParticipantEntry } from '../lib/leaderboardApi';
import type { LeaderboardEntry } from '../lib/leaderboardApi';
import { TEAM_MAP } from '../data/teams';
import type { Team } from '../types/domain';

const LS_EMAIL = 'tnom_wc_email';

export function MyPortfolioPage() {
  const [loading, setLoading]       = useState(true);
  const [entry, setEntry]           = useState<LeaderboardEntry | null>(null);
  // Fallback teams when leaderboard fetch fails (before lock)
  const [fallbackTeams, setFallbackTeams] = useState<Team[]>([]);
  const [fallbackName, setFallbackName]   = useState('');
  const [fallbackCost, setFallbackCost]   = useState(0);
  const [hasEntry, setHasEntry]     = useState(false);
  const [email, setEmail]           = useState('');
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
    // Try full leaderboard entry first (includes scoring)
    const lbEntry = await fetchParticipantEntry(e);
    if (lbEntry) {
      setEntry(lbEntry);
      setHasEntry(true);
      setLoading(false);
      return;
    }
    // Fallback: simple entry (pre-lock or leaderboard not yet available)
    const simple = await fetchMyEntry(e);
    if (simple) {
      setHasEntry(true);
      setFallbackName(simple.displayName);
      setFallbackCost(simple.totalCost);
      setFallbackTeams(simple.teamIds.map((id) => TEAM_MAP[id]).filter(Boolean) as Team[]);
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

  // Use leaderboard entry if available, otherwise fall back
  const displayName = entry?.displayName ?? fallbackName;
  const totalCost   = entry?.totalCost   ?? fallbackCost;
  const teams: Team[] = entry?.teams     ?? fallbackTeams;

  return (
    <PageContainer width="narrow">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{displayName}'s Portfolio</h1>
          <p className="page-subtitle">${totalCost} spent · {teams.length} teams</p>
        </div>
        <Link to="/pick">
          <Button variant="secondary" size="sm">Edit Portfolio</Button>
        </Link>
      </div>

      {/* Scoring summary — shown when leaderboard data is available */}
      {entry && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {[
            { label: 'Current Points', value: entry.currentPoints },
            { label: 'Best Score',     value: entry.bestScore },
            { label: 'Teams Alive',    value: entry.teamsAlive },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card" style={{ flex: '1 1 100px' }}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Team cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
              {entry && (
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-teal-500)', minWidth: '2.5rem', textAlign: 'right' }}>
                  {entry.teamStatuses[team.id]?.currentPoints ?? 0}pts
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', minWidth: '2rem', textAlign: 'right' }}>
                ${team.cost}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Points breakdown table — shown when scoring data is available */}
      {entry && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th className="lb-num">Points</th>
                  <th className="lb-num">Max Possible</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entry.teams.map((team) => {
                  const ts = entry.teamStatuses[team.id];
                  const alive = ts?.isAlive !== false;
                  const stage = ts?.currentStage ?? 'group';
                  const stageLabel = stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <tr key={team.id} className="lb-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="sm" />
                          <span>{team.country}</span>
                        </div>
                      </td>
                      <td className="lb-num lb-pts">{ts?.currentPoints ?? 0}</td>
                      <td className="lb-num">{ts?.maxPossiblePoints ?? 52}</td>
                      <td>
                        <span className={`lb-status ${alive ? 'lb-status--alive' : 'lb-status--eliminated'}`}>
                          {alive ? stageLabel : 'Eliminated'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                  <td>Total</td>
                  <td className="lb-num lb-pts">{entry.currentPoints}</td>
                  <td className="lb-num">
                    {entry.teams.reduce((s, t) => s + (entry.teamStatuses[t.id]?.maxPossiblePoints ?? 52), 0)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

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
