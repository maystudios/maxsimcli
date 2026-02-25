/**
 * @maxsim/adapters — Codex adapter
 *
 * Ports the Codex-specific logic from bin/install.js:
 *   - getGlobalDir('codex', ...)         (lines 124-133)
 *   - getDirName('codex')                (line 48)
 *   - getConfigDirFromHome('codex', isGlobal) (line 70)
 *   - convertClaudeCommandToCodexSkill + convertClaudeToCodexMarkdown
 */
import type { AdapterConfig } from '../core/index.js';
import { convertClaudeCommandToCodexSkill } from './transforms/frontmatter.js';
import { convertClaudeToCodexMarkdown } from './transforms/content.js';
/**
 * Codex adapter configuration.
 * Codex uses skill-based command structure (skills/maxsim-star/SKILL.md).
 */
export declare const codexAdapter: AdapterConfig;
export { convertClaudeCommandToCodexSkill, convertClaudeToCodexMarkdown };
//# sourceMappingURL=codex.d.ts.map