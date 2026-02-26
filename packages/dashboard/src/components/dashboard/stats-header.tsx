import { motion } from "motion/react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import type { RoadmapAnalysis } from "@maxsim/core";
import type { ParsedState, TodoItem } from "@/lib/types";

interface StatsHeaderProps {
  roadmap: RoadmapAnalysis | null;
  state: ParsedState | null;
  todos: { pending: TodoItem[]; completed: TodoItem[] } | null;
}

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
    <div className="border-b border-border pb-6">
      {/* Section label — website accent line pattern */}
      <div className="flex items-center gap-3 mb-4">
        <span className="block w-6 h-px bg-accent" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Milestone Progress
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {completedPhases}/{totalPhases} phases
          </span>
          <span
            className={`inline-block h-1.5 w-1.5 ${connected ? "bg-success" : "bg-danger"}`}
            title={connected ? "Connected" : "Disconnected"}
          />
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted mb-5">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-10">
        {/* Left group: progress % + current phase */}
        <div className="flex items-end gap-4 sm:gap-10">
          <div>
            <span className="font-mono text-3xl font-bold tabular-nums text-foreground leading-none">
              {progressPercent}
            </span>
            <span className="text-sm text-muted-foreground ml-1">%</span>
          </div>

          <div className="border-l border-border pl-4 sm:pl-10">
            <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">
              Current
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold text-accent">
                {currentPhaseNum}
              </span>
              <span className="truncate text-sm text-foreground/80 max-w-[140px] sm:max-w-none">{currentPhaseName}</span>
            </div>
          </div>
        </div>

        {/* Right group: blockers + todos */}
        <div className="flex items-end gap-6 sm:ml-auto sm:gap-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">
              Blockers
            </span>
            <span
              className={`font-mono text-xl font-bold tabular-nums ${
                openBlockers > 0 ? "text-danger" : "text-muted-foreground"
              }`}
            >
              {openBlockers}
            </span>
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">
              Todos
            </span>
            <span
              className={`font-mono text-xl font-bold tabular-nums ${
                openTodos > 0 ? "text-warning" : "text-muted-foreground"
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
