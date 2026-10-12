import { cn } from "../../lib/utils";

interface StickerProps {
  text: string;
  rotation?: number;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

/** Rotated pill with bold text, pops in with overshoot. */
export function Sticker({ text, rotation = -6, className, delay = 0, style }: StickerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-sticker-pop rounded-pill px-4 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide",
        className
      )}
      style={
        {
          ...style,
          transform: `rotate(${rotation}deg)`,
          animationDelay: `${delay}ms`,
          "--rot": `${rotation}deg`,
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );
}
