import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { NetworkQRButton } from "@/components/network/NetworkQRButton";
import { cn } from "@/lib/utils";
import type { DashboardPhase } from "@/lib/types";

type ActiveView = "overview" | "phase" | "todos" | "blockers" | "terminal";

interface SidebarProps {
  activeView: ActiveView;
  activePhaseId: string | null;
  onNavigate: (view: ActiveView, id?: string) => void;
}

function statusBarClass(status: DashboardPhase["diskStatus"]): string {
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
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="flex flex-col gap-0.5 text-left"
        >
          <span className="font-mono text-sm font-bold tracking-widest uppercase text-foreground">
            MAXSIM
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Dashboard
          </span>
        </button>
      </div>

      {/* Phases */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Phases
          </span>
        </div>
        <nav className="flex flex-col">
          {phases.map((phase) => {
            const isActive = activeView === "phase" && activePhaseId === phase.number;
            const isCurrent = phase.number === currentPhase;

            return (
              <button
                key={phase.number}
                type="button"
                onClick={() => onNavigate("phase", phase.number)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-card-hover border-l-2 border-l-accent"
                    : "border-l-2 border-l-transparent hover:bg-card-hover",
                  isCurrent && !isActive && "border-l-accent/40"
                )}
              >
                {/* Status indicator */}
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 shrink-0",
                    statusBarClass(phase.diskStatus)
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold tabular-nums",
                    isCurrent || isActive ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {phase.number}
                </span>
                <span className="truncate text-xs text-foreground/80">
                  {phase.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary nav */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => onNavigate("todos")}
          className={cn(
            "flex w-full items-center justify-between px-5 py-2.5 text-left transition-colors",
            activeView === "todos"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">Todos</span>
          {openTodos > 0 && (
            <span className="font-mono text-[9px] font-bold text-warning tabular-nums">
              {openTodos}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("blockers")}
          className={cn(
            "flex w-full items-center justify-between px-5 py-2.5 text-left transition-colors border-t border-border",
            activeView === "blockers"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">Blockers</span>
          {openBlockers > 0 && (
            <span className="font-mono text-[9px] font-bold text-danger tabular-nums">
              {openBlockers}
            </span>
          )}
        </button>
      </div>

      {/* Terminal */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => onNavigate("terminal")}
          className={cn(
            "flex w-full items-center gap-2.5 px-5 py-2.5 text-left transition-colors",
            activeView === "terminal"
              ? "bg-card-hover text-foreground"
              : "hover:bg-card-hover text-muted-foreground"
          )}
        >
          <span className="font-mono text-[10px] font-bold">{">_"}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest">Terminal</span>
        </button>
      </div>

      <NetworkQRButton />

      {/* Footer: connection */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5",
              connected ? "bg-success" : "bg-danger"
            )}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
