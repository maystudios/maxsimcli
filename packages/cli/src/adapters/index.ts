/**
 * @maxsim/adapters — Runtime adapter registry
 */

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
