import { useState, useEffect } from "react";
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

function statusDotClass(status: DashboardPhase["diskStatus"]): string {
  switch (status) {
    case "complete":
      return "bg-success";
    case "partial":
      return "bg-accent";
    case "planned":
    case "researched":
    case "discussed":
      return "bg-muted-foreground/50";
    default:
      return "bg-muted";
  }
}

export function Sidebar({ activeView, activePhaseId, onNavigate }: SidebarProps) {
  const { roadmap, state, todos } = useDashboardData();
  const { connected } = useWebSocket();
  const [confirmShutdown, setConfirmShutdown] = useState(false);

  useEffect(() => {
    if (!confirmShutdown) return;
    const t = setTimeout(() => setConfirmShutdown(false), 3000);
    return () => clearTimeout(t);
  }, [confirmShutdown]);

  async function handleShutdown() {
    if (!confirmShutdown) {
      setConfirmShutdown(true);
      return;
    }
    try {
      await fetch('/api/shutdown', { method: 'POST' });
    } catch {
      // server is shutting down — connection error is expected
    }
  }

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
      {/* Logo — matches website navbar style */}
      <div className="border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="flex flex-col gap-0.5 text-left"
        >
          <span className="text-sm font-bold tracking-tight text-foreground">
            MAXSIM
          </span>
          <span className="text-xs text-muted-foreground">
            Dashboard
          </span>
        </button>
      </div>

      {/* Phase section */}
      <div className="flex-1 overflow-y-auto">
        {/* Section label with accent line — website style */}
        <div className="flex items-center gap-2 px-5 py-3">
          <span className="block w-4 h-px bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
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
                  "flex w-full items-center gap-2.5 px-5 py-2 text-left transition-colors duration-200",
                  isActive
                    ? "bg-card-hover border-l-2 border-l-accent text-foreground"
                    : "border-l-2 border-l-transparent text-muted-foreground hover:text-foreground hover:bg-card-hover"
                )}
              >
                <span className={cn("inline-block h-1.5 w-1.5 shrink-0", statusDotClass(phase.diskStatus))} />
                <span className={cn("font-mono text-xs tabular-nums shrink-0", isCurrent || isActive ? "text-accent" : "")}>
                  {phase.number}
                </span>
                <span className="truncate text-xs">{phase.name}</span>
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
            "flex w-full items-center justify-between px-5 py-2.5 text-left transition-colors duration-200",
            activeView === "todos"
              ? "text-foreground bg-card-hover"
              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
          )}
        >
          <span className="text-sm">Todos</span>
          {openTodos > 0 && (
            <span className="font-mono text-xs text-warning tabular-nums">{openTodos}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("blockers")}
          className={cn(
            "flex w-full items-center justify-between border-t border-border px-5 py-2.5 text-left transition-colors duration-200",
            activeView === "blockers"
              ? "text-foreground bg-card-hover"
              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
          )}
        >
          <span className="text-sm">Blockers</span>
          {openBlockers > 0 && (
            <span className="font-mono text-xs text-danger tabular-nums">{openBlockers}</span>
          )}
        </button>
      </div>

      {/* Terminal */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => onNavigate("terminal")}
          className={cn(
            "flex w-full items-center gap-2 px-5 py-2.5 text-left transition-colors duration-200",
            activeView === "terminal"
              ? "text-foreground bg-card-hover"
              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
          )}
        >
          <span className="font-mono text-xs">{">"}_</span>
          <span className="text-sm">Terminal</span>
        </button>
      </div>

      <NetworkQRButton />

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn("inline-block h-1.5 w-1.5", connected ? "bg-success" : "bg-danger")} />
            <span className="text-xs text-muted-foreground">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShutdown}
            title={confirmShutdown ? "Click again to confirm shutdown" : "Shut down dashboard server"}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors duration-150",
              confirmShutdown
                ? "bg-danger/15 text-danger hover:bg-danger/25"
                : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path d="M6 2.5A5.5 5.5 0 1 0 10 3" strokeLinecap="round" />
              <path d="M8 1v5" strokeLinecap="round" />
            </svg>
            {confirmShutdown && <span>Confirm</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
