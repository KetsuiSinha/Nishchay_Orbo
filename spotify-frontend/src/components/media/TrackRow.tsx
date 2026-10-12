import { MoreHorizontal } from "lucide-react";
import { cn, formatDuration, formatArtists, matchTierLabel } from "../../lib/utils";
import { usePlayer } from "../../state/player";
import { useSeeds } from "../../state/seeds";
import type { Track, TrackWithMatch } from "../../types";
import { CoverArt } from "./CoverArt";

interface TrackRowProps {
  track: Track | TrackWithMatch;
  rank?: number;
  onNavigate?: (trackId: string) => void;
  showTier?: boolean;
}

/** The primary list unit: rank · art 48 · title + explicit · artist · tier · duration */
export function TrackRow({ track, rank, onNavigate, showTier = true }: TrackRowProps) {
  const play = usePlayer((s) => s.play);
  const current = usePlayer((s) => s.current);
  const isPlaying = current?.track_id === track.track_id;
  const isSaved = useSeeds((s) => s.saved.some((t) => t.track_id === track.track_id));
  const tier = "match_tier" in track ? (track as TrackWithMatch).match_tier : null;

  return (
    <div
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onNavigate?.(track.track_id);
      }}
      onClick={() => {
        play(track);
        onNavigate?.(track.track_id);
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded px-2 py-2",
        "transition-colors duration-micro hover:bg-highlight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      )}
      title={track.track_name}
    >
      {rank !== undefined && (
        <span className="tabular w-6 shrink-0 text-center text-sm text-secondary" aria-hidden>
          {rank}
        </span>
      )}

      <div className="relative shrink-0">
        <CoverArt track={track} size="sm" />
        <span
          className={cn(
            "absolute inset-0 flex items-end justify-center gap-[3px] bg-black/50 pb-2.5",
            isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("w-[3px] rounded-sm bg-green", isPlaying ? "animate-eq-bar" : "")}
              style={{ height: 12, animationDelay: `${i * 140}ms`, transformOrigin: "bottom" }}
            />
          ))}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("truncate text-[15px] font-medium", isPlaying ? "text-green" : "text-primary")}>
            {track.track_name}
          </p>
          {track.explicit && (
            <span className="shrink-0 rounded-sm bg-white/25 px-1 text-[9px] font-bold text-secondary" aria-label="Explicit">
              E
            </span>
          )}
        </div>
        <p className="truncate text-sm text-secondary">{formatArtists(track.artists)}</p>
      </div>

      {showTier && tier && (
        <span
          className={cn(
            "hidden shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold sm:block",
            tier === "perfect"
              ? "bg-lime/20 text-lime"
              : tier === "great"
                ? "bg-green/20 text-green-bright"
                : "bg-white/10 text-secondary"
          )}
        >
          {matchTierLabel(tier)}
        </span>
      )}

      <span className="tabular hidden shrink-0 text-sm text-secondary sm:block">
        {formatDuration(track.duration_ms)}
      </span>

      <button
        aria-label={isSaved ? "Saved" : "More"}
        onClick={(e) => {
          e.stopPropagation();
          useSeeds.getState().toggleSaved(track);
        }}
        className="shrink-0 rounded-full p-1.5 text-secondary opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
      >
        {isSaved ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-green)">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 10.54L12 21.35z" />
          </svg>
        ) : (
          <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
        )}
      </button>
    </div>
  );
}
