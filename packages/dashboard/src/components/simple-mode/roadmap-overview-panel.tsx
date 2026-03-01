import { useDashboardData } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

function statusIcon(status: string, roadmapComplete: boolean): { color: string; label: string } {
  if (roadmapComplete || status === "complete") {
    return { color: "bg-success", label: "Complete" };
  }
  if (status === "partial") {
    return { color: "bg-simple-accent", label: "In Progress" };
  }
  if (status === "planned") {
    return { color: "bg-blue-400", label: "Planned" };
  }
  if (status === "discussed" || status === "researched") {
    return { color: "bg-yellow-500", label: status === "discussed" ? "Discussed" : "Researched" };
  }
  return { color: "bg-muted-foreground/40", label: "Not Started" };
}

export function RoadmapOverviewPanel() {
  const { roadmap } = useDashboardData();

  const phases = roadmap?.phases ?? [];
  const currentPhase = roadmap?.current_phase ?? null;

  if (phases.length === 0) return null;

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Roadmap
        </span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {phases.length} phases
        </span>
      </div>

      <div className="space-y-0.5 max-h-52 overflow-y-auto">
        {phases.map((phase) => {
          const isCurrent = phase.number === currentPhase;
          const { color, label } = statusIcon(phase.disk_status, phase.roadmap_complete);

          return (
            <div
              key={phase.number}
              className={cn(
                "flex items-center gap-2.5 py-1.5 px-1",
                isCurrent && "bg-simple-accent/5 border-l-2 border-l-simple-accent -ml-1 pl-2"
              )}
            >
              <span
                className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", color)}
                title={label}
              />
              <span
                className={cn(
                  "font-mono text-[10px] font-bold tabular-nums shrink-0",
                  isCurrent ? "text-simple-accent" : "text-muted-foreground"
                )}
              >
                {phase.number}
              </span>
              <span className="text-xs text-foreground/80 truncate">
                {phase.name}
              </span>
              {isCurrent && (
                <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-simple-accent shrink-0">
                  current
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
