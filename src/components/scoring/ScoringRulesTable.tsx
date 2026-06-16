import { SCORING_TABLE, CHAMPION_EXAMPLE } from '../../data/scoringRules';

export function ScoringRulesTable() {
  return (
    <div className="scoring-rules">
      <div className="scoring-section">
        <h3>Match Points</h3>
        <table className="scoring-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {SCORING_TABLE.map((row) => (
              <tr key={row.event}>
                <td>{row.event}</td>
                <td>
                  <strong style={{ color: row.points > 0 ? 'var(--color-teal-500)' : 'var(--color-text-muted)' }}>
                    +{row.points}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="scoring-section">
        <h3>Maximum Possible Score</h3>
        <table className="scoring-table">
          <tbody>
            <tr>
              <td>3 group wins (max)</td>
              <td><strong>+{CHAMPION_EXAMPLE.groupPoints}</strong></td>
            </tr>
            <tr>
              <td>Group winner bonus</td>
              <td><strong>+{CHAMPION_EXAMPLE.groupBonus}</strong></td>
            </tr>
            <tr>
              <td>R32 + R16 + QF + SF + Final wins</td>
              <td><strong>+{CHAMPION_EXAMPLE.knockoutPoints}</strong></td>
            </tr>
            <tr style={{ borderTop: '2px solid var(--color-border)' }}>
              <td><strong>Total</strong></td>
              <td>
                <strong style={{ color: 'var(--color-gold-400)', fontSize: '1.1rem' }}>
                  {CHAMPION_EXAMPLE.total} pts
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
