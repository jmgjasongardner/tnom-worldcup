import { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamCostTable } from '../components/teams/TeamCostTable';
import { ScoringRulesTable } from '../components/scoring/ScoringRulesTable';
import { fetchTeams } from '../lib/teamsApi';
import type { Team } from '../types/domain';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => {
        import('../data/teams').then((m) => setTeams(m.TEAMS));
      });
  }, []);

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Teams &amp; Costs</h1>
        <p className="page-subtitle">
          All 48 World Cup nations, ranked by cost. Click any row to see team details and pool angle.
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
          <a
            href="https://www.espn.com/soccer/story/_/id/48871263/world-cup-2026-key-players-facts-expectations-fixtures-odds-all-48-teams"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-teal-500)', fontWeight: 600 }}
          >
            ESPN Mega-Preview: Key players, facts &amp; odds for all 48 teams →
          </a>
        </p>
      </div>

      <TeamCostTable teams={teams} />

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Scoring Rules</h2>
        <ScoringRulesTable />
      </div>
    </PageContainer>
  );
}
