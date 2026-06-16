import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { TierBadge } from '../components/ui/Badge';
import { TeamFlag } from '../components/teams/TeamFlag';
import { fetchTeams, fetchAppSettings } from '../lib/teamsApi';
import { resolvePicksLocked } from '../lib/devUtils';
import { fetchTeamPickers, fetchTeamCoPicks, type CoPickRow, type TeamPicker, type TeamStatusRow } from '../lib/leaderboardApi';
import { supabase } from '../lib/supabaseClient';
import type { Team } from '../types/domain';

function InfoItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="team-info-item">
      <span className="team-info-label">{label}</span>
      <span className="team-info-value">{value ?? '—'}</span>
    </div>
  );
}

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [loading, setLoading] = useState(true);
  const [picksLocked, setPicksLocked] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamStatus, setTeamStatus] = useState<TeamStatusRow | null>(null);
  const [pickers, setPickers] = useState<TeamPicker[]>([]);
  const [coPicks, setCoPicks] = useState<CoPickRow[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }

    Promise.all([fetchTeams(), fetchAppSettings()])
      .then(([teams, settings]) => {
        const found = teams.find((t) => t.id === teamId) ?? null;
        setTeam(found);
        const locked = resolvePicksLocked(settings.picksLocked);
        setPicksLocked(locked);

        // Always fetch team status (points visible regardless of lock)
        supabase
          .from('team_status')
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setTeamStatus({
                teamId: data.team_id as string,
                currentPoints: (data.total_points as number) ?? 0,
                maxPossiblePoints: (data.max_possible_points as number) ?? 52,
                isAlive: (data.is_alive as boolean) ?? true,
                currentStage: (data.current_stage as string) ?? 'group',
                groupMatchesPlayed: 0,
              });
            }
          });

        if (locked) {
          return Promise.all([
            fetchTeamPickers(teamId),
            fetchTeamCoPicks(teamId),
            supabase.rpc('count_entries'),
          ]).then(([p, cp, { data: count }]) => {
            setPickers(p);
            setCoPicks(cp);
            setTotalEntries(typeof count === 'number' ? count : p.length);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) return <PageContainer width="narrow"><LoadingState /></PageContainer>;

  if (!team) {
    return (
      <PageContainer width="narrow">
        <EmptyState icon="🔍" title="Team not found" description="This team doesn't exist." />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      {/* Back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/leaderboard?devLock=1" className="btn btn--ghost btn--sm" style={{ color: 'var(--color-text-muted)' }}>
          ← Leaderboard
        </Link>
      </div>

      {/* Hero */}
      <div className="team-detail-hero">
        <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="lg" />
        <div className="team-detail-hero-info">
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>{team.country}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="group-pill">Group {team.groupLetter}</span>
            <TierBadge tier={team.tier} />
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', color: 'var(--color-navy-900)' }}>${team.cost}</span>
          </div>
        </div>
      </div>

      {/* Tournament scoring */}
      {teamStatus && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ flex: '1 1 100px' }}>
            <div className="stat-card-label">Points</div>
            <div className="stat-card-value" style={{ color: 'var(--color-teal-500)' }}>{teamStatus.currentPoints}</div>
          </div>
          <div className="stat-card" style={{ flex: '1 1 100px' }}>
            <div className="stat-card-label">Max Possible</div>
            <div className="stat-card-value">{teamStatus.maxPossiblePoints}</div>
          </div>
          <div className="stat-card" style={{ flex: '1 1 100px' }}>
            <div className="stat-card-label">Status</div>
            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-base)', paddingTop: '0.25rem' }}>
              <span className={`lb-status ${teamStatus.isAlive ? 'lb-status--alive' : 'lb-status--eliminated'}`}>
                {teamStatus.isAlive
                  ? (teamStatus.currentStage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                  : 'Eliminated'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Key player */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-navy-900)' }}>Team Info</div>
          <div className="team-card-expanded-grid">
            <InfoItem label="Key Player" value={team.keyPlayer} />
            <InfoItem label="FIFA Rank" value={team.fifaRank} />
            <InfoItem label="Group Win Odds" value={team.groupWinOdds} />
            <InfoItem label="Advance Odds" value={team.advanceOdds} />
            <InfoItem label="Title Odds" value={team.titleOdds} />
            {team.playerPosition && <InfoItem label="Position" value={team.playerPosition} />}
          </div>
          {team.poolAngle && (
            <div className="team-info-angle" style={{ marginTop: '0.75rem' }}>
              <span className="team-info-label">Pool angle</span>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {team.poolAngle}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pickers section — only post-lock */}
      {picksLocked && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>
                  Picked by {pickers.length} / {totalEntries} participants
                  {totalEntries > 0 && (
                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                      ({Math.round((pickers.length / totalEntries) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              {pickers.length === 0 ? (
                <div style={{ padding: '1rem 1.25rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  No one picked this team.
                </div>
              ) : (
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickers.map((p) => (
                      <tr key={p.entryId} className="lb-row">
                        <td>
                          <Link to={`/participants/${p.emailUser}`} className="lb-name-link">
                            {p.displayName}
                          </Link>
                        </td>
                        <td className="lb-email">{p.emailUser}</td>
                        <td>
                          <Link to={`/participants/${p.emailUser}`} className="btn btn--ghost btn--sm">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Co-picks table */}
          {coPicks.length > 0 && (
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>
                    Co-picked teams
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: '0.5rem' }}>
                    other teams chosen by the {pickers.length} participant{pickers.length !== 1 ? 's' : ''} who picked {team.country}
                  </span>
                </div>
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th className="lb-num">Group</th>
                      <th className="lb-num">Cost</th>
                      <th className="lb-num">Times co-picked</th>
                      <th className="lb-num">% of pickers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coPicks.map((row) => (
                      <tr key={row.team.id} className="lb-row">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TeamFlag teamId={row.team.id} flagEmoji={row.team.flagEmoji} country={row.team.country} size="sm" />
                            <Link to={`/teams/${row.team.id}`} className="lb-name-link">
                              {row.team.country}
                            </Link>
                          </div>
                        </td>
                        <td className="lb-num"><span className="group-pill">{row.team.groupLetter}</span></td>
                        <td className="lb-num">${row.team.cost}</td>
                        <td className="lb-num lb-pts">{row.count}</td>
                        <td className="lb-num">{row.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pre-lock: just show team info, no picks */}
      {!picksLocked && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', padding: '1.5rem' }}>
            🔒 Pick counts and participant details unlock after the opening kickoff on June 11.
          </div>
        </div>
      )}
    </PageContainer>
  );
}
