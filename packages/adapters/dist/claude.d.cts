import { AdapterConfig } from "@maxsim/core";

//#region src/claude.d.ts
/**
 * Claude Code adapter configuration.
 * Claude uses nested command structure (commands/maxsim/*.md).
 */
declare const claudeAdapter: AdapterConfig;
/**
 * Install Claude Code adapter files.
 * Stub — actual install orchestration will be implemented in Phase 5.
 */
declare function installClaude(): void;
//#endregion
export { claudeAdapter, installClaude };
//# sourceMappingURL=claude.d.cts.map