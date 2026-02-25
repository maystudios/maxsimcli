/**
 * @maxsim/adapters — Content transformation utilities
 *
 * Ported from bin/install.js lines ~423-564
 */
/**
 * Convert /maxsim:command-name to $maxsim-command-name for Codex skill mentions.
 * Ported from install.js line ~423
 */
export declare function convertSlashCommandsToCodexSkillMentions(content: string): string;
/**
 * Convert Claude markdown to Codex markdown format.
 * Replaces slash commands and $ARGUMENTS placeholder.
 * Ported from install.js line ~431
 */
export declare function convertClaudeToCodexMarkdown(content: string): string;
/**
 * Strip HTML <sub> tags for Gemini CLI output.
 * Terminals don't support subscript -- converts <sub>text</sub> to italic *(text)*.
 * Ported from install.js line ~474
 */
export declare function stripSubTags(content: string): string;
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
export declare function convertClaudeToGeminiAgent(content: string): string;
/**
 * Replace path references in markdown content for a target runtime.
 * Replaces ~/.claude/ with pathPrefix and ./.claude/ with ./dirName/.
 */
export declare function replacePathReferences(content: string, pathPrefix: string, dirName: string): string;
//# sourceMappingURL=content.d.ts.map