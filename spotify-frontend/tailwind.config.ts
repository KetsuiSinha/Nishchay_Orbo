import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        elevated: "var(--bg-elevated)",
        highlight: "var(--bg-highlight)",
        "highlight-hover": "var(--bg-highlight-hover)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        green: { DEFAULT: "var(--accent-green)", bright: "var(--accent-green-bright)", dim: "var(--accent-green-dim)" },
        error: "var(--error)",
        // Wrapped slide palettes (flat colours)
        lime: { DEFAULT: "#CDF564", deep: "#1E3264" },
        purple: { DEFAULT: "#5038A0", text: "#F573A0" },
        pink: { DEFAULT: "#F573A0", deep: "#450A1E" },
        cobalt: { DEFAULT: "#1E3264", text: "#CDF564", accent: "#F573A0" },
        tangerine: { DEFAULT: "#FF6437" },
        mint: { DEFAULT: "#1ED760" },
      },
      fontFamily: {
        display: ['"Figtree"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      fontSize: {
        display1: ["clamp(3rem, 9vw, 5.5rem)", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "800" }],
        display2: ["clamp(2.25rem, 6vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "800" }],
        display3: ["clamp(1.75rem, 4vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        label: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.08em", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        xl: "24px",
        pill: "500px",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        overshoot: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: { micro: "120ms", ui: "240ms", slide: "400ms" },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        "blob-morph": {
          "0%, 100%": { borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%", transform: "rotate(0deg) scale(1)" },
          "33%": { borderRadius: "45% 55% 40% 60% / 60% 40% 55% 45%", transform: "rotate(8deg) scale(1.06)" },
          "66%": { borderRadius: "55% 45% 60% 40% / 40% 60% 45% 55%", transform: "rotate(-6deg) scale(0.97)" },
        },
        "slide-in": { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "sticker-pop": { "0%": { opacity: "0", transform: "scale(0.4) rotate(-18deg)" }, "100%": { opacity: "1", transform: "scale(1) rotate(var(--rot, -6deg))" } },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        "eq-bar": "eq-bar 0.9s ease-in-out infinite",
        "blob-morph": "blob-morph 20s ease-in-out infinite",
        "slide-in": "slide-in 400ms cubic-bezier(0.2, 0, 0, 1) both",
        "sticker-pop": "sticker-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
