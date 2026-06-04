import { useState } from 'react';
import type { Team } from '../../types/domain';
import { TierBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (team: Team) => void;
  picksLocked?: boolean;
}

export function TeamCard({ team, isSelected, isDisabled, onToggle, picksLocked = false }: TeamCardProps) {
  const [expanded, setExpanded] = useState(false);

  const canAdd = !isSelected && !isDisabled && !picksLocked;
  const canRemove = isSelected && !picksLocked;

  return (
    <div
      className={`team-card ${isSelected ? 'team-card--selected' : ''} ${isDisabled && !isSelected ? 'team-card--disabled' : ''}`}
    >
      <div className="team-card-main">
        {/* Flag + country info */}
        <div className="team-card-identity">
          <span className="team-flag" role="img" aria-label={`${team.country} flag`}>
            {team.flagEmoji}
          </span>
          <div className="team-card-info">
            <div className="team-card-country">{team.country}</div>
            <div className="team-card-meta">
              <span className="team-card-group">Group {team.groupLetter}</span>
              <span className="team-card-dot">·</span>
              <span className="team-card-player">{team.keyPlayer}</span>
            </div>
          </div>
        </div>

        {/* Cost + Tier + Actions */}
        <div className="team-card-right">
          <div className="team-card-tier">
            <TierBadge tier={team.tier} />
          </div>
          <div className="team-card-cost">${team.cost}</div>
          <div className="team-card-actions">
            {canAdd && (
              <Button variant="primary" size="sm" onClick={() => onToggle(team)} aria-label={`Add ${team.country}`}>
                + Add
              </Button>
            )}
            {canRemove && (
              <Button variant="danger" size="sm" onClick={() => onToggle(team)} aria-label={`Remove ${team.country}`}>
                Remove
              </Button>
            )}
            {isSelected && picksLocked && (
              <span className="badge badge--locked">Selected</span>
            )}
            {isDisabled && !isSelected && !picksLocked && (
              <span className="badge badge--warning">Budget</span>
            )}
            <button
              className="team-card-expand-btn"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label="Toggle team details"
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded info */}
      {expanded && (
        <div className="team-card-expanded">
          <div className="team-card-expanded-grid">
            <div className="team-info-item">
              <span className="team-info-label">FIFA Rank</span>
              <span className="team-info-value">{team.fifaRank ?? '—'}</span>
            </div>
            <div className="team-info-item">
              <span className="team-info-label">Group Win Odds</span>
              <span className="team-info-value">{team.groupWinOdds ?? '—'}</span>
            </div>
            <div className="team-info-item">
              <span className="team-info-label">Title Odds</span>
              <span className="team-info-value">{team.titleOdds ?? '—'}</span>
            </div>
            <div className="team-info-item">
              <span className="team-info-label">Position</span>
              <span className="team-info-value">{team.playerPosition ?? '—'}</span>
            </div>
          </div>
          {team.poolAngle && (
            <div className="team-info-angle">
              <span className="team-info-label">Pool angle</span>
              <p>{team.poolAngle}</p>
            </div>
          )}
          {team.whyPick && (
            <div className="team-info-angle">
              <span className="team-info-label">Why pick them?</span>
              <p>{team.whyPick}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
