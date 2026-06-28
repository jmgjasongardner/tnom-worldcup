/**
 * Official FIFA 2026 World Cup knockout bracket — Matches 73 through 104.
 *
 * Round of 32 (Matches 73–88) entrants are real, confirmed teams: the final
 * group standings concluded June 27, 2026, and FIFA's third-place
 * combination table (Annex C) plus independently-sourced real matchups both
 * point to the same 16 fixtures below (cross-checked 8-for-8 on which
 * third-place team lands in which slot).
 *
 * Round of 16 onward (Matches 89–104) are encoded as references to earlier
 * match winners/losers ("winnerOf" / "loserOf"), per FIFA's official bracket
 * diagram. These resolve to real teams automatically as Round of 32+ results
 * come in — see src/lib/bracketEngine.ts.
 *
 * Kickoff times/venues are filled in only where currently known (Round of 32,
 * sourced from ESPN's scoreboard feed). Later rounds don't have fixed
 * date/venue info wired in yet.
 */

export type KnockoutStage =
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third_place'
  | 'final';

export interface BracketSlot {
  /** Literal team id — only set for Round of 32 slots, where the real team is already known. */
  teamId?: string;
  /** Filled by the winner of an earlier match, referenced by official FIFA match number. */
  winnerOf?: number;
  /** Filled by the loser of an earlier match (third-place match only). */
  loserOf?: number;
  /** Human-readable fallback shown until the slot resolves. */
  label: string;
}

export interface BracketMatch {
  /** Official FIFA match number, 73–104. */
  matchNumber: number;
  stage: KnockoutStage;
  home: BracketSlot;
  away: BracketSlot;
  /** ESPN's numeric event id — currently only populated for Round of 32. */
  espnEventId?: string;
  /** ISO datetime string in US Eastern Time, same convention as src/data/schedule.ts. */
  dateTimeET?: string;
  venue?: string;
  city?: string;
}

function team(teamId: string, label: string): BracketSlot {
  return { teamId, label };
}
function winnerOf(matchNumber: number): BracketSlot {
  return { winnerOf: matchNumber, label: `Winner Match ${matchNumber}` };
}
function loserOf(matchNumber: number): BracketSlot {
  return { loserOf: matchNumber, label: `Loser Match ${matchNumber}` };
}

export const KNOCKOUT_BRACKET: BracketMatch[] = [
  // ── Round of 32 (Matches 73–88) — real teams, confirmed ───────────────────
  {
    matchNumber: 73, stage: 'round_of_32',
    home: team('south-africa', 'South Africa'), away: team('canada', 'Canada'),
    espnEventId: '760486', dateTimeET: '2026-06-28T15:00:00',
    venue: 'SoFi Stadium', city: 'Los Angeles',
  },
  {
    matchNumber: 74, stage: 'round_of_32',
    home: team('germany', 'Germany'), away: team('paraguay', 'Paraguay'),
    espnEventId: '760489', dateTimeET: '2026-06-29T16:30:00',
    venue: 'Gillette Stadium', city: 'Boston',
  },
  {
    matchNumber: 75, stage: 'round_of_32',
    home: team('netherlands', 'Netherlands'), away: team('morocco', 'Morocco'),
    espnEventId: '760488', dateTimeET: '2026-06-29T21:00:00',
    venue: 'Estadio BBVA', city: 'Monterrey',
  },
  {
    matchNumber: 76, stage: 'round_of_32',
    home: team('brazil', 'Brazil'), away: team('japan', 'Japan'),
    espnEventId: '760487', dateTimeET: '2026-06-29T13:00:00',
    venue: 'NRG Stadium', city: 'Houston',
  },
  {
    matchNumber: 77, stage: 'round_of_32',
    home: team('france', 'France'), away: team('sweden', 'Sweden'),
    espnEventId: '760492', dateTimeET: '2026-06-30T17:00:00',
    venue: 'MetLife Stadium', city: 'New York / New Jersey',
  },
  {
    matchNumber: 78, stage: 'round_of_32',
    home: team('cote-divoire', "Côte d'Ivoire"), away: team('norway', 'Norway'),
    espnEventId: '760490', dateTimeET: '2026-06-30T13:00:00',
    venue: 'AT&T Stadium', city: 'Dallas',
  },
  {
    matchNumber: 79, stage: 'round_of_32',
    home: team('mexico', 'Mexico'), away: team('ecuador', 'Ecuador'),
    espnEventId: '760491', dateTimeET: '2026-06-30T21:00:00',
    venue: 'Estadio Azteca', city: 'Mexico City',
  },
  {
    matchNumber: 80, stage: 'round_of_32',
    home: team('england', 'England'), away: team('dr-congo', 'DR Congo'),
    espnEventId: '760495', dateTimeET: '2026-07-01T12:00:00',
    venue: 'Mercedes-Benz Stadium', city: 'Atlanta',
  },
  {
    matchNumber: 81, stage: 'round_of_32',
    home: team('united-states', 'United States'), away: team('bosnia-and-herzegovina', 'Bosnia and Herzegovina'),
    espnEventId: '760494', dateTimeET: '2026-07-01T20:00:00',
    venue: "Levi's Stadium", city: 'San Francisco',
  },
  {
    matchNumber: 82, stage: 'round_of_32',
    home: team('belgium', 'Belgium'), away: team('senegal', 'Senegal'),
    espnEventId: '760493', dateTimeET: '2026-07-01T16:00:00',
    venue: 'Lumen Field', city: 'Seattle',
  },
  {
    matchNumber: 83, stage: 'round_of_32',
    home: team('portugal', 'Portugal'), away: team('croatia', 'Croatia'),
    espnEventId: '760496', dateTimeET: '2026-07-02T19:00:00',
    venue: 'BMO Field', city: 'Toronto',
  },
  {
    matchNumber: 84, stage: 'round_of_32',
    home: team('spain', 'Spain'), away: team('austria', 'Austria'),
    espnEventId: '760497', dateTimeET: '2026-07-02T15:00:00',
    venue: 'SoFi Stadium', city: 'Los Angeles',
  },
  {
    matchNumber: 85, stage: 'round_of_32',
    home: team('switzerland', 'Switzerland'), away: team('algeria', 'Algeria'),
    espnEventId: '760498', dateTimeET: '2026-07-02T23:00:00',
    venue: 'BC Place', city: 'Vancouver',
  },
  {
    matchNumber: 86, stage: 'round_of_32',
    home: team('argentina', 'Argentina'), away: team('cabo-verde', 'Cabo Verde'),
    espnEventId: '760500', dateTimeET: '2026-07-03T18:00:00',
    venue: 'Hard Rock Stadium', city: 'Miami',
  },
  {
    matchNumber: 87, stage: 'round_of_32',
    home: team('colombia', 'Colombia'), away: team('ghana', 'Ghana'),
    espnEventId: '760501', dateTimeET: '2026-07-03T21:30:00',
    venue: 'Arrowhead Stadium', city: 'Kansas City',
  },
  {
    matchNumber: 88, stage: 'round_of_32',
    home: team('australia', 'Australia'), away: team('egypt', 'Egypt'),
    espnEventId: '760499', dateTimeET: '2026-07-03T14:00:00',
    venue: 'AT&T Stadium', city: 'Dallas',
  },

  // ── Round of 16 (Matches 89–96) ────────────────────────────────────────────
  { matchNumber: 89, stage: 'round_of_16', home: winnerOf(74), away: winnerOf(77) },
  { matchNumber: 90, stage: 'round_of_16', home: winnerOf(73), away: winnerOf(75) },
  { matchNumber: 91, stage: 'round_of_16', home: winnerOf(76), away: winnerOf(78) },
  { matchNumber: 92, stage: 'round_of_16', home: winnerOf(79), away: winnerOf(80) },
  { matchNumber: 93, stage: 'round_of_16', home: winnerOf(83), away: winnerOf(84) },
  { matchNumber: 94, stage: 'round_of_16', home: winnerOf(81), away: winnerOf(82) },
  { matchNumber: 95, stage: 'round_of_16', home: winnerOf(86), away: winnerOf(88) },
  { matchNumber: 96, stage: 'round_of_16', home: winnerOf(85), away: winnerOf(87) },

  // ── Quarterfinals (Matches 97–100) ─────────────────────────────────────────
  { matchNumber: 97,  stage: 'quarterfinal', home: winnerOf(89), away: winnerOf(90) },
  { matchNumber: 98,  stage: 'quarterfinal', home: winnerOf(93), away: winnerOf(94) },
  { matchNumber: 99,  stage: 'quarterfinal', home: winnerOf(91), away: winnerOf(92) },
  { matchNumber: 100, stage: 'quarterfinal', home: winnerOf(95), away: winnerOf(96) },

  // ── Semifinals (Matches 101–102) ───────────────────────────────────────────
  { matchNumber: 101, stage: 'semifinal', home: winnerOf(97), away: winnerOf(98) },
  { matchNumber: 102, stage: 'semifinal', home: winnerOf(99), away: winnerOf(100) },

  // ── Third place (Match 103) — no points awarded in our scoring system ─────
  { matchNumber: 103, stage: 'third_place', home: loserOf(101), away: loserOf(102) },

  // ── Final (Match 104) ──────────────────────────────────────────────────────
  { matchNumber: 104, stage: 'final', home: winnerOf(101), away: winnerOf(102) },
];

/** Points awarded for winning a match at each knockout stage — mirrors KNOCKOUT_PTS
 *  in netlify/functions/update-scores.mts. The third-place match awards nothing. */
export const KNOCKOUT_ROUND_POINTS: Record<KnockoutStage, number> = {
  round_of_32: 3,
  round_of_16: 5,
  quarterfinal: 7,
  semifinal: 10,
  third_place: 0,
  final: 14,
};

export const KNOCKOUT_STAGE_LABELS: Record<KnockoutStage, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarterfinal: 'Quarterfinal',
  semifinal: 'Semifinal',
  third_place: 'Third Place Match',
  final: 'Final',
};
