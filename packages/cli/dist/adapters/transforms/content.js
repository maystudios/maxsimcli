"use strict";
/**
 * @maxsim/adapters — Content transformation utilities
 *
 * Ported from bin/install.js lines ~423-564
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSlashCommandsToCodexSkillMentions = convertSlashCommandsToCodexSkillMentions;
exports.convertClaudeToCodexMarkdown = convertClaudeToCodexMarkdown;
exports.stripSubTags = stripSubTags;
exports.convertClaudeToGeminiAgent = convertClaudeToGeminiAgent;
exports.replacePathReferences = replacePathReferences;
const tool_maps_js_1 = require("./tool-maps.js");
/**
 * Convert /maxsim:command-name to $maxsim-command-name for Codex skill mentions.
 * Ported from install.js line ~423
 */
function convertSlashCommandsToCodexSkillMentions(content) {
    let converted = content.replace(/\/maxsim:([a-z0-9-]+)/gi, (_, commandName) => {
        return `$maxsim-${String(commandName).toLowerCase()}`;
    });
    converted = converted.replace(/\/maxsim-help\b/g, '$maxsim-help');
    return converted;
}
/**
 * Convert Claude markdown to Codex markdown format.
 * Replaces slash commands and $ARGUMENTS placeholder.
 * Ported from install.js line ~431
 */
function convertClaudeToCodexMarkdown(content) {
    let converted = convertSlashCommandsToCodexSkillMentions(content);
    converted = converted.replace(/\$ARGUMENTS\b/g, '{{MAXSIM_ARGS}}');
    return converted;
}
/**
 * Strip HTML <sub> tags for Gemini CLI output.
 * Terminals don't support subscript -- converts <sub>text</sub> to italic *(text)*.
 * Ported from install.js line ~474
 */
function stripSubTags(content) {
    return content.replace(/<sub>(.*?)<\/sub>/g, '*($1)*');
}
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
function convertClaudeToGeminiAgent(content) {
    if (!content.startsWith('---'))
        return content;
    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1)
        return content;
    const frontmatter = content.substring(3, endIndex).trim();
    const body = content.substring(endIndex + 3);
    const lines = frontmatter.split('\n');
    const newLines = [];
    let inAllowedTools = false;
    const tools = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('allowed-tools:')) {
            inAllowedTools = true;
            continue;
        }
        if (trimmed.startsWith('tools:')) {
            const toolsValue = trimmed.substring(6).trim();
            if (toolsValue) {
                const parsed = toolsValue.split(',').map((t) => t.trim()).filter((t) => t);
                for (const t of parsed) {
                    const mapped = (0, tool_maps_js_1.convertGeminiToolName)(t);
                    if (mapped)
                        tools.push(mapped);
                }
            }
            else {
                inAllowedTools = true;
            }
            continue;
        }
        if (trimmed.startsWith('color:'))
            continue;
        if (inAllowedTools) {
            if (trimmed.startsWith('- ')) {
                const mapped = (0, tool_maps_js_1.convertGeminiToolName)(trimmed.substring(2).trim());
                if (mapped)
                    tools.push(mapped);
                continue;
            }
            else if (trimmed && !trimmed.startsWith('-')) {
                inAllowedTools = false;
            }
        }
        if (!inAllowedTools) {
            newLines.push(line);
        }
    }
    if (tools.length > 0) {
        newLines.push('tools:');
        for (const tool of tools) {
            newLines.push(`  - ${tool}`);
        }
    }
    const newFrontmatter = newLines.join('\n').trim();
    // Escape ${VAR} patterns in agent body for Gemini CLI compatibility.
    const escapedBody = body.replace(/\$\{(\w+)\}/g, '$$$1');
    return `---\n${newFrontmatter}\n---${stripSubTags(escapedBody)}`;
}
/**
 * Replace path references in markdown content for a target runtime.
 * Replaces ~/.claude/ with pathPrefix and ./.claude/ with ./dirName/.
 */
function replacePathReferences(content, pathPrefix, dirName) {
    const globalClaudeRegex = /~\/\.claude\//g;
    const localClaudeRegex = /\.\/\.claude\//g;
    let result = content.replace(globalClaudeRegex, pathPrefix);
    result = result.replace(localClaudeRegex, `./${dirName}/`);
    return result;
}
//# sourceMappingURL=content.js.map