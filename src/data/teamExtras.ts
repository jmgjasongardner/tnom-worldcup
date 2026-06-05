/**
 * Static FIFA rankings (April 2026) and DraftKings betting odds.
 * These are merged into team data at runtime so the UI shows real values
 * even when falling back from Supabase to static data.
 *
 * Source: FIFA/Coca-Cola World Ranking (April 2026)
 * Odds: ESPN/DraftKings (June 2026) — groupWinOdds = win group, advanceOdds = qualify from group stage
 */
export interface TeamExtras {
  fifaRank?: number;
  titleOdds?: string;
  groupWinOdds?: string;
  advanceOdds?: string;
}

export const TEAM_EXTRAS: Record<string, TeamExtras> = {
  // ── Group H ─────────────────────────────────────────────────────────────
  'spain':                   { fifaRank: 2,  titleOdds: '+450',    groupWinOdds: '-500',   advanceOdds: '-10000' },
  // ── Group I ─────────────────────────────────────────────────────────────
  'france':                  { fifaRank: 1,  titleOdds: '+600',    groupWinOdds: '-235',   advanceOdds: '-5000'  },
  // ── Group L ─────────────────────────────────────────────────────────────
  'england':                 { fifaRank: 4,  titleOdds: '+600',    groupWinOdds: '-340',   advanceOdds: '-10000' },
  // ── Group C ─────────────────────────────────────────────────────────────
  'brazil':                  { fifaRank: 6,  titleOdds: '+850',    groupWinOdds: '-475',   advanceOdds: '-10000' },
  // ── Group J ─────────────────────────────────────────────────────────────
  'argentina':               { fifaRank: 3,  titleOdds: '+850',    groupWinOdds: '-340',   advanceOdds: '-10000' },
  // ── Group K ─────────────────────────────────────────────────────────────
  'portugal':                { fifaRank: 5,  titleOdds: '+1100',   groupWinOdds: '-230',   advanceOdds: '-5000'  },
  // ── Group E ─────────────────────────────────────────────────────────────
  'germany':                 { fifaRank: 8,  titleOdds: '+1400',   groupWinOdds: '-340',   advanceOdds: '-10000' },
  // ── Group F ─────────────────────────────────────────────────────────────
  'netherlands':             { fifaRank: 7,  titleOdds: '+2000',   groupWinOdds: '-125',   advanceOdds: '-1400'  },
  // ── Group I ─────────────────────────────────────────────────────────────
  'norway':                  { fifaRank: 24, titleOdds: '+2800',   groupWinOdds: '+280',   advanceOdds: '-575'   },
  // ── Group G ─────────────────────────────────────────────────────────────
  'belgium':                 { fifaRank: 11, titleOdds: '+3500',   groupWinOdds: '-250',   advanceOdds: '-2000'  },
  // ── Group K ─────────────────────────────────────────────────────────────
  'colombia':                { fifaRank: 9,  titleOdds: '+4000',   groupWinOdds: '+240',   advanceOdds: '-800'   },
  // ── Group F ─────────────────────────────────────────────────────────────
  'japan':                   { fifaRank: 17, titleOdds: '+5000',   groupWinOdds: '+300',   advanceOdds: '-340'   },
  // ── Group C ─────────────────────────────────────────────────────────────
  'morocco':                 { fifaRank: 13, titleOdds: '+6000',   groupWinOdds: '+450',   advanceOdds: '-1000'  },
  // ── Group D ─────────────────────────────────────────────────────────────
  'united-states':           { fifaRank: 15, titleOdds: '+6500',   groupWinOdds: '+140',   advanceOdds: '-575'   },
  'turkey':                  { fifaRank: 21, titleOdds: '+6500',   groupWinOdds: '+180',   advanceOdds: '-500'   },
  // ── Group H ─────────────────────────────────────────────────────────────
  'uruguay':                 { fifaRank: 20, titleOdds: '+6500',   groupWinOdds: '+400',   advanceOdds: '-800'   },
  // ── Group A ─────────────────────────────────────────────────────────────
  'mexico':                  { fifaRank: 16, titleOdds: '+7000',   groupWinOdds: '+110',   advanceOdds: '-750'   },
  // ── Group E ─────────────────────────────────────────────────────────────
  'ecuador':                 { fifaRank: 23, titleOdds: '+8000',   groupWinOdds: '+400',   advanceOdds: '-900'   },
  // ── Group F ─────────────────────────────────────────────────────────────
  'sweden':                  { fifaRank: 22, titleOdds: '+8000',   groupWinOdds: '+400',   advanceOdds: '-250'   },
  // ── Group L ─────────────────────────────────────────────────────────────
  'croatia':                 { fifaRank: 12, titleOdds: '+9000',   groupWinOdds: '+400',   advanceOdds: '-475'   },
  // ── Group B ─────────────────────────────────────────────────────────────
  'switzerland':             { fifaRank: 14, titleOdds: '+10000',  groupWinOdds: '-105',   advanceOdds: '-1800'  },
  // ── Group J ─────────────────────────────────────────────────────────────
  'austria':                 { fifaRank: 19, titleOdds: '+10000',  groupWinOdds: '+450',   advanceOdds: '-340'   },
  // ── Group I ─────────────────────────────────────────────────────────────
  'senegal':                 { fifaRank: 18, titleOdds: '+10000',  groupWinOdds: '+850',   advanceOdds: '-200'   },
  // ── Group A ─────────────────────────────────────────────────────────────
  'czechia':                 { fifaRank: 29, titleOdds: '+15000',  groupWinOdds: '+240',   advanceOdds: '-475'   },
  'south-korea':             { fifaRank: 25, titleOdds: '+15000',  groupWinOdds: '+300',   advanceOdds: '-330'   },
  // ── Group B ─────────────────────────────────────────────────────────────
  'canada':                  { fifaRank: 27, titleOdds: '+20000',  groupWinOdds: '+260',   advanceOdds: '-500'   },
  'bosnia-and-herzegovina':  { fifaRank: 41, titleOdds: '+25000',  groupWinOdds: '+260',   advanceOdds: '-475'   },
  // ── Group E ─────────────────────────────────────────────────────────────
  'cote-divoire':            { fifaRank: 30, titleOdds: '+25000',  groupWinOdds: '+700',   advanceOdds: '-370'   },
  // ── Group J ─────────────────────────────────────────────────────────────
  'algeria':                 { fifaRank: 28, titleOdds: '+35000',  groupWinOdds: '+650',   advanceOdds: '-250'   },
  // ── Group D ─────────────────────────────────────────────────────────────
  'paraguay':                { fifaRank: 32, titleOdds: '+20000',  groupWinOdds: '+425',   advanceOdds: '-185'   },
  // ── Group G ─────────────────────────────────────────────────────────────
  'egypt':                   { fifaRank: 26, titleOdds: '+30000',  groupWinOdds: '+450',   advanceOdds: '-310'   },
  'iran':                    { fifaRank: 33, titleOdds: '+30000',  groupWinOdds: '+600',   advanceOdds: '-230'   },
  // ── Group C ─────────────────────────────────────────────────────────────
  'scotland':                { fifaRank: 36, titleOdds: '+20000',  groupWinOdds: '+900',   advanceOdds: '-230'   },
  // ── Group A ─────────────────────────────────────────────────────────────
  'south-africa':            { fifaRank: 34, titleOdds: '+80000',  groupWinOdds: '+1200',  advanceOdds: '+150'   },
  // ── Group D ─────────────────────────────────────────────────────────────
  'australia':               { fifaRank: 35, titleOdds: '+45000',  groupWinOdds: '+700',   advanceOdds: 'Even'   },
  // ── Group F ─────────────────────────────────────────────────────────────
  'tunisia':                 { fifaRank: 37, titleOdds: '+50000',  groupWinOdds: '+800',   advanceOdds: '+120'   },
  // ── Group K ─────────────────────────────────────────────────────────────
  'dr-congo':                { fifaRank: 38, titleOdds: '+70000',  groupWinOdds: '+800',   advanceOdds: '-155'   },
  // ── Group A ─────────────────────────────────────────────────────────────ño
  // ── Group L ─────────────────────────────────────────────────────────────
  'ghana':                   { fifaRank: 31, titleOdds: '+35000',  groupWinOdds: '+1000',  advanceOdds: '-155'   },
  // ── Group H ─────────────────────────────────────────────────────────────
  'saudi-arabia':            { fifaRank: 40, titleOdds: '+100000', groupWinOdds: '+1600',  advanceOdds: '+120'   },
  'cabo-verde':              { fifaRank: 45, titleOdds: '+100000', groupWinOdds: '+4000',  advanceOdds: '+225'   },
  // ── Group L ─────────────────────────────────────────────────────────────
  'panama':                  { fifaRank: 44, titleOdds: '+100000', groupWinOdds: '+2500',  advanceOdds: '+220'   },
  // ── Group B ─────────────────────────────────────────────────────────────
  'qatar':                   { fifaRank: 39, titleOdds: '+100000', groupWinOdds: '+2800',  advanceOdds: '+300'   },
  // ── Group G ─────────────────────────────────────────────────────────────
  'new-zealand':             { fifaRank: 43, titleOdds: '+100000', groupWinOdds: '+2000',  advanceOdds: '+175'   },
  // ── Group I ─────────────────────────────────────────────────────────────
  'iraq':                    { fifaRank: 46, titleOdds: '+100000', groupWinOdds: '+4000',  advanceOdds: '+350'   },
  // ── Group K ─────────────────────────────────────────────────────────────
  'uzbekistan':              { fifaRank: 42, titleOdds: '+150000', groupWinOdds: '+3500',  advanceOdds: '+190'   },
  // ── Group J ─────────────────────────────────────────────────────────────
  'jordan':                  { fifaRank: 47, titleOdds: '+150000', groupWinOdds: '+4000',  advanceOdds: '+275'   },
  // ── Group C ─────────────────────────────────────────────────────────────
  'haiti':                   { fifaRank: 49, titleOdds: '+150000', groupWinOdds: '+10000', advanceOdds: '+700'   },
  // ── Group E ─────────────────────────────────────────────────────────────
  'curacao':                 { fifaRank: 48, titleOdds: '+150000', groupWinOdds: '+13000', advanceOdds: '+800'   },
};
