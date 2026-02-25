/**
 * @maxsim/adapters — Runtime adapter registry
 */

import type { AdapterConfig } from '../core/index.js';
import { claudeAdapter } from './claude.js';
import { opencodeAdapter } from './opencode.js';
import { geminiAdapter } from './gemini.js';
import { codexAdapter } from './codex.js';

// Re-export adapters
export { claudeAdapter } from './claude.js';
export { installClaude } from './claude.js';
export { opencodeAdapter } from './opencode.js';
export { geminiAdapter } from './gemini.js';
export { codexAdapter } from './codex.js';

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

// Re-export transform functions
export {
  convertToolName,
  convertGeminiToolName,
} from './transforms/tool-maps.js';

export {
  colorNameToHex,
  toSingleLine,
  yamlQuote,
  extractFrontmatterField,
  convertClaudeToOpencodeFrontmatter,
  convertClaudeToGeminiToml,
  convertClaudeCommandToCodexSkill,
  getCodexSkillAdapterHeader,
} from './transforms/frontmatter.js';

export {
  convertSlashCommandsToCodexSkillMentions,
  convertClaudeToCodexMarkdown,
  stripSubTags,
  convertClaudeToGeminiAgent,
  replacePathReferences,
} from './transforms/content.js';

/**
 * Get all registered adapters.
 */
export function getAllAdapters(): AdapterConfig[] {
  return [claudeAdapter, opencodeAdapter, geminiAdapter, codexAdapter];
}
