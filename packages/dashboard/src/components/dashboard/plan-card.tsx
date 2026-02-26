import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TaskList } from "./task-list";
import type { PlanFile } from "@/lib/types";

interface PlanCardProps {
  plan: PlanFile;
  onEdit: (planPath: string) => void;
}

export function PlanCard({ plan, onEdit }: PlanCardProps) {
  const [planContent, setPlanContent] = useState(plan.content);

  const fm = plan.frontmatter;
  const planNumber = (fm.plan as number | string) ?? "?";
  const wave = fm.wave as number | undefined;
  const autonomous = fm.autonomous as boolean | undefined;
  const dependsOn = (fm.depends_on as string[]) ?? [];
  const filesModified = (fm.files_modified as string[]) ?? [];

  let objective = "";
  const objectiveMatch = plan.content.match(/<objective>([\s\S]*?)<\/objective>/);
  if (objectiveMatch) {
    const raw = objectiveMatch[1].trim();
    const firstLine = raw.split("\n")[0];
    objective = firstLine.length > 120 ? firstLine.slice(0, 117) + "..." : firstLine;
  }

  const handleContentChange = useCallback((newContent: string) => {
    setPlanContent(newContent);
  }, []);

  return (
    <div className="border border-border bg-card transition-colors hover:bg-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-accent tabular-nums">
            #{String(planNumber).padStart(2, "0")}
          </span>

          {wave !== undefined && (
            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-accent/20 text-accent/70">
              Wave {wave}
            </span>
          )}

          {autonomous && (
            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-success/20 text-success">
              Auto
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(plan.path)}
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest px-3 py-1",
            "border border-border text-muted-foreground",
            "hover:border-accent hover:text-accent",
            "transition-colors"
          )}
        >
          Edit
        </button>
      </div>

      <div className="px-4 py-3">
        {/* Objective */}
        {objective && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {objective}
          </p>
        )}

        {/* Meta */}
        <div className="flex gap-4 mb-3 font-mono text-[10px] text-muted-foreground">
          {dependsOn.length > 0 && (
            <span>deps: {dependsOn.join(", ")}</span>
          )}
          {filesModified.length > 0 && (
            <span>{filesModified.length} file{filesModified.length !== 1 ? "s" : ""}</span>
          )}
          <span>{plan.tasks.length} task{plan.tasks.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Task list */}
        <TaskList
          tasks={plan.tasks}
          planPath={plan.path}
          planContent={planContent}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
