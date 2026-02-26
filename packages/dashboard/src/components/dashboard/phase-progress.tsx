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
      return "bg-muted-foreground/40";
  }
}

function dotColor(status: DashboardPhase["diskStatus"]): string {
  switch (status) {
    case "complete":
      return "bg-success";
    case "partial":
      return "bg-accent";
    default:
      return "bg-muted-foreground/40";
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
      className={`group relative w-full text-left transition-colors duration-200 bg-background ${
        isCurrent
          ? "border-l-2 border-l-accent"
          : "border-l-2 border-l-transparent hover:border-l-accent/40"
      }`}
    >
      {/* Hover overlay — matches website feature card hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-card-hover" />

      <div className="relative flex items-center gap-3 px-4 py-3">
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
          <span className={`inline-block h-1.5 w-1.5 shrink-0 ${dotColor(status)}`} />
        )}

        <span
          className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
            isCurrent ? "text-accent" : "text-muted-foreground"
          }`}
        >
          {phaseNumber}
        </span>

        <span className="truncate text-sm text-foreground/90">{phaseName}</span>

        <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {completedPlans}/{totalPlans}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-px w-full bg-muted/50">
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
