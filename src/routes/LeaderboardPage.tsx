import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { LoadingState } from '../components/ui/LoadingState';
import { TeamFlag } from '../components/teams/TeamFlag';
import { TierBadge } from '../components/ui/Badge';
import { ScoringRulesTable } from '../components/scoring/ScoringRulesTable';
import { fetchAppSettings } from '../lib/teamsApi';
import { resolvePicksLocked } from '../lib/devUtils';
import {
  fetchLeaderboardEntries,
  fetchTeamLeaderboard,
  type LeaderboardEntry,
  type TeamLeaderboardRow,
} from '../lib/leaderboardApi';
import { supabase } from '../lib/supabaseClient';
import type { Team } from '../types/domain';

type TeamSortKey = 'cost' | 'group' | 'picks' | 'points' | 'maxPossible' | 'status';
type PortfolioSortKey = 'rank' | 'participant' | 'email' | 'cost' | 'points' | 'bestScore' | 'alive' | 'diversity';

function stageLabel(stage: string, isAlive: boolean): string {
  if (!isAlive) return 'Eliminated';
  const map: Record<string, string> = {
    group: 'Group Stage',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarterfinal: 'Quarterfinal',
    semifinal: 'Semifinal',
    final: 'Final',
    champion: '🏆 Champion',
  };
  return map[stage] ?? stage;
}

// ── Pre-lock screen ─────────────────────────────────────────────────────────
function PreLockView({ entryCount, loading }: { entryCount: number | null; loading: boolean }) {
  return (
    <PageContainer width="narrow">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
      </div>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Leaderboard unlocks after picks lock</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Portfolios are hidden until the opening kickoff to keep the competition fair.
          </p>
          <div className="leaderboard-pre-lock-stats">
            <div className="stat-card">
              <div className="stat-card-label">Portfolios Submitted</div>
              <div className="stat-card-value">{loading ? '…' : (entryCount ?? '—')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Lock Date</div>
              <div className="stat-card-value" style={{ fontSize: 'var(--font-size-xl)' }}>June 11</div>
              <div className="stat-card-sub">3:00 PM ET · Opening kickoff</div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// ── Portfolios tab ──────────────────────────────────────────────────────────
function ScoringModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="scoring-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Scoring Rules"
    >
      <div
        className="scoring-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scoring-modal-header">
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-navy-900)' }}>
            Scoring Rules
          </h2>
          <button
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close scoring rules"
            style={{ fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem 0.5rem' }}
          >
            ×
          </button>
        </div>
        <div className="scoring-modal-body">
          <ScoringRulesTable />
        </div>
      </div>
    </div>
  );
}

function PortfoliosTab({ entries }: { entries: LeaderboardEntry[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<PortfolioSortKey>('points');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showScoring, setShowScoring] = useState(false);

  function handleSort(key: PortfolioSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Default directions: text cols asc, numeric cols desc
      setSortDir(key === 'participant' || key === 'email' ? 'asc' : key === 'rank' ? 'asc' : 'desc');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = q
      ? entries.filter(
          (e) =>
            e.displayName.toLowerCase().includes(q) ||
            e.emailUser.toLowerCase().includes(q),
        )
      : entries;

    const d = sortDir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      let primary = 0;
      switch (sortKey) {
        case 'rank':        primary = d * (a.rank - b.rank); break;
        case 'participant': primary = d * a.displayName.localeCompare(b.displayName); break;
        case 'email':       primary = d * a.emailUser.localeCompare(b.emailUser); break;
        case 'cost':        primary = d * (a.totalCost - b.totalCost); break;
        case 'points':       primary = d * (a.currentPoints - b.currentPoints); break;
        case 'bestScore':    primary = d * (a.bestScore - b.bestScore); break;
        case 'alive':        primary = d * (a.teamsAlive - b.teamsAlive); break;
        case 'diversity':    primary = d * (a.diversityScore - b.diversityScore); break;
      }
      if (primary !== 0) return primary;
      // Secondary sort cascade: points desc → teams alive desc → best score desc → participant asc
      return (b.currentPoints - a.currentPoints)
          || (b.teamsAlive - a.teamsAlive)
          || (b.bestScore - a.bestScore)
          || a.displayName.localeCompare(b.displayName);
    });
  }, [entries, search, sortKey, sortDir]);

  const leaderPts     = entries[0]?.currentPoints ?? 0;
  const leaders       = entries.filter((e) => e.currentPoints === leaderPts);

  const maxAlive      = Math.max(...entries.map((e) => e.teamsAlive));
  const mostAliveList = entries.filter((e) => e.teamsAlive === maxAlive);

  const highestCeiling   = Math.max(...entries.map((e) => e.bestScore));
  const highestMaxList = entries.filter((e) => e.bestScore === highestCeiling);

  function cardName(list: LeaderboardEntry[]) {
    return list.length > 1 ? `${list.length} tied` : list[0].displayName;
  }

  function SortTh({
    label, col, numeric, title,
  }: { label: string; col: PortfolioSortKey; numeric?: boolean; title?: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`lb-sortable ${active ? 'active' : ''} ${numeric ? 'lb-num' : ''}`}
        onClick={() => handleSort(col)}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
        title={title}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div>
      {/* Summary cards */}
      {entries.length > 0 && (
        <div className="lb-summary-cards">
          <div className="stat-card">
            <div className="stat-card-label">🥇 Current Leader</div>
            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-lg)' }}>{cardName(leaders)}</div>
            <div className="stat-card-sub">{leaderPts} pts</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">💪 Most Alive</div>
            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-lg)' }}>{cardName(mostAliveList)}</div>
            <div className="stat-card-sub">{maxAlive} / 6 teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">📈 Highest Ceiling</div>
            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-lg)' }}>{cardName(highestMaxList)}</div>
            <div className="stat-card-sub">{highestCeiling} pts (best score)</div>
          </div>
        </div>
      )}

      {/* Search + Scoring Rules button */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => setShowScoring(true)}
          style={{ whiteSpace: 'nowrap' }}
        >
          📋 Scoring Rules
        </button>
      </div>

      {showScoring && <ScoringModal onClose={() => setShowScoring(false)} />}

      {/* Table */}
      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <SortTh label="Rank"         col="rank" />
              <SortTh label="Participant"  col="participant" />
              <SortTh label="Email"        col="email" />
              <SortTh label="Cost"         col="cost"        numeric />
              <SortTh label="Points"       col="points"      numeric />
              <SortTh label="Best Score"   col="bestScore"   numeric title="The most points you could still realistically win. Accounts for bracket collisions — if two of your teams are on a path to meet, only one can advance, so that round's points are awarded once, not twice." />
              <SortTh label="Alive"         col="alive"        numeric />
              <SortTh label="Diversity"    col="diversity"   numeric title="Popularity-weighted uniqueness (0–100). For each of your 6 teams, score = 1 − (% of all participants who picked that team). Average those 6 values × 100. A score of 100 means every pick was unique to you; a score of 0 means every pick was taken by all participants. High scores reward contrarian portfolios; low scores indicate chalk-heavy picks." />
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="lb-row">
                <td className="lb-rank">{e.rank}</td>
                <td className="lb-participant-cell">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/participants/${e.emailUser}`} className="lb-name-link">
                      {e.displayName}
                    </Link>
                    <div className="lb-flags">
                      {e.teams.map((t) => (
                        <Link key={t.id} to={`/teams/${t.id}`} title={t.country}>
                          <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="lb-email">{e.emailUser}</td>
                <td className="lb-num">${e.totalCost}</td>
                <td className="lb-num lb-pts">{e.currentPoints}</td>
                <td className="lb-num lb-pts">{e.bestScore}</td>
                <td className="lb-num">{e.teamsAlive} / 6</td>
                <td className="lb-num">
                  <span className={`lb-diversity lb-diversity--${e.diversityScore >= 75 ? 'high' : e.diversityScore >= 50 ? 'mid' : 'low'}`}>
                    {e.diversityScore}
                  </span>
                </td>
                <td>
                  <Link to={`/participants/${e.emailUser}`} className="btn btn--ghost btn--sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state" style={{ margin: '2rem 0' }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No results</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Teams tab ───────────────────────────────────────────────────────────────
function TeamsTab({ rows }: { rows: TeamLeaderboardRow[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<TeamSortKey>('picks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: TeamSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'group' ? 'asc' : 'desc');
    }
  }

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.team.country.toLowerCase().includes(q) ||
            r.team.keyPlayer.toLowerCase().includes(q) ||
            r.team.groupLetter.toLowerCase().includes(q),
        )
      : rows;
    const copy = [...base];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'cost':    return dir * (a.team.cost - b.team.cost);
        case 'group':   return dir * a.team.groupLetter.localeCompare(b.team.groupLetter) || a.team.country.localeCompare(b.team.country);
        case 'picks':   return dir * (a.pickCount - b.pickCount);
        case 'points':  return dir * (a.currentPoints - b.currentPoints);
        case 'maxPossible': return dir * (a.maxPossiblePoints - b.maxPossiblePoints);
        case 'status':  return dir * stageLabel(a.currentStage, a.isAlive).localeCompare(stageLabel(b.currentStage, b.isAlive));
        default: return 0;
      }
    });
    return copy;
  }, [rows, search, sortKey, sortDir]);

  function SortTh({ label, col }: { label: string; col: TeamSortKey }) {
    const active = sortKey === col;
    return (
      <th
        className={`lb-sortable ${active ? 'active' : ''}`}
        onClick={() => handleSort(col)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', maxWidth: 320 }}>
        <input
          className="input"
          placeholder="Search by country, player, or group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th>Team</th>
            <SortTh label="Group" col="group" />
            <SortTh label="Cost" col="cost" />
            <SortTh label="Picks" col="picks" />
            <th className="lb-num">Pick %</th>
            <SortTh label="Points" col="points" />
            <SortTh label="Max Possible" col="maxPossible" />
            <SortTh label="Status" col="status" />
            <th>Form</th>
            <th style={{ width: 48 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.team.id} className={`lb-row ${!row.isAlive ? 'lb-row--eliminated' : ''}`}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TeamFlag teamId={row.team.id} flagEmoji={row.team.flagEmoji} country={row.team.country} size="sm" />
                  <Link to={`/teams/${row.team.id}`} className="lb-name-link">{row.team.country}</Link>
                </div>
              </td>
              <td><span className="group-pill">{row.team.groupLetter}</span></td>
              <td className="lb-num">${row.team.cost}</td>
              <td className="lb-num lb-pts">{row.pickCount}</td>
              <td className="lb-num">{row.pickPct}%</td>
              <td className="lb-num">{row.currentPoints}</td>
              <td className="lb-num">{row.maxPossiblePoints}</td>
              <td>
                <span className={`lb-status ${!row.isAlive ? 'lb-status--out' : 'lb-status--alive'}`}>
                  {stageLabel(row.currentStage, row.isAlive)}
                </span>
              </td>
              <td>
                <div className="team-form-badges">
                  {row.form.length === 0
                    ? <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
                    : row.form.map((r, i) => (
                        <span key={i} className={`form-badge form-badge--${r.toLowerCase()}`}>{r}</span>
                      ))
                  }
                </div>
              </td>
              <td>
                <Link to={`/teams/${row.team.id}`} className="btn btn--ghost btn--sm">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="empty-state" style={{ margin: '2rem 0' }}>
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No teams match "{search}"</div>
        </div>
      )}
    </div>
    </div>
  );
}

// ── Team Combos tab ─────────────────────────────────────────────────────────
function TeamCombosTab({ entries, teamRows }: { entries: LeaderboardEntry[]; teamRows: TeamLeaderboardRow[] }) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // All teams sorted by cost desc for the picker
  const allTeams = useMemo(
    () => [...teamRows.map((r) => r.team)].sort((a, b) => b.cost - a.cost || a.country.localeCompare(b.country)),
    [teamRows],
  );

  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allTeams;
    return allTeams.filter(
      (t) =>
        t.country.toLowerCase().includes(q) ||
        t.keyPlayer.toLowerCase().includes(q),
    );
  }, [allTeams, search]);

  function toggleTeam(team: Team) {
    setSelectedIds((prev) => {
      if (prev.includes(team.id)) return prev.filter((id) => id !== team.id);
      if (prev.length >= 6) return prev;
      return [...prev, team.id];
    });
  }

  const selectedTeams = selectedIds.map((id) => allTeams.find((t) => t.id === id)).filter(Boolean) as Team[];

  const filteredEntries = useMemo(() => {
    if (selectedIds.length === 0) return entries;
    return entries.filter((e) => selectedIds.every((id) => e.teamIds.includes(id)));
  }, [entries, selectedIds]);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '0.75rem' }}>
          Select up to 6 teams to see which participants have all of them in their portfolio.
        </p>

        {/* Selected chips */}
        {selectedTeams.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {selectedTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTeam(t)}
                className="btn btn--ghost btn--sm"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: 'var(--color-teal-500)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                }}
              >
                <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                {t.country}
                <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>×</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn--ghost btn--sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Team search picker — only show when fewer than 6 selected */}
        {selectedIds.length < 6 && (
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: '0.75rem' }}>
            <input
              className="input"
              placeholder="Search teams to add…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)',
                zIndex: 10, maxHeight: 240, overflowY: 'auto',
              }}>
                {filteredTeams.slice(0, 20).map((t) => {
                  const already = selectedIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => { toggleTeam(t); setSearch(''); }}
                      disabled={already}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.5rem 0.75rem',
                        background: 'none', border: 'none', cursor: already ? 'default' : 'pointer',
                        textAlign: 'left', opacity: already ? 0.4 : 1,
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                      <span>{t.country}</span>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}>${t.cost}</span>
                    </button>
                  );
                })}
                {filteredTeams.length === 0 && (
                  <div style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    No teams found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        {selectedIds.length === 0
          ? `Showing all ${entries.length} participants`
          : `${filteredEntries.length} participant${filteredEntries.length !== 1 ? 's' : ''} have all ${selectedIds.length} selected team${selectedIds.length !== 1 ? 's' : ''}`}
      </div>

      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>Rank</th>
              <th>Participant</th>
              <th className="lb-num">Points</th>
              <th className="lb-num">Best Score</th>
              <th className="lb-num">Alive</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e.id} className="lb-row">
                <td className="lb-rank">{e.rank}</td>
                <td className="lb-participant-cell">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/participants/${e.emailUser}`} className="lb-name-link">
                      {e.displayName}
                    </Link>
                    <div className="lb-flags">
                      {e.teams.map((t) => (
                        <Link key={t.id} to={`/teams/${t.id}`} title={t.country}>
                          <TeamFlag teamId={t.id} flagEmoji={t.flagEmoji} country={t.country} size="sm" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="lb-num lb-pts">{e.currentPoints}</td>
                <td className="lb-num">{e.bestScore}</td>
                <td className="lb-num">{e.teamsAlive} / 6</td>
                <td>
                  <Link to={`/participants/${e.emailUser}`} className="btn btn--ghost btn--sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEntries.length === 0 && (
          <div className="empty-state" style={{ margin: '2rem 0' }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No participants have all selected teams</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export function LeaderboardPage() {
  const [picksLocked, setPicksLocked] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [teamRows, setTeamRows] = useState<TeamLeaderboardRow[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolios' | 'teams' | 'combos'>('portfolios');

  // Step 1: check lock status
  useEffect(() => {
    Promise.all([fetchAppSettings(), supabase.rpc('count_entries')])
      .then(([settings, { data: count }]) => {
        const locked = resolvePicksLocked(settings.picksLocked);
        setPicksLocked(locked);
        setEntryCount(typeof count === 'number' ? count : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Step 2: once locked, fetch full leaderboard data
  useEffect(() => {
    if (!picksLocked) return;
    setDataLoading(true);
    Promise.all([fetchLeaderboardEntries(), fetchTeamLeaderboard()])
      .then(([e, t]) => {
        setEntries(e);
        setTeamRows(t);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [picksLocked]);

  if (loading) {
    return <PageContainer><LoadingState message="Loading…" /></PageContainer>;
  }

  if (!picksLocked) {
    return <PreLockView entryCount={entryCount} loading={loading} />;
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Live standings · updated after each match</p>
      </div>

      {/* Tabs */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${activeTab === 'portfolios' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolios')}
        >
          📋 Portfolios
        </button>
        <button
          className={`lb-tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          🌍 Teams
        </button>
        <button
          className={`lb-tab ${activeTab === 'combos' ? 'active' : ''}`}
          onClick={() => setActiveTab('combos')}
        >
          🔀 Team Combos
        </button>
      </div>

      {dataLoading ? (
        <LoadingState message="Loading leaderboard…" />
      ) : activeTab === 'portfolios' ? (
        <PortfoliosTab entries={entries} />
      ) : activeTab === 'teams' ? (
        <TeamsTab rows={teamRows} />
      ) : (
        <TeamCombosTab entries={entries} teamRows={teamRows} />
      )}
    </PageContainer>
  );
}
