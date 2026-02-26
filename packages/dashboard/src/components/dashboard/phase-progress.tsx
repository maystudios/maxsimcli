import { motion } from "motion/react";
import type { DashboardPhase } from "@/lib/types";

interface PhaseProgressProps {
  phaseName: string;
  phaseNumber: string;
  completedPlans: number;
  totalPlans: number;
  status: DashboardPhase["diskStatus"];
  roadmapComplete: boolean;
  isCurrent: boolean;
  onClick: (phaseNumber: string) => void;
  onToggleComplete?: (phaseNumber: string, checked: boolean) => void;
}

function barColor(status: DashboardPhase["diskStatus"]): string {
  switch (status) {
    case "complete":
      return "bg-success";
    case "partial":
      return "bg-accent";
    default:
      return "bg-muted-foreground";
  }
}

export function PhaseProgress({
  phaseName,
  phaseNumber,
  completedPlans,
  totalPlans,
  status,
  roadmapComplete,
  isCurrent,
  onClick,
  onToggleComplete,
}: PhaseProgressProps) {
  const pct = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => onClick(phaseNumber)}
      className={`group w-full text-left transition-colors border-b border-border ${
        isCurrent ? "bg-card-hover border-l-2 border-l-accent" : "hover:bg-card-hover border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox / status marker */}
        {onToggleComplete ? (
          <input
            type="checkbox"
            checked={roadmapComplete}
            onChange={(e) => {
              e.stopPropagation();
              onToggleComplete(phaseNumber, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-3 w-3 shrink-0 cursor-pointer accent-accent"
            title={roadmapComplete ? "Mark incomplete" : "Mark complete"}
          />
        ) : (
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 ${barColor(status)}`}
          />
        )}

        <span
          className={`font-mono text-xs font-bold tabular-nums ${
            isCurrent ? "text-accent" : "text-muted-foreground"
          }`}
        >
          {phaseNumber}
        </span>

        <span className="truncate text-xs text-foreground/90">{phaseName}</span>

        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
          {completedPlans}/{totalPlans}
        </span>
      </div>

      {/* Progress bar — 1px height, flat */}
      <div className="h-px w-full bg-muted">
        <motion.div
          className={`h-full ${barColor(status)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </button>
  );
}
