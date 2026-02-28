import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useSimpleMode } from "@/components/providers/simple-mode-provider";
import type { SimpleTab } from "@/components/providers/simple-mode-provider";
import { ACTION_DEFS } from "@/lib/simple-mode-actions";

export function RecommendationCard() {
  const { roadmap } = useDashboardData();
  const { setTab, setExpanded } = useSimpleMode();

  const currentPhaseData = roadmap?.phases?.find(p => p.number === roadmap?.current_phase);
  let recommendedActionId: string | null = null;

  if (currentPhaseData) {
    const s = currentPhaseData.disk_status;
    if (s === "empty" || s === "no_directory" || s === "discussed" || s === "researched") {
      recommendedActionId = "plan-new-phase";
    } else if (s === "planned") {
      recommendedActionId = "execute-phase";
    } else if (s === "partial") {
      recommendedActionId = "execute-phase";
    } else if (s === "complete") {
      recommendedActionId = "verify-work";
    }
  } else if ((roadmap?.phases?.length ?? 0) === 0) {
    recommendedActionId = "new-project";
  }

  if (!recommendedActionId) return null;

  const action = ACTION_DEFS.find(a => a.id === recommendedActionId);
  if (!action) return null;

  const phaseName = currentPhaseData
    ? `Phase ${currentPhaseData.number}: ${currentPhaseData.name}`
    : "your project";

  function handleCTA() {
    const tab: SimpleTab = action!.tab;
    setTab(tab);
    setExpanded(action!.id);
  }

  return (
    <div className="border border-simple-accent/40 bg-simple-accent/5 p-4 flex items-center justify-between gap-4 mb-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-simple-accent font-mono mb-1">Recommended</p>
        <p className="text-sm text-foreground">
          <span className="font-medium">{phaseName}</span> is ready to{" "}
          <span className="text-simple-accent">{action.title.toLowerCase()}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleCTA}
        className="shrink-0 border border-simple-accent bg-simple-accent/10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-simple-accent transition-colors hover:bg-simple-accent hover:text-background"
      >
        {action.title}
      </button>
    </div>
  );
}
