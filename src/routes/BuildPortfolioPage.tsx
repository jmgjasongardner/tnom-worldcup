import { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamFilters } from '../components/teams/TeamFilters';
import { PortfolioSidebar } from '../components/portfolio/PortfolioSidebar';
import { LoadingState } from '../components/ui/LoadingState';
import { fetchTeams, fetchAppSettings } from '../lib/teamsApi';
import { fetchMyEntry, submitPortfolio } from '../lib/entriesApi';
import { sortTeams, filterTeams } from '../lib/sorting';
import { MAX_BUDGET, REQUIRED_TEAM_COUNT, EMAIL_DOMAIN } from '../lib/validation';
import { TEAMS as STATIC_TEAMS } from '../data/teams';
import type { Team, SortOption } from '../types/domain';

const LS_EMAIL = 'tnom_wc_email';
const LS_NAME  = 'tnom_wc_display_name';

export function BuildPortfolioPage() {
  const [teams, setTeams] = useState<Team[]>(STATIC_TEAMS);
  const [picksLocked, setPicksLocked] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [email, setEmail] = useState(() => localStorage.getItem(LS_EMAIL) ?? '');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(LS_NAME) ?? '');
  const [hasEntry, setHasEntry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [entryLoading, setEntryLoading] = useState(false);

  // Filter/sort state
  const [sortOption, setSortOption] = useState<SortOption>('cost-desc');
  const [tierFilter, setTierFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load teams and app settings on mount
  useEffect(() => {
    Promise.all([fetchTeams(), fetchAppSettings()])
      .then(([teamData, settings]) => {
        setTeams(teamData);
        setPicksLocked(settings.picksLocked);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  // Load existing entry when email is a valid Technomics address
  const loadEntry = useCallback(async (emailVal: string, teamList: Team[]) => {
    if (!emailVal.toLowerCase().endsWith(EMAIL_DOMAIN)) return;
    setEntryLoading(true);
    try {
      const entry = await fetchMyEntry(emailVal);
      if (entry) {
        setHasEntry(true);
        setDisplayName(entry.displayName);
        localStorage.setItem(LS_NAME, entry.displayName);
        const savedTeams = entry.teamIds
          .map((id) => teamList.find((t) => t.id === id))
          .filter(Boolean) as Team[];
        setSelectedTeams(savedTeams);
      }
    } finally {
      setEntryLoading(false);
    }
  }, []);

  // Auto-load when we have both teams and a saved email
  useEffect(() => {
    if (!dataLoading && email) {
      loadEntry(email, teams);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading]);

  const totalCost = selectedTeams.reduce((s, t) => s + t.cost, 0);

  const handleToggle = (team: Team) => {
    if (picksLocked) return;
    setSelectedTeams((prev) => {
      if (prev.find((t) => t.id === team.id)) return prev.filter((t) => t.id !== team.id);
      return [...prev, team];
    });
    setSubmitMessage(null);
  };

  const handleEmailBlur = () => {
    if (email.toLowerCase().endsWith(EMAIL_DOMAIN)) {
      localStorage.setItem(LS_EMAIL, email.toLowerCase().trim());
      loadEntry(email, teams);
    }
  };

  const handleSubmit = async () => {
    if (selectedTeams.length !== REQUIRED_TEAM_COUNT || totalCost > MAX_BUDGET) return;
    if (!email.toLowerCase().endsWith(EMAIL_DOMAIN)) return;

    setSubmitting(true);
    setSubmitMessage(null);

    const result = await submitPortfolio(email, displayName, selectedTeams);

    setSubmitting(false);
    if (!result.success) {
      setSubmitMessage({ type: 'error', text: result.error ?? 'Something went wrong.' });
    } else {
      localStorage.setItem(LS_EMAIL, email.toLowerCase().trim());
      localStorage.setItem(LS_NAME, displayName.trim());
      setHasEntry(true);
      setSubmitMessage({
        type: 'success',
        text: hasEntry
          ? '✓ Portfolio updated! You can keep editing until picks lock.'
          : '✓ Portfolio submitted! You can edit until picks lock.',
      });
    }
  };

  const filtered = filterTeams(teams, tierFilter, groupFilter, searchQuery);
  const sorted = sortTeams(filtered, sortOption);

  const isDisabled = (team: Team) =>
    !selectedTeams.find((t) => t.id === team.id) &&
    (selectedTeams.length >= REQUIRED_TEAM_COUNT || totalCost + team.cost > MAX_BUDGET);

  const emailValid = email.toLowerCase().trim().endsWith(EMAIL_DOMAIN);

  if (dataLoading) {
    return <PageContainer><LoadingState message="Loading…" /></PageContainer>;
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Build Portfolio</h1>
        <p className="page-subtitle">Select exactly 6 teams. Stay under $100.</p>
      </div>

      {/* Identity card */}
      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 520 }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label htmlFor="pick-email" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Technomics email
            </label>
            <input
              id="pick-email"
              type="email"
              className="input"
              placeholder="you@technomics.net"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSubmitMessage(null); }}
              onBlur={handleEmailBlur}
              disabled={picksLocked}
              autoComplete="email"
            />
            {email && !emailValid && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)', marginTop: '0.25rem' }}>
                Please use your @technomics.net email.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="display-name" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Display name <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(shown on leaderboard)</span>
            </label>
            <input
              id="display-name"
              type="text"
              className="input"
              placeholder="e.g. Jason G."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={picksLocked}
            />
          </div>
          {entryLoading && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Loading your picks…</p>
          )}
          {hasEntry && !entryLoading && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>
              ✓ Portfolio loaded — you can edit until picks lock.
            </p>
          )}
        </div>
      </div>

      {/* Submit message */}
      {submitMessage && (
        <div
          className={`submit-message submit-message--${submitMessage.type}`}
          role="alert"
          aria-live="polite"
          style={{ marginBottom: '1.5rem', maxWidth: 520 }}
        >
          {submitMessage.text}
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
            email={email}
            displayName={displayName}
            picksLocked={picksLocked}
            submitted={hasEntry}
            submitting={submitting}
            signedIn={emailValid}
            onRemove={handleToggle}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </PageContainer>
  );
}
