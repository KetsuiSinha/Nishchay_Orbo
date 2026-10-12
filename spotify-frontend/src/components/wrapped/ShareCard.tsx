import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { Copy, Download, X } from "lucide-react";
import type { WrappedPayload } from "../../types";
import { toast } from "../../state/toast";

interface ShareCardProps {
  data: WrappedPayload;
  onClose: () => void;
}

const SLIDES: Array<{
  label: string;
  bg: string;
  text: string;
  accent: string;
  headline: string;
  value?: string;
  sub?: string;
}> = [
  { label: "Minutes", bg: "#CDF564", text: "#121212", accent: "#1E3264", headline: "minutes of music", value: "0", sub: "" },
  { label: "Top genre", bg: "#F573A0", text: "#450A1E", accent: "#FFFFFF", headline: "top genre", value: "", sub: "" },
  { label: "Aura", bg: "#121212", text: "#FFFFFF", accent: "#CDF564", headline: "your audio aura", value: "", sub: "" },
  { label: "Personality", bg: "#1E3264", text: "#CDF564", accent: "#F573A0", headline: "listening character", value: "", sub: "" },
];

/** Share gallery: 1080×1920 PNG export per slide + copy link. */
export function ShareCard({ data, onClose }: ShareCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  const slides = SLIDES.map((s) => ({
    ...s,
    value:
      s.label === "Minutes"
        ? String(data.minutes_estimate)
        : s.label === "Top genre"
          ? data.top_genre.name.replace(/-/g, " ")
          : s.label === "Personality"
            ? data.personality.name
            : "",
    sub:
      s.label === "Minutes"
        ? `≈ ${Math.max(1, Math.round(data.minutes_estimate / 45))} albums`
        : s.label === "Top genre"
          ? `${data.top_genre.track_count} tracks in your mix`
          : s.label === "Aura"
            ? `Mood ${Math.round((data.audio_profile.features.valence ?? 0.5) * 100)} · Energy ${Math.round((data.audio_profile.features.energy ?? 0.5) * 100)}`
            : data.personality.traits.join(" · "),
  }));

  const download = async (i: number) => {
    const node = refs.current[i];
    if (!node) return;
    setBusy(slides[i].label);
    try {
      const dataUrl = await toPng(node, { pixelRatio: 1080 / node.offsetWidth, backgroundColor: slides[i].bg });
      const a = document.createElement("a");
      a.download = `wrapped-${slides[i].label.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("Image saved");
    } catch {
      toast.error("Could not export image");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] overflow-y-auto bg-black/85 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Share your Wrapped"
    >
      <div className="mx-auto max-w-md pb-10">
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between bg-black/70 px-4 py-3 backdrop-blur">
          <h2 className="font-display text-lg font-extrabold text-white">Share your Wrapped</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5">
          {slides.map((s, i) => (
            <div key={s.label}>
              {/* 9:16 preview — exported at 1080×1920 */}
              <div
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="relative mx-auto flex aspect-[9/16] w-56 flex-col items-center justify-center gap-3 rounded-xl p-6 text-center"
                style={{ backgroundColor: s.bg, color: s.text }}
              >
                <p className="text-[10px] font-bold uppercase tracking-label opacity-70">Wrapped {new Date().getFullYear()}</p>
                <p className="font-display text-[clamp(1.6rem,7vw,2.4rem)] font-extrabold capitalize leading-none tracking-[-0.03em]">
                  {s.value || s.headline}
                </p>
                <p className="font-display text-sm font-bold opacity-80">{s.label}</p>
                <p className="px-2 text-xs opacity-70">{s.sub}</p>
                {s.label === "Top genre" && data.playlist[0] && (
                  <img src={data.playlist[0].artwork_url ?? ""} alt="" className="absolute -bottom-4 -right-4 h-24 w-24 rotate-[25deg] rounded object-cover" />
                )}
                <p className="absolute bottom-3 text-[9px] font-bold opacity-50">Wrapped Recommendations</p>
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => download(i)}
                  disabled={busy === s.label}
                  className="flex h-8 items-center gap-1.5 rounded-pill bg-white px-4 text-xs font-bold text-[#121212] disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> {busy === s.label ? "Rendering…" : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={copyLink}
          className="mx-auto mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-pill border-2 border-white font-semibold text-white transition-colors hover:bg-white/10"
        >
          <Copy className="h-4 w-4" aria-hidden /> Copy link
        </button>
      </div>
    </motion.div>
  );
}
