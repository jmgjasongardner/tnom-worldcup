import { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamFilters } from '../components/teams/TeamFilters';
import { PortfolioSidebar } from '../components/portfolio/PortfolioSidebar';
import { SignInPanel } from '../components/auth/SignInPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../contexts/AuthContext';
import { fetchTeams, fetchAppSettings } from '../lib/teamsApi';
import { fetchMyEntry, submitPortfolio } from '../lib/entriesApi';
import { sortTeams, filterTeams } from '../lib/sorting';
import { MAX_BUDGET, REQUIRED_TEAM_COUNT } from '../lib/validation';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import type { Team, SortOption } from '../types/domain';

export function BuildPortfolioPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [teams, setTeams] = useState<Team[]>(STATIC_TEAMS);
  const [picksLocked, setPicksLocked] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Filter/sort state
  const [sortOption, setSortOption] = useState<SortOption>('cost-desc');
  const [tierFilter, setTierFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load teams and app settings on mount
  useEffect(() => {
    Promise.all([fetchTeams(), fetchAppSettings()]).then(([teamData, settings]) => {
      setTeams(teamData);
      setPicksLocked(settings.picksLocked);
      setDataLoading(false);
    });
  }, []);

  // Load existing entry when user is known
  useEffect(() => {
    if (!user) return;
    fetchMyEntry(user.id).then((entry) => {
      if (!entry) return;
      setExistingEntryId(entry.id);
      setDisplayName(entry.displayName);
      // Map saved team IDs back to Team objects
      const savedTeams = entry.teamIds
        .map((id) => teams.find((t) => t.id === id))
        .filter(Boolean) as Team[];
      setSelectedTeams(savedTeams);
    });
  }, [user, teams]);

  // Pre-fill display name from profile
  useEffect(() => {
    if (profile?.display_name && !displayName) {
      setDisplayName(profile.display_name);
    }
  }, [profile, displayName]);

  const totalCost = selectedTeams.reduce((s, t) => s + t.cost, 0);

  const handleToggle = (team: Team) => {
    if (picksLocked) return;
    setSelectedTeams((prev) => {
      if (prev.find((t) => t.id === team.id)) {
        return prev.filter((t) => t.id !== team.id);
      }
      return [...prev, team];
    });
    setSubmitMessage(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (selectedTeams.length !== REQUIRED_TEAM_COUNT || totalCost > MAX_BUDGET) return;

    setSubmitting(true);
    setSubmitMessage(null);

    const { error } = await submitPortfolio(user.id, displayName, selectedTeams);

    setSubmitting(false);
    if (error) {
      setSubmitMessage({ type: 'error', text: error });
    } else {
      setExistingEntryId('saved'); // mark as submitted
      setSubmitMessage({
        type: 'success',
        text: existingEntryId
          ? 'Portfolio updated! You can keep editing until picks lock.'
          : 'Portfolio submitted! You can edit until picks lock.',
      });
    }
  };

  const filtered = filterTeams(teams, tierFilter, groupFilter, searchQuery);
  const sorted = sortTeams(filtered, sortOption);

  const isDisabled = (team: Team) =>
    !selectedTeams.find((t) => t.id === team.id) &&
    (selectedTeams.length >= REQUIRED_TEAM_COUNT || totalCost + team.cost > MAX_BUDGET);

  if (authLoading || dataLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Build Portfolio</h1>
        <p className="page-subtitle">Select exactly 6 teams. Stay under $100.</p>
      </div>

      {/* Sign-in gate */}
      {!user && (
        <div style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
          <SignInPanel />
        </div>
      )}

      {/* Display name (shown when signed in and no existing entry) */}
      {user && !existingEntryId && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
          <div className="card-body">
            <h2 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.75rem' }}>
              Your display name
            </h2>
            <label
              htmlFor="display-name"
              style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}
            >
              How you'll appear on the leaderboard
            </label>
            <input
              id="display-name"
              type="text"
              className="input"
              placeholder="e.g. Jason G."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Submit / update message */}
      {submitMessage && (
        <div
          className={`submit-message submit-message--${submitMessage.type}`}
          role="alert"
          aria-live="polite"
          style={{ marginBottom: '1.5rem', maxWidth: 480 }}
        >
          {submitMessage.type === 'success' ? '✓' : '⚠'} {submitMessage.text}
        </div>
      )}

      {/* Main layout */}
      <div className="build-layout">
        <div className="build-main">
          <TeamFilters
            tierFilter={tierFilter}
            groupFilter={groupFilter}
            sortOption={sortOption}
            searchQuery={searchQuery}
            onTierChange={setTierFilter}
            onGroupChange={setGroupFilter}
            onSortChange={setSortOption}
            onSearchChange={setSearchQuery}
            resultCount={sorted.length}
          />

          <div className="team-card-list" style={{ marginTop: '1rem' }}>
            {sorted.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isSelected={!!selectedTeams.find((t) => t.id === team.id)}
                isDisabled={isDisabled(team)}
                onToggle={handleToggle}
                picksLocked={picksLocked}
              />
            ))}
            {sorted.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No teams match your filters</div>
                <div className="empty-state-description">Try adjusting your search or filters.</div>
              </div>
            )}
          </div>
        </div>

        <div className="build-sidebar">
          <PortfolioSidebar
            selectedTeams={selectedTeams}
            email={user?.email ?? ''}
            displayName={displayName}
            picksLocked={picksLocked}
            submitted={!!existingEntryId}
            submitting={submitting}
            signedIn={!!user}
            onRemove={handleToggle}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </PageContainer>
  );
}
