import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

const PICKS_LOCKED = false;

export function ParticipantPortfolioPage() {
  const { entryId } = useParams();

  if (!PICKS_LOCKED) {
    return (
      <PageContainer width="narrow">
        <div className="page-header">
          <h1 className="page-title">Participant Portfolio</h1>
        </div>
        <EmptyState
          icon="🔒"
          title="Portfolios hidden until lock"
          description="Other participants' picks are only visible after the opening kickoff."
          action={
            <Link to="/leaderboard">
              <Button variant="secondary">Back to Leaderboard</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <div className="page-header">
        <h1 className="page-title">Portfolio #{entryId}</h1>
      </div>
      {/* Full detail view in Phase 6 */}
    </PageContainer>
  );
}
