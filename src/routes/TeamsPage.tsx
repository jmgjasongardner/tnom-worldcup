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
      </div>

      <TeamCostTable teams={teams} />

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Scoring Rules</h2>
        <ScoringRulesTable />
      </div>
    </PageContainer>
  );
}
