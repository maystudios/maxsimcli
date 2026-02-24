"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { usePhaseDetail } from "@/app/hooks/use-phase-detail";
import { PlanCard } from "./plan-card";
import { PlanEditor } from "@/app/components/editor/plan-editor";

interface PhaseDetailProps {
  phaseId: string;
  onBack: () => void;
}

/**
 * Phase drill-down view with plan cards, context summary, and research status.
 * Supports inline editing via CodeMirror editor overlay.
 */
export function PhaseDetail({ phaseId, onBack }: PhaseDetailProps) {
  const { plans, context, research, loading, error, refetch } =
    usePhaseDetail(phaseId);

  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // Extract phase name from first plan's frontmatter or phaseId
  const phaseName =
    plans.length > 0
      ? ((plans[0].frontmatter.phase as string) ?? phaseId)
      : phaseId;

  const handleEdit = useCallback(
    async (planPath: string) => {
      // Fetch full plan content from API
      try {
        const pathAfterPlanning = planPath.replace(/^\.planning[\\/]/, "");
        const segments = pathAfterPlanning.split(/[\\/]/);
        const response = await fetch(`/api/plan/${segments.join("/")}`);

        if (!response.ok) {
          console.error("[phase-detail] Failed to fetch plan for editing");
          return;
        }

        const data = (await response.json()) as { content: string };
        setEditingContent(data.content);
        setEditingPath(planPath);
      } catch (err) {
        console.error("[phase-detail] Error fetching plan:", err);
      }
    },
    []
  );

  const handleSave = useCallback(
    async (content: string) => {
      if (!editingPath) return;

      const pathAfterPlanning = editingPath.replace(/^\.planning[\\/]/, "");
      const segments = pathAfterPlanning.split(/[\\/]/);

      const response = await fetch(`/api/plan/${segments.join("/")}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to save plan");
      }
    },
    [editingPath]
  );

  const handleCloseEditor = useCallback(() => {
    setEditingPath(null);
    setEditingContent("");
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-md px-2 py-1"
        )}
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to overview
      </button>

      {/* Phase header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          <span className="text-accent font-mono">Phase {phaseId}</span>
          <span className="mx-2 text-muted-foreground">-</span>
          <span>{phaseName}</span>
        </h2>

        {/* Context / Research indicators */}
        <div className="flex gap-2 mt-2">
          {context && (
            <span className="text-xs px-2 py-0.5 rounded-sm bg-success/20 text-success font-mono">
              context available
            </span>
          )}
          {research && (
            <span className="text-xs px-2 py-0.5 rounded-sm bg-success/20 text-success font-mono">
              research available
            </span>
          )}
          {!context && !research && !loading && (
            <span className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono">
              no context or research
            </span>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg border border-danger/50 bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Loading state - skeleton cards */}
      {loading && plans.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 w-32 bg-muted rounded mb-3" />
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && plans.length === 0 && (
        <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
          <p className="text-sm">
            No plans yet -- run{" "}
            <code className="font-mono text-accent">/maxsim:plan-phase</code> to
            create plans
          </p>
        </div>
      )}

      {/* Plan cards */}
      {plans.length > 0 && (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard key={plan.path} plan={plan} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Editor overlay */}
      {editingPath && (
        <PlanEditor
          initialContent={editingContent}
          filePath={editingPath}
          onSave={handleSave}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
