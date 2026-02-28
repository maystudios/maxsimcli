import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSimpleMode } from "@/components/providers/simple-mode-provider";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ActionDef } from "@/lib/simple-mode-actions";
import type { RoadmapAnalysis } from "@maxsim/core";
import { ActionForm } from "./action-form";

interface ActionCardProps {
  action: ActionDef;
  roadmap: RoadmapAnalysis | null;
}

export function ActionCard({ action, roadmap }: ActionCardProps) {
  const { expandedCardId, setExpanded } = useSimpleMode();
  const { roadmap: roadmapData } = useDashboardData();
  const isOpen = expandedCardId === action.id;
  const isDisabled = !action.isAvailable(roadmap);

  // Determine recommended action (same logic as RecommendationCard)
  const currentPhaseData = roadmapData?.phases?.find(p => p.number === roadmapData?.current_phase);
  let recommendedId: string | null = null;
  if (currentPhaseData) {
    const s = currentPhaseData.disk_status;
    if (s === "empty" || s === "no_directory" || s === "discussed" || s === "researched") recommendedId = "plan-new-phase";
    else if (s === "planned" || s === "partial") recommendedId = "execute-phase";
    else if (s === "complete") recommendedId = "verify-work";
  } else if ((roadmapData?.phases?.length ?? 0) === 0) {
    recommendedId = "new-project";
  }
  const isRecommended = action.id === recommendedId;

  function handleClick() {
    if (isDisabled) return;
    setExpanded(isOpen ? null : action.id);
  }

  return (
    <div
      className={cn(
        "relative bg-card border-0 transition-all duration-200",
        isDisabled ? "opacity-50" : "cursor-pointer hover:shadow-md hover:-translate-y-px",
        isOpen && "ring-1 ring-simple-accent/40"
      )}
      title={isDisabled ? action.unavailableReason : undefined}
    >
      {isRecommended && !isDisabled && (
        <span className="absolute top-2 right-2 z-10 bg-simple-accent/20 border border-simple-accent/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-simple-accent">
          Recommended
        </span>
      )}

      <button
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={isOpen}
      >
        <span className={cn(
          "mt-0.5 shrink-0",
          isDisabled ? "text-muted-foreground" : "text-simple-accent"
        )}>
          {action.icon}
        </span>
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-foreground leading-tight">{action.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.description}</p>
        </div>
        <svg
          className={cn("mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="p-4">
              <ActionForm action={action} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
