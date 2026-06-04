import { MAX_BUDGET } from '../../lib/validation';

interface BudgetMeterProps {
  totalCost: number;
}

export function BudgetMeter({ totalCost }: BudgetMeterProps) {
  const pct = Math.min((totalCost / MAX_BUDGET) * 100, 100);
  const over = totalCost > MAX_BUDGET;
  const nearLimit = totalCost >= MAX_BUDGET * 0.9;

  const fillClass = over
    ? 'progress-bar-fill--danger'
    : nearLimit
    ? 'progress-bar-fill--warning'
    : '';

  return (
    <div className="budget-meter">
      <div className="meter-header">
        <span className="meter-label">Budget</span>
        <span className={`meter-value ${over ? 'meter-value--over' : ''}`}>
          ${totalCost} <span className="meter-max">/ ${MAX_BUDGET}</span>
        </span>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={totalCost} aria-valuemin={0} aria-valuemax={MAX_BUDGET}>
        <div
          className={`progress-bar-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="meter-sub">
        {over ? (
          <span style={{ color: 'var(--color-error)' }}>
            ${totalCost - MAX_BUDGET} over budget
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>
            ${MAX_BUDGET - totalCost} remaining
          </span>
        )}
      </div>
    </div>
  );
}
