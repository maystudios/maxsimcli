import { useState, useEffect } from "react";
import type { DashboardMode } from "@/lib/types";

const LS_KEY = "maxsim_dashboard_mode";

export function useDashboardMode() {
  // Initialize synchronously from localStorage to prevent first-run flash
  const [mode, setModeState] = useState<DashboardMode | null>(() => {
    try {
      const ls = localStorage.getItem(LS_KEY);
      if (ls === "simple" || ls === "advanced") return ls;
    } catch { /* SSR guard */ }
    return null;
  });
  const [initialized, setInitialized] = useState(() => {
    try {
      const ls = localStorage.getItem(LS_KEY);
      return ls === "simple" || ls === "advanced";
    } catch { return false; }
  });

  // If no localStorage value, check server config
  useEffect(() => {
    if (initialized) return;
    fetch("/api/simple-mode-config")
      .then(r => r.json())
      .then((data: { default_mode?: string }) => {
        if (data.default_mode === "simple" || data.default_mode === "advanced") {
          setModeState(data.default_mode as DashboardMode);
          try { localStorage.setItem(LS_KEY, data.default_mode); } catch { /* ignore */ }
        }
        // If neither: mode stays null → trigger first-run card
      })
      .catch(() => { /* server unreachable, stay null */ })
      .finally(() => setInitialized(true));
  }, [initialized]);

  const setMode = (newMode: DashboardMode) => {
    setModeState(newMode);
    if (!initialized) setInitialized(true);
    try { localStorage.setItem(LS_KEY, newMode); } catch { /* ignore */ }
    fetch("/api/simple-mode-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_mode: newMode }),
    }).catch(() => { /* non-blocking fire-and-forget */ });
  };

  return { mode, setMode, initialized };
}
