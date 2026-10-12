import { genreGradient } from "../../lib/colorFromSlug";
import { cn, primaryArtist } from "../../lib/utils";
import type { Track } from "../../types";

interface GenreTileProps {
  genre: string;
  count?: number;
  hotCount?: number;
  tracks?: Track[];
  onClick: () => void;
  className?: string;
}

/** Flat colour card with a rotated cover thumbnail cropped bottom-right. */
export function GenreTile({ genre, count, hotCount, tracks = [], onClick, className }: GenreTileProps) {
  const thumb = tracks[0];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-[16/11] w-full overflow-hidden rounded text-left",
        "transition-transform duration-micro ease-standard hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className
      )}
      style={{ background: genreGradient(genre) }}
      aria-label={`Browse ${genre}`}
    >
      {thumb && (
        <img
          src={thumb.artwork_url ?? ""}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute -bottom-3 -right-3 h-[62%] w-[62%] rotate-[25deg] rounded-sm object-cover shadow-sheet transition-transform duration-ui group-hover:scale-105"
        />
      )}
      <span className="absolute left-3 top-3 z-10 pr-16 font-display text-lg font-extrabold capitalize leading-tight tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
        {genre.replace(/-/g, " ")}
      </span>
      {hotCount !== undefined && hotCount > 0 ? (
        <span
          className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 text-[11px] font-bold text-white/85"
          title={`${hotCount} tracks with popularity ≥ 80`}
        >
          <span aria-hidden>★</span>
          {hotCount}
        </span>
      ) : count !== undefined && count > 0 ? (
        <span className="absolute bottom-2.5 left-3 z-10 text-[11px] font-semibold text-white/70">
          {count.toLocaleString()} tracks
        </span>
      ) : null}
      {thumb && <span className="sr-only">Featuring {primaryArtist(thumb.artists)}</span>}
    </button>
  );
}
