/**
 * Deterministic colour helpers for genre tiles and heroes.
 */
const GENRE_HUES: Record<string, number> = {
  rock: 0, "alt-rock": 0, "hard-rock": 0, punk: 0, metal: 0, grunge: 0,
  pop: 320, "indie-pop": 320, "synth-pop": 320, "k-pop": 320, "j-pop": 320,
  "hip-hop": 24, hiphop: 24, trap: 24, reggaeton: 24, dance: 24, edm: 24,
  electronic: 278, electro: 278, house: 24, techno: 24, trance: 278,
  dubstep: 278, "drum-and-bass": 24, breakbeat: 24, hardstyle: 24,
  jazz: 210, blues: 210, "new-age": 200, ambient: 210, chill: 200, sleep: 210,
  classical: 0, opera: 20, piano: 210,
  country: 36, folk: 30, acoustic: 30, "singer-songwriter": 30, songwriter: 30,
  "r-n-b": 340, soul: 340, funk: 42, disco: 300, groove: 42,
  reggae: 160, dub: 170, ska: 60, "world-music": 150, afrobeat: 28,
  latin: 28, salsa: 28, brazil: 150, brazilian: 150, tango: 340,
  anime: 310, children: 60, comedy: 50, indian: 28, french: 320, german: 20,
  british: 20, spanish: 28, swedish: 200, turkish: 28, iranian: 28,
  "j-dance": 24, "j-idol": 310, "j-rock": 0, mandopop: 310, cantopop: 310,
  "chicago-house": 24, "detroit-techno": 24, "deep-house": 24,
  "progressive-house": 24, "minimal-techno": 24, "post-dubstep": 278,
  idm: 278, industrial: 270, goth: 270, "psych-rock": 270, "punk-rock": 0,
  "death-metal": 0, "black-metal": 0, "heavy-metal": 0, metalcore: 0,
  grindcore: 0, hardcore: 0, emo: 340, indie: 340, alternative: 262,
  bluegrass: 36, "honky-tonk": 36, honkytonk: 36, gospel: 50,
  "show-tunes": 320, soundtrack: 262, "pop-film": 320, party: 320,
  "work-out": 24, romance: 340, sad: 210, study: 200, "rainy-day": 210,
  "road-trip": 30, summer: 350, holidays: 350,
  "philippines-opm": 310, pagode: 150, forro: 28, sertanejo: 36, samba: 150,
  mpb: 150, malay: 310, club: 320, kids: 60, movies: 262,
};

function hashHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function colorFromSlug(slug: string): string {
  const normalized = slug.toLowerCase().trim();
  const hue = GENRE_HUES[normalized] ?? hashHue(normalized);
  return `hsl(${hue}, 62%, 38%)`;
}

export function genreGradient(slug: string): string {
  const normalized = slug.toLowerCase().trim();
  const hue = GENRE_HUES[normalized] ?? hashHue(normalized);
  return `linear-gradient(135deg, hsl(${hue}, 65%, 34%) 0%, hsl(${(hue + 40) % 360}, 60%, 18%) 100%)`;
}
