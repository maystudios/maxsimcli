import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { cn } from "@/lib/utils";
import type { DashboardPhase } from "@/lib/types";

type ActiveView = "overview" | "phase" | "todos" | "blockers" | "terminal";

interface SidebarProps {
  activeView: ActiveView;
  activePhaseId: string | null;
  onNavigate: (view: ActiveView, id?: string) => void;
}

/** Status dot color based on phase disk status */
function statusDotClass(status: DashboardPhase["diskStatus"]): string {
  switch (status) {
    case "complete":
      return "bg-success";
    case "partial":
      return "bg-accent";
    case "planned":
    case "researched":
    case "discussed":
      return "bg-muted-foreground";
    default:
      return "bg-muted";
  }
}

/**
 * Navigation sidebar with phase list, todos/blockers badges, and connection status.
 */
export function Sidebar({ activeView, activePhaseId, onNavigate }: SidebarProps) {
  const { roadmap, state, todos } = useDashboardData();
  const { connected } = useWebSocket();

  const phases: DashboardPhase[] = (roadmap?.phases ?? []).map((p) => ({
    number: p.number,
    name: p.name,
    goal: p.goal ?? "",
    dependsOn: p.depends_on ? [p.depends_on] : [],
    planCount: p.plan_count,
    summaryCount: p.summary_count,
    diskStatus: p.disk_status as DashboardPhase["diskStatus"],
    roadmapComplete: p.roadmap_complete,
    hasContext: p.has_context,
    hasResearch: p.has_research,
  }));

  const currentPhase = roadmap?.current_phase ?? null;
  const openBlockers = state?.blockers.filter((b) => !b.includes("RESOLVED")).length ?? 0;
  const openTodos = todos?.pending.length ?? 0;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo / Title */}
      <div className="border-b border-border px-4 py-4">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="flex flex-col gap-0.5 text-left"
        >
          <span className="font-mono text-lg font-bold tracking-tight text-foreground">
            MAXSIM
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Dashboard
          </span>
        </button>
      </div>

      {/* Main nav: Phase list */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Phases
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 px-1">
          {phases.map((phase) => {
            const isActive = activeView === "phase" && activePhaseId === phase.number;
            const isCurrent = phase.number === currentPhase;

            return (
              <button
                key={phase.number}
                type="button"
                onClick={() => onNavigate("phase", phase.number)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-3 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-l-accent bg-card-hover text-foreground"
                    : "border-l-2 border-l-transparent hover:bg-card-hover",
                  isCurrent && !isActive && "border-l-accent-glow"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2 w-2 shrink-0 rounded-full",
                    statusDotClass(phase.diskStatus)
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-xs font-semibold",
                    isCurrent || isActive ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {phase.number}
                </span>
                <span className="truncate text-xs text-foreground">
                  {phase.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary nav: Todos & Blockers */}
      <div className="border-t border-border px-1 py-2">
        <button
          type="button"
          onClick={() => onNavigate("todos")}
          className={cn(
            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors",
            activeView === "todos"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-xs uppercase tracking-wide">Todos</span>
          {openTodos > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-warning/20 px-1 font-mono text-[10px] font-bold text-warning">
              {openTodos}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("blockers")}
          className={cn(
            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors",
            activeView === "blockers"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-xs uppercase tracking-wide">Blockers</span>
          {openBlockers > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-danger/20 px-1 font-mono text-[10px] font-bold text-danger shadow-[0_0_6px_rgba(239,68,68,0.3)]">
              {openBlockers}
            </span>
          )}
        </button>
      </div>

      {/* Terminal nav */}
      <div className="border-t border-border px-1 py-2">
        <button
          type="button"
          onClick={() => onNavigate("terminal")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors",
            activeView === "terminal"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-xs font-bold">{">_"}</span>
          <span className="font-mono text-xs uppercase tracking-wide">Terminal</span>
        </button>
      </div>

      {/* Footer: Connection status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-success" : "bg-danger"
            )}
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </aside>
  );
}
