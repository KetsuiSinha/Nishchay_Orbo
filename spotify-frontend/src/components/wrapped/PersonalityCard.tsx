import { cn } from "../../lib/utils";
import type { Personality } from "../../types";
import { Sticker } from "./Sticker";

interface PersonalityCardProps {
  personality: Personality;
  textClassName?: string;
}

/** Wrapped "Listening Character": archetype name, traits, one-liner. */
export function PersonalityCard({ personality, textClassName }: PersonalityCardProps) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* Geometric illustration in the archetype's colour */}
      <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden>
        <circle cx="75" cy="75" r="62" fill={personality.color} opacity="0.25" />
        <circle cx="75" cy="75" r="42" fill={personality.color} opacity="0.45" />
        {personality.id === "daydreamer" && <ellipse cx="75" cy="75" rx="52" ry="30" fill={personality.color} />}
        {personality.id === "hype-machine" && (
          <polygon points="75,18 105,75 75,132 45,75" fill={personality.color} />
        )}
        {personality.id === "optimist" && (
          <g stroke={personality.color} strokeWidth="7" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1={75 + Math.cos((a * Math.PI) / 180) * 50}
                y1={75 + Math.sin((a * Math.PI) / 180) * 50}
                x2={75 + Math.cos((a * Math.PI) / 180) * 66}
                y2={75 + Math.sin((a * Math.PI) / 180) * 66}
              />
            ))}
          </g>
        )}
        {personality.id === "deep-diver" && <rect x="47" y="47" width="56" height="56" rx="12" fill={personality.color} transform="rotate(45 75 75)" />}
        {personality.id === "rhythm-seeker" && (
          <path d="M30 75 Q52 45 75 75 T120 75" stroke={personality.color} strokeWidth="10" fill="none" strokeLinecap="round" />
        )}
        {personality.id === "explorer" && (
          <g stroke={personality.color} strokeWidth="9" strokeLinecap="round">
            <line x1="45" y1="45" x2="105" y2="105" />
            <line x1="105" y1="45" x2="45" y2="105" />
          </g>
        )}
      </svg>

      <Sticker text="Listening character" rotation={-4} style={{ backgroundColor: personality.color, color: "#121212" }} />

      <h2 className={cn("font-display text-4xl font-extrabold tracking-tight", textClassName)}>
        {personality.name}
      </h2>
      <p className={cn("max-w-[28ch] text-base", textClassName ?? "opacity-80")}>
        {personality.description}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {personality.traits.map((trait) => (
          <span
            key={trait}
            className={cn(
              "rounded-pill border border-current px-3 py-1 text-xs font-bold uppercase tracking-label",
              textClassName
            )}
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  );
}
