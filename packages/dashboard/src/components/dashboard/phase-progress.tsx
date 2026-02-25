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

/** Status icon for phase completion state */
function StatusIcon({ status }: { status: DashboardPhase["diskStatus"] }) {
  switch (status) {
    case "complete":
      return (
        <svg
          className="h-4 w-4 text-success"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 8.5l3.5 3.5L13 4" />
        </svg>
      );
    case "partial":
      return (
        <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-accent bg-transparent" />
      );
    case "planned":
    case "researched":
    case "discussed":
      return (
        <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-muted-foreground bg-transparent" />
      );
    default:
      return (
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted" />
      );
  }
}

/** Color class for the progress bar fill based on status */
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

/**
 * Individual phase card with animated progress bar, plan count, and status.
 */
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
      className={`group flex w-full flex-col gap-2 rounded-sm px-4 py-3 text-left transition-colors ${
        isCurrent
          ? "border-l-4 border-l-accent bg-card-hover"
          : "border-l-4 border-l-transparent hover:bg-card-hover"
      }`}
    >
      <div className="flex items-center gap-3">
        {onToggleComplete ? (
          <input
            type="checkbox"
            checked={roadmapComplete}
            onChange={(e) => {
              e.stopPropagation();
              onToggleComplete(phaseNumber, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-accent"
            title={roadmapComplete ? "Mark incomplete" : "Mark complete"}
          />
        ) : (
          <StatusIcon status={status} />
        )}
        <span
          className={`font-mono text-sm font-semibold ${
            isCurrent ? "text-accent" : "text-muted-foreground"
          }`}
        >
          {phaseNumber}
        </span>
        <span className="truncate text-sm text-foreground">{phaseName}</span>
        <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
          {completedPlans}/{totalPlans}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
        <motion.div
          className={`h-full rounded-sm ${barColor(status)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </button>
  );
}
