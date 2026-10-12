import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import { ArtistAvatar } from "../media/ArtistChip";
import { CoverArt } from "../media/CoverArt";
import { cn, FEATURE_LABELS } from "../../lib/utils";
import { paletteFor } from "../../lib/palettes";
import type { WrappedPayload } from "../../types";
import { AuraVisual } from "./AuraVisual";
import { BigStat } from "./BigStat";
import { PersonalityCard } from "./PersonalityCard";
import { RankedList } from "./RankedList";
import { ShareCard } from "./ShareCard";
import { Sticker } from "./Sticker";

interface StoryPlayerProps {
  data: WrappedPayload;
  onClose: () => void;
}

const SLIDE_MS = 6000;
const LIST_SLIDE_MS = 10000;
const TOTAL = 11;

/** Full-screen story player: 11 slides, tap zones, keyboard, auto-advance, hold-to-pause. */
export function StoryPlayer({ data, onClose }: StoryPlayerProps) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(() => {
    const s = Number(params.get("s"));
    return Number.isFinite(s) && s >= 1 && s <= TOTAL ? s - 1 : 0;
  });
  const [playing, setPlaying] = useState(true);
  const [muted] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef<number | null>(null);

  const next = useCallback(() => {
    setIndex((i) => {
      const n = Math.min(i + 1, TOTAL - 1);
      setParams(n === 0 ? {} : { s: String(n + 1) }, { replace: true });
      return n;
    });
  }, [setParams]);

  const prev = useCallback(() => {
    setIndex((i) => {
      const p = Math.max(i - 1, 0);
      setParams(p === 0 ? {} : { s: String(p + 1) }, { replace: true });
      return p;
    });
  }, [setParams]);

  // Auto-advance
  useEffect(() => {
    if (!playing || showShare) return;
    const ms = index === 4 ? LIST_SLIDE_MS : SLIDE_MS;
    const t = setTimeout(() => {
      if (index < TOTAL - 1) next();
      else setPlaying(false);
    }, ms);
    return () => clearTimeout(t);
  }, [playing, index, showShare, next]);

  // Pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    holdTimer.current = setTimeout(() => setPlaying(false), 250);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 110) {
      onClose();
    }
    touchStartY.current = null;
  };

  const palette = paletteFor(index);
  const year = new Date().getFullYear();

  const slides = [
    <IntroSlide key="s0" year={year} />,
    <CenterSlide key="s1">
      <BigStat value={data.minutes_estimate} unit="min" label="minutes of music" />
      <p className="mt-4 text-sm opacity-80">That's about {Math.max(1, Math.round(data.minutes_estimate / 45))} albums</p>
    </CenterSlide>,
    <CenterSlide key="s2">
      <Sticker text="Top genre" rotation={-5} className="mb-5" style={{ backgroundColor: "rgba(0,0,0,0.18)", color: palette.text }} />
      <h2 className="font-display text-[clamp(2.6rem,11vw,4.6rem)] font-extrabold capitalize leading-none tracking-[-0.03em]">
        {data.top_genre.name.replace(/-/g, " ")}
      </h2>
      <div className="mt-6 w-full max-w-xs space-y-1.5">
        {data.top_genres.slice(0, 5).map((g) => (
          <div key={g.name} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-right text-xs font-semibold capitalize opacity-80">
              {g.name.replace(/-/g, " ")}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-black/15">
              <div
                className="h-full rounded-pill bg-current opacity-70"
                style={{ width: `${data.top_genres[0].track_count ? (g.track_count / data.top_genres[0].track_count) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CenterSlide>,
    <CenterSlide key="s3">
      <Sticker text="Top artists" rotation={4} className="mb-5" style={{ backgroundColor: "rgba(0,0,0,0.18)", color: palette.text }} />
      {data.top_artists[0] && <ArtistAvatar name={data.top_artists[0].name} imageUrl={data.top_artists[0].image_url} size={150} />}
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight">{data.top_artists[0]?.name}</h2>
      <div className="mt-5 w-full max-w-sm">
        <RankedList
          textClassName="text-white"
          items={data.top_artists.slice(1, 5).map((a, i) => ({
            rank: i + 2,
            title: a.name,
            subtitle: `${a.track_count} tracks`,
            imageUrl: a.image_url,
          }))}
        />
      </div>
    </CenterSlide>,
    <CenterSlide key="s4">
      <Sticker text="Top tracks" rotation={-4} className="mb-5" style={{ backgroundColor: "rgba(0,0,0,0.18)", color: palette.text }} />
      <div className="w-full max-w-sm">
        <RankedList
          items={data.top_tracks.slice(0, 5).map((t, i) => ({
            rank: i + 1,
            title: t.track_name,
            subtitle: t.artists,
            track: t,
          }))}
        />
      </div>
    </CenterSlide>,
    <CenterSlide key="s5">
      <Sticker text="Your audio aura" rotation={3} className="mb-2" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF" }} />
      <AuraVisual features={data.audio_profile.features} baseline={data.audio_profile.baseline} />
    </CenterSlide>,
    <CenterSlide key="s6">
      <MoodSlide
        valence={data.audio_profile.features.valence ?? 0.5}
        energy={data.audio_profile.features.energy ?? 0.5}
        label={data.mood_label}
      />
    </CenterSlide>,
    <CenterSlide key="s7">
      <BigStat value={data.discovery.new_artists_count} label="artists you haven't heard" />
      <p className="mt-3 text-sm opacity-80">
        Across {data.discovery.new_genres_count} new genre{data.discovery.new_genres_count === 1 ? "" : "s"}
      </p>
    </CenterSlide>,
    <CenterSlide key="s8">
      <PersonalityCard personality={data.personality} textClassName="text-white" />
    </CenterSlide>,
    <CenterSlide key="s9">
      <Sticker text="Made from your wrapped" rotation={-3} className="mb-4" style={{ backgroundColor: "rgba(0,0,0,0.18)", color: palette.text }} />
      <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Your 10-track mix</h2>
      <div className="w-full max-w-sm space-y-1">
        {data.playlist.slice(0, 5).map((t, i) => (
          <div key={t.track_id} className="flex items-center gap-3">
            <span className="tabular w-4 text-sm font-bold opacity-70">{i + 1}</span>
            <CoverArt track={t} size="xs" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold">{t.track_name}</span>
              <span className="block truncate text-xs opacity-70">{t.artists}</span>
            </span>
          </div>
        ))}
        {data.playlist.length > 5 && <p className="pt-1 text-xs font-semibold opacity-70">+ {data.playlist.length - 5} more</p>}
      </div>
    </CenterSlide>,
    <CenterSlide key="s10">
      <h2 className="max-w-[16ch] font-display text-4xl font-extrabold leading-tight tracking-tight">
        Your Wrapped, ready to share
      </h2>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => setShowShare(true)}
          className="flex h-12 items-center justify-center rounded-pill bg-white font-semibold text-[#121212] transition-transform hover:scale-[1.03]"
        >
          Share your Wrapped
        </button>
        <button
          onClick={() => setIndex(0)}
          className="flex h-12 items-center justify-center rounded-pill border-2 border-current font-semibold transition-colors hover:bg-white/10"
        >
          Replay
        </button>
        <button
          onClick={() => navigate("/home")}
          className="flex h-12 items-center justify-center rounded-pill font-semibold underline underline-offset-4 opacity-90 transition-opacity hover:opacity-100"
        >
          Explore recommendations
        </button>
      </div>
    </CenterSlide>,
  ];

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Your Wrapped story"
    >
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden md:h-[min(746px,92dvh)] md:w-[420px] md:rounded-xl"
        style={{ backgroundColor: palette.bg, color: palette.text }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Tap zones */}
        <button aria-label="Previous slide" className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-default focus-visible:outline-none" onClick={prev} />
        <button aria-label="Next slide" className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-default focus-visible:outline-none" onClick={next} />

        {/* Segmented progress */}
        <div className="absolute inset-x-0 top-0 z-30 flex gap-1 px-4 pt-4" aria-hidden>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-pill bg-current opacity-25">
              <div
                className="h-full rounded-pill bg-current"
                style={{
                  width: i < index ? "100%" : i === index && playing ? "100%" : "0%",
                  opacity: i <= index ? 1 : 0,
                  transition: i === index && playing ? `width ${index === 4 ? LIST_SLIDE_MS : SLIDE_MS}ms linear` : "width 300ms",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top chrome */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-8">
          <div className="flex items-center gap-1">
            <span
              className="rounded-full bg-black/20 p-2 backdrop-blur"
              aria-label={muted ? "Muted" : "Sound on"}
              role="img"
            >
              <Volume2 className={cn("h-4 w-4", muted && "opacity-50")} aria-hidden />
            </span>
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="rounded-full bg-black/20 p-2 backdrop-blur transition-colors hover:bg-black/35"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          <span className="text-xs font-bold uppercase tracking-label opacity-70">
            {index + 1} / {TOTAL}
          </span>
          <button
            onClick={onClose}
            aria-label="Close story"
            className="rounded-full bg-black/20 p-2 backdrop-blur transition-colors hover:bg-black/35"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-16"
          >
            {slides[index]}
          </motion.div>
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous slide"
            className="rounded-full bg-black/20 p-2.5 backdrop-blur transition-colors hover:bg-black/35 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#121212] shadow-sheet transition-transform hover:scale-[1.04]"
          >
            {playing ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="ml-0.5 h-5 w-5" aria-hidden />}
          </button>
          <button
            onClick={next}
            disabled={index === TOTAL - 1}
            aria-label="Next slide"
            className="rounded-full bg-black/20 p-2.5 backdrop-blur transition-colors hover:bg-black/35 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <AnimatePresence>{showShare && <ShareCard data={data} onClose={() => setShowShare(false)} />}</AnimatePresence>
    </div>
  );
}

function CenterSlide({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col items-center justify-center text-center">{children}</div>;
}

function IntroSlide({ year }: { year: number }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Sticker text={`Wrapped ${year}`} rotation={-7} delay={100} className="bg-white/15 text-white" />
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="font-display text-[clamp(2.8rem,12vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]"
      >
        Your Wrapped
        <br />
        is here.
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm font-medium opacity-80">
        11 stories about your year in music
      </motion.p>
    </div>
  );
}

function MoodSlide({ valence, energy, label }: { valence: number; energy: number; label: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Sticker text="Your mood" rotation={5} className="bg-black/20" />
      <div className="relative h-52 w-52 rounded-3xl border-2 border-current opacity-90" aria-hidden>
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-label opacity-60">
          High energy
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-label opacity-60">
          Low energy
        </span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-label opacity-60 [writing-mode:vertical-rl]">
          Low
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-label opacity-60 [writing-mode:vertical-rl]">
          High
        </span>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute h-5 w-5 rounded-full border-[3px] border-current bg-white/30 shadow-lg"
          style={{
            left: `${12 + valence * 76}%`,
            top: `${12 + (1 - energy) * 76}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <h2 className="font-display text-4xl font-extrabold tracking-tight">{label}</h2>
      <p className="text-sm opacity-80">
        {FEATURE_LABELS.valence} {Math.round(valence * 100)} · {FEATURE_LABELS.energy} {Math.round(energy * 100)}
      </p>
    </div>
  );
}
