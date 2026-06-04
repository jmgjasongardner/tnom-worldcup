import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Button } from '../components/ui/Button';
import { TierBadge } from '../components/ui/Badge';
import { TeamFlag } from '../components/teams/TeamFlag';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyEntry } from '../lib/entriesApi';
import { TEAM_MAP } from '../data/teams';
import type { Team } from '../types/domain';

export function MyPortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [hasEntry, setHasEntry] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetchMyEntry(user.id).then((entry) => {
      if (entry) {
        setHasEntry(true);
        setDisplayName(entry.displayName);
        setTotalCost(entry.totalCost);
        const entryTeams = entry.teamIds
          .map((id) => TEAM_MAP[id])
          .filter(Boolean) as Team[];
        setTeams(entryTeams);
      }
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <PageContainer width="narrow"><LoadingState /></PageContainer>;
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
        <div className="page-header">
          <h1 className="page-title">My Portfolio</h1>
        </div>
        <EmptyState
          icon="🔑"
          title="Sign in to view your portfolio"
          description="Use your Technomics email to sign in and access your picks."
          action={<Link to="/pick"><Button variant="primary">Sign In</Button></Link>}
        />
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
          description="You haven't submitted a portfolio. Build one before the opening kickoff on June 11."
          action={<Link to="/pick"><Button variant="primary">Build Portfolio</Button></Link>}
        />
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
    </PageContainer>
  );
}
