import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';

// Admin access will be gated by Supabase RLS + auth in Phase 7
const IS_ADMIN = false;

export function AdminPage() {
  if (!IS_ADMIN) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          icon="🚫"
          title="Admin access required"
          description="This page is only accessible to admins. Please sign in with an admin account."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Admin Results Update</h1>
        <p className="page-subtitle">Manage lock status, match results, and scoring.</p>
      </div>
      {/* Admin forms will be built in Phase 7 */}
    </PageContainer>
  );
}
