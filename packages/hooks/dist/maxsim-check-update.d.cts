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
export { CheckForUpdateOptions, UpdateCheckResult, checkForUpdate };
//# sourceMappingURL=maxsim-check-update.d.cts.map