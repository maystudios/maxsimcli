import { useState, useCallback } from "react";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { PhaseList } from "@/components/dashboard/phase-list";
import { PhaseDetail } from "@/components/dashboard/phase-detail";
import { TodosPanel } from "@/components/dashboard/todos-panel";
import { BlockersPanel } from "@/components/dashboard/blockers-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import type { DashboardPhase } from "@/lib/types";

type ActiveView = "overview" | "phase" | "todos" | "blockers";

/** Skeleton placeholder for loading state */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
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

/** Inner app that depends on WebSocket context being available */
function DashboardApp() {
  const { roadmap, state, todos, loading, error } = useDashboardData();
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);

  const handleNavigate = useCallback((view: ActiveView, id?: string) => {
    setActiveView(view);
    if (view === "phase" && id) {
      setActivePhaseId(id);
    }
  }, []);

  const handlePhaseClick = useCallback((phaseNumber: string) => {
    setActiveView("phase");
    setActivePhaseId(phaseNumber);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setActiveView("overview");
    setActivePhaseId(null);
  }, []);

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

  /** Render the active view content */
  function renderContent() {
    if (loading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      );
    }

    switch (activeView) {
      case "overview":
        return (
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <StatsHeader roadmap={roadmap} state={state} todos={todos} />
            <PhaseList
              phases={phases}
              currentPhase={currentPhase}
              onPhaseClick={handlePhaseClick}
            />
          </div>
        );

      case "phase":
        return activePhaseId ? (
          <div className="mx-auto max-w-4xl">
            <PhaseDetail
              phaseId={activePhaseId}
              onBack={handleBackToOverview}
            />
          </div>
        ) : null;

      case "todos":
        return (
          <div className="mx-auto max-w-3xl">
            <TodosPanel />
          </div>
        );

      case "blockers":
        return (
          <div className="mx-auto max-w-3xl">
            <BlockersPanel />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          activeView={activeView}
          activePhaseId={activePhaseId}
          onNavigate={handleNavigate}
        />
      }
    >
      {renderContent()}
    </AppShell>
  );
}

/**
 * Root application component. Wraps everything in WebSocketProvider so all
 * child components can access the WebSocket context.
 */
export function App() {
  return (
    <WebSocketProvider>
      <DashboardApp />
    </WebSocketProvider>
  );
}
