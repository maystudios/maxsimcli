export function SkeletonCard() {
  return (
    <div className="border border-border bg-card p-4 animate-pulse">
      {/* Skeleton header pill */}
      <div className="h-3 w-16 bg-muted mb-3" />

      {/* Skeleton question text */}
      <div className="h-4 w-3/4 bg-muted mb-2" />
      <div className="h-4 w-1/2 bg-muted mb-4" />

      {/* Skeleton option blocks */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-muted" />
        <div className="h-10 flex-1 bg-muted" />
      </div>

      {/* Spinner indicator */}
      <div className="flex items-center gap-2 mt-3">
        <svg
          className="h-3.5 w-3.5 text-simple-accent animate-spin"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            strokeDasharray="28"
            strokeDashoffset="8"
          />
        </svg>
        <span className="text-[10px] text-muted-foreground">
          Loading question...
        </span>
      </div>
    </div>
  );
}
