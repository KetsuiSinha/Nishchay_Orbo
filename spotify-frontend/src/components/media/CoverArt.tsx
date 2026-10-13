import { useMemo } from "react";
import { generateCoverDataURL } from "../../lib/generateCover";
import { cn } from "../../lib/utils";
import type { Track } from "../../types";

const SIZES: Record<string, number> = { xs: 40, sm: 48, md: 56, lg: 120, xl: 160, hero: 300 };

interface CoverArtProps {
  track: Pick<Track, "track_id" | "track_name" | "artwork_url" | "valence" | "energy" | "acousticness" | "danceability" | "instrumentalness">;
  size?: keyof typeof SIZES;
  rounded?: string;
  className?: string;
  /** Stretch to the parent's width (aspect-square) instead of a fixed pixel size. */
  fill?: boolean;
}

/** Cover with fallback chain: scraped URL → generated SVG → neutral tile. Never empty. */
export function CoverArt({ track, size = "sm", rounded = "rounded-sm", className, fill }: CoverArtProps) {
  const px = SIZES[size] ?? 48;

  const src = useMemo(() => {
    if (track.artwork_url) return track.artwork_url;
    return generateCoverDataURL({
      trackId: track.track_id,
      valence: track.valence,
      energy: track.energy,
      acousticness: track.acousticness,
      danceability: track.danceability,
      instrumentalness: track.instrumentalness,
      size: Math.max(px, 160),
    });
  }, [track.track_id, track.artwork_url, track.valence, track.energy, track.acousticness, track.danceability, track.instrumentalness, px]);

  return (
    <img
      src={src}
      alt={`${track.track_name} cover`}
      loading="lazy"
      width={fill ? undefined : px}
      height={fill ? undefined : px}
      style={fill ? undefined : { width: px, height: px }}
      className={cn(
        "shrink-0 bg-highlight object-cover",
        rounded,
        fill && "aspect-square h-auto w-full",
        className
      )}
    />
  );
}
