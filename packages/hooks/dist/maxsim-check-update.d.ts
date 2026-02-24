#!/usr/bin/env node
/**
 * Check for MAXSIM updates in background, write result to cache.
 * Called by SessionStart hook - runs once per session.
 */
export interface UpdateCheckResult {
    update_available: boolean;
    installed: string;
    latest: string;
    checked: number;
}
export interface CheckForUpdateOptions {
    homeDir: string;
    cwd: string;
}
export declare function checkForUpdate(options: CheckForUpdateOptions): void;
//# sourceMappingURL=maxsim-check-update.d.ts.map