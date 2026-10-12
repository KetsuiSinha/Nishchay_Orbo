import type { Track } from "../types";

export interface Archetype {
  id: string;
  name: string;
  description: string;
  traits: string[];
  color: string;
}

const ARCHETYPES: Archetype[] = [
  { id: "daydreamer", name: "The Daydreamer", description: "You drift through gentle, acoustic soundscapes.", traits: ["High acousticness", "Low energy", "Reflective"], color: "#5038A0" },
  { id: "hype-machine", name: "The Hype Machine", description: "You live for the drop. Maximum energy, zero chill.", traits: ["High energy", "High danceability", "Driving tempo"], color: "#FF6437" },
  { id: "optimist", name: "The Optimist", description: "Your soundtrack is sunshine and feel-good moments.", traits: ["High valence", "Positive", "Uplifting"], color: "#CDF564" },
  { id: "deep-diver", name: "The Deep Diver", description: "You go beneath the surface into instrumental worlds.", traits: ["High instrumentalness", "Exploratory", "Complex"], color: "#1E3264" },
  { id: "rhythm-seeker", name: "The Rhythm Seeker", description: "Groove is everything. Your body leads, your mind follows.", traits: ["High danceability", "Strong groove", "Rhythmic"], color: "#FF6437" },
  { id: "explorer", name: "The Explorer", description: "Genre boundaries don't exist for you. Always searching.", traits: ["Curious", "Eclectic", "Adventurous"], color: "#CDF564" },
];

/** Rule-based archetype from a mean audio-feature profile. */
export function detectPersonality(features: Record<string, number>): Archetype {
  const f = (k: string) => features[k] ?? 0;
  if (f("acousticness") > 0.5 && f("energy") < 0.5) return ARCHETYPES[0];
  if (f("energy") > 0.6 && f("danceability") > 0.6) return ARCHETYPES[1];
  if (f("valence") > 0.6) return ARCHETYPES[2];
  if (f("instrumentalness") > 0.4) return ARCHETYPES[3];
  if (f("danceability") > 0.6) return ARCHETYPES[4];
  return ARCHETYPES[5];
}

/** "Why this match" reasons shared between a recommendation and the seeds. */
export function matchReasons(rec: Track, seeds: Track[]): string[] {
  const reasons: string[] = [];
  if (!seeds.length) return reasons;
  const avg = (k: keyof Track) =>
    seeds.reduce((s, t) => s + (Number(t[k]) || 0), 0) / seeds.length;

  const recEnergy = Number(rec.energy) || 0;
  if (Math.abs(recEnergy - avg("energy")) < 0.15) reasons.push("Similar energy");
  const recVal = Number(rec.valence) || 0;
  if (Math.abs(recVal - avg("valence")) < 0.15) reasons.push("Similar mood");
  const recAcoustic = Number(rec.acousticness) || 0;
  if (Math.abs(recAcoustic - avg("acousticness")) < 0.15) reasons.push("Same acoustic space");
  return reasons;
}
