#!/usr/bin/env node
/**
 * Context Monitor - PostToolUse hook
 * Reads context metrics from the statusline bridge file and injects
 * warnings when context usage is high.
 */
export declare const WARNING_THRESHOLD = 35;
export declare const CRITICAL_THRESHOLD = 25;
export declare const STALE_SECONDS = 60;
export declare const DEBOUNCE_CALLS = 5;
export interface ContextMonitorInput {
    session_id?: string;
}
export interface ContextMonitorOutput {
    hookSpecificOutput: {
        hookEventName: string;
        additionalContext: string;
    };
}
export declare function processContextMonitor(data: ContextMonitorInput): ContextMonitorOutput | null;
//# sourceMappingURL=maxsim-context-monitor.d.ts.map