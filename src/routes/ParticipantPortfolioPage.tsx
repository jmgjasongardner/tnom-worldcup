import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Button } from '../components/ui/Button';
import { TierBadge } from '../components/ui/Badge';
import { TeamFlag } from '../components/teams/TeamFlag';
import { fetchAppSettings } from '../lib/teamsApi';
import { resolvePicksLocked } from '../lib/devUtils';
import { fetchParticipantEntry, fetchSimilarPortfolios, type LeaderboardEntry, type SimilarPortfolio } from '../lib/leaderboardApi';

export function ParticipantPortfolioPage() {
  const { emailUser } = useParams<{ emailUser: string }>();
  const [picksLocked, setPicksLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<LeaderboardEntry | null>(null);
  const [similar, setSimilar] = useState<SimilarPortfolio[]>([]);

  useEffect(() => {
    if (!emailUser) { setLoading(false); return; }

    fetchAppSettings().then((settings) => {
      const locked = resolvePicksLocked(settings.picksLocked);
      setPicksLocked(locked);
      if (locked) {
        return fetchParticipantEntry(emailUser).then((e) => {
          setEntry(e);
          if (e) {
            fetchSimilarPortfolios(e.emailUser, e.teamIds).then(setSimilar);
          }
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [emailUser]);

  if (loading) {
    return <PageContainer width="narrow"><LoadingState /></PageContainer>;
  }

  if (!picksLocked) {
    return (
      <PageContainer width="narrow">
        <div className="page-header"><h1 className="page-title">Participant Portfolio</h1></div>
        <EmptyState
          icon="🔒"
          title="Portfolios hidden until lock"
          description="Other participants' picks are only visible after the opening kickoff."
          action={<Link to="/leaderboard"><Button variant="secondary">Back to Leaderboard</Button></Link>}
        />
      </PageContainer>
    );
  }

  if (!entry) {
    return (
      <PageContainer width="narrow">
        <div className="page-header"><h1 className="page-title">Portfolio not found</h1></div>
        <EmptyState
          icon="🔍"
          title="Portfolio not found"
          description="This portfolio doesn't exist or couldn't be loaded."
          action={<Link to="/leaderboard"><Button variant="secondary">Back to Leaderboard</Button></Link>}
        />
      </PageContainer>
    );
  }

  const totalCost = entry.teams.reduce((s, t) => s + t.cost, 0);

  return (
    <PageContainer width="narrow">
      {/* Back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/leaderboard" className="btn btn--ghost btn--sm" style={{ color: 'var(--color-text-muted)' }}>
          ← Leaderboard
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{entry.displayName}</h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace' }}>{entry.emailUser}@technomics.net</p>
        </div>
      </div>

      {/* Score summary */}
      <div className="lb-summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-label">Current Points</div>
          <div className="stat-card-value">{entry.currentPoints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Max Possible</div>
          <div className="stat-card-value">{entry.maxPossiblePoints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Teams Alive</div>
          <div className="stat-card-value">{entry.teamsAlive} / 6</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Portfolio Cost</div>
          <div className="stat-card-value">${totalCost}</div>
        </div>
        {entry.diversityScore > 0 && (
          <div className="stat-card">
            <div className="stat-card-label" title="Average Jaccard distance vs all other portfolios. Higher = more unique.">Diversity Score</div>
            <div className="stat-card-value">{entry.diversityScore}</div>
            <div className="stat-card-sub">
              {entry.diversityScore >= 75 ? 'Highly unique' : entry.diversityScore >= 50 ? 'Moderately unique' : 'Similar to field'}
            </div>
          </div>
        )}
      </div>

      {/* Team cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {entry.teams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="card card--flat participant-team-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem' }}>
                <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="lg" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>{team.country}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Group {team.groupLetter} · {team.keyPlayer}
                  </div>
                </div>
                <TierBadge tier={team.tier} />
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-navy-900)', minWidth: '2.5rem', textAlign: 'right' }}>
                  ${team.cost}
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>›</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Points breakdown table */}
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
                        <Link to={`/teams/${team.id}`} className="lb-name-link">{team.country}</Link>
                      </div>
                    </td>
                    <td className="lb-num lb-pts">{ts?.currentPoints ?? 0}</td>
                    <td className="lb-num">{ts?.maxPossiblePoints ?? 50}</td>
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
                <td className="lb-num">{entry.maxPossiblePoints}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Similar Portfolios */}
      {similar.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>Most Similar Portfolios</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: '0.5rem' }}>
                participants with 3+ teams in common
              </span>
            </div>
            {[6, 5, 4, 3].map((overlap) => {
              const group = similar.filter((s) => s.overlapCount === overlap);
              if (group.length === 0) return null;
              return (
                <div key={overlap}>
                  <div style={{
                    padding: '0.5rem 1.25rem',
                    background: 'var(--color-bg)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {overlap} teams in common
                  </div>
                  {group.map((s) => (
                    <div key={s.entry.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1.25rem',
                      borderBottom: '1px solid var(--color-border)',
                      flexWrap: 'wrap',
                    }}>
                      <Link to={`/participants/${s.entry.emailUser}`} className="lb-name-link" style={{ minWidth: 120 }}>
                        {s.entry.displayName}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {s.sharedTeams.map((t) => (
                          <Link key={t.id} to={`/teams/${t.id}`} title={t.country}>
                            <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                          </Link>
                        ))}
                        {s.differentTeams.length > 0 && (
                          <>
                            <span style={{ color: 'var(--color-border)', fontSize: 'var(--font-size-sm)', margin: '0 0.125rem' }}>·</span>
                            {s.differentTeams.map((t) => (
                              <Link key={t.id} to={`/teams/${t.id}`} title={`${t.country} (different)`} style={{ opacity: 0.45 }}>
                                <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: 'auto' }}>
                        {s.entry.currentPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
