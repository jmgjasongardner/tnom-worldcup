import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamFlag } from '../components/teams/TeamFlag';
import { SCHEDULE, GROUPS, type GroupLetter } from '../data/schedule';
import { fetchTeams } from '../lib/teamsApi';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import { supabase } from '../lib/supabaseClient';
import type { Team } from '../types/domain';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchResult {
  homeScore: number;
  awayScore: number;
  status: string; // 'complete' | 'in_progress' | 'scheduled'
  /** True when DB stored the match with home/away reversed vs our static schedule. */
  flipped: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** June/July 2026 is EDT = UTC-4. Returns UTC ms for an ET kickoff string. */
function etToUtcMs(dateTimeET: string): number {
  const [datePart, timePart] = dateTimeET.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour + 4, minute);
}

function isInFuture(dateTimeET: string): boolean {
  return etToUtcMs(dateTimeET) > Date.now();
}

function formatDateTime(isoET: string): { date: string; time: string } {
  const [datePart, timePart] = isoET.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' ET',
  };
}

function formatDateHeading(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SchedulePage() {
  const [teams, setTeams]           = useState<Team[]>(STATIC_TEAMS);
  const [activeGroup, setActiveGroup] = useState<GroupLetter | 'ALL'>('ALL');
  const [resultMap, setResultMap]   = useState<Map<string, MatchResult>>(new Map());
  const [resultsLoaded, setResultsLoaded] = useState(false);

  // Ref for the "next upcoming" match card — used for auto-scroll
  const nextUpcomingRef = useRef<HTMLDivElement | null>(null);

  // Load teams
  useEffect(() => {
    fetchTeams().then(setTeams).catch(() => {
      import('../data/teams').then((m) => setTeams(m.TEAMS));
    });
  }, []);

  // Load match results from Supabase
  useEffect(() => {
    supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score, status')
      .then(({ data }) => {
        const map = new Map<string, MatchResult>();
        for (const row of data ?? []) {
          const h = row.home_team_id as string;
          const a = row.away_team_id as string;
          map.set(`${h}-${a}`, {
            homeScore: (row.home_score as number) ?? 0,
            awayScore: (row.away_score as number) ?? 0,
            status: (row.status as string) ?? 'complete',
            flipped: false,
          });
        }
        setResultMap(map);
        setResultsLoaded(true);
      });
  }, []);

  // Auto-scroll to next upcoming match once results are loaded
  useEffect(() => {
    if (!resultsLoaded) return;
    const timer = setTimeout(() => {
      nextUpcomingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [resultsLoaded]);

  const teamMap = useMemo(() => {
    const map: Record<string, Team> = {};
    for (const t of teams) map[t.id] = t;
    return map;
  }, [teams]);

  const displayedMatches = useMemo(() => {
    if (activeGroup === 'ALL') return SCHEDULE;
    return SCHEDULE.filter((m) => m.group === activeGroup);
  }, [activeGroup]);

  const matchesByDate = useMemo(() => {
    const grouped: Record<string, typeof displayedMatches> = {};
    for (const match of displayedMatches) {
      const dateKey = match.dateTimeET.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(match);
    }
    return grouped;
  }, [displayedMatches]);

  const sortedDates = useMemo(() => Object.keys(matchesByDate).sort(), [matchesByDate]);

  /** The ID of the next upcoming (unplayed, future-scheduled) match in the current view.
   *  Sort by date first so we find the chronologically earliest, not the first by group order. */
  const nextUpcomingId = useMemo(() => {
    const byDate = [...displayedMatches].sort(
      (a, b) => etToUtcMs(a.dateTimeET) - etToUtcMs(b.dateTimeET),
    );
    for (const match of byDate) {
      const hasResult =
        resultMap.has(`${match.homeId}-${match.awayId}`) ||
        resultMap.has(`${match.awayId}-${match.homeId}`);
      if (!hasResult && isInFuture(match.dateTimeET)) return match.id;
    }
    return null;
  }, [displayedMatches, resultMap]);

  /** Get the result for a match, handling home/away flip. */
  function getResult(homeId: string, awayId: string): MatchResult | null {
    const direct = resultMap.get(`${homeId}-${awayId}`);
    if (direct) return direct;
    const flipped = resultMap.get(`${awayId}-${homeId}`);
    if (flipped) return { ...flipped, homeScore: flipped.awayScore, awayScore: flipped.homeScore, flipped: true };
    return null;
  }

  // Callback ref: assigns nextUpcomingRef when the "next" card mounts
  const assignNextRef = useCallback((el: HTMLDivElement | null) => {
    nextUpcomingRef.current = el;
  }, []);

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Schedule</h1>
        <p className="page-subtitle">All 72 group stage matches · times in US Eastern Time</p>
      </div>

      {/* Group filter tabs */}
      <div className="schedule-group-tabs" role="tablist" aria-label="Filter by group">
        <button
          role="tab"
          aria-selected={activeGroup === 'ALL'}
          className={`schedule-tab ${activeGroup === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveGroup('ALL')}
        >
          All Groups
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={activeGroup === g}
            className={`schedule-tab ${activeGroup === g ? 'active' : ''}`}
            onClick={() => setActiveGroup(g)}
          >
            Group {g}
          </button>
        ))}
      </div>

      {/* Match list grouped by date */}
      <div className="schedule-dates">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="schedule-date-section">
            <h2 className="schedule-date-heading">{formatDateHeading(dateKey)}</h2>
            <div className="schedule-match-list">
              {matchesByDate[dateKey].map((match) => {
                const home = teamMap[match.homeId];
                const away = teamMap[match.awayId];
                if (!home || !away) return null;

                const result     = getResult(match.homeId, match.awayId);
                const isComplete = result?.status === 'complete';
                const isLive     = result?.status === 'in_progress';
                const isNext     = match.id === nextUpcomingId;
                const { time }   = formatDateTime(match.dateTimeET);

                const homeWon = isComplete && result!.homeScore > result!.awayScore;
                const awayWon = isComplete && result!.awayScore > result!.homeScore;
                const isDraw  = isComplete && result!.homeScore === result!.awayScore;

                return (
                  <div
                    key={match.id}
                    ref={isNext ? assignNextRef : undefined}
                    className={[
                      'schedule-match-card',
                      isComplete ? 'schedule-match-card--complete' : '',
                      isNext     ? 'schedule-match-card--next'     : '',
                      isLive     ? 'schedule-match-card--live'     : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {/* Top row: group + status */}
                    <div className="schedule-match-header">
                      <span className="schedule-match-group">Group {match.group}</span>
                      {isNext && !isComplete && !isLive && (
                        <span className="schedule-status-badge schedule-status-badge--next">▶ Next Up</span>
                      )}
                      {isLive && (
                        <span className="schedule-status-badge schedule-status-badge--live">⚽ Live</span>
                      )}
                      {isComplete && (
                        <span className="schedule-status-badge schedule-status-badge--final">Final</span>
                      )}
                    </div>

                    {/* Teams + score */}
                    <div className="schedule-match-teams">
                      {/* Home */}
                      <div className={`schedule-team schedule-team--home ${homeWon ? 'schedule-team--winner' : ''} ${awayWon ? 'schedule-team--loser' : ''}`}>
                        <TeamFlag teamId={home.id} flagEmoji={home.flagEmoji} country={home.country} size="md" />
                        <div className="schedule-team-info">
                          <span className="schedule-team-name">{home.country}</span>
                          <span className="schedule-team-cost">${home.cost}</span>
                        </div>
                      </div>

                      {/* Score / VS */}
                      <div className="schedule-vs-block">
                        {result ? (
                          <div className="schedule-score">
                            <span className={`schedule-score-num ${homeWon ? 'schedule-score-num--winner' : isDraw ? 'schedule-score-num--draw' : 'schedule-score-num--loser'}`}>
                              {result.homeScore}
                            </span>
                            <span className="schedule-score-sep">–</span>
                            <span className={`schedule-score-num ${awayWon ? 'schedule-score-num--winner' : isDraw ? 'schedule-score-num--draw' : 'schedule-score-num--loser'}`}>
                              {result.awayScore}
                            </span>
                          </div>
                        ) : (
                          <div className="schedule-vs">vs</div>
                        )}
                      </div>

                      {/* Away */}
                      <div className={`schedule-team schedule-team--away ${awayWon ? 'schedule-team--winner' : ''} ${homeWon ? 'schedule-team--loser' : ''}`}>
                        <div className="schedule-team-info schedule-team-info--away">
                          <span className="schedule-team-name">{away.country}</span>
                          <span className="schedule-team-cost">${away.cost}</span>
                        </div>
                        <TeamFlag teamId={away.id} flagEmoji={away.flagEmoji} country={away.country} size="md" />
                      </div>
                    </div>

                    {/* Meta: time + venue */}
                    <div className="schedule-match-meta">
                      <span className="schedule-match-time">🕐 {time}</span>
                      <span className="schedule-match-venue">📍 {match.venue}, {match.city}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
