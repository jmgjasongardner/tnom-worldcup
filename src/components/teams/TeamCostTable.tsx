import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Team, SortOption } from '../../types/domain';
import { TierBadge } from '../ui/Badge';
import { sortTeams, filterTeams } from '../../lib/sorting';
import { TeamFilters } from './TeamFilters';
import { TeamFlag } from './TeamFlag';

interface TeamCostTableProps {
  teams: Team[];
}

export function TeamCostTable({ teams }: TeamCostTableProps) {
  const [sort, setSort] = useState<SortOption>('cost-desc');
  const [tierFilter, setTierFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterTeams(teams, tierFilter, groupFilter, search);
  const sorted = sortTeams(filtered, sort);

  return (
    <div className="team-cost-table-wrapper">
      <TeamFilters
        tierFilter={tierFilter}
        groupFilter={groupFilter}
        sortOption={sort}
        searchQuery={search}
        onTierChange={setTierFilter}
        onGroupChange={setGroupFilter}
        onSortChange={setSort}
        onSearchChange={setSearch}
        resultCount={sorted.length}
      />

      <div className="team-table-container">
        <table className="team-table" aria-label="Teams and costs">
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Group</th>
              <th scope="col">Cost</th>
              <th scope="col">Tier</th>
              <th scope="col">Key Player</th>
              <th scope="col" style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team) => (
              <>
                <tr
                  key={team.id}
                  className={`team-table-row ${expandedId === team.id ? 'team-table-row--expanded' : ''}`}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="sm" />
                      <Link to={`/teams/${team.id}`} className="lb-name-link">{team.country}</Link>
                    </div>
                  </td>
                  <td>
                    <span className="group-pill">Group {team.groupLetter}</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--color-navy-900)' }}>${team.cost}</strong>
                  </td>
                  <td>
                    <TierBadge tier={team.tier} />
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {team.keyPlayer}
                  </td>
                  <td>
                    <button
                      className="team-card-expand-btn"
                      onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                      aria-expanded={expandedId === team.id}
                      aria-label={`Toggle ${team.country} details`}
                    >
                      {expandedId === team.id ? '▲' : '▼'}
                    </button>
                  </td>
                </tr>
                {expandedId === team.id && (
                  <tr key={`${team.id}-expanded`} className="team-table-expanded-row">
                    <td colSpan={6}>
                      <div className="team-expanded-content">
                        {team.poolAngle && (
                          <div className="team-info-item">
                            <span className="team-info-label">Pool angle</span>
                            <p>{team.poolAngle}</p>
                          </div>
                        )}
                        {team.whyPick && (
                          <div className="team-info-item">
                            <span className="team-info-label">Why pick them?</span>
                            <p>{team.whyPick}</p>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          <div className="team-info-item">
                            <span className="team-info-label">FIFA Rank</span>
                            <span>{team.fifaRank ?? '—'}</span>
                          </div>
                          <div className="team-info-item">
                            <span className="team-info-label">Title Odds</span>
                            <span>{team.titleOdds ?? '—'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
