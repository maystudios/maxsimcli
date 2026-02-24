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
import type { AdapterConfig } from '@maxsim/core';
/**
 * OpenCode adapter configuration.
 * OpenCode uses flat command structure (command/maxsim-*.md).
 */
export declare const opencodeAdapter: AdapterConfig;
//# sourceMappingURL=opencode.d.ts.map