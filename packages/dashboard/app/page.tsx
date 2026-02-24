"use client";

import { useState } from "react";
import { useDashboardData } from "@/app/hooks/use-dashboard-data";
import { StatsHeader } from "@/app/components/dashboard/stats-header";
import { PhaseList } from "@/app/components/dashboard/phase-list";
import type { DashboardPhase } from "@/lib/types";

/** Skeleton placeholder for loading state */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Stats header skeleton */}
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="h-3 w-40 animate-pulse rounded-sm bg-muted" />
        <div className="h-2 w-full animate-pulse rounded-sm bg-muted" />
        <div className="flex gap-8">
          <div className="h-8 w-20 animate-pulse rounded-sm bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-sm bg-muted" />
          <div className="ml-auto flex gap-6">
            <div className="h-6 w-24 animate-pulse rounded-sm bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-sm bg-muted" />
          </div>
        </div>
      </div>

      {/* Phase list skeleton */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between px-4">
          <div className="h-3 w-16 animate-pulse rounded-sm bg-muted" />
          <div className="h-3 w-6 animate-pulse rounded-sm bg-muted" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-8 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded-sm bg-muted" />
            </div>
            <div className="h-1.5 w-full animate-pulse rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Error state with retry button */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="font-mono text-sm text-danger">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-sm bg-accent px-4 py-2 font-mono text-xs text-foreground transition-colors hover:bg-accent-glow"
      >
        Retry
      </button>
    </div>
  );
}

export default function Home() {
  const { roadmap, state, todos, loading, error } = useDashboardData();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl">
        <LoadingSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  // Build phases array from roadmap data (camelCase mapping)
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

  const handlePhaseClick = (phaseNumber: string) => {
    setSelectedPhase(phaseNumber);
    // Phase drill-down will be implemented in Plan 05
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <StatsHeader roadmap={roadmap} state={state} todos={todos} />
      <PhaseList
        phases={phases}
        currentPhase={currentPhase}
        onPhaseClick={handlePhaseClick}
      />
    </main>
  );
}
