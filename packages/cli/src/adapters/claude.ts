/**
 * @maxsim/adapters — Claude Code adapter
 *
 * Ports the Claude-specific logic from bin/install.js:
 *   - getGlobalDir('claude', ...)  (lines 135-142)
 *   - getDirName('claude')         (line 49)
 *   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
 *   - copyWithPathReplacement for Claude (lines 839-892)
 */

import * as path from 'node:path';
import * as os from 'node:os';
import type { AdapterConfig } from '../core/index.js';
import { expandTilde } from './base.js';

/**
 * Get the global config directory for Claude Code.
 * Priority: explicitDir > CLAUDE_CONFIG_DIR env > ~/.claude
 */
function getGlobalDir(explicitDir?: string | null): string {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

/**
 * Get the config directory path relative to home for hook templating.
 * Used for path.join(homeDir, '<configDir>', ...) replacement in hooks.
 */
function getConfigDirFromHome(isGlobal: boolean): string {
  // Both global and local use '.claude' for Claude Code
  return "'.claude'";
}

/**
 * Transform markdown content for Claude Code installation.
 * For Claude, this is path replacement only — no frontmatter conversion needed.
 * Replaces ~/.claude/ and ./.claude/ references with the actual install path prefix.
 */
function transformContent(content: string, pathPrefix: string): string {
  const globalClaudeRegex = /~\/\.claude\//g;
  const localClaudeRegex = /\.\/\.claude\//g;
  let result = content.replace(globalClaudeRegex, pathPrefix);
  result = result.replace(localClaudeRegex, `./.claude/`);
  return result;
}

/**
 * Claude Code adapter configuration.
 * Claude uses nested command structure (commands/maxsim/*.md).
 */
export const claudeAdapter: AdapterConfig = {
  runtime: 'claude',
  dirName: '.claude',
  getGlobalDir,
  getConfigDirFromHome,
  transformContent,
  commandStructure: 'nested',
};

/**
 * Install Claude Code adapter files.
 * Stub — actual install orchestration will be implemented in Phase 5.
 */
export function installClaude(): void {
  // Phase 5 will implement the full install orchestration.
  // The adapter exposes this function per CONTEXT.md decision.
  throw new Error('installClaude() not yet implemented — see Phase 5');
}
