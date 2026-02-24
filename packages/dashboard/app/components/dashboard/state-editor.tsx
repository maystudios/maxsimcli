"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type EditorTab = "decision" | "blocker";

interface StateEditorProps {
  onEntryAdded?: () => void;
}

/**
 * Form panel for adding decisions and blockers to STATE.md.
 *
 * Two tabs: "Add Decision" (phase + text) and "Add Blocker" (text only).
 * Submits via PATCH /api/state. Shown as an expandable section within the blockers panel.
 */
export function StateEditor({ onEntryAdded }: StateEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("decision");
  const [phase, setPhase] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === "decision") {
        const phasePrefix = phase.trim() ? `[${phase.trim()}]: ` : "";
        const decisionText = `${phasePrefix}${trimmedText}`;

        const res = await fetch("/api/state", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "decisions",
            value: decisionText,
          }),
        });

        if (!res.ok) {
          // If the field-replace approach fails, it means the STATE.md
          // structure may not support direct field replacement for list items.
          // This is expected behavior for list-based fields.
          throw new Error("Could not add decision - STATE.md field not found");
        }

        setSuccess("Decision added");
      } else {
        const res = await fetch("/api/state", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "blockers",
            value: trimmedText,
          }),
        });

        if (!res.ok) {
          throw new Error("Could not add blocker - STATE.md field not found");
        }

        setSuccess("Blocker added");
      }

      setText("");
      setPhase("");
      onEntryAdded?.();

      // Clear success message after 2s
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update STATE.md");
    } finally {
      setSubmitting(false);
    }
  }, [activeTab, phase, text, onEntryAdded]);

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        <svg
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M4 2l5 4-5 4z" />
        </svg>
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Add to STATE.md
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Tab selector */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("decision")}
              className={cn(
                "rounded-sm px-3 py-1 font-mono text-xs transition-colors",
                activeTab === "decision"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Decision
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("blocker")}
              className={cn(
                "rounded-sm px-3 py-1 font-mono text-xs transition-colors",
                activeTab === "blocker"
                  ? "bg-danger/20 text-danger"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Blocker
            </button>
          </div>

          {/* Phase input (decisions only) */}
          {activeTab === "decision" && (
            <input
              type="text"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              placeholder="Phase (e.g. 13-06)"
              className="w-full rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          )}

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !submitting) handleSubmit();
            }}
            placeholder={
              activeTab === "decision"
                ? "Decision text..."
                : "Blocker description..."
            }
            className="w-full rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-xs font-semibold transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              activeTab === "decision"
                ? "bg-accent/20 text-accent hover:bg-accent/30"
                : "bg-danger/20 text-danger hover:bg-danger/30"
            )}
          >
            {submitting ? "Saving..." : `Add ${activeTab === "decision" ? "Decision" : "Blocker"}`}
          </button>

          {/* Error */}
          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          {/* Success */}
          {success && (
            <p className="text-xs text-success">{success}</p>
          )}
        </div>
      )}
    </div>
  );
}
