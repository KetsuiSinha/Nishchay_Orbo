import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "share";
type Size = "default" | "compact" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-green text-[#121212] font-semibold hover:bg-green-bright hover:scale-[1.04] active:scale-[0.96]",
  secondary:
    "bg-transparent border border-white/40 text-primary hover:border-white hover:bg-white/10 active:scale-[0.96]",
  ghost: "bg-transparent text-secondary hover:text-primary hover:bg-highlight active:scale-[0.96]",
  share: "bg-white text-[#121212] font-bold hover:bg-white/90 active:scale-[0.96]",
};

const sizes: Record<Size, string> = {
  default: "h-12 px-6 text-sm gap-2",
  compact: "h-8 px-4 text-xs gap-1.5",
  icon: "h-12 w-12 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-body font-semibold",
        "transition-all duration-micro ease-standard select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : children}
    </button>
  )
);
Button.displayName = "Button";
