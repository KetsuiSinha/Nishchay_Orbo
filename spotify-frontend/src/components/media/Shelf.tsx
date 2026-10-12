import { cn } from "../../lib/utils";

interface ShelfProps {
  title: string;
  subtitle?: string;
  showAllLabel?: string;
  onShowAll?: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Horizontal scroll shelf with snap + peeking next card. */
export function Shelf({ title, subtitle, showAllLabel, onShowAll, children, className }: ShelfProps) {
  return (
    <section className={cn("space-y-1", className)}>
      <div className="flex items-end justify-between px-4 md:px-6">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-primary md:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>}
        </div>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="shrink-0 text-xs font-bold uppercase tracking-label text-secondary transition-colors hover:text-primary"
          >
            {showAllLabel ?? "Show all"}
          </button>
        )}
      </div>
      <div className="no-scrollbar snap-shelf -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {children}
      </div>
    </section>
  );
}
