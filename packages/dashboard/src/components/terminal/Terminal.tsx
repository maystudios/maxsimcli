import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { SerializeAddon } from "@xterm/addon-serialize";
import "@xterm/xterm/css/xterm.css";
import { useTerminal } from "@/hooks/use-terminal";
import { TerminalStatusBar } from "./TerminalStatusBar";
import { QuickActionBar } from "./QuickActionBar";

interface TerminalProps {
  onReady?: (term: XTerm) => void;
}

export function Terminal({ onReady }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipPermissions, setSkipPermissions] = useState(true);

  const {
    connected,
    unavailable,
    status,
    exitCode,
    writeInput,
    resize,
    spawn,
    kill,
    onOutput,
    onScrollback,
  } = useTerminal({ autoSpawn: true, skipPermissions });

  // Wire up output callbacks
  const handleOutput = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  const handleScrollback = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  useEffect(() => {
    onOutput.current = handleOutput;
    onScrollback.current = handleScrollback;
    return () => {
      onOutput.current = null;
      onScrollback.current = null;
    };
  }, [handleOutput, handleScrollback, onOutput, onScrollback]);

  // Initialize xterm
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: "#0a0a0a",
        foreground: "#e0e0e0",
        cursor: "#e0e0e0",
      },
    });

    const fitAddon = new FitAddon();
    const serializeAddon = new SerializeAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(serializeAddon);

    try {
      term.loadAddon(new WebglAddon());
    } catch {
      // Fallback to canvas renderer
    }

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send keyboard input to server
    const dataDisposable = term.onData((data) => {
      writeInput(data);
    });

    // Resize observer with debounce
    const observer = new ResizeObserver(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (fitAddonRef.current && termRef.current) {
          fitAddonRef.current.fit();
          resize(termRef.current.cols, termRef.current.rows);
        }
      }, 100);
    });
    observer.observe(containerRef.current);
    resizeObserverRef.current = observer;

    onReady?.(term);

    return () => {
      dataDisposable.dispose();
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      resizeObserverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestart = useCallback(() => {
    spawn(skipPermissions);
    // Restore focus to the terminal so the user can type immediately after restart
    setTimeout(() => termRef.current?.focus(), 100);
  }, [spawn, skipPermissions]);

  const handleStop = useCallback(() => {
    kill();
  }, [kill]);

  const handleToggleSkipPermissions = useCallback(() => {
    setSkipPermissions((prev) => !prev);
  }, []);

  return (
    // onWheel stopPropagation: prevent parent scroll containers from stealing wheel events
    // when the terminal is in split/compact view
    <div className="flex h-full w-full flex-col" onWheel={(e) => e.stopPropagation()}>
      {/* Terminal area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Quick action bar */}
        <QuickActionBar
          onSendCommand={writeInput}
          isActive={status?.isActive ?? false}
          isAlive={status?.alive ?? false}
          unavailable={unavailable}
        />

        {/* Unavailable overlay */}
        {unavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card">
            <div className="max-w-sm text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">Terminal unavailable</h2>
              <p className="text-sm text-muted-foreground">
                node-pty is not installed. Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">npm install node-pty</code> in the dashboard directory.
              </p>
            </div>
          </div>
        )}

        {/* Reconnection overlay (only when disconnected, not clean exit) */}
        {!connected && exitCode === null && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Reconnecting...
            </div>
          </div>
        )}

        {/* Exit banner */}
        {exitCode !== null && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-card/90 px-4 py-2 font-mono text-sm backdrop-blur-sm">
            <span className="text-muted-foreground">
              Process exited (code {exitCode})
            </span>
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-sm bg-accent px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent-glow"
            >
              Restart
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <TerminalStatusBar
        status={status}
        connected={connected}
        exitCode={exitCode}
        skipPermissions={skipPermissions}
        onToggleSkipPermissions={handleToggleSkipPermissions}
        onStop={handleStop}
        onRestart={handleRestart}
      />
    </div>
  );
}
