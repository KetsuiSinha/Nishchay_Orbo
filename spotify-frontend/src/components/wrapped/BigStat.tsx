import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface BigStatProps {
  value: string | number;
  label: string;
  unit?: string;
  className?: string;
  delay?: number;
}

/** Count-up number in display type — replaces the broken stat rings. */
export function BigStat({ value, label, unit, className, delay = 0 }: BigStatProps) {
  const numeric = typeof value === "number";
  const [display, setDisplay] = useState(numeric ? 0 : value);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!numeric) {
      setDisplay(value as string);
      return;
    }
    const target = value as number;
    const start = performance.now() + delay;
    const dur = 1200;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, numeric, delay]);

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <p className="font-display text-[clamp(4rem,18vw,8rem)] font-extrabold leading-none tracking-[-0.03em]">
        <span className="tabular">
          {typeof display === "number" ? display.toLocaleString() : display}
        </span>
        {unit && <span className="ml-1 text-[0.35em] font-bold opacity-80">{unit}</span>}
      </p>
      <p className="mt-3 max-w-[26ch] font-display text-lg font-bold md:text-xl">{label}</p>
    </div>
  );
}
