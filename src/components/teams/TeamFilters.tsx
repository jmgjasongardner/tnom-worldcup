import type { SortOption } from '../../types/domain';
import { GROUPS } from '../../data/teams';

const TIER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Favorite', label: 'Favorites' },
  { value: 'Elite Contender', label: 'Elite' },
  { value: 'Contender', label: 'Contenders' },
  { value: 'Dark Horse', label: 'Dark Horses' },
  { value: 'Host Pick', label: 'Hosts' },
  { value: 'Mid-Tier', label: 'Mid-Tier' },
  { value: 'Value', label: 'Value' },
  { value: 'Sleeper', label: 'Sleepers' },
  { value: 'Long Shot', label: 'Long Shots' },
  { value: 'Deep Long Shot', label: 'Deep' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'cost-desc', label: 'Cost: High → Low' },
  { value: 'cost-asc', label: 'Cost: Low → High' },
  { value: 'group-asc', label: 'Group A → L' },
  { value: 'country-asc', label: 'Country A → Z' },
  { value: 'tier', label: 'By Tier' },
];

interface TeamFiltersProps {
  tierFilter: string;
  groupFilter: string;
  sortOption: SortOption;
  searchQuery: string;
  onTierChange: (tier: string) => void;
  onGroupChange: (group: string) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (query: string) => void;
  resultCount: number;
}

export function TeamFilters({
  tierFilter,
  groupFilter,
  sortOption,
  searchQuery,
  onTierChange,
  onGroupChange,
  onSortChange,
  onSearchChange,
  resultCount,
}: TeamFiltersProps) {
  return (
    <div className="team-filters">
      {/* Search + Sort row */}
      <div className="team-filters-top">
        <div className="input-group" style={{ flex: 1 }}>
          <span className="input-group-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="input"
            placeholder="Search country or player…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search teams"
          />
        </div>
        <select
          className="sort-select"
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          aria-label="Sort teams"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tier chips */}
      <div className="filter-chips" role="group" aria-label="Filter by tier">
        {TIER_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-chip ${tierFilter === f.value ? 'active' : ''}`}
            onClick={() => onTierChange(f.value)}
            aria-pressed={tierFilter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Group chips */}
      <div className="filter-chips" role="group" aria-label="Filter by group">
        <button
          className={`filter-chip ${groupFilter === 'all' ? 'active' : ''}`}
          onClick={() => onGroupChange('all')}
          aria-pressed={groupFilter === 'all'}
        >
          All Groups
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            className={`filter-chip ${groupFilter === g ? 'active' : ''}`}
            onClick={() => onGroupChange(g)}
            aria-pressed={groupFilter === g}
          >
            Group {g}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        Showing {resultCount} team{resultCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
