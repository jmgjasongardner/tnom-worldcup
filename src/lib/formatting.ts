export function formatCost(cost: number): string {
  return `$${cost}`;
}

export function formatPoints(points: number): string {
  return `${points} pt${points !== 1 ? 's' : ''}`;
}

export function formatBudget(used: number, max: number): string {
  return `$${used} / $${max}`;
}

export function formatTeamCount(count: number, max: number): string {
  return `${count} / ${max}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function tierShortLabel(tier: string): string {
  const map: Record<string, string> = {
    'Favorite': 'Fav',
    'Elite Contender': 'Elite',
    'Contender': 'Cont.',
    'Dark Horse': 'Dark',
    'Host Pick': 'Host',
    'Mid-Tier': 'Mid',
    'Value': 'Val',
    'Sleeper': 'Sleep',
    'Long Shot': 'Long',
    'Deep Long Shot': 'Deep',
  };
  return map[tier] ?? tier;
}
