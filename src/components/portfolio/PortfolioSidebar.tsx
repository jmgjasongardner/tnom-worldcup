import type { Team } from '../../types/domain';
import { validatePortfolio } from '../../lib/validation';
import { BudgetMeter } from './BudgetMeter';
import { TeamCountMeter } from './TeamCountMeter';
import { PortfolioStatusBadge } from './PortfolioStatusBadge';
import { PortfolioStrategyCard } from './PortfolioStrategyCard';
import { Button } from '../ui/Button';

interface PortfolioSidebarProps {
  selectedTeams: Team[];
  email: string;
  displayName: string;
  picksLocked: boolean;
  submitted: boolean;
  submitting?: boolean;
  signedIn?: boolean;
  onRemove: (team: Team) => void;
  onSubmit: () => void;
}

export function PortfolioSidebar({
  selectedTeams,
  email,
  displayName,
  picksLocked,
  submitted,
  submitting = false,
  signedIn = false,
  onRemove,
  onSubmit,
}: PortfolioSidebarProps) {
  const validation = validatePortfolio(selectedTeams, email, displayName, picksLocked);
  const totalCost = selectedTeams.reduce((s, t) => s + t.cost, 0);

  return (
    <aside className="portfolio-sidebar card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>Your Portfolio</h2>
          <PortfolioStatusBadge validation={validation} picksLocked={picksLocked} />
        </div>
      </div>

      <div className="card-body sidebar-body">
        {/* Meters */}
        <div className="sidebar-meters">
          <TeamCountMeter count={selectedTeams.length} />
          <BudgetMeter totalCost={totalCost} />
        </div>

        {/* Strategy */}
        {selectedTeams.length > 0 && <PortfolioStrategyCard teams={selectedTeams} />}

        {/* Selected teams list */}
        <div className="sidebar-teams">
          {selectedTeams.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              No teams selected yet. Pick 6 teams from the list.
            </p>
          ) : (
            <ul className="selected-team-list" aria-label="Selected teams">
              {selectedTeams.map((team) => (
                <li key={team.id} className="selected-team-item">
                  <span className="selected-team-flag">{team.flagEmoji}</span>
                  <span className="selected-team-name">{team.country}</span>
                  <span className="selected-team-cost">${team.cost}</span>
                  {!picksLocked && (
                    <button
                      className="selected-team-remove"
                      onClick={() => onRemove(team)}
                      aria-label={`Remove ${team.country}`}
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <ul className="sidebar-errors" aria-live="polite">
            {validation.errors.map((err) => (
              <li key={err} className="sidebar-error-item">
                <span aria-hidden>⚠</span> {err}
              </li>
            ))}
          </ul>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <ul className="sidebar-warnings" aria-live="polite">
            {validation.warnings.map((w) => (
              <li key={w} className="sidebar-warning-item">
                <span aria-hidden>💡</span> {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-footer">
        {picksLocked ? (
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            🔒 Picks locked after opening kickoff.
          </div>
        ) : !signedIn ? (
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Sign in above to submit your portfolio.
          </div>
        ) : submitted ? (
          <Button variant="secondary" fullWidth onClick={onSubmit} disabled={!validation.isValid || submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={onSubmit} disabled={!validation.isValid || submitting}>
            {submitting ? 'Submitting…' : 'Submit Portfolio'}
          </Button>
        )}
      </div>
    </aside>
  );
}
