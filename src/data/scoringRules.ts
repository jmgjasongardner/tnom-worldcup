export const SCORING = {
  groupWin: 3,
  groupDraw: 1,
  groupLoss: 0,
  groupFirst: 4,
  groupSecond: 2,
  groupThirdAdvance: 1,
  groupThirdFail: 0,
  groupFourth: 0,
  roundOf32Win: 3,
  roundOf16Win: 5,
  quarterfinalWin: 7,
  semifinalWin: 10,
  finalWin: 14,
} as const;

export const MAX_POSSIBLE_POINTS = 52; // True max: 3 group wins (9) + group 1st bonus (4) + all knockouts (39)

export const SCORING_TABLE = [
  { event: 'Group-stage win', points: SCORING.groupWin },
  { event: 'Group-stage draw', points: SCORING.groupDraw },
  { event: 'Group-stage loss', points: SCORING.groupLoss },
  { event: 'Win group (1st place)', points: SCORING.groupFirst },
  { event: 'Finish 2nd in group', points: SCORING.groupSecond },
  { event: 'Finish 3rd and advance', points: SCORING.groupThirdAdvance },
  { event: 'Finish 3rd and fail to advance', points: SCORING.groupThirdFail },
  { event: 'Win Round of 32', points: SCORING.roundOf32Win },
  { event: 'Win Round of 16', points: SCORING.roundOf16Win },
  { event: 'Win Quarterfinal', points: SCORING.quarterfinalWin },
  { event: 'Win Semifinal', points: SCORING.semifinalWin },
  { event: 'Win Final / Win World Cup', points: SCORING.finalWin },
];

export const CHAMPION_EXAMPLE = {
  groupWins: 3,
  groupDraw: 0,
  groupPoints: 9,
  groupBonus: 4,
  knockoutPoints: 3 + 5 + 7 + 10 + 14,
  total: 52,
};
