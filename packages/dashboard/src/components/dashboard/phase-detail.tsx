import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { usePhaseDetail } from "@/hooks/use-phase-detail";
import { PlanCard } from "./plan-card";
import { PlanEditor } from "@/components/editor/plan-editor";

interface PhaseDetailProps {
  phaseId: string;
  onBack: () => void;
}

export function PhaseDetail({ phaseId, onBack }: PhaseDetailProps) {
  const { plans, context, research, loading, error, refetch } =
    usePhaseDetail(phaseId);

  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  const phaseName =
    plans.length > 0
      ? ((plans[0].frontmatter.phase as string) ?? phaseId)
      : phaseId;

  const handleEdit = useCallback(async (planPath: string) => {
    try {
      const pathAfterPlanning = planPath.replace(/^\.planning[\\/]/, "");
      const segments = pathAfterPlanning.split(/[\\/]/);
      const response = await fetch(`/api/plan/${segments.join("/")}`);
      if (!response.ok) return;
      const data = (await response.json()) as { content: string };
      setEditingContent(data.content);
      setEditingPath(planPath);
    } catch (err) {
      console.error("[phase-detail]", err);
    }
  }, []);

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
      if (!response.ok) throw new Error("Failed to save plan");
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
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground",
          "hover:text-foreground transition-colors"
        )}
      >
        <svg
          className="w-3 h-3"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
        Overview
      </button>

      {/* Phase header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest">
            Phase {phaseId}
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {phaseName}
          </h2>
        </div>

        <div className="flex gap-2">
          {context && (
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-success/30 text-success">
              Context
            </span>
          )}
          {research && (
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-success/30 text-success">
              Research
            </span>
          )}
          {!context && !research && !loading && (
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-border text-muted-foreground">
              No context
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-danger/30 p-4 text-danger text-sm font-mono text-xs">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && plans.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border p-4 animate-pulse">
              <div className="h-4 w-24 bg-muted mb-3" />
              <div className="h-3 w-3/4 bg-muted mb-2" />
              <div className="h-3 w-1/2 bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && plans.length === 0 && (
        <div className="border border-border p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            No plans yet — run{" "}
            <code className="text-accent">/maxsim:plan-phase</code>
          </p>
        </div>
      )}

      {/* Plans */}
      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.path} plan={plan} onEdit={handleEdit} />
          ))}
        </div>
      )}

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
