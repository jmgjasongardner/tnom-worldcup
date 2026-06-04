import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { MOCK_ENTRIES } from '../data/mockEntries';

const PICKS_LOCKED = false;

export function LeaderboardPage() {
  if (!PICKS_LOCKED) {
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
                <div className="stat-card-value">{MOCK_ENTRIES.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Lock Date</div>
                <div className="stat-card-value" style={{ fontSize: 'var(--font-size-xl)' }}>June 11</div>
                <div className="stat-card-sub">Opening kickoff</div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // After lock — full leaderboard
  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Live standings. Updated after each match.</p>
      </div>
      <EmptyState
        icon="🏆"
        title="Tournament hasn't started yet"
        description="Check back after the opening match for live standings."
      />
    </PageContainer>
  );
}
