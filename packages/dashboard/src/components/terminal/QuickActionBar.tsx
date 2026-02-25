import { useState, useEffect, useCallback, useRef } from "react";

interface QuickCommand {
  label: string;
  command: string;
}

interface QuickActionBarProps {
  onSendCommand: (cmd: string) => void;
  isActive: boolean;
  isAlive: boolean;
  unavailable?: boolean;
}

const DEFAULT_COMMANDS: QuickCommand[] = [
  { label: "Progress", command: "/maxsim:progress" },
  { label: "New Project", command: "/maxsim:new-project" },
  { label: "Discuss", command: "/maxsim:discuss-phase N" },
  { label: "Plan", command: "/maxsim:plan-phase N" },
  { label: "Execute", command: "/maxsim:execute-phase N" },
  { label: "Roadmap", command: "/maxsim:roadmap" },
  { label: "Verify", command: "/maxsim:verify-work" },
  { label: "Resume", command: "/maxsim:resume-work" },
];

const STORAGE_KEY = "maxsim-quick-commands";
const PHASE_CACHE_TTL = 30_000;

function loadCommands(): QuickCommand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as QuickCommand[];
  } catch {
    // ignore
  }
  return DEFAULT_COMMANDS;
}

function saveCommands(cmds: QuickCommand[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cmds));
}

export function QuickActionBar({
  onSendCommand,
  isActive,
  isAlive,
  unavailable = false,
}: QuickActionBarProps) {
  const [minimized, setMinimized] = useState(false);
  const [commands, setCommands] = useState<QuickCommand[]>(loadCommands);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmCommand, setConfirmCommand] = useState<{
    label: string;
    resolved: string;
  } | null>(null);

  // Phase cache
  const phaseCacheRef = useRef<{ value: string; ts: number } | null>(null);

  const resolvePhase = useCallback(async (cmd: string): Promise<string> => {
    if (!cmd.includes(" N")) return cmd;

    const cache = phaseCacheRef.current;
    if (cache && Date.now() - cache.ts < PHASE_CACHE_TTL) {
      return cmd.replace(" N", ` ${cache.value}`);
    }

    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        const phase = String(data.currentPhase ?? "1");
        phaseCacheRef.current = { value: phase, ts: Date.now() };
        return cmd.replace(" N", ` ${phase}`);
      }
    } catch {
      // fallback: leave N
    }
    return cmd;
  }, []);

  const disabled = unavailable || isActive || !isAlive;

  const handleClick = useCallback(
    async (cmd: QuickCommand) => {
      if (disabled) return;
      const resolved = await resolvePhase(cmd.command);
      setConfirmCommand({ label: cmd.label, resolved });
    },
    [disabled, resolvePhase]
  );

  const handleConfirm = useCallback(() => {
    if (confirmCommand) {
      onSendCommand(confirmCommand.resolved + "\r");
      setConfirmCommand(null);
    }
  }, [confirmCommand, onSendCommand]);

  const handleCancel = useCallback(() => {
    setConfirmCommand(null);
  }, []);

  // Settings handlers
  const [editCommands, setEditCommands] = useState<QuickCommand[]>([]);

  const openSettings = useCallback(() => {
    setEditCommands([...commands]);
    setSettingsOpen(true);
  }, [commands]);

  const saveSettings = useCallback(() => {
    const filtered = editCommands.filter(
      (c) => c.label.trim() && c.command.trim()
    );
    setCommands(filtered);
    saveCommands(filtered);
    setSettingsOpen(false);
  }, [editCommands]);

  if (minimized) {
    return (
      <div className="absolute bottom-2 right-2 z-20">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="rounded-md bg-card/80 p-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur-sm border border-border hover:text-foreground transition-colors"
          title="Show quick actions"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 z-20 flex flex-col items-end gap-1">
      {/* Confirmation popup */}
      {confirmCommand && (
        <div className="rounded-lg bg-card border border-border shadow-lg p-2 text-xs mb-1 backdrop-blur-sm">
          <p className="text-muted-foreground mb-1.5">
            Send{" "}
            <span className="font-mono text-foreground">
              {confirmCommand.resolved}
            </span>
            ?
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-sm bg-accent px-2 py-0.5 text-foreground hover:bg-accent-glow transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-sm bg-muted px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && (
        <div className="rounded-lg bg-card border border-border shadow-lg p-3 text-xs mb-1 backdrop-blur-sm w-72 max-h-64 overflow-y-auto">
          <p className="text-muted-foreground font-medium mb-2">
            Quick Commands
          </p>
          {editCommands.map((cmd, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                className="flex-[1] rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground"
                value={cmd.label}
                onChange={(e) => {
                  const next = [...editCommands];
                  next[i] = { ...next[i], label: e.target.value };
                  setEditCommands(next);
                }}
                placeholder="Label"
              />
              <input
                className="flex-[2] rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground"
                value={cmd.command}
                onChange={(e) => {
                  const next = [...editCommands];
                  next[i] = { ...next[i], command: e.target.value };
                  setEditCommands(next);
                }}
                placeholder="Command"
              />
              <button
                type="button"
                onClick={() =>
                  setEditCommands(editCommands.filter((_, j) => j !== i))
                }
                className="text-muted-foreground hover:text-destructive transition-colors px-0.5"
                title="Remove"
              >
                x
              </button>
            </div>
          ))}
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={() =>
                setEditCommands([
                  ...editCommands,
                  { label: "", command: "" },
                ])
              }
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-sm bg-muted px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="rounded-sm bg-accent px-2 py-0.5 text-foreground hover:bg-accent-glow transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Button bar */}
      <div className="flex items-center gap-1 rounded-lg bg-card/80 border border-border shadow-lg p-1.5 backdrop-blur-sm">
        {commands.map((cmd) => (
          <button
            key={cmd.label}
            type="button"
            onClick={() => handleClick(cmd)}
            disabled={disabled}
            className="rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            title={unavailable ? "Terminal unavailable — node-pty not installed" : cmd.command}
          >
            {cmd.label}
          </button>
        ))}

        {/* Settings gear */}
        <button
          type="button"
          onClick={openSettings}
          className="rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-0.5"
          title="Settings"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>

        {/* Minimize */}
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Minimize"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
