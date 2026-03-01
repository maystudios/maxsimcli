import { motion } from "motion/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function PhaseProgressPanel() {
  const { roadmap, state } = useDashboardData();

  const currentPhaseNum = roadmap?.current_phase ?? state?.currentPhase ?? null;
  const currentPhaseData = roadmap?.phases?.find(
    (p) => p.number === currentPhaseNum
  );
  const progressPercent = roadmap?.progress_percent ?? 0;
  const completedPhases = roadmap?.completed_phases ?? 0;
  const totalPhases = roadmap?.phase_count ?? 0;

  if (!currentPhaseData && totalPhases === 0) return null;

  const phaseName = currentPhaseData
    ? `${currentPhaseData.number} - ${currentPhaseData.name}`
    : "No active phase";

  const diskStatus = currentPhaseData?.disk_status ?? "empty";
  const statusLabel =
    diskStatus === "complete"
      ? "Complete"
      : diskStatus === "partial"
        ? "In Progress"
        : diskStatus === "planned"
          ? "Planned"
          : diskStatus === "discussed"
            ? "Discussed"
            : diskStatus === "researched"
              ? "Researched"
              : "Not Started";

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Current Phase
        </span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {completedPhases}/{totalPhases} phases
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-2xl font-bold tabular-nums text-foreground leading-none">
          {progressPercent}%
        </span>
        <span className="text-sm text-foreground/80 truncate">
          {phaseName}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted mb-2">
        <motion.div
          className="h-full bg-simple-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {statusLabel}
        </span>
        {currentPhaseData && currentPhaseData.plan_count > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {currentPhaseData.summary_count}/{currentPhaseData.plan_count} plans
          </span>
        )}
      </div>
    </div>
  );
}
