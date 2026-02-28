import { useDiscussion } from "@/components/providers/discussion-provider";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { RecommendationCard } from "./recommendation-card";
import { ActionGrid } from "./action-grid";
import { DiscussionView } from "./discussion/discussion-view";

function StatusBar() {
  const { lifecycleEvent, pendingQuestionCount } = useWebSocket();

  if (!lifecycleEvent && pendingQuestionCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-muted/50 border-b border-border text-xs font-mono text-muted-foreground">
      {lifecycleEvent && (
        <span>
          Phase {lifecycleEvent.phase_number}: {lifecycleEvent.phase_name}
          {" — "}
          {lifecycleEvent.event_type?.replace(/-/g, " ")}
          {lifecycleEvent.step && lifecycleEvent.total_steps
            ? ` (Step ${lifecycleEvent.step}/${lifecycleEvent.total_steps})`
            : ""}
        </span>
      )}
      {pendingQuestionCount > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-semibold">
          {pendingQuestionCount} pending
        </span>
      )}
    </div>
  );
}

interface SimpleModeViewProps {
  onExecute: (cmd: string) => void;
}

export function SimpleModeView({ onExecute }: SimpleModeViewProps) {
  const { phase, startDiscussion, resetDiscussion } = useDiscussion();
  const { pendingQuestionCount } = useWebSocket();
  const isDiscussionActive = phase !== "idle";

  function handleExecute(cmd: string) {
    // Intercept "Discuss Phase" action — open discussion UI instead of terminal
    if (cmd.startsWith("/maxsim:discuss-phase")) {
      startDiscussion();
      return;
    }
    onExecute(cmd);
  }

  if (isDiscussionActive) {
    return (
      <div className="flex flex-col gap-0 h-full">
        <StatusBar />
        {/* Back to actions link */}
        <div className="px-4 pt-3 sm:px-6 flex items-center gap-2">
          <button
            type="button"
            onClick={resetDiscussion}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M8 1L3 6l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to actions
          </button>
          {pendingQuestionCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-semibold">
              {pendingQuestionCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <DiscussionView />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full">
      <StatusBar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl flex flex-col gap-4">
          <RecommendationCard />
          <ActionGrid onExecute={handleExecute} />
        </div>
      </div>
    </div>
  );
}
