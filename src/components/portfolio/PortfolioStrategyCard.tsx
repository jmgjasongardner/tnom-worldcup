import type { Team, PortfolioStrategy } from '../../types/domain';
import { inferStrategy } from '../../lib/validation';

interface PortfolioStrategyCardProps {
  teams: Team[];
}

const STRATEGY_DESCRIPTIONS: Record<PortfolioStrategy, string> = {
  'Stars & Sleepers': 'Two elite teams carrying a few budget picks.',
  'Balanced': 'Spread across mid-tier and value teams — no big bets.',
  'One Favorite + Depth': 'A single star surrounded by solid mid-range choices.',
  'Value Hunting': 'All affordable picks — maximizing team count over star power.',
  'Long Shot Heavy': 'Extreme budget plays — cheap teams with lottery-ticket upside.',
  'Favorite Heavy': 'Loading up on top-tier teams — high floor, tight budget.',
  'Custom': 'A unique mix — hard to categorize.',
};

export function PortfolioStrategyCard({ teams }: PortfolioStrategyCardProps) {
  if (teams.length === 0) return null;

  const strategy = inferStrategy(teams);
  const description = STRATEGY_DESCRIPTIONS[strategy];

  return (
    <div className="strategy-card">
      <span className="strategy-label">Strategy</span>
      <span className="strategy-name">{strategy}</span>
      <p className="strategy-description">{description}</p>
    </div>
  );
}
