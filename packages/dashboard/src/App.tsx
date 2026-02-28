import { useState, useCallback, useRef, useEffect } from "react";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { SimpleModeProvider } from "@/components/providers/simple-mode-provider";
import { DiscussionProvider } from "@/components/providers/discussion-provider";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDashboardMode } from "@/hooks/use-dashboard-mode";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { PhaseList } from "@/components/dashboard/phase-list";
import { PhaseDetail } from "@/components/dashboard/phase-detail";
import { TodosPanel } from "@/components/dashboard/todos-panel";
import { BlockersPanel } from "@/components/dashboard/blockers-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Terminal } from "@/components/terminal/Terminal";
import { TerminalToggle, useTerminalLayout } from "@/components/terminal/TerminalTab";
import { ModeToggleButton } from "@/components/simple-mode/mode-toggle-button";
import { FirstRunCard } from "@/components/simple-mode/first-run-card";
import { SimpleModeView } from "@/components/simple-mode/simple-mode-view";
import type { DashboardPhase } from "@/lib/types";

export type ActiveView = "overview" | "phase" | "todos" | "blockers" | "terminal";

/** Skeleton placeholder for loading state */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats header skeleton */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="h-2 w-32 animate-pulse bg-muted" />
        <div className="h-px w-full animate-pulse bg-muted" />
        <div className="flex gap-10">
          <div className="h-8 w-16 animate-pulse bg-muted" />
          <div className="h-8 w-40 animate-pulse bg-muted" />
          <div className="ml-auto flex gap-8">
            <div className="h-6 w-12 animate-pulse bg-muted" />
            <div className="h-6 w-12 animate-pulse bg-muted" />
          </div>
        </div>
      </div>

      {/* Phase list skeleton */}
      <div className="flex flex-col">
        <div className="flex justify-between px-4 pb-3">
          <div className="h-2 w-12 animate-pulse bg-muted" />
          <div className="h-2 w-4 animate-pulse bg-muted" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-1.5 w-1.5 animate-pulse bg-muted" />
              <div className="h-3 w-6 animate-pulse bg-muted" />
              <div className="h-3 w-36 animate-pulse bg-muted" />
            </div>
            <div className="h-px w-full animate-pulse bg-muted" />
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
        className="border border-accent bg-accent/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-foreground"
      >
        Retry
      </button>
    </div>
  );
}

/** Inner app that depends on WebSocket context being available */
function DashboardApp() {
  const { roadmap, state, todos, loading, error } = useDashboardData();
  const { mode, setMode, initialized } = useDashboardMode();
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { splitMode, toggleSplit } = useTerminalLayout();
  const terminalWriteRef = useRef<((data: string) => void) | null>(null);

  const toggleMode = useCallback(() => {
    setMode(mode === "simple" ? "advanced" : "simple");
  }, [mode, setMode]);

  const modeToggle = initialized ? (
    <ModeToggleButton mode={mode} onToggle={toggleMode} />
  ) : null;
  /** Track the last non-terminal view for split mode dashboard content */
  const lastDashboardViewRef = useRef<{ view: ActiveView; phaseId: string | null }>({ view: "overview", phaseId: null });

  const handleNavigate = useCallback((view: ActiveView, id?: string) => {
    if (view !== "terminal") {
      lastDashboardViewRef.current = { view, phaseId: view === "phase" && id ? id : null };
    }
    setActiveView(view);
    if (view === "phase" && id) {
      setActivePhaseId(id);
    }
    setMobileMenuOpen(false);
  }, []);

  const pendingCommandRef = useRef<string | null>(null);

  const executeInTerminal = useCallback((cmd: string) => {
    if (terminalWriteRef.current) {
      terminalWriteRef.current(cmd + "\r");
    } else {
      // Terminal not ready yet — queue for when it connects
      pendingCommandRef.current = cmd;
    }
    handleNavigate("terminal");
  }, [handleNavigate]);

  // Flush pending command once terminal writeInput becomes available
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingCommandRef.current && terminalWriteRef.current) {
        terminalWriteRef.current(pendingCommandRef.current + "\r");
        pendingCommandRef.current = null;
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePhaseClick = useCallback((phaseNumber: string) => {
    setActiveView("phase");
    setActivePhaseId(phaseNumber);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setActiveView("overview");
    setActivePhaseId(null);
  }, []);

  const handleToggleComplete = useCallback(async (phaseNumber: string, checked: boolean) => {
    try {
      const res = await fetch("/api/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseNumber, checked }),
      });
      if (!res.ok) {
        console.error("[toggle-phase]", await res.text());
      }
    } catch (err) {
      console.error("[toggle-phase]", err);
    }
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
              onToggleComplete={handleToggleComplete}
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

      case "terminal":
        // Terminal content is rendered persistently below, not here
        return null;

      default:
        return null;
    }
  }

  const isTerminalView = activeView === "terminal";
  const isSimple = mode === "simple";

  return (
    <AppShell
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      headerRight={modeToggle}
      simpleMode={isSimple}
      sidebar={
        <div style={{ display: isSimple ? "none" : "contents" }}>
          <Sidebar
            activeView={activeView}
            activePhaseId={activePhaseId}
            onNavigate={handleNavigate}
            logoAction={modeToggle}
          />
        </div>
      }
    >
      {/* First-run card — shown above everything when mode is not yet chosen */}
      {initialized && mode === null && <FirstRunCard onChoose={setMode} />}

      {/* Simple Mode content area */}
      {isSimple && initialized && (
        <div className="flex flex-col flex-1 min-h-0">
          <SimpleModeView onExecute={executeInTerminal} />
        </div>
      )}

      {/* Advanced Mode content — always mounted, hidden when in Simple Mode */}
      <div style={{ display: isSimple ? "none" : "contents" }}>
        {/* Dashboard content: hidden when terminal is full-height, visible in split top half */}
        <div
          style={{ display: isTerminalView && !splitMode ? "none" : "block" }}
          className={
            isTerminalView && splitMode
              ? "h-1/2 min-h-0 overflow-auto border-b border-border p-4 sm:p-6"
              : "flex-1 overflow-y-auto p-4 sm:p-6"
          }
        >
          {renderContent()}
        </div>

        {/* Terminal: always mounted, visibility toggled via CSS */}
        <div
          style={{ display: isTerminalView ? "flex" : "none" }}
          className={`relative min-h-0 flex-col overflow-hidden ${isTerminalView && splitMode ? "h-1/2" : "flex-1"}`}
        >
          <TerminalToggle splitMode={splitMode} onToggle={toggleSplit} />
          <Terminal writeInputRef={terminalWriteRef} />
        </div>
      </div>
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
      <SimpleModeProvider>
        <DiscussionProvider>
          <DashboardApp />
        </DiscussionProvider>
      </SimpleModeProvider>
    </WebSocketProvider>
  );
}
