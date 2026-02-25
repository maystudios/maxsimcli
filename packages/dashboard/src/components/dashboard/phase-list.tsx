import { PhaseProgress } from "./phase-progress";
import type { DashboardPhase } from "@/lib/types";

interface PhaseListProps {
  phases: DashboardPhase[];
  currentPhase: string | null;
  onPhaseClick: (id: string) => void;
}

/**
 * Vertical list of all phases with individual progress bars and status icons.
 *
 * Current phase is visually highlighted via PhaseProgress accent border.
 */
export function PhaseList({ phases, currentPhase, onPhaseClick }: PhaseListProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Phases
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {phases.length}
        </span>
      </div>

      {/* Phase entries */}
      <div className="flex flex-col gap-1">
        {phases.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="font-mono text-xs text-muted-foreground">
              No project initialized yet.
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Run{" "}
              <code className="rounded-sm bg-muted px-1.5 py-0.5 text-accent">
                /maxsim:new-project
              </code>{" "}
              in Claude Code to get started.
            </span>
          </div>
        ) : (
          phases.map((phase) => (
            <PhaseProgress
              key={phase.number}
              phaseNumber={phase.number}
              phaseName={phase.name}
              completedPlans={phase.summaryCount}
              totalPlans={phase.planCount}
              status={phase.diskStatus}
              isCurrent={phase.number === currentPhase}
              onClick={onPhaseClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
