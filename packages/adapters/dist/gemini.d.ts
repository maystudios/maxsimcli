/**
 * @maxsim/adapters — Gemini adapter
 *
 * Ports the Gemini-specific logic from bin/install.js:
 *   - getGlobalDir('gemini', ...)         (lines 113-122)
 *   - getDirName('gemini')                (line 47)
 *   - getConfigDirFromHome('gemini', isGlobal) (line 69)
 *   - convertClaudeToGeminiToml + convertClaudeToGeminiAgent + stripSubTags
 */
import type { AdapterConfig } from '@maxsim/core';
import { convertClaudeToGeminiToml } from './transforms/frontmatter.js';
import { convertClaudeToGeminiAgent, stripSubTags } from './transforms/content.js';
/**
 * Gemini adapter configuration.
 * Gemini uses nested command structure (commands/maxsim/*.toml).
 */
export declare const geminiAdapter: AdapterConfig;
export { convertClaudeToGeminiToml, convertClaudeToGeminiAgent, stripSubTags };
//# sourceMappingURL=gemini.d.ts.map