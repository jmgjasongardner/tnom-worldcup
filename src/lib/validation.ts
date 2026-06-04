import type { Team, PortfolioValidationResult, PortfolioStrategy } from '../types/domain';

export const REQUIRED_TEAM_COUNT = 6;
export const MAX_BUDGET = 100;
export const EMAIL_DOMAIN = '@technomics.net';

export function validateEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(EMAIL_DOMAIN);
}

export function validatePortfolio(
  selectedTeams: Team[],
  email: string,
  displayName: string,
  picksLocked: boolean
): PortfolioValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalCost = selectedTeams.reduce((sum, t) => sum + t.cost, 0);
  const remainingBudget = MAX_BUDGET - totalCost;
  const teamCount = selectedTeams.length;

  if (picksLocked) {
    errors.push('Picks are locked. Your portfolio is now read-only.');
  }

  if (!email.trim()) {
    errors.push('Email is required.');
  } else if (!validateEmail(email)) {
    errors.push('Please use your Technomics email (@technomics.net).');
  }

  if (!displayName.trim()) {
    errors.push('Display name is required.');
  }

  if (teamCount < REQUIRED_TEAM_COUNT) {
    const remaining = REQUIRED_TEAM_COUNT - teamCount;
    errors.push(`Pick ${remaining} more team${remaining > 1 ? 's' : ''}.`);
  } else if (teamCount > REQUIRED_TEAM_COUNT) {
    const over = teamCount - REQUIRED_TEAM_COUNT;
    errors.push(`Remove ${over} team${over > 1 ? 's' : ''} before submitting.`);
  }

  if (totalCost > MAX_BUDGET) {
    errors.push(`This portfolio is $${totalCost - MAX_BUDGET} over budget.`);
  }

  // Unique team check
  const ids = selectedTeams.map((t) => t.id);
  if (new Set(ids).size !== ids.length) {
    errors.push('Duplicate teams detected.');
  }

  // Warnings
  if (remainingBudget > 15 && teamCount === REQUIRED_TEAM_COUNT) {
    warnings.push(`You have $${remainingBudget} remaining. Consider upgrading a team.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalCost,
    remainingBudget,
    teamCount,
  };
}

export function inferStrategy(teams: Team[]): PortfolioStrategy {
  if (teams.length === 0) return 'Custom';

  const costs = teams.map((t) => t.cost);
  const tier1Count = costs.filter((c) => c >= 33).length;
  const tier2Count = costs.filter((c) => c >= 28 && c < 33).length;
  const topCount = costs.filter((c) => c >= 28).length;
  const lowCount = costs.filter((c) => c <= 5).length;
  const valueMidCount = costs.filter((c) => c >= 9 && c <= 23).length;

  if (tier1Count >= 2) return 'Stars & Sleepers';
  if (tier1Count === 1 && valueMidCount >= 3) return 'One Favorite + Depth';
  if (topCount === 0 && valueMidCount >= 4) return 'Balanced';
  if (tier2Count >= 2 && tier1Count >= 1) return 'Favorite Heavy';
  if (lowCount >= 3) return 'Long Shot Heavy';
  if (costs.filter((c) => c <= 10).length >= 4) return 'Value Hunting';

  return 'Balanced';
}
