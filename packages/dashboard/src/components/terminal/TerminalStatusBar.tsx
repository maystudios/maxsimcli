import { cn } from "@/lib/utils";
import type { TerminalStatus } from "@/hooks/use-terminal";

interface TerminalStatusBarProps {
  status: TerminalStatus | null;
  connected: boolean;
  exitCode: number | null;
  skipPermissions: boolean;
  onToggleSkipPermissions: () => void;
  onStop: () => void;
  onRestart: () => void;
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function truncateCwd(cwd: string): string {
  const segments = cwd.replace(/\\/g, "/").split("/").filter(Boolean);
  if (segments.length <= 2) return cwd;
  return ".../" + segments.slice(-2).join("/");
}

export function TerminalStatusBar({
  status,
  connected,
  exitCode,
  skipPermissions,
  onToggleSkipPermissions,
  onStop,
  onRestart,
}: TerminalStatusBarProps) {
  const alive = connected && status?.alive;
  const dotColor = !connected
    ? "bg-red-500"
    : alive
      ? "bg-green-500"
      : "bg-yellow-500";

  const statusText = !connected
    ? "Disconnected"
    : alive
      ? `Running (PID ${status?.pid ?? "?"})`
      : "Stopped";

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span
          className={cn("inline-block h-2 w-2 rounded-full", dotColor)}
          title={statusText}
        />
        <span>{statusText}</span>
        {status && alive && (
          <>
            <span className="text-border">|</span>
            <span>{formatUptime(status.uptime)}</span>
            <span className="text-border">|</span>
            <span title={status.cwd}>{truncateCwd(status.cwd)}</span>
            <span className="text-border">|</span>
            <span>{status.memoryMB} MB</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={skipPermissions}
            onChange={onToggleSkipPermissions}
            className="h-3 w-3 accent-accent"
          />
          <span>Skip Perms</span>
        </label>

        {alive && (
          <button
            type="button"
            onClick={onStop}
            className="rounded-sm px-2 py-0.5 text-red-400 transition-colors hover:bg-red-500/20"
          >
            Stop
          </button>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="rounded-sm px-2 py-0.5 transition-colors hover:bg-accent/20"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
