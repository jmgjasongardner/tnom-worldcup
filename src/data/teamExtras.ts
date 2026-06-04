/**
 * Static FIFA rankings (April 2026) and DraftKings betting odds.
 * These are merged into team data at runtime so the UI shows real values
 * even when falling back from Supabase to static data.
 *
 * Source: FIFA/Coca-Cola World Ranking (April 2026), DraftKings via ESPN (April 2026)
 */
export interface TeamExtras {
  fifaRank?: number;
  titleOdds?: string;
  groupWinOdds?: string;
}

export const TEAM_EXTRAS: Record<string, TeamExtras> = {
  'france':                  { fifaRank: 1,  titleOdds: '+600',   groupWinOdds: '-180' },
  'spain':                   { fifaRank: 2,  titleOdds: '+450',   groupWinOdds: '-200' },
  'argentina':               { fifaRank: 3,  titleOdds: '+850',   groupWinOdds: '-160' },
  'england':                 { fifaRank: 4,  titleOdds: '+600',   groupWinOdds: '-220' },
  'portugal':                { fifaRank: 5,  titleOdds: '+1100',  groupWinOdds: '-150' },
  'brazil':                  { fifaRank: 6,  titleOdds: '+850',   groupWinOdds: '-175' },
  'netherlands':             { fifaRank: 7,  titleOdds: '+2000',  groupWinOdds: '-140' },
  'germany':                 { fifaRank: 8,  titleOdds: '+1400',  groupWinOdds: '-170' },
  'colombia':                { fifaRank: 9,  titleOdds: '+4000',  groupWinOdds: '-120' },
  'belgium':                 { fifaRank: 11, titleOdds: '+3500',  groupWinOdds: '-130' },
  'croatia':                 { fifaRank: 12, titleOdds: '+9000',  groupWinOdds: '+300' },
  'morocco':                 { fifaRank: 13, titleOdds: '+6000',  groupWinOdds: '+180' },
  'switzerland':             { fifaRank: 14, titleOdds: '+10000', groupWinOdds: '+200' },
  'united-states':           { fifaRank: 15, titleOdds: '+6500',  groupWinOdds: '+120' },
  'mexico':                  { fifaRank: 16, titleOdds: '+7000',  groupWinOdds: '-110' },
  'japan':                   { fifaRank: 17, titleOdds: '+5000',  groupWinOdds: '+160' },
  'senegal':                 { fifaRank: 18, titleOdds: '+12000', groupWinOdds: '+280' },
  'austria':                 { fifaRank: 19, titleOdds: '+12000', groupWinOdds: '+350' },
  'uruguay':                 { fifaRank: 20, titleOdds: '+6500',  groupWinOdds: '+150' },
  'turkey':                  { fifaRank: 21, titleOdds: '+6500',  groupWinOdds: '+200' },
  'sweden':                  { fifaRank: 22, titleOdds: '+8000',  groupWinOdds: '+400' },
  'ecuador':                 { fifaRank: 23, titleOdds: '+8000',  groupWinOdds: '+220' },
  'norway':                  { fifaRank: 24, titleOdds: '+2800',  groupWinOdds: '-150' },
  'south-korea':             { fifaRank: 25, titleOdds: '+15000', groupWinOdds: '+350' },
  'egypt':                   { fifaRank: 26, titleOdds: '+15000', groupWinOdds: '-110' },
  'canada':                  { fifaRank: 27, titleOdds: '+15000', groupWinOdds: '+180' },
  'algeria':                 { fifaRank: 28, titleOdds: '+25000', groupWinOdds: '+450' },
  'czechia':                 { fifaRank: 29, titleOdds: '+20000', groupWinOdds: '+400' },
  'cote-divoire':            { fifaRank: 30, titleOdds: '+20000', groupWinOdds: '+300' },
  'ghana':                   { fifaRank: 31, titleOdds: '+25000', groupWinOdds: '+500' },
  'paraguay':                { fifaRank: 32, titleOdds: '+20000', groupWinOdds: '+300' },
  'iran':                    { fifaRank: 33, titleOdds: '+30000', groupWinOdds: '+550' },
  'south-africa':            { fifaRank: 34, titleOdds: '+50000', groupWinOdds: '+800' },
  'australia':               { fifaRank: 35, titleOdds: '+30000', groupWinOdds: '+500' },
  'scotland':                { fifaRank: 36, titleOdds: '+30000', groupWinOdds: '+600' },
  'tunisia':                 { fifaRank: 37, titleOdds: '+40000', groupWinOdds: '+700' },
  'dr-congo':                { fifaRank: 38, titleOdds: '+40000', groupWinOdds: '+700' },
  'qatar':                   { fifaRank: 39, titleOdds: '+50000', groupWinOdds: '+1200' },
  'saudi-arabia':            { fifaRank: 40, titleOdds: '+50000', groupWinOdds: '+800' },
  'bosnia-and-herzegovina':  { fifaRank: 41, titleOdds: '+40000', groupWinOdds: '+600' },
  'uzbekistan':              { fifaRank: 42, titleOdds: '+75000', groupWinOdds: '+1200' },
  'new-zealand':             { fifaRank: 43, titleOdds: '+75000', groupWinOdds: '+900' },
  'panama':                  { fifaRank: 44, titleOdds: '+75000', groupWinOdds: '+1500' },
  'cabo-verde':              { fifaRank: 45, titleOdds: '+100000', groupWinOdds: '+2000' },
  'iraq':                    { fifaRank: 46, titleOdds: '+150000', groupWinOdds: '+2000' },
  'jordan':                  { fifaRank: 47, titleOdds: '+150000', groupWinOdds: '+2500' },
  'curacao':                 { fifaRank: 48, titleOdds: '+200000', groupWinOdds: '+5000' },
  'haiti':                   { fifaRank: 49, titleOdds: '+200000', groupWinOdds: '+5000' },
};
