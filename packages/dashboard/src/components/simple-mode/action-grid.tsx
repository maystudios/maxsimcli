import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useSimpleMode } from "@/components/providers/simple-mode-provider";
import type { SimpleTab } from "@/components/providers/simple-mode-provider";
import { ACTION_DEFS } from "@/lib/simple-mode-actions";
import { ActionCard } from "./action-card";

const PAGE_SIZE = 6;

interface ActionGridProps {
  onExecute: (cmd: string) => void;
}

export function ActionGrid({ onExecute }: ActionGridProps) {
  const { roadmap } = useDashboardData();
  const { activeTab, setTab } = useSimpleMode();
  const prevTabRef = useRef<SimpleTab>(activeTab);
  const [showAll, setShowAll] = useState<Record<SimpleTab, boolean>>({ plan: false, execute: false });

  const roadmapData = roadmap ?? null;

  const planActions = ACTION_DEFS.filter(a => a.tab === "plan");
  const executeActions = ACTION_DEFS.filter(a => a.tab === "execute");

  const isEmptyState = (roadmap?.phases?.length ?? 0) === 0;

  const filteredPlan = isEmptyState
    ? planActions.filter(a => a.id === "new-project" || a.id === "init-existing")
    : planActions;
  const filteredExecute = isEmptyState ? [] : executeActions;

  const tabActions = activeTab === "plan" ? filteredPlan : filteredExecute;
  const showAllForTab = showAll[activeTab];
  const visibleActions = showAllForTab ? tabActions : tabActions.slice(0, PAGE_SIZE);
  const hasMore = tabActions.length > PAGE_SIZE && !showAllForTab;

  function handleTabChange(tab: SimpleTab) {
    prevTabRef.current = activeTab;
    setTab(tab);
  }

  const slideDir = activeTab === "plan" && prevTabRef.current === "execute" ? -1 : 1;

  return (
    <div className="flex flex-col gap-0">
      <div className="flex border-b border-border">
        {(["plan", "execute"] as SimpleTab[]).map((tab) => {
          const count = tab === "plan" ? filteredPlan.length : filteredExecute.length;
          const label = tab === "plan" ? "Plan & Discuss" : "Execute & Verify";
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={cn(
                "flex-1 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors duration-200 border-b-2",
                activeTab === tab
                  ? "border-b-simple-accent text-simple-accent"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ x: slideDir * 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDir * -20, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tabActions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No actions available in this tab.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-3">
                  {visibleActions.map(action => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      roadmap={roadmapData}
                      onExecute={onExecute}
                    />
                  ))}
                </div>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setShowAll(prev => ({ ...prev, [activeTab]: true }))}
                    className="w-full border-t border-border py-2.5 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover:bg-card-hover"
                  >
                    Show more ({tabActions.length - PAGE_SIZE} more)
                  </button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
