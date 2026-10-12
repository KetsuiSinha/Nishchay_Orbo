import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SeedGenre, SeedTrack, Track } from "../types";

interface SeedsState {
  genres: SeedGenre[];
  tracks: SeedTrack[];
  saved: Track[];
  onboarded: boolean;
  addGenre: (g: SeedGenre) => void;
  removeGenre: (g: string) => void;
  toggleTrack: (t: SeedTrack) => void;
  toggleSaved: (t: Track) => void;
  clearSeeds: () => void;
  setOnboarded: (v: boolean) => void;
  isSeed: (trackId: string) => boolean;
  isSaved: (trackId: string) => boolean;
}

export const useSeeds = create<SeedsState>()(
  persist(
    (set, get) => ({
      genres: [],
      tracks: [],
      saved: [],
      onboarded: false,

      addGenre: (g) =>
        set((s) =>
          s.genres.length >= 10 || s.genres.some((x) => x.genre === g.genre)
            ? s
            : { genres: [...s.genres, g] }
        ),
      removeGenre: (g) => set((s) => ({ genres: s.genres.filter((x) => x.genre !== g) })),
      toggleTrack: (t) =>
        set((s) =>
          s.tracks.some((x) => x.track_id === t.track_id)
            ? { tracks: s.tracks.filter((x) => x.track_id !== t.track_id) }
            : s.tracks.length >= 10
              ? s
              : { tracks: [...s.tracks, t] }
        ),
      toggleSaved: (t) =>
        set((s) =>
          s.saved.some((x) => x.track_id === t.track_id)
            ? { saved: s.saved.filter((x) => x.track_id !== t.track_id) }
            : { saved: [t, ...s.saved].slice(0, 100) }
        ),
      clearSeeds: () => set({ genres: [], tracks: [] }),
      setOnboarded: (v) => set({ onboarded: v }),
      isSeed: (id) => get().tracks.some((t) => t.track_id === id),
      isSaved: (id) => get().saved.some((t) => t.track_id === id),
    }),
    { name: "wrapped-seeds-v2", version: 2 }
  )
);
