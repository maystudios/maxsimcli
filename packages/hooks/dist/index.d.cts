//#region src/maxsim-check-update.d.ts
/**
 * Check for MAXSIM updates in background, write result to cache.
 * Called by SessionStart hook - runs once per session.
 */
interface UpdateCheckResult {
  update_available: boolean;
  installed: string;
  latest: string;
  checked: number;
}
interface CheckForUpdateOptions {
  homeDir: string;
  cwd: string;
}
declare function checkForUpdate(options: CheckForUpdateOptions): void;
//#endregion
//#region src/maxsim-context-monitor.d.ts
/**
 * Context Monitor - PostToolUse hook
 * Reads context metrics from the statusline bridge file and injects
 * warnings when context usage is high.
 */
declare const WARNING_THRESHOLD = 35;
declare const CRITICAL_THRESHOLD = 25;
declare const STALE_SECONDS = 60;
declare const DEBOUNCE_CALLS = 5;
interface ContextMonitorInput {
  session_id?: string;
}
interface ContextMonitorOutput {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  };
}
declare function processContextMonitor(data: ContextMonitorInput): ContextMonitorOutput | null;
//#endregion
//#region src/maxsim-statusline.d.ts
/**
 * Claude Code Statusline - MAXSIM Edition
 * Shows: model | current task | directory | context usage
 */
interface StatuslineInput {
  model?: {
    display_name?: string;
  };
  workspace?: {
    current_dir?: string;
  };
  session_id?: string;
  context_window?: {
    remaining_percentage?: number;
  };
}
declare function formatStatusline(data: StatuslineInput): string;
//#endregion
export { CRITICAL_THRESHOLD, type CheckForUpdateOptions, type ContextMonitorInput, type ContextMonitorOutput, DEBOUNCE_CALLS, STALE_SECONDS, type StatuslineInput, type UpdateCheckResult, WARNING_THRESHOLD, checkForUpdate, formatStatusline, processContextMonitor };
//# sourceMappingURL=index.d.cts.map