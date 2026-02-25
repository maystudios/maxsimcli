/**
 * @maxsim/hooks — Re-exports for unit testing.
 * Do NOT import this module at runtime; hooks run as standalone CJS bundles.
 */

export { checkForUpdate } from './maxsim-check-update';
export type { UpdateCheckResult, CheckForUpdateOptions } from './maxsim-check-update';

export { processContextMonitor, WARNING_THRESHOLD, CRITICAL_THRESHOLD, STALE_SECONDS, DEBOUNCE_CALLS } from './maxsim-context-monitor';
export type { ContextMonitorInput, ContextMonitorOutput } from './maxsim-context-monitor';

export { formatStatusline } from './maxsim-statusline';
export type { StatuslineInput } from './maxsim-statusline';
