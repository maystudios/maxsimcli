import { useState, useEffect, useRef } from "react";
import { useRunningDashboards, type RunningDashboard } from "@/hooks/use-running-dashboards";
import { cn } from "@/lib/utils";

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function truncatePath(cwd: string, maxLen = 36): string {
  if (cwd.length <= maxLen) return cwd;
  return `...${cwd.slice(-(maxLen - 3))}`;
}

export function ProjectSwitcher() {
  const { dashboards, loading } = useRunningDashboards();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = dashboards.find((d) => d.isCurrent);
  const projectName = current?.projectName ?? "Dashboard";

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleSelect(d: RunningDashboard, newTab = false) {
    if (d.isCurrent) {
      setOpen(false);
      return;
    }
    const url = `http://localhost:${d.port}`;
    if (newTab) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-left min-w-0 group"
      >
        <span
          className="text-xs text-muted-foreground truncate max-w-[140px] group-hover:text-foreground transition-colors duration-150"
          title={projectName}
        >
          {projectName}
        </span>
        {loading ? (
          <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
        ) : (
          <svg
            className={cn(
              "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150",
              open && "rotate-180"
            )}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded border border-border bg-card shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Running dashboards
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {dashboards.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No dashboards found
              </div>
            )}
            {dashboards.map((d) => (
              <button
                key={d.port}
                type="button"
                onClick={(e) => handleSelect(d, e.ctrlKey || e.metaKey)}
                onAuxClick={(e) => { if (e.button === 1) handleSelect(d, true); }}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors duration-150",
                  d.isCurrent
                    ? "bg-accent/10 border-l-2 border-l-accent"
                    : "border-l-2 border-l-transparent hover:bg-card-hover"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium truncate",
                      d.isCurrent ? "text-accent" : "text-foreground"
                    )}
                  >
                    {d.projectName}
                  </span>
                  {d.isCurrent && (
                    <span className="text-[10px] text-accent/70">current</span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {formatUptime(d.uptime)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground truncate" title={d.cwd}>
                    {truncatePath(d.cwd)}
                  </span>
                  {!d.isCurrent && (
                    <span className="ml-auto text-[9px] text-muted-foreground/50 shrink-0">
                      Ctrl+click: new tab
                    </span>
                  )}
                </div>
              </button>
            ))}
            {dashboards.length === 1 && (
              <div className="px-3 py-1.5 text-[10px] text-muted-foreground/60 text-center">
                (only instance)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
