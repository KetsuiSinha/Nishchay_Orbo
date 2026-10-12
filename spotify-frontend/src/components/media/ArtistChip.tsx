import { cn, primaryArtist } from "../../lib/utils";

interface ArtistChipProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  onClick?: () => void;
}

/** Circular 96px artist image with generated gradient fallback. */
export function ArtistChip({ name, imageUrl, size = 96, onClick }: ArtistChipProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-24 shrink-0 flex-col items-center gap-2 focus-visible:outline-none"
      aria-label={name}
    >
      <span
        className="block overflow-hidden rounded-full transition-transform duration-ui group-hover:scale-[1.03]"
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            width={size}
            height={size}
            className="h-full w-full bg-highlight object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold text-white"
            style={{ background: artistGradient(name) }}
          >
            {initials(name)}
          </span>
        )}
      </span>
      <span className="line-clamp-2 w-full text-center text-sm text-secondary group-hover:text-primary">
        {name}
      </span>
    </button>
  );
}

export function artistGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue},45%,38%), hsl(${(hue + 60) % 360},45%,22%))`;
}

function initials(name: string): string {
  return primaryArtist(name)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Small circular avatar used inside Wrapped slides. */
export function ArtistAvatar({
  name,
  imageUrl,
  size = 140,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  return (
    <span
      className="block overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      aria-label={name}
      role="img"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span
          className={cn("flex h-full w-full items-center justify-center font-display font-extrabold text-white")}
          style={{ background: artistGradient(name), fontSize: size * 0.34 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
