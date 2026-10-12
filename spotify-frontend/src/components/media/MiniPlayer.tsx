import { Pause, Play } from "lucide-react";
import { formatArtists } from "../../lib/utils";
import { usePlayer } from "../../state/player";
import { CoverArt } from "./CoverArt";

/**
 * 56px bar docked above the tab bar. Per PRD §8.4 it only appears when the
 * current track actually has a preview_url — never a dead "0:00" player.
 */
export function MiniPlayer() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const stop = usePlayer((s) => s.stop);

  if (!current?.preview_url) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom,0px))] z-[200] md:bottom-0 md:pl-[72px]"
      role="region"
      aria-label="Mini player"
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 border-t border-white/5 bg-[#181818f2] px-3 backdrop-blur md:px-6">
        <CoverArt track={current} size="xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary">{current.track_name}</p>
          <p className="truncate text-xs text-secondary">{formatArtists(current.artists)}</p>
        </div>
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#121212] transition-transform hover:scale-[1.04]"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" aria-hidden />
          ) : (
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden />
          )}
        </button>
        <button
          onClick={stop}
          aria-label="Close player"
          className="shrink-0 rounded-full p-2 text-secondary transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
