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
export { CRITICAL_THRESHOLD, ContextMonitorInput, ContextMonitorOutput, DEBOUNCE_CALLS, STALE_SECONDS, WARNING_THRESHOLD, processContextMonitor };
//# sourceMappingURL=maxsim-context-monitor.d.cts.map