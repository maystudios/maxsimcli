import { PhaseProgress } from "./phase-progress";
import type { DashboardPhase } from "@/lib/types";

interface PhaseListProps {
  phases: DashboardPhase[];
  currentPhase: string | null;
  onPhaseClick: (id: string) => void;
  onToggleComplete?: (phaseNumber: string, checked: boolean) => void;
}

export function PhaseList({ phases, currentPhase, onPhaseClick, onToggleComplete }: PhaseListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header — website accent line pattern */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="block w-6 h-px bg-accent" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Phases
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{phases.length}</span>
      </div>

      {/* Phase grid — gap-px bg-border like website feature cards */}
      {phases.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-border px-4 py-10 text-center">
          <span className="text-sm text-muted-foreground">
            No project initialized yet.
          </span>
          <span className="text-sm text-muted-foreground">
            Run{" "}
            <code className="bg-muted px-1.5 py-0.5 font-mono text-accent text-xs">
              /maxsim:new-project
            </code>{" "}
            in Claude Code to get started.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-border">
          {phases.map((phase) => (
            <PhaseProgress
              key={phase.number}
              phaseNumber={phase.number}
              phaseName={phase.name}
              completedPlans={phase.summaryCount}
              totalPlans={phase.planCount}
              status={phase.diskStatus}
              roadmapComplete={phase.roadmapComplete}
              isCurrent={phase.number === currentPhase}
              onClick={onPhaseClick}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
