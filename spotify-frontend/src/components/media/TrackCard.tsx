import { Play } from "lucide-react";
import { cn, formatArtists } from "../../lib/utils";
import { usePlayer } from "../../state/player";
import type { Track } from "../../types";
import { CoverArt } from "./CoverArt";

interface TrackCardProps {
  track: Track;
  onNavigate?: (trackId: string) => void;
}

/** Grid/carousel unit: art 160–200 + title + artist, hover reveals play. */
export function TrackCard({ track, onNavigate }: TrackCardProps) {
  const play = usePlayer((s) => s.play);

  return (
    <article
      className="group w-full cursor-pointer rounded bg-elevated p-3 transition-colors duration-micro hover:bg-highlight"
      onClick={() => {
        play(track);
        onNavigate?.(track.track_id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && (play(track), onNavigate?.(track.track_id))}
    >
      <div className="relative mb-3">
        <CoverArt track={track} size="xl" rounded="rounded" fill />
        <button
          aria-label={`Play ${track.track_name}`}
          onClick={(e) => {
            e.stopPropagation();
            play(track);
          }}
          className={cn(
            "absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full",
            "bg-green text-[#121212] shadow-sheet",
            "translate-y-2 opacity-0 transition-all duration-ui ease-standard",
            "hover:scale-[1.04] group-hover:translate-y-0 group-hover:opacity-100",
            "focus-visible:translate-y-0 focus-visible:opacity-100"
          )}
        >
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden />
        </button>
      </div>
      <p className="truncate font-medium text-primary" title={track.track_name}>
        {track.track_name}
      </p>
      <p className="truncate text-sm text-secondary">{formatArtists(track.artists)}</p>
    </article>
  );
}
