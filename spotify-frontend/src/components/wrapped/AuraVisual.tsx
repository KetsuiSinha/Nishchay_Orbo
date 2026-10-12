import { motion } from "framer-motion";
import { FEATURE_LABELS } from "../../lib/utils";

interface FeatureBarsProps {
  features: Record<string, number>;
  baseline?: Record<string, number>;
  accent?: string;
  textClassName?: string;
  max?: number;
}

const ORDER = ["danceability", "energy", "valence", "acousticness", "instrumentalness", "liveness", "speechiness"];

/** Horizontal bars, 0–100, optional "typical listener" tick — real numbers, always readable. */
export function FeatureBars({ features, baseline, accent = "var(--accent-green)", textClassName, max = 7 }: FeatureBarsProps) {
  const entries = ORDER.slice(0, max)
    .map((k) => ({ key: k, value: features[k] ?? 0 }))
    .filter((e) => features[e.key] !== undefined);

  return (
    <div className="mx-auto w-full max-w-sm space-y-2.5" role="list" aria-label="Audio features">
      {entries.map(({ key, value }, i) => (
        <div key={key} role="listitem">
          <div className="mb-1 flex items-baseline justify-between">
            <span className={`text-xs font-semibold uppercase tracking-label ${textClassName ?? "text-secondary"}`}>
              {FEATURE_LABELS[key]}
            </span>
            <span className={`tabular text-xs font-bold ${textClassName ?? "text-primary"}`}>
              {Math.round(value * 100)}
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-pill bg-white/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(value * 100)}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.9, ease: [0.2, 0, 0, 1] }}
              className="h-full rounded-pill"
              style={{ backgroundColor: accent }}
            />
            {baseline?.[key] !== undefined && (
              <span
                className="absolute top-[-2px] h-[10px] w-[2px] bg-white/70"
                style={{ left: `${Math.round(baseline[key] * 100)}%` }}
                title={`Typical listener: ${Math.round(baseline[key] * 100)}`}
                aria-label={`Typical listener ${Math.round(baseline[key] * 100)}`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface AuraVisualProps {
  features: Record<string, number>;
  baseline?: Record<string, number>;
  className?: string;
}

/** Organic morphing blob driven by audio features + FeatureBars beneath. */
export function AuraVisual({ features, baseline, className }: AuraVisualProps) {
  const valence = features.valence ?? 0.5;
  const energy = features.energy ?? 0.5;
  const acousticness = features.acousticness ?? 0.5;

  // hue from valence, size from energy, softness from acousticness
  const hue = Math.round(280 - valence * 280);
  const scale = 0.75 + energy * 0.45;
  const blur = 18 + acousticness * 34;

  return (
    <div className={className ?? "flex flex-col items-center gap-6"}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 240, height: 240 }}
        aria-hidden
      >
        <div
          className="animate-blob-morph absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              hsl(${hue}, 85%, 60%) 0%,
              hsl(${(hue + 60) % 360}, 85%, 55%) 50%,
              hsl(${(hue + 140) % 360}, 80%, 45%) 100%)`,
            transform: `scale(${scale})`,
            filter: `blur(${blur}px)`,
            opacity: 0.9,
          }}
        />
        <div
          className="animate-blob-morph absolute inset-6"
          style={{
            background: `radial-gradient(circle at 35% 35%, hsla(${(hue + 30) % 360},95%,75%,0.85), transparent 65%)`,
            animationDelay: "-7s",
            transform: `scale(${scale * 0.9})`,
            filter: `blur(${blur * 0.6}px)`,
          }}
        />
      </div>
      {/* Text equivalent — never the visual alone */}
      <FeatureBars features={features} baseline={baseline} />
    </div>
  );
}
