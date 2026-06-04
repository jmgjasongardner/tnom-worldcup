import type { PortfolioValidationResult } from '../../types/domain';

interface PortfolioStatusBadgeProps {
  validation: PortfolioValidationResult;
  picksLocked: boolean;
}

export function PortfolioStatusBadge({ validation, picksLocked }: PortfolioStatusBadgeProps) {
  if (picksLocked) {
    return <span className="badge badge--locked">🔒 Picks Locked</span>;
  }
  if (validation.isValid) {
    return <span className="badge badge--valid">✓ Ready to Submit</span>;
  }
  if (validation.totalCost > 100) {
    return <span className="badge badge--error">Over Budget</span>;
  }
  if (validation.teamCount > 6) {
    return <span className="badge badge--error">Too Many Teams</span>;
  }
  return <span className="badge badge--warning">Incomplete</span>;
}
