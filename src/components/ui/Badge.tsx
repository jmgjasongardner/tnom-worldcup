import React from 'react';
import type { Tier } from '../../types/domain';

type BadgeVariant =
  | 'favorite' | 'elite' | 'contender' | 'dark-horse' | 'host'
  | 'mid' | 'value' | 'sleeper' | 'long-shot'
  | 'alive' | 'eliminated' | 'locked' | 'valid' | 'warning' | 'error';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  );
}

export function tierToBadgeVariant(tier: Tier): BadgeVariant {
  const map: Record<Tier, BadgeVariant> = {
    'Favorite': 'favorite',
    'Elite Contender': 'elite',
    'Contender': 'contender',
    'Dark Horse': 'dark-horse',
    'Host Pick': 'host',
    'Mid-Tier': 'mid',
    'Value': 'value',
    'Sleeper': 'sleeper',
    'Long Shot': 'long-shot',
    'Deep Long Shot': 'long-shot',
  };
  return map[tier] ?? 'mid';
}

export function TierBadge({ tier }: { tier: Tier }) {
  return <Badge variant={tierToBadgeVariant(tier)}>{tier}</Badge>;
}
