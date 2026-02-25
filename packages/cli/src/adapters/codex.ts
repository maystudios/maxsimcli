/**
 * @maxsim/adapters — Codex adapter
 *
 * Ports the Codex-specific logic from bin/install.js:
 *   - getGlobalDir('codex', ...)         (lines 124-133)
 *   - getDirName('codex')                (line 48)
 *   - getConfigDirFromHome('codex', isGlobal) (line 70)
 *   - convertClaudeCommandToCodexSkill + convertClaudeToCodexMarkdown
 */

import * as path from 'node:path';
import * as os from 'node:os';
import type { AdapterConfig } from '../core/index.js';
import { expandTilde } from './base.js';
import { convertClaudeCommandToCodexSkill } from './transforms/frontmatter.js';
import {
  convertClaudeToCodexMarkdown,
  replacePathReferences,
} from './transforms/content.js';

/**
 * Get the global config directory for Codex.
 * Priority: explicitDir > CODEX_HOME env > ~/.codex
 */
function getGlobalDir(explicitDir?: string | null): string {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CODEX_HOME) {
    return expandTilde(process.env.CODEX_HOME);
  }
  return path.join(os.homedir(), '.codex');
}

/**
 * Get the config directory path relative to home for hook templating.
 */
function getConfigDirFromHome(_isGlobal: boolean): string {
  return "'.codex'";
}

/**
 * Transform markdown content for Codex installation.
 * Applies Codex markdown conversion and path replacement.
 */
function transformContent(content: string, pathPrefix: string): string {
  let result = replacePathReferences(content, pathPrefix, '.codex');
  result = result.replace(/~\/\.codex\//g, pathPrefix);
  result = convertClaudeCommandToCodexSkill(result);
  return result;
}

/**
 * Codex adapter configuration.
 * Codex uses skill-based command structure (skills/maxsim-star/SKILL.md).
 */
export const codexAdapter: AdapterConfig = {
  runtime: 'codex',
  dirName: '.codex',
  getGlobalDir,
  getConfigDirFromHome,
  transformContent,
  commandStructure: 'skills',
};

// Re-export Codex-specific transforms for use by install orchestration
export { convertClaudeCommandToCodexSkill, convertClaudeToCodexMarkdown };
