import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface SearchBarProps {
  onSearch: (q: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  onValueChange?: (q: string) => void;
}

/** 48px white search bar, black text, magnifier, clear button. */
export function SearchBar({ onSearch, placeholder = "What do you want to listen to?", autoFocus, value: controlled, onValueChange }: SearchBarProps) {
  const [internal, setInternal] = useState("");
  const value = controlled ?? internal;
  const setValue = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  // Stable debounce instance — survives re-renders so the timer actually works
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const debounced = useMemo(
    () => {
      let t: ReturnType<typeof setTimeout> | null = null;
      return (q: string) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => onSearchRef.current(q), 250);
      };
    },
    []
  );

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#121212]" aria-hidden />
      <input
        type="search"
        role="searchbox"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          debounced(e.target.value);
        }}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
        className={cnSearch()}
        aria-label="Search tracks and artists"
      />
      {value && (
        <button
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#121212]/60 hover:bg-black/10 hover:text-[#121212]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function cnSearch() {
  return [
    "h-12 w-full rounded bg-white pl-11 pr-10 text-[15px] text-[#121212]",
    "placeholder:text-[#121212]/50",
    "focus:outline-none focus:ring-2 focus:ring-white",
  ].join(" ");
}
