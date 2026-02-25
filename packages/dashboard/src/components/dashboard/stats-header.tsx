import { motion } from "motion/react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import type { RoadmapAnalysis } from "@maxsim/core";
import type { ParsedState, TodoItem } from "@/lib/types";

interface StatsHeaderProps {
  roadmap: RoadmapAnalysis | null;
  state: ParsedState | null;
  todos: { pending: TodoItem[]; completed: TodoItem[] } | null;
}

/**
 * Dashboard stats header bar showing at-a-glance project status.
 */
export function StatsHeader({ roadmap, state, todos }: StatsHeaderProps) {
  const { connected } = useWebSocket();

  const progressPercent = roadmap?.progress_percent ?? 0;
  const currentPhaseNum = roadmap?.current_phase ?? state?.currentPhase ?? "--";
  const currentPhaseName =
    roadmap?.phases.find((p) => p.number === roadmap.current_phase)?.name ?? "";

  const openBlockers =
    state?.blockers.filter((b) => !b.includes("RESOLVED")).length ?? 0;

  const openTodos = todos?.pending.length ?? 0;
  const completedPhases = roadmap?.completed_phases ?? 0;
  const totalPhases = roadmap?.phase_count ?? 0;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5">
      {/* Top row: connection status + milestone label */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connected ? "bg-success" : "bg-danger"
          }`}
          title={connected ? "Connected" : "Disconnected"}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Milestone Progress
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {completedPhases}/{totalPhases} phases
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
        <motion.div
          className="h-full rounded-sm bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-8">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {progressPercent}%
          </span>
          <span className="text-xs text-muted-foreground">complete</span>
        </div>

        <div className="flex items-baseline gap-2 border-l border-border pl-8">
          <span className="font-mono text-sm font-semibold text-accent">
            {currentPhaseNum}
          </span>
          <span className="text-sm text-foreground">{currentPhaseName}</span>
        </div>

        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Blockers
            </span>
            <span
              className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 font-mono text-xs font-bold ${
                openBlockers > 0
                  ? "bg-danger/20 text-danger shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {openBlockers}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Todos
            </span>
            <span
              className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 font-mono text-xs font-bold ${
                openTodos > 0
                  ? "bg-warning/20 text-warning"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {openTodos}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
