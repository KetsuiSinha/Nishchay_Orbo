import { motion } from "framer-motion";
import { formatArtists } from "../../lib/utils";
import { CoverArt } from "../media/CoverArt";
import type { Track } from "../../types";

interface RankedListProps {
  items: Array<{ rank: number; title: string; subtitle?: string; imageUrl?: string | null; track?: Track }>;
  textClassName?: string;
}

/** Large numerals 1–5, title + artist, small art; staggered reveal. */
export function RankedList({ items, textClassName }: RankedListProps) {
  return (
    <ol className="mx-auto w-full max-w-md space-y-2.5" role="list">
      {items.slice(0, 5).map((item, i) => (
        <motion.li
          key={item.rank}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="flex items-center gap-3"
        >
          <span
            className={`tabular w-8 shrink-0 text-right font-display text-2xl font-extrabold ${textClassName ?? "opacity-80"}`}
            aria-hidden
          >
            {item.rank}
          </span>
          {item.track ? (
            <CoverArt track={item.track} size="xs" />
          ) : (
            <span className="h-10 w-10 shrink-0 rounded-sm bg-black/15" aria-hidden />
          )}
          <span className="min-w-0 flex-1 text-left">
            <span className={`block truncate font-display text-lg font-bold leading-tight ${textClassName ?? ""}`}>
              {item.title}
            </span>
            {item.subtitle && (
              <span className={`block truncate text-sm ${textClassName ?? "opacity-70"}`}>
                {formatArtists(item.subtitle)}
              </span>
            )}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
