import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "../../state/toast";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[136px] z-[400] flex flex-col items-center gap-2 px-4 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded bg-white px-4 py-3 text-left shadow-sheet"
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${t.type === "error" ? "text-error" : "text-green"}`}
                aria-hidden
              />
              <span className="flex-1 text-sm font-medium text-[#121212]">{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
