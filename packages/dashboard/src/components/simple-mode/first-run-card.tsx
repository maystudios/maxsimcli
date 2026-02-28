import type { DashboardMode } from "@/lib/types";

interface FirstRunCardProps {
  onChoose: (mode: DashboardMode) => void;
}

export function FirstRunCard({ onChoose }: FirstRunCardProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm bg-background/60" />
      {/* Card */}
      <div className="relative z-10 border border-border bg-card p-8 max-w-lg w-full mx-4">
        <h2 className="font-bold text-lg tracking-tight text-foreground mb-1">Choose Your Dashboard Mode</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You can switch between modes at any time from the header toggle.
        </p>
        <div className="flex gap-4">
          {/* Simple Mode option */}
          <div className="flex-1 border border-border p-4 flex flex-col gap-3">
            <svg viewBox="0 0 120 70" className="w-full h-auto border border-border/40 bg-muted/20" aria-hidden="true">
              <rect x="0" y="0" width="120" height="12" fill="currentColor" fillOpacity="0.08" />
              <rect x="8" y="3" width="30" height="6" rx="1" fill="#14b8a6" fillOpacity="0.6" />
              <rect x="8" y="18" width="104" height="8" rx="1" fill="currentColor" fillOpacity="0.12" />
              <rect x="8" y="32" width="50" height="30" rx="1" fill="currentColor" fillOpacity="0.08" />
              <rect x="62" y="32" width="50" height="30" rx="1" fill="currentColor" fillOpacity="0.08" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground">Simple Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clean action cards. No terminal required.</p>
            </div>
            <button
              type="button"
              onClick={() => onChoose("simple")}
              className="border border-simple-accent bg-simple-accent/10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-simple-accent transition-colors hover:bg-simple-accent hover:text-background"
            >
              Use Simple Mode
            </button>
          </div>
          {/* Advanced Mode option */}
          <div className="flex-1 border border-border p-4 flex flex-col gap-3">
            <svg viewBox="0 0 120 70" className="w-full h-auto border border-border/40 bg-muted/20" aria-hidden="true">
              <rect x="0" y="0" width="120" height="70" fill="currentColor" fillOpacity="0.03" />
              <rect x="0" y="0" width="28" height="70" fill="currentColor" fillOpacity="0.08" />
              <rect x="3" y="3" width="22" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
              <rect x="3" y="12" width="22" height="3" rx="0.5" fill="currentColor" fillOpacity="0.12" />
              <rect x="3" y="18" width="22" height="3" rx="0.5" fill="currentColor" fillOpacity="0.12" />
              <rect x="30" y="4" width="86" height="28" rx="1" fill="currentColor" fillOpacity="0.08" />
              <rect x="30" y="36" width="86" height="28" rx="1" fill="#3b82f6" fillOpacity="0.1" />
              <rect x="33" y="39" width="12" height="2" rx="0.5" fill="#3b82f6" fillOpacity="0.5" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground">Advanced Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Full dashboard with terminal and phase viewer.</p>
            </div>
            <button
              type="button"
              onClick={() => onChoose("advanced")}
              className="border border-accent bg-accent/10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-foreground"
            >
              Use Advanced Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
