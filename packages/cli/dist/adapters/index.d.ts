/**
 * @maxsim/adapters — Runtime adapter registry (Claude Code only)
 */
import type { AdapterConfig } from '../core/index.js';
export { claudeAdapter } from './claude.js';
export { installClaude } from './claude.js';
export type { RuntimeName, AdapterConfig } from '../core/index.js';
export type { InstallOptions } from './types.js';
export { expandTilde, extractFrontmatterAndBody, processAttribution, buildHookCommand, readSettings, writeSettings, } from './base.js';
/**
 * Get all registered adapters.
 */
export declare function getAllAdapters(): AdapterConfig[];
//# sourceMappingURL=index.d.ts.map