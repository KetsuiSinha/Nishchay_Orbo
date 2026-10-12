import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMinutes(ms: number): string {
  if (!ms || ms <= 0) return "—";
  return `${Math.round(ms / 60000)} min`;
}

export function parseArtists(artists: string): string[] {
  return artists.split(";").map((a) => a.trim()).filter(Boolean);
}

export function formatArtists(artists: string, max = 2): string {
  const arr = parseArtists(artists);
  if (arr.length <= max) return arr.join(", ");
  return `${arr.slice(0, max).join(", ")} +${arr.length - max}`;
}

export function primaryArtist(artists: string): string {
  return parseArtists(artists)[0] ?? artists;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function matchTierLabel(tier: string): string {
  if (tier === "perfect") return "Perfect fit";
  if (tier === "great") return "Great fit";
  return "Good fit";
}

export const FEATURE_LABELS: Record<string, string> = {
  danceability: "Danceability",
  energy: "Energy",
  valence: "Mood",
  acousticness: "Acoustic",
  instrumentalness: "Instrumental",
  liveness: "Live",
  speechiness: "Speech",
  tempo: "Tempo",
  loudness: "Loudness",
};
