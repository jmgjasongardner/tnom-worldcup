export type Tier =
  | 'Favorite'
  | 'Elite Contender'
  | 'Contender'
  | 'Dark Horse'
  | 'Host Pick'
  | 'Mid-Tier'
  | 'Value'
  | 'Sleeper'
  | 'Long Shot'
  | 'Deep Long Shot';

export type MatchStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'final';

export type TeamTournamentStatus =
  | 'scheduled'
  | 'group_stage'
  | 'advanced'
  | 'eliminated'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinalist'
  | 'semifinalist'
  | 'finalist'
  | 'champion';

export type PortfolioStrategy =
  | 'Stars & Sleepers'
  | 'Balanced'
  | 'One Favorite + Depth'
  | 'Value Hunting'
  | 'Long Shot Heavy'
  | 'Favorite Heavy'
  | 'Custom';

export interface Team {
  id: string;
  country: string;
  groupLetter: string;
  cost: number;
  tier: Tier;
  keyPlayer: string;
  playerPosition: string | null;
  playerClub: string | null;
  flagEmoji: string;
  flagUrl: string | null;
  fifaRank: number | null;
  groupWinOdds: string | null;
  titleOdds: string | null;
  whyPick: string | null;
  poolAngle: string | null;
}

export interface TeamStatus {
  teamId: string;
  groupMatchPoints: number;
  groupFinishBonus: number;
  knockoutPoints: number;
  totalPoints: number;
  maxPossiblePoints: number;
  isAlive: boolean;
  currentStage: string;
  groupFinish: number | null;
  advancedFromGroup: boolean | null;
  latestResult: string | null;
  nextMatch: string | null;
}

export interface Entry {
  id: string;
  userId: string;
  displayName: string;
  totalCost: number;
  submittedAt: string;
  updatedAt: string;
  teams?: Team[];
  currentPoints?: number;
  maxPossiblePoints?: number;
  teamsAlive?: number;
  rank?: number;
  strategy?: PortfolioStrategy;
}

export interface PortfolioValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalCost: number;
  remainingBudget: number;
  teamCount: number;
}

export interface ScoringEvent {
  id: string;
  teamId: string;
  matchId: string | null;
  eventType: string;
  stage: string;
  points: number;
  label: string;
  createdAt: string;
}

export interface AppSettings {
  bracketLockAt: string | null;
  picksLocked: boolean;
  lastScoreUpdateAt: string | null;
}

export type SortOption =
  | 'cost-desc'
  | 'cost-asc'
  | 'group-asc'
  | 'country-asc'
  | 'tier';

export type TierFilter =
  | 'all'
  | 'Favorite'
  | 'Elite Contender'
  | 'Contender'
  | 'Dark Horse'
  | 'Host Pick'
  | 'Mid-Tier'
  | 'Value'
  | 'Sleeper'
  | 'Long Shot'
  | 'Deep Long Shot';
