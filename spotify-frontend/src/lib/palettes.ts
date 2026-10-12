import type { Palette, PaletteName } from "../types";

export const PALETTES: Record<PaletteName, Palette> = {
  "electric-purple": { bg: "#5038A0", text: "#F573A0", accent: "#FFFFFF", name: "electric-purple" },
  lime: { bg: "#CDF564", text: "#121212", accent: "#1E3264", name: "lime" },
  "hot-pink": { bg: "#F573A0", text: "#450A1E", accent: "#FFFFFF", name: "hot-pink" },
  cobalt: { bg: "#1E3264", text: "#CDF564", accent: "#F573A0", name: "cobalt" },
  tangerine: { bg: "#FF6437", text: "#121212", accent: "#FFFFFF", name: "tangerine" },
  mint: { bg: "#1ED760", text: "#121212", accent: "#FFFFFF", name: "mint" },
  black: { bg: "#121212", text: "#FFFFFF", accent: "#CDF564", name: "black" },
};

export const PALETTE_ORDER: PaletteName[] = [
  "electric-purple",
  "lime",
  "hot-pink",
  "cobalt",
  "tangerine",
  "black",
  "mint",
  "hot-pink",
  "cobalt",
  "lime",
  "electric-purple",
];

export function paletteFor(index: number): Palette {
  return PALETTES[PALETTE_ORDER[index % PALETTE_ORDER.length]];
}
