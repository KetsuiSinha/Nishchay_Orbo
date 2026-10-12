import { create } from "zustand";
import type { Track } from "../types";

interface PlayerState {
  current: Track | null;
  isPlaying: boolean;
  play: (t: Track) => void;
  toggle: () => void;
  stop: () => void;
}

export const usePlayer = create<PlayerState>((set) => ({
  current: null,
  isPlaying: false,
  play: (t) => set({ current: t, isPlaying: true }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  stop: () => set({ isPlaying: false }),
}));
