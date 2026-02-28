import { useState } from "react";
import { motion } from "motion/react";
import type { DashboardMode } from "@/lib/types";

interface ModeToggleButtonProps {
  mode: DashboardMode | null;
  onToggle: () => void;
}

export function ModeToggleButton({ mode, onToggle }: ModeToggleButtonProps) {
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    setSpinning(true);
    onToggle();
    setTimeout(() => setSpinning(false), 420);
  }

  const isSimple = mode === "simple";
  const title = isSimple ? "Switch to Advanced Mode" : "Switch to Simple Mode";

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      <motion.span
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isSimple ? (
          /* Globe icon — shown in Simple Mode */
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6" />
            <ellipse cx="8" cy="8" rx="2.5" ry="6" />
            <path d="M2 8h12M3.5 5h9M3.5 11h9" strokeLinecap="round" />
          </svg>
        ) : (
          /* Terminal icon — shown in Advanced Mode */
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
            <path d="M4 6l2.5 2L4 10M8 10h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
