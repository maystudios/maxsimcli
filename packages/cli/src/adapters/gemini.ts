/**
 * @maxsim/adapters — Gemini adapter
 *
 * Ports the Gemini-specific logic from bin/install.js:
 *   - getGlobalDir('gemini', ...)         (lines 113-122)
 *   - getDirName('gemini')                (line 47)
 *   - getConfigDirFromHome('gemini', isGlobal) (line 69)
 *   - convertClaudeToGeminiToml + convertClaudeToGeminiAgent + stripSubTags
 */

import * as path from 'node:path';
import * as os from 'node:os';
import type { AdapterConfig } from '../core/index.js';
import { expandTilde } from './base.js';
import { convertClaudeToGeminiToml } from './transforms/frontmatter.js';
import {
  convertClaudeToGeminiAgent,
  stripSubTags,
  replacePathReferences,
} from './transforms/content.js';

/**
 * Get the global config directory for Gemini.
 * Priority: explicitDir > GEMINI_CONFIG_DIR env > ~/.gemini
 */
function getGlobalDir(explicitDir?: string | null): string {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.GEMINI_CONFIG_DIR) {
    return expandTilde(process.env.GEMINI_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.gemini');
}

/**
 * Get the config directory path relative to home for hook templating.
 */
function getConfigDirFromHome(_isGlobal: boolean): string {
  return "'.gemini'";
}

/**
 * Transform markdown content for Gemini installation.
 * Applies TOML conversion for commands, agent conversion for agents,
 * stripSubTags, and path replacement.
 */
function transformContent(content: string, pathPrefix: string): string {
  let result = replacePathReferences(content, pathPrefix, '.gemini');
  result = stripSubTags(result);
  result = convertClaudeToGeminiToml(result);
  return result;
}

/**
 * Gemini adapter configuration.
 * Gemini uses nested command structure (commands/maxsim/*.toml).
 */
export const geminiAdapter: AdapterConfig = {
  runtime: 'gemini',
  dirName: '.gemini',
  getGlobalDir,
  getConfigDirFromHome,
  transformContent,
  commandStructure: 'nested',
};

// Re-export Gemini-specific transforms for use by install orchestration
export { convertClaudeToGeminiToml, convertClaudeToGeminiAgent, stripSubTags };
