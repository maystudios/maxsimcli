"use strict";
/**
 * @maxsim/adapters — Tool name mappings per runtime
 *
 * Ported from bin/install.js lines ~327-390
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToolName = convertToolName;
exports.convertGeminiToolName = convertGeminiToolName;
/** Tool name mapping from Claude Code to OpenCode */
const claudeToOpencodeTools = {
    AskUserQuestion: 'question',
    SlashCommand: 'skill',
    TodoWrite: 'todowrite',
    WebFetch: 'webfetch',
    WebSearch: 'websearch',
};
/** Tool name mapping from Claude Code to Gemini CLI */
const claudeToGeminiTools = {
    Read: 'read_file',
    Write: 'write_file',
    Edit: 'replace',
    Bash: 'run_shell_command',
    Glob: 'glob',
    Grep: 'search_file_content',
    WebSearch: 'google_web_search',
    WebFetch: 'web_fetch',
    TodoWrite: 'write_todos',
    AskUserQuestion: 'ask_user',
};
/**
 * Convert a Claude Code tool name to OpenCode format.
 * - Applies special mappings (AskUserQuestion -> question, etc.)
 * - Converts to lowercase (except MCP tools which keep their format)
 */
function convertToolName(claudeTool) {
    if (claudeToOpencodeTools[claudeTool]) {
        return claudeToOpencodeTools[claudeTool];
    }
    if (claudeTool.startsWith('mcp__')) {
        return claudeTool;
    }
    return claudeTool.toLowerCase();
}
/**
 * Convert a Claude Code tool name to Gemini CLI format.
 * - Applies Claude->Gemini mapping (Read->read_file, Bash->run_shell_command, etc.)
 * - Filters out MCP tools (mcp__*) -- auto-discovered at runtime in Gemini
 * - Filters out Task -- agents are auto-registered as tools in Gemini
 * @returns Gemini tool name, or null if tool should be excluded
 */
function convertGeminiToolName(claudeTool) {
    if (claudeTool.startsWith('mcp__')) {
        return null;
    }
    if (claudeTool === 'Task') {
        return null;
    }
    if (claudeToGeminiTools[claudeTool]) {
        return claudeToGeminiTools[claudeTool];
    }
    return claudeTool.toLowerCase();
}
//# sourceMappingURL=tool-maps.js.map