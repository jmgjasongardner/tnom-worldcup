/**
 * Maps team IDs to ISO 3166-1 alpha-2 country codes for flagcdn.com images.
 * Usage: `https://flagcdn.com/w40/${code}.png`
 */
export const FLAG_CODES: Record<string, string> = {
  'france': 'fr',
  'spain': 'es',
  'brazil': 'br',
  'england': 'gb-eng',
  'argentina': 'ar',
  'portugal': 'pt',
  'germany': 'de',
  'netherlands': 'nl',
  'belgium': 'be',
  'colombia': 'co',
  'norway': 'no',
  'morocco': 'ma',
  'switzerland': 'ch',
  'uruguay': 'uy',
  'japan': 'jp',
  'mexico': 'mx',
  'united-states': 'us',
  'canada': 'ca',
  'croatia': 'hr',
  'ecuador': 'ec',
  'austria': 'at',
  'turkey': 'tr',
  'cote-divoire': 'ci',
  'czechia': 'cz',
  'senegal': 'sn',
  'south-korea': 'kr',
  'sweden': 'se',
  'algeria': 'dz',
  'egypt': 'eg',
  'paraguay': 'py',
  'bosnia-and-herzegovina': 'ba',
  'ghana': 'gh',
  'iran': 'ir',
  'australia': 'au',
  'dr-congo': 'cd',
  'scotland': 'gb-sct',
  'tunisia': 'tn',
  'qatar': 'qa',
  'saudi-arabia': 'sa',
  'south-africa': 'za',
  'new-zealand': 'nz',
  'panama': 'pa',
  'uzbekistan': 'uz',
  'iraq': 'iq',
  'jordan': 'jo',
  'cabo-verde': 'cv',
  'curacao': 'cw',
  'haiti': 'ht',
};

export function getFlagUrl(teamId: string, width: 20 | 40 | 80 = 40): string | null {
  const code = FLAG_CODES[teamId];
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}
