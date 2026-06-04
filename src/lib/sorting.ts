import type { Team, SortOption } from '../types/domain';

const TIER_ORDER: Record<string, number> = {
  'Favorite': 1,
  'Elite Contender': 2,
  'Contender': 3,
  'Dark Horse': 4,
  'Host Pick': 5,
  'Mid-Tier': 6,
  'Value': 7,
  'Sleeper': 8,
  'Long Shot': 9,
  'Deep Long Shot': 10,
};

export function sortTeams(teams: Team[], sortOption: SortOption): Team[] {
  return [...teams].sort((a, b) => {
    switch (sortOption) {
      case 'cost-desc':
        if (b.cost !== a.cost) return b.cost - a.cost;
        return a.country.localeCompare(b.country);
      case 'cost-asc':
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.country.localeCompare(b.country);
      case 'group-asc':
        if (a.groupLetter !== b.groupLetter) return a.groupLetter.localeCompare(b.groupLetter);
        return b.cost - a.cost;
      case 'country-asc':
        return a.country.localeCompare(b.country);
      case 'tier':
        if (TIER_ORDER[a.tier] !== TIER_ORDER[b.tier]) {
          return (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99);
        }
        return b.cost - a.cost;
      default:
        return b.cost - a.cost;
    }
  });
}

export function filterTeams(
  teams: Team[],
  tierFilter: string,
  groupFilter: string,
  searchQuery: string
): Team[] {
  let filtered = teams;

  if (tierFilter !== 'all') {
    filtered = filtered.filter((t) => t.tier === tierFilter);
  }

  if (groupFilter !== 'all') {
    filtered = filtered.filter((t) => t.groupLetter === groupFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.country.toLowerCase().includes(q) ||
        t.keyPlayer.toLowerCase().includes(q) ||
        t.groupLetter.toLowerCase() === q ||
        t.tier.toLowerCase().includes(q)
    );
  }

  return filtered;
}
