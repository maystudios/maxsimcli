/**
 * @maxsim/adapters — Claude Code adapter
 *
 * Ports the Claude-specific logic from bin/install.js:
 *   - getGlobalDir('claude', ...)  (lines 135-142)
 *   - getDirName('claude')         (line 49)
 *   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
 *   - copyWithPathReplacement for Claude (lines 839-892)
 */
import type { AdapterConfig } from '@maxsim/core';
/**
 * Claude Code adapter configuration.
 * Claude uses nested command structure (commands/maxsim/*.md).
 */
export declare const claudeAdapter: AdapterConfig;
/**
 * Install Claude Code adapter files.
 * Stub — actual install orchestration will be implemented in Phase 5.
 */
export declare function installClaude(): void;
//# sourceMappingURL=claude.d.ts.map