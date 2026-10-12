import { cn } from "../../lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "default" | "compact";
  className?: string;
}

export function Chip({ label, selected, onClick, size = "default", className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill font-medium",
        "transition-colors duration-micro ease-standard",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        size === "compact" ? "h-8 px-3 text-xs" : "h-8 px-3.5 text-sm",
        selected
          ? "bg-white text-[#121212]"
          : "bg-highlight text-primary hover:bg-highlight-hover",
        className
      )}
    >
      {label}
    </button>
  );
}

interface ChipGroupProps {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  size?: "default" | "compact";
}

export function ChipGroup({ options, value, onChange, multiple = true, size }: ChipGroupProps) {
  const toggle = (v: string) => {
    if (multiple) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange(value.includes(v) ? [] : [v]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          size={size}
          selected={value.includes(o.value)}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  );
}
