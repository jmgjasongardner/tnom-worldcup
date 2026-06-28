import { KNOCKOUT_STAGE_LABELS, type KnockoutStage } from '../../data/knockoutBracket';
import type { ResolvedBracketMatch } from '../../lib/bracketEngine';
import { TeamFlag } from '../teams/TeamFlag';
import type { Team } from '../../types/domain';

interface KnockoutBracketProps {
  resolved: ResolvedBracketMatch[];
  teamMap: Record<string, Team>;
}

const COLUMN_STAGES: KnockoutStage[] = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final'];

interface SlotRowProps {
  teamId: string | null;
  label: string;
  score: number | null;
  isWinner: boolean;
  isComplete: boolean;
  teamMap: Record<string, Team>;
}

function SlotRow({ teamId, label, score, isWinner, isComplete, teamMap }: SlotRowProps) {
  const team = teamId ? teamMap[teamId] : null;
  return (
    <div
      className={[
        'bracket-slot',
        isComplete && isWinner ? 'bracket-slot--winner' : '',
        isComplete && !isWinner ? 'bracket-slot--loser' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="bracket-slot-team">
        {team ? (
          <>
            <TeamFlag teamId={team.id} flagEmoji={team.flagEmoji} country={team.country} size="sm" />
            <span className="bracket-slot-name">{team.country}</span>
          </>
        ) : (
          <span className="bracket-slot-placeholder">{label}</span>
        )}
      </div>
      {score != null && <span className="bracket-slot-score">{score}</span>}
    </div>
  );
}

/** Round-by-round visual bracket (Round of 32 through Final), driven by live results.
 *  Unresolved slots show a placeholder label (e.g. "Winner Match 74") until that
 *  earlier match is decided. */
export function KnockoutBracket({ resolved, teamMap }: KnockoutBracketProps) {
  const byStage: Partial<Record<KnockoutStage, ResolvedBracketMatch[]>> = {};
  for (const m of resolved) {
    (byStage[m.stage] ??= []).push(m);
  }
  for (const stage of Object.keys(byStage) as KnockoutStage[]) {
    byStage[stage]!.sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const thirdPlace = byStage.third_place?.[0];

  return (
    <div className="knockout-bracket">
      <div className="knockout-bracket-columns">
        {COLUMN_STAGES.map((stage) => (
          <div key={stage} className="knockout-round">
            <h3 className="knockout-round-title">{KNOCKOUT_STAGE_LABELS[stage]}</h3>
            <div className="knockout-round-matches">
              {(byStage[stage] ?? []).map((m) => (
                <div key={m.matchNumber} className="knockout-match">
                  <span className="knockout-match-number">Match {m.matchNumber}</span>
                  <SlotRow
                    teamId={m.homeTeamId} label={m.homeLabel} score={m.homeScore}
                    isWinner={!!m.winnerTeamId && m.winnerTeamId === m.homeTeamId}
                    isComplete={m.isComplete} teamMap={teamMap}
                  />
                  <SlotRow
                    teamId={m.awayTeamId} label={m.awayLabel} score={m.awayScore}
                    isWinner={!!m.winnerTeamId && m.winnerTeamId === m.awayTeamId}
                    isComplete={m.isComplete} teamMap={teamMap}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {thirdPlace && (
        <div className="knockout-third-place">
          <h3 className="knockout-round-title">Third Place Match <span className="knockout-third-place-note">(no points awarded)</span></h3>
          <div className="knockout-match knockout-match--third">
            <SlotRow
              teamId={thirdPlace.homeTeamId} label={thirdPlace.homeLabel} score={thirdPlace.homeScore}
              isWinner={!!thirdPlace.winnerTeamId && thirdPlace.winnerTeamId === thirdPlace.homeTeamId}
              isComplete={thirdPlace.isComplete} teamMap={teamMap}
            />
            <SlotRow
              teamId={thirdPlace.awayTeamId} label={thirdPlace.awayLabel} score={thirdPlace.awayScore}
              isWinner={!!thirdPlace.winnerTeamId && thirdPlace.winnerTeamId === thirdPlace.awayTeamId}
              isComplete={thirdPlace.isComplete} teamMap={teamMap}
            />
          </div>
        </div>
      )}
    </div>
  );
}
