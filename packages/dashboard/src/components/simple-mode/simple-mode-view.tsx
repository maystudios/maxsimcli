import { RecommendationCard } from "./recommendation-card";
import { ActionGrid } from "./action-grid";

export function SimpleModeView() {
  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl flex flex-col gap-4">
          <RecommendationCard />
          <ActionGrid />
        </div>
      </div>
    </div>
  );
}
