"use client";

import { useState, useCallback } from "react";
import { useDashboardData } from "@/app/hooks/use-dashboard-data";
import { StateEditor } from "./state-editor";
import { cn } from "@/lib/utils";

interface BlockerEntry {
  text: string;
  resolved: boolean;
}

/** Parse blocker text to detect RESOLVED status */
function parseBlockers(blockers: string[]): BlockerEntry[] {
  return blockers.map((b) => ({
    text: b.replace(/~~(.+)~~/, "$1").replace(/\s*RESOLVED.*$/i, "").trim(),
    resolved: b.includes("RESOLVED") || (b.startsWith("~~") && b.endsWith("~~")),
  }));
}

/**
 * Blockers panel showing active and resolved blockers with resolve action.
 *
 * Reads blocker data from useDashboardData() state. Active blockers display
 * with a resolve button; resolved blockers are in a collapsed section with
 * strikethrough. Includes StateEditor for adding decisions and blockers.
 */
export function BlockersPanel() {
  const { state } = useDashboardData();
  const [showResolved, setShowResolved] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const blockers = parseBlockers(state?.blockers ?? []);
  const active = blockers.filter((b) => !b.resolved);
  const resolved = blockers.filter((b) => b.resolved);

  const handleResolve = useCallback(async (blockerText: string) => {
    setResolving(blockerText);
    setError(null);

    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "blockers",
          value: `~~${blockerText}~~ RESOLVED`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to resolve blocker");
      }

      // Trigger a data refresh via key change
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve blocker");
    } finally {
      setResolving(null);
    }
  }, []);

  const handleEntryAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
          Blockers
        </h2>
        <span
          className={cn(
            "font-mono text-xs",
            active.length > 0 ? "text-danger" : "text-success"
          )}
        >
          {active.length > 0
            ? `${active.length} active`
            : "No active blockers"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-sm border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Active blockers */}
      {active.length === 0 ? (
        <div className="rounded-sm border border-success/30 bg-success/5 px-4 py-6 text-center">
          <p className="text-sm text-success">No active blockers</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((blocker) => (
            <div
              key={blocker.text}
              className="flex items-start gap-3 rounded-sm border border-border bg-card px-4 py-3"
            >
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-danger" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{blocker.text}</p>
              </div>
              <button
                type="button"
                onClick={() => handleResolve(blocker.text)}
                disabled={resolving === blocker.text}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-1 font-mono text-xs transition-colors",
                  "bg-success/20 text-success hover:bg-success/30",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {resolving === blocker.text ? "..." : "Resolve"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Resolved section (collapsed by default) */}
      {resolved.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="flex w-full items-center gap-2 text-left"
          >
            <svg
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform",
                showResolved && "rotate-90"
              )}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M4 2l5 4-5 4z" />
            </svg>
            <span className="font-mono text-xs text-muted-foreground">
              Resolved ({resolved.length})
            </span>
          </button>

          {showResolved && (
            <div className="mt-2 space-y-1">
              {resolved.map((blocker) => (
                <div
                  key={blocker.text}
                  className="flex items-center gap-3 rounded-sm px-4 py-2"
                >
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-muted" />
                  <p className="text-sm text-muted-foreground line-through">
                    {blocker.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* State editor for adding decisions/blockers */}
      <StateEditor onEntryAdded={handleEntryAdded} />
    </div>
  );
}
