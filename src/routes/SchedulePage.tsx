import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamFlag } from '../components/teams/TeamFlag';
import { SCHEDULE, GROUPS, type GroupLetter } from '../data/schedule';
import { fetchTeams } from '../lib/teamsApi';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import type { Team } from '../types/domain';

function formatDateTime(isoET: string): { date: string; time: string } {
  // Parse the datetime as local (ET) without timezone offset
  const [datePart, timePart] = isoET.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const d = new Date(year, month - 1, day, hour, minute);

  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { date: dateStr, time: timeStr + ' ET' };
}

export function SchedulePage() {
  const [teams, setTeams] = useState<Team[]>(STATIC_TEAMS);
  const [activeGroup, setActiveGroup] = useState<GroupLetter | 'ALL'>('ALL');

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => {
        import('../data/teams').then((m) => setTeams(m.TEAMS));
      });
  }, []);

  const teamMap = useMemo(() => {
    const map: Record<string, Team> = {};
    for (const t of teams) map[t.id] = t;
    return map;
  }, [teams]);

  const displayedMatches = useMemo(() => {
    if (activeGroup === 'ALL') return SCHEDULE;
    return SCHEDULE.filter((m) => m.group === activeGroup);
  }, [activeGroup]);

  // Group matches by date for display
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

  function formatDateHeading(isoDate: string) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Group Stage Schedule</h1>
        <p className="page-subtitle">
          All 72 group stage matches · times shown in US Eastern Time
        </p>
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
                const { time } = formatDateTime(match.dateTimeET);
                if (!home || !away) return null;

                return (
                  <div key={match.id} className="schedule-match-card">
                    {/* Group badge */}
                    <div className="schedule-match-group">Group {match.group}</div>

                    {/* Teams */}
                    <div className="schedule-match-teams">
                      {/* Home */}
                      <div className="schedule-team schedule-team--home">
                        <TeamFlag
                          teamId={home.id}
                          flagEmoji={home.flagEmoji}
                          country={home.country}
                          size="md"
                        />
                        <div className="schedule-team-info">
                          <span className="schedule-team-name">{home.country}</span>
                          <span className="schedule-team-cost">${home.cost}</span>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="schedule-vs">vs</div>

                      {/* Away */}
                      <div className="schedule-team schedule-team--away">
                        <div className="schedule-team-info schedule-team-info--away">
                          <span className="schedule-team-name">{away.country}</span>
                          <span className="schedule-team-cost">${away.cost}</span>
                        </div>
                        <TeamFlag
                          teamId={away.id}
                          flagEmoji={away.flagEmoji}
                          country={away.country}
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Meta */}
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
