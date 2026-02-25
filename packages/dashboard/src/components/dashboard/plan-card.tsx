import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TaskList } from "./task-list";
import type { PlanFile } from "@/lib/types";

interface PlanCardProps {
  plan: PlanFile;
  onEdit: (planPath: string) => void;
}

/**
 * Individual plan card showing frontmatter summary, wave, task list, and edit button.
 */
export function PlanCard({ plan, onEdit }: PlanCardProps) {
  const [planContent, setPlanContent] = useState(plan.content);

  const fm = plan.frontmatter;
  const planNumber = (fm.plan as number | string) ?? "?";
  const wave = fm.wave as number | undefined;
  const autonomous = fm.autonomous as boolean | undefined;
  const dependsOn = (fm.depends_on as string[]) ?? [];
  const filesModified = (fm.files_modified as string[]) ?? [];

  // Extract objective from XML tag if present
  let objective = "";
  const objectiveMatch = plan.content.match(
    /<objective>([\s\S]*?)<\/objective>/
  );
  if (objectiveMatch) {
    // Take first line or first 120 chars as excerpt
    const raw = objectiveMatch[1].trim();
    const firstLine = raw.split("\n")[0];
    objective =
      firstLine.length > 120 ? firstLine.slice(0, 117) + "..." : firstLine;
  }

  const handleContentChange = useCallback((newContent: string) => {
    setPlanContent(newContent);
  }, []);

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4",
        "transition-colors hover:bg-card-hover"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Plan number */}
          <span className="text-lg font-semibold font-mono text-accent">
            #{String(planNumber).padStart(2, "0")}
          </span>

          {/* Wave badge */}
          {wave !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded-sm bg-accent/20 text-accent-glow font-mono">
              wave {wave}
            </span>
          )}

          {/* Autonomous badge */}
          {autonomous && (
            <span className="text-xs px-1.5 py-0.5 rounded-sm bg-success/20 text-success font-mono">
              autonomous
            </span>
          )}
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEdit(plan.path)}
          className={cn(
            "text-xs px-3 py-1 rounded-md font-mono",
            "bg-muted text-muted-foreground",
            "hover:bg-accent/20 hover:text-accent-glow",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          )}
        >
          Edit
        </button>
      </div>

      {/* Objective excerpt */}
      {objective && (
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {objective}
        </p>
      )}

      {/* Frontmatter summary */}
      <div className="flex gap-4 mb-3 text-xs text-muted-foreground font-mono">
        {dependsOn.length > 0 && (
          <span>
            depends: {dependsOn.join(", ")}
          </span>
        )}
        {filesModified.length > 0 && (
          <span>
            {filesModified.length} file{filesModified.length !== 1 ? "s" : ""}
          </span>
        )}
        <span>
          {plan.tasks.length} task{plan.tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Task list */}
      <TaskList
        tasks={plan.tasks}
        planPath={plan.path}
        planContent={planContent}
        onContentChange={handleContentChange}
      />
    </div>
  );
}
