import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";
import { useSeeds } from "../state/seeds";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { Skeleton } from "../components/ui/Skeleton";
import { CoverArt } from "../components/media/CoverArt";
import { cn } from "../lib/utils";
import type { GenreCount, Track } from "../types";

const ROTATING = ["Reading your vibe…", "Digging through 114 genres…", "Finding your sound…", "Almost there…"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { genres, tracks, addGenre, removeGenre, toggleTrack, setOnboarded } = useSeeds();
  const [step, setStep] = useState(0);
  const [allGenres, setAllGenres] = useState<Array<GenreCount & { hot: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [rotIdx, setRotIdx] = useState(0);

  useEffect(() => {
    api.getGenres(true).then((r) => {
      const hot = new Map((r.hot_counts ?? []).map((c) => [c.name, c.count]));
      const counts = (r.counts ?? r.genres.map((g) => ({ name: g, count: 0 }))).map((c) => ({
        ...c,
        hot: hot.get(c.name) ?? 0,
      }));
      setAllGenres(counts.sort((a, b) => b.hot - a.hot));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setRotIdx((i) => (i + 1) % ROTATING.length), 1400);
    return () => clearInterval(t);
  }, [generating]);

  useEffect(() => {
    if (step !== 2 || search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchTracks(search, 12).then((r) => setResults(r.tracks));
    }, 300);
    return () => clearTimeout(t);
  }, [search, step]);

  const canFinish = genres.length >= 3 && tracks.length >= 1;

  const finish = () => {
    setGenerating(true);
    setOnboarded(true);
    setTimeout(() => navigate("/wrapped"), 2600);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col px-4 pb-10 pt-8 md:pt-14">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn("h-1 flex-1 rounded-pill transition-colors", i <= step ? "bg-white" : "bg-white/20")}
            />
          ))}
        </div>

        {generating ? (
          <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-lime"
            >
              <Sparkles className="h-9 w-9 text-[#121212]" aria-hidden />
            </motion.div>
            <motion.h1 key={rotIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-extrabold">
              {ROTATING[rotIdx]}
            </motion.h1>
          </div>
        ) : step === 0 ? (
          <WelcomeSlide onNext={() => setStep(1)} />
        ) : step === 1 ? (
          <GenreStep
            allGenres={allGenres}
            loading={loading}
            selected={genres.map((g) => g.genre)}
            onToggle={(g) => (genres.some((x) => x.genre === g) ? removeGenre(g) : addGenre({ genre: g }))}
            onNext={() => setStep(2)}
          />
        ) : (
          <TrackStep
            search={search}
            onSearch={setSearch}
            results={results}
            selectedCount={tracks.length}
            onToggle={toggleTrack}
            isSelected={(id) => tracks.some((t) => t.track_id === id)}
            onBack={() => setStep(1)}
            canFinish={canFinish}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-8 text-center">
      <div className="relative">
        <div className="absolute -left-8 -top-6 h-16 w-16 rotate-[-14deg] rounded bg-pink" aria-hidden />
        <div className="absolute -bottom-6 -right-8 h-14 w-14 rotate-[10deg] rounded bg-tangerine" aria-hidden />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-lime">
          <Sparkles className="h-12 w-12 text-[#121212]" aria-hidden />
        </div>
      </div>
      <div>
        <p className="mb-2 text-label uppercase text-secondary">Wrapped {new Date().getFullYear()}</p>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-5xl">
          Let's build
          <br />
          your Wrapped
        </h1>
        <p className="mx-auto mt-4 max-w-[32ch] text-secondary">
          Pick a few genres and tracks you love — we'll turn them into your year in music.
        </p>
      </div>
      <Button onClick={onNext} className="w-full max-w-xs">
        Get started
      </Button>
    </div>
  );
}

function GenreStep({
  allGenres,
  loading,
  selected,
  onToggle,
  onNext,
}: {
  allGenres: Array<GenreCount & { hot: number }>;
  loading: boolean;
  selected: string[];
  onToggle: (g: string) => void;
  onNext: () => void;
}) {
  const hot = (g: string) => allGenres.find((x) => x.name === g)?.hot ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-label uppercase text-secondary">Step 1 of 2</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Pick 3–10 genres</h1>
        <p className="mt-1 text-sm text-secondary">
          114 genres · 1,000 tracks each (114,000 total) · <span aria-hidden>★</span> = charting tracks
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-2 bg-base px-4 py-3" aria-live="polite">
        {selected.length === 0 ? (
          <span className="text-sm text-secondary">Nothing picked yet</span>
        ) : (
          selected.map((g) => (
            <Chip key={g} label={g.replace(/-/g, " ")} selected onClick={() => onToggle(g)} size="compact" />
          ))
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allGenres.slice(0, 60).map((g) => (
            <button
              key={g.name}
              onClick={() => onToggle(g.name)}
              aria-pressed={selected.includes(g.name)}
              className={cn(
                "flex h-16 items-center justify-between rounded px-3 text-left font-display text-sm font-extrabold capitalize transition-all duration-micro",
                selected.includes(g.name)
                  ? "bg-white text-[#121212]"
                  : "bg-highlight text-primary hover:bg-highlight-hover"
              )}
            >
              <span className="truncate">{g.name.replace(/-/g, " ")}</span>
              <span
                className="ml-2 flex shrink-0 items-center gap-1 text-[10px] font-bold opacity-70"
                title={`${hot(g.name)} tracks with popularity ≥ 80`}
              >
                <span aria-hidden>★</span>
                {hot(g.name)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Button onClick={onNext} disabled={selected.length < 3} className="sticky bottom-4 w-full">
        {selected.length < 3 ? `Pick ${3 - selected.length} more` : "Next: pick tracks"}
      </Button>
    </div>
  );
}

function TrackStep({
  search,
  onSearch,
  results,
  selectedCount,
  onToggle,
  isSelected,
  onBack,
  canFinish,
  onFinish,
}: {
  search: string;
  onSearch: (q: string) => void;
  results: Track[];
  selectedCount: number;
  onToggle: (t: Track) => void;
  isSelected: (id: string) => boolean;
  onBack: () => void;
  canFinish: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-label uppercase text-secondary">Step 2 of 2</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Pick a few tracks</h1>
        <p className="mt-1 text-sm text-secondary">Search for songs or artists you love.</p>
      </header>

      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search tracks or artists…"
        aria-label="Search tracks"
        className="h-12 w-full rounded bg-white px-4 text-[15px] text-[#121212] placeholder:text-[#121212]/50 focus:outline-none focus:ring-2 focus:ring-white"
      />

      <div className="space-y-0.5" aria-live="polite">
        {results.map((t) => {
          const isSel = isSelected(t.track_id);
          return (
            <button
              key={t.track_id}
              onClick={() => onToggle(t)}
              aria-pressed={isSel}
              className={cn(
                "flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors",
                isSel ? "bg-green/20" : "hover:bg-highlight"
              )}
            >
              <CoverArt track={t} size="xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.track_name}</span>
                <span className="block truncate text-xs text-secondary">{t.artists}</span>
              </span>
              {isSel && <span className="font-bold text-green" aria-hidden>✓</span>}
            </button>
          );
        })}
        {search.trim().length >= 2 && results.length === 0 && (
          <p className="py-6 text-center text-sm text-secondary">No results for “{search}”</p>
        )}
      </div>

      <div className="sticky bottom-4 flex gap-3">
        <Button variant="secondary" onClick={onBack} className="w-28">
          Back
        </Button>
        <Button onClick={onFinish} disabled={!canFinish} className="flex-1">
          {canFinish ? "Generate my Wrapped" : selectedCount === 0 ? "Pick at least 1 track" : "Almost there…"}
        </Button>
      </div>
    </div>
  );
}
