import { useState, useCallback } from "react";

/**
 * Controls for terminal view layout mode (full-height vs split-panel).
 * Renders the toggle button overlay. Split mode state is managed here
 * and exposed via the exported hook for App.tsx to coordinate layout.
 */

export function useTerminalLayout() {
  const [splitMode, setSplitMode] = useState(false);
  const toggleSplit = useCallback(() => setSplitMode((p) => !p), []);
  return { splitMode, toggleSplit };
}

interface TerminalToggleProps {
  splitMode: boolean;
  onToggle: () => void;
}

/**
 * Small icon button overlay to toggle between full-height and split-panel terminal modes.
 */
export function TerminalToggle({ splitMode, onToggle }: TerminalToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={splitMode ? "Full-height mode" : "Split-panel mode"}
      className="absolute right-3 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
    >
      {splitMode ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}
