/**
 * @maxsim/adapters — Frontmatter conversion functions for opencode, gemini, codex
 *
 * Ported from bin/install.js lines ~308-711
 */
/** Color name to hex mapping for opencode compatibility */
export declare const colorNameToHex: Record<string, string>;
/** Collapse whitespace to single line */
export declare function toSingleLine(value: string): string;
/** Quote a value for YAML using JSON.stringify */
export declare function yamlQuote(value: string): string;
/** Extract a single-line field value from YAML frontmatter text */
export declare function extractFrontmatterField(frontmatter: string, fieldName: string): string | null;
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
export declare function convertClaudeToOpencodeFrontmatter(content: string): string;
/**
 * Convert Claude Code markdown command to Gemini TOML format.
 * Ported from install.js line ~677
 */
export declare function convertClaudeToGeminiToml(content: string): string;
/**
 * Convert Claude command to Codex skill format with adapter header.
 * Ported from install.js line ~452
 */
export declare function convertClaudeCommandToCodexSkill(content: string, skillName: string): string;
/**
 * Generate the Codex skill adapter header block.
 * Ported from install.js line ~437
 */
export declare function getCodexSkillAdapterHeader(skillName: string): string;
//# sourceMappingURL=frontmatter.d.ts.map