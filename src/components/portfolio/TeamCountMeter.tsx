import { REQUIRED_TEAM_COUNT } from '../../lib/validation';

interface TeamCountMeterProps {
  count: number;
}

export function TeamCountMeter({ count }: TeamCountMeterProps) {
  const pct = Math.min((count / REQUIRED_TEAM_COUNT) * 100, 100);
  const complete = count === REQUIRED_TEAM_COUNT;
  const over = count > REQUIRED_TEAM_COUNT;

  const fillClass = over
    ? 'progress-bar-fill--danger'
    : complete
    ? 'progress-bar-fill--success'
    : '';

  return (
    <div className="team-count-meter">
      <div className="meter-header">
        <span className="meter-label">Teams</span>
        <span className={`meter-value ${over ? 'meter-value--over' : complete ? 'meter-value--complete' : ''}`}>
          {count} <span className="meter-max">/ {REQUIRED_TEAM_COUNT}</span>
        </span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={REQUIRED_TEAM_COUNT}
      >
        <div
          className={`progress-bar-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="meter-sub">
        {over ? (
          <span style={{ color: 'var(--color-error)' }}>
            Remove {count - REQUIRED_TEAM_COUNT} team{count - REQUIRED_TEAM_COUNT > 1 ? 's' : ''}
          </span>
        ) : complete ? (
          <span style={{ color: 'var(--color-success)' }}>All 6 teams selected ✓</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>
            Pick {REQUIRED_TEAM_COUNT - count} more team{REQUIRED_TEAM_COUNT - count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
