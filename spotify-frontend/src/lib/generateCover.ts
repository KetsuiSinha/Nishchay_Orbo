/**
 * Deterministic SVG cover art seeded by track_id, shaped by audio features.
 * Used as the universal fallback so no surface ever shows an empty box.
 */

interface CoverOptions {
  trackId: string;
  valence?: number | null;
  energy?: number | null;
  acousticness?: number | null;
  danceability?: number | null;
  instrumentalness?: number | null;
  size?: number;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const cache = new Map<string, string>();

export function generateCoverDataURL(options: CoverOptions): string {
  const key = `${options.trackId}|${options.valence}|${options.energy}|${options.acousticness}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const valence = options.valence ?? 0.5;
  const energy = options.energy ?? 0.5;
  const acousticness = options.acousticness ?? 0.5;
  const danceability = options.danceability ?? 0.5;
  const instrumentalness = options.instrumentalness ?? 0.5;
  const size = options.size ?? 300;

  const rand = seededRandom(hashString(options.trackId));
  const baseHue = Math.round(280 - valence * 280);
  const sat = 48 + energy * 30;
  const light = 22 + energy * 20;
  const organic = acousticness > 0.5;
  const density = 3 + Math.floor(danceability * 4);

  let shapes = "";
  for (let i = 0; i < density; i++) {
    const angle = (i / density) * Math.PI * 2 + rand() * 0.6;
    const radius = size * 0.42 * (0.15 + rand() * 0.55);
    const cx = size / 2 + Math.cos(angle) * radius;
    const cy = size / 2 + Math.sin(angle) * radius;
    const r = size * (0.09 + rand() * 0.2);
    const h = (baseHue + rand() * 60 - 30 + 360) % 360;
    const op = (0.28 + rand() * 0.45).toFixed(2);
    const fill = `hsl(${h.toFixed(0)}, ${(45 + rand() * 30).toFixed(0)}%, ${(30 + rand() * 28).toFixed(0)}%)`;

    if (organic) {
      const pts: string[] = [];
      const n = 8;
      for (let p = 0; p < n; p++) {
        const a = (p / n) * Math.PI * 2;
        const rr = r * (0.7 + rand() * 0.5);
        pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
      }
      shapes += `<polygon points="${pts.join(" ")}" fill="${fill}" opacity="${op}"/>`;
    } else if (instrumentalness > 0.5) {
      shapes += `<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" fill="${fill}" opacity="${op}" transform="rotate(${(rand() * 90).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    } else {
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${op}"/>`;
    }
  }

  const id = hashString(options.trackId).toString(36);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${(baseHue + 30) % 360},${sat.toFixed(0)}%,${light.toFixed(0)}%)"/><stop offset="1" stop-color="hsl(${(baseHue + 340) % 360},${sat.toFixed(0)}%,${Math.max(12, light - 12).toFixed(0)}%)"/></linearGradient><radialGradient id="v${id}" cx="0.5" cy="0.42" r="0.75"><stop offset="0.55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,0.42)"/></radialGradient></defs><rect width="${size}" height="${size}" fill="url(#g${id})"/>${shapes}<rect width="${size}" height="${size}" fill="url(#v${id})"/></svg>`;

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}
