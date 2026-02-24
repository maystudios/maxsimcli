import { watch, type FSWatcher } from "chokidar";
import type { WebSocketServer } from "ws";
import { broadcast } from "./websocket";

/**
 * Set of paths recently written by the dashboard itself.
 * Used to suppress broadcast for our own writes (prevents infinite loops).
 */
const suppressedPaths = new Map<string, number>();
const SUPPRESS_TTL_MS = 500;

/**
 * Mark a path as recently written by the dashboard.
 * The watcher will ignore changes to this path for SUPPRESS_TTL_MS.
 */
export function suppressPath(filePath: string): void {
  const normalized = normalizePath(filePath);
  suppressedPaths.set(normalized, Date.now());
}

/**
 * Check if a path is currently suppressed.
 */
function isSuppressed(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const timestamp = suppressedPaths.get(normalized);
  if (timestamp === undefined) return false;

  if (Date.now() - timestamp > SUPPRESS_TTL_MS) {
    suppressedPaths.delete(normalized);
    return false;
  }
  return true;
}

/**
 * Normalize path separators to forward slashes (Windows compatibility).
 * chokidar on Windows may emit backslash paths.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Set up a chokidar watcher on the .planning/ directory.
 * Debounces file changes and broadcasts them via WebSocket.
 */
export function setupWatcher(
  cwd: string,
  wss: WebSocketServer
): FSWatcher {
  const planningDir = normalizePath(`${cwd}/.planning`);

  console.error(`[watcher] Watching ${planningDir}`);

  const watcher = watch(planningDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
    depth: 5,
  });

  // Debounce: collect changed paths, broadcast after 200ms of quiet
  let changedPaths = new Set<string>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onFileChange(filePath: string): void {
    const normalized = normalizePath(filePath);

    // Skip if this path was recently written by the dashboard
    if (isSuppressed(normalized)) {
      console.error(`[watcher] Suppressed: ${normalized}`);
      return;
    }

    changedPaths.add(normalized);

    // Reset debounce timer
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (changedPaths.size > 0) {
        const changes = Array.from(changedPaths);
        changedPaths = new Set();

        console.error(
          `[watcher] Broadcasting ${changes.length} change(s): ${changes.join(", ")}`
        );

        broadcast(wss, {
          type: "file-changes",
          changes,
          timestamp: Date.now(),
        });
      }
      debounceTimer = null;
    }, 200);
  }

  watcher.on("add", onFileChange);
  watcher.on("change", onFileChange);
  watcher.on("unlink", onFileChange);

  watcher.on("error", (err: unknown) => {
    console.error("[watcher] Error:", (err as Error).message);
  });

  return watcher;
}
