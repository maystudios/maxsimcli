//#region src/transforms/frontmatter.d.ts
/**
 * @maxsim/adapters — Frontmatter conversion functions for opencode, gemini, codex
 *
 * Ported from bin/install.js lines ~308-711
 */
/** Color name to hex mapping for opencode compatibility */
declare const colorNameToHex: Record<string, string>;
/** Collapse whitespace to single line */
declare function toSingleLine(value: string): string;
/** Quote a value for YAML using JSON.stringify */
declare function yamlQuote(value: string): string;
/** Extract a single-line field value from YAML frontmatter text */
declare function extractFrontmatterField(frontmatter: string, fieldName: string): string | null;
/**
 * Convert Claude Code frontmatter to OpenCode format.
 * - Converts 'allowed-tools:' array to 'tools:' object with tool: true entries
 * - Converts color names to hex
 * - Removes name: field (opencode uses filename)
 * - Replaces tool name references in body content
 * - Replaces /maxsim: with /maxsim- (flat command structure)
 * - Replaces ~/.claude with ~/.config/opencode
 * - Replaces subagent_type="general-purpose" with "general"
 *
 * Ported from install.js line ~566
 */
declare function convertClaudeToOpencodeFrontmatter(content: string): string;
/**
 * Convert Claude Code markdown command to Gemini TOML format.
 * Ported from install.js line ~677
 */
declare function convertClaudeToGeminiToml(content: string): string;
/**
 * Convert Claude command to Codex skill format with adapter header.
 * Ported from install.js line ~452
 */
declare function convertClaudeCommandToCodexSkill(content: string, skillName: string): string;
/**
 * Generate the Codex skill adapter header block.
 * Ported from install.js line ~437
 */
declare function getCodexSkillAdapterHeader(skillName: string): string;
//#endregion
//#region src/transforms/content.d.ts
/**
 * @maxsim/adapters — Content transformation utilities
 *
 * Ported from bin/install.js lines ~423-564
 */
/**
 * Convert /maxsim:command-name to $maxsim-command-name for Codex skill mentions.
 * Ported from install.js line ~423
 */
declare function convertSlashCommandsToCodexSkillMentions(content: string): string;
/**
 * Convert Claude markdown to Codex markdown format.
 * Replaces slash commands and $ARGUMENTS placeholder.
 * Ported from install.js line ~431
 */
declare function convertClaudeToCodexMarkdown(content: string): string;
/**
 * Strip HTML <sub> tags for Gemini CLI output.
 * Terminals don't support subscript -- converts <sub>text</sub> to italic *(text)*.
 * Ported from install.js line ~474
 */
declare function stripSubTags(content: string): string;
/**
 * Convert Claude Code agent frontmatter to Gemini CLI format.
 * - tools: must be a YAML array (not comma-separated string)
 * - tool names: must use Gemini built-in names (read_file, not Read)
 * - color: must be removed (causes validation error)
 * - mcp__* tools: must be excluded (auto-discovered at runtime)
 * - ${VAR} patterns: escaped to $VAR for Gemini template compatibility
 *
 * Ported from install.js line ~487
 */
declare function convertClaudeToGeminiAgent(content: string): string;
/**
 * Replace path references in markdown content for a target runtime.
 * Replaces ~/.claude/ with pathPrefix and ./.claude/ with ./dirName/.
 */
declare function replacePathReferences(content: string, pathPrefix: string, dirName: string): string;
//#endregion
export { stripSubTags as a, convertClaudeToGeminiToml as c, getCodexSkillAdapterHeader as d, toSingleLine as f, replacePathReferences as i, convertClaudeToOpencodeFrontmatter as l, convertClaudeToGeminiAgent as n, colorNameToHex as o, yamlQuote as p, convertSlashCommandsToCodexSkillMentions as r, convertClaudeCommandToCodexSkill as s, convertClaudeToCodexMarkdown as t, extractFrontmatterField as u };
//# sourceMappingURL=content-BwZBxUHp.d.cts.map