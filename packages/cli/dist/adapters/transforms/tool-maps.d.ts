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
export declare function convertToolName(claudeTool: string): string;
/**
 * Convert a Claude Code tool name to Gemini CLI format.
 * - Applies Claude->Gemini mapping (Read->read_file, Bash->run_shell_command, etc.)
 * - Filters out MCP tools (mcp__*) -- auto-discovered at runtime in Gemini
 * - Filters out Task -- agents are auto-registered as tools in Gemini
 * @returns Gemini tool name, or null if tool should be excluded
 */
export declare function convertGeminiToolName(claudeTool: string): string | null;
//# sourceMappingURL=tool-maps.d.ts.map