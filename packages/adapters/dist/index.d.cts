import { claudeAdapter, installClaude } from "./claude.cjs";
import { a as stripSubTags, c as convertClaudeToGeminiToml, d as getCodexSkillAdapterHeader, f as toSingleLine, i as replacePathReferences, l as convertClaudeToOpencodeFrontmatter, n as convertClaudeToGeminiAgent, o as colorNameToHex, p as yamlQuote, r as convertSlashCommandsToCodexSkillMentions, s as convertClaudeCommandToCodexSkill, t as convertClaudeToCodexMarkdown, u as extractFrontmatterField } from "./content-BwZBxUHp.cjs";
import { codexAdapter } from "./codex.cjs";
import { geminiAdapter } from "./gemini.cjs";
import { opencodeAdapter } from "./opencode.cjs";
import { AdapterConfig, AdapterConfig as AdapterConfig$1, RuntimeName } from "@maxsim/core";

//#region src/types.d.ts
interface InstallOptions {
  isGlobal: boolean;
  explicitConfigDir?: string | null;
  forceStatusline?: boolean;
}
//#endregion
//#region src/base.d.ts
/**
 * @maxsim/adapters — Shared base utilities extracted from bin/install.js
 */
/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
declare function expandTilde(filePath: string): string;
/**
 * Extract YAML frontmatter and body from markdown content.
 * Returns null frontmatter if content doesn't start with ---.
 */
declare function extractFrontmatterAndBody(content: string): {
  frontmatter: string | null;
  body: string;
};
/**
 * Process Co-Authored-By lines based on attribution setting.
 * @param content - File content to process
 * @param attribution - null=remove, undefined=keep default, string=replace
 */
declare function processAttribution(content: string, attribution: null | undefined | string): string;
/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 */
declare function buildHookCommand(configDir: string, hookName: string): string;
/**
 * Read and parse settings.json, returning empty object if it doesn't exist.
 */
declare function readSettings(settingsPath: string): Record<string, unknown>;
/**
 * Write settings.json with proper formatting.
 */
declare function writeSettings(settingsPath: string, settings: Record<string, unknown>): void;
//#endregion
//#region src/transforms/tool-maps.d.ts
/**
 * @maxsim/adapters — Tool name mappings per runtime
 *
 * Ported from bin/install.js lines ~327-390
 */
/**
 * Convert a Claude Code tool name to OpenCode format.
 * - Applies special mappings (AskUserQuestion -> question, etc.)
 * - Converts to lowercase (except MCP tools which keep their format)
 */
declare function convertToolName(claudeTool: string): string;
/**
 * Convert a Claude Code tool name to Gemini CLI format.
 * - Applies Claude->Gemini mapping (Read->read_file, Bash->run_shell_command, etc.)
 * - Filters out MCP tools (mcp__*) -- auto-discovered at runtime in Gemini
 * - Filters out Task -- agents are auto-registered as tools in Gemini
 * @returns Gemini tool name, or null if tool should be excluded
 */
declare function convertGeminiToolName(claudeTool: string): string | null;
//#endregion
//#region src/index.d.ts
/**
 * Get all registered adapters.
 */
declare function getAllAdapters(): AdapterConfig$1[];
//#endregion
export { type AdapterConfig, type InstallOptions, type RuntimeName, buildHookCommand, claudeAdapter, codexAdapter, colorNameToHex, convertClaudeCommandToCodexSkill, convertClaudeToCodexMarkdown, convertClaudeToGeminiAgent, convertClaudeToGeminiToml, convertClaudeToOpencodeFrontmatter, convertGeminiToolName, convertSlashCommandsToCodexSkillMentions, convertToolName, expandTilde, extractFrontmatterAndBody, extractFrontmatterField, geminiAdapter, getAllAdapters, getCodexSkillAdapterHeader, installClaude, opencodeAdapter, processAttribution, readSettings, replacePathReferences, stripSubTags, toSingleLine, writeSettings, yamlQuote };
//# sourceMappingURL=index.d.cts.map