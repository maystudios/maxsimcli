/**
 * @maxsim/adapters — Runtime adapter registry (Claude Code only)
 */

import type { AdapterConfig } from '../core/index.js';
import { claudeAdapter } from './claude.js';

// Re-export adapters
export { claudeAdapter } from './claude.js';
export { installClaude } from './claude.js';

// Re-export types
export type { RuntimeName, AdapterConfig } from '../core/index.js';
export type { InstallOptions } from './types.js';

// Re-export base utilities
export {
  expandTilde,
  extractFrontmatterAndBody,
  processAttribution,
  buildHookCommand,
  readSettings,
  writeSettings,
} from './base.js';

/**
 * Get all registered adapters.
 */
export function getAllAdapters(): AdapterConfig[] {
  return [claudeAdapter];
}
