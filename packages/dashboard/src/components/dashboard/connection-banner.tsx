import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/components/providers/websocket-provider";

/**
 * Displays a banner when the WebSocket connection to the dashboard server is lost.
 * Shows connection status and provides a manual retry button.
 * Automatically hides once connection is restored.
 */
export function ConnectionBanner() {
  const { connected } = useWebSocket();
  const [serverReachable, setServerReachable] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Show banner after a short delay to avoid flashing on brief disconnects
  useEffect(() => {
    if (connected) {
      setShowBanner(false);
      setServerReachable(true);
      return;
    }
    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [connected]);

  const checkServer = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
      setServerReachable(res.ok);
      if (res.ok) {
        // Server is up but WS disconnected -- reload to re-establish
        window.location.reload();
      }
    } catch {
      setServerReachable(false);
    } finally {
      setRetrying(false);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 border-b border-danger/30 bg-danger/5 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-danger animate-pulse" />
        <span className="font-mono text-xs text-danger">
          {serverReachable
            ? "WebSocket disconnected. Reconnecting..."
            : "Dashboard server unreachable"}
        </span>
      </div>
      <button
        type="button"
        disabled={retrying}
        onClick={checkServer}
        className="shrink-0 border border-danger/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        {retrying ? "Checking..." : "Retry"}
      </button>
    </div>
  );
}
