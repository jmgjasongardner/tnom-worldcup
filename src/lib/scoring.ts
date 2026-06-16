import { SCORING } from '../data/scoringRules';
import type { TeamStatus, Entry, Team } from '../types/domain';

export { SCORING };

export function calcEntryPoints(teams: Team[], statuses: Record<string, TeamStatus>): number {
  return teams.reduce((sum, team) => {
    const status = statuses[team.id];
    return sum + (status?.totalPoints ?? 0);
  }, 0);
}

export function calcEntryMaxPossible(teams: Team[], statuses: Record<string, TeamStatus>): number {
  return teams.reduce((sum, team) => {
    const status = statuses[team.id];
    return sum + (status?.maxPossiblePoints ?? 52);
  }, 0);
}

export function calcTeamsAlive(teams: Team[], statuses: Record<string, TeamStatus>): number {
  return teams.filter((t) => statuses[t.id]?.isAlive !== false).length;
}

export function sortEntriesByScore(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const aPoints = a.currentPoints ?? 0;
    const bPoints = b.currentPoints ?? 0;
    if (bPoints !== aPoints) return bPoints - aPoints;
    const aMax = a.maxPossiblePoints ?? 0;
    const bMax = b.maxPossiblePoints ?? 0;
    return bMax - aMax;
  });
}

export function assignRanks(entries: Entry[]): Entry[] {
  const sorted = sortEntriesByScore(entries);
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
