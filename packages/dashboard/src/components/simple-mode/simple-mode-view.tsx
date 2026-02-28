import { useDiscussion } from "@/components/providers/discussion-provider";
import { RecommendationCard } from "./recommendation-card";
import { ActionGrid } from "./action-grid";
import { DiscussionView } from "./discussion/discussion-view";

interface SimpleModeViewProps {
  onExecute: (cmd: string) => void;
}

export function SimpleModeView({ onExecute }: SimpleModeViewProps) {
  const { phase, startDiscussion, resetDiscussion } = useDiscussion();
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
        {/* Back to actions link */}
        <div className="px-4 pt-3 sm:px-6">
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
        </div>
        <div className="flex-1 min-h-0">
          <DiscussionView />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl flex flex-col gap-4">
          <RecommendationCard />
          <ActionGrid onExecute={handleExecute} />
        </div>
      </div>
    </div>
  );
}
