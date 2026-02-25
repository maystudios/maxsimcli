/**
 * @maxsim/adapters — OpenCode adapter
 *
 * Ports the OpenCode-specific logic from bin/install.js:
 *   - getOpencodeGlobalDir()           (lines 79-97)
 *   - getGlobalDir('opencode', ...)    (lines 104-111)
 *   - getDirName('opencode')           (line 46)
 *   - getConfigDirFromHome('opencode', isGlobal) (lines 58-68)
 *   - convertClaudeToOpencodeFrontmatter + path replacement
 */

import * as path from 'node:path';
import * as os from 'node:os';
import type { AdapterConfig } from '../core/index.js';
import { expandTilde } from './base.js';
import { convertClaudeToOpencodeFrontmatter } from './transforms/frontmatter.js';
import { replacePathReferences } from './transforms/content.js';

/**
 * Get the global config directory for OpenCode.
 * OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/.
 * Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
function getOpencodeGlobalDir(): string {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return expandTilde(process.env.OPENCODE_CONFIG_DIR);
  }
  if (process.env.OPENCODE_CONFIG) {
    return path.dirname(expandTilde(process.env.OPENCODE_CONFIG));
  }
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(expandTilde(process.env.XDG_CONFIG_HOME), 'opencode');
  }
  return path.join(os.homedir(), '.config', 'opencode');
}

/**
 * Get the global config directory for OpenCode.
 * Priority: explicitDir > env vars (via getOpencodeGlobalDir)
 */
function getGlobalDir(explicitDir?: string | null): string {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  return getOpencodeGlobalDir();
}

/**
 * Get the config directory path relative to home for hook templating.
 */
function getConfigDirFromHome(isGlobal: boolean): string {
  if (!isGlobal) {
    return "'.opencode'";
  }
  return "'.config', 'opencode'";
}

/**
 * Transform markdown content for OpenCode installation.
 * Applies frontmatter conversion and path replacement.
 */
function transformContent(content: string, pathPrefix: string): string {
  let result = replacePathReferences(content, pathPrefix, '.opencode');
  // Also replace ~/.opencode/ references
  result = result.replace(/~\/\.opencode\//g, pathPrefix);
  result = convertClaudeToOpencodeFrontmatter(result);
  return result;
}

/**
 * OpenCode adapter configuration.
 * OpenCode uses flat command structure (command/maxsim-*.md).
 */
export const opencodeAdapter: AdapterConfig = {
  runtime: 'opencode',
  dirName: '.opencode',
  getGlobalDir,
  getConfigDirFromHome,
  transformContent,
  commandStructure: 'flat',
};
