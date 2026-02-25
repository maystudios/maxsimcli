"use strict";
/**
 * @maxsim/adapters — Frontmatter conversion functions for opencode, gemini, codex
 *
 * Ported from bin/install.js lines ~308-711
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorNameToHex = void 0;
exports.toSingleLine = toSingleLine;
exports.yamlQuote = yamlQuote;
exports.extractFrontmatterField = extractFrontmatterField;
exports.convertClaudeToOpencodeFrontmatter = convertClaudeToOpencodeFrontmatter;
exports.convertClaudeToGeminiToml = convertClaudeToGeminiToml;
exports.convertClaudeCommandToCodexSkill = convertClaudeCommandToCodexSkill;
exports.getCodexSkillAdapterHeader = getCodexSkillAdapterHeader;
const base_js_1 = require("../base.js");
const tool_maps_js_1 = require("./tool-maps.js");
const content_js_1 = require("./content.js");
/** Color name to hex mapping for opencode compatibility */
exports.colorNameToHex = {
    cyan: '#00FFFF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    yellow: '#FFFF00',
    magenta: '#FF00FF',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    grey: '#808080',
};
/** Collapse whitespace to single line */
function toSingleLine(value) {
    return value.replace(/\s+/g, ' ').trim();
}
/** Quote a value for YAML using JSON.stringify */
function yamlQuote(value) {
    return JSON.stringify(value);
}
/** Extract a single-line field value from YAML frontmatter text */
function extractFrontmatterField(frontmatter, fieldName) {
    const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm');
    const match = frontmatter.match(regex);
    if (!match)
        return null;
    return match[1].trim().replace(/^['"]|['"]$/g, '');
}
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
function convertClaudeToOpencodeFrontmatter(content) {
    // Replace tool name references in content (applies to all files)
    let convertedContent = content;
    convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, 'question');
    convertedContent = convertedContent.replace(/\bSlashCommand\b/g, 'skill');
    convertedContent = convertedContent.replace(/\bTodoWrite\b/g, 'todowrite');
    convertedContent = convertedContent.replace(/\/maxsim:/g, '/maxsim-');
    convertedContent = convertedContent.replace(/~\/\.claude\b/g, '~/.config/opencode');
    convertedContent = convertedContent.replace(/subagent_type="general-purpose"/g, 'subagent_type="general"');
    if (!convertedContent.startsWith('---')) {
        return convertedContent;
    }
    const endIndex = convertedContent.indexOf('---', 3);
    if (endIndex === -1) {
        return convertedContent;
    }
    const frontmatter = convertedContent.substring(3, endIndex).trim();
    const body = convertedContent.substring(endIndex + 3);
    const lines = frontmatter.split('\n');
    const newLines = [];
    let inAllowedTools = false;
    const allowedTools = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('allowed-tools:')) {
            inAllowedTools = true;
            continue;
        }
        if (trimmed.startsWith('tools:')) {
            const toolsValue = trimmed.substring(6).trim();
            if (toolsValue) {
                const tools = toolsValue.split(',').map((t) => t.trim()).filter((t) => t);
                allowedTools.push(...tools);
            }
            continue;
        }
        if (trimmed.startsWith('name:')) {
            continue;
        }
        if (trimmed.startsWith('color:')) {
            const colorValue = trimmed.substring(6).trim().toLowerCase();
            const hexColor = exports.colorNameToHex[colorValue];
            if (hexColor) {
                newLines.push(`color: "${hexColor}"`);
            }
            else if (colorValue.startsWith('#')) {
                if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(colorValue)) {
                    newLines.push(line);
                }
            }
            continue;
        }
        if (inAllowedTools) {
            if (trimmed.startsWith('- ')) {
                allowedTools.push(trimmed.substring(2).trim());
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
    if (allowedTools.length > 0) {
        newLines.push('tools:');
        for (const tool of allowedTools) {
            newLines.push(`  ${(0, tool_maps_js_1.convertToolName)(tool)}: true`);
        }
    }
    const newFrontmatter = newLines.join('\n').trim();
    return `---\n${newFrontmatter}\n---${body}`;
}
/**
 * Convert Claude Code markdown command to Gemini TOML format.
 * Ported from install.js line ~677
 */
function convertClaudeToGeminiToml(content) {
    if (!content.startsWith('---')) {
        return `prompt = ${JSON.stringify(content)}\n`;
    }
    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) {
        return `prompt = ${JSON.stringify(content)}\n`;
    }
    const frontmatter = content.substring(3, endIndex).trim();
    const body = content.substring(endIndex + 3).trim();
    let description = '';
    const lines = frontmatter.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('description:')) {
            description = trimmed.substring(12).trim();
            break;
        }
    }
    let toml = '';
    if (description) {
        toml += `description = ${JSON.stringify(description)}\n`;
    }
    toml += `prompt = ${JSON.stringify(body)}\n`;
    return toml;
}
/**
 * Convert Claude command to Codex skill format with adapter header.
 * Ported from install.js line ~452
 */
function convertClaudeCommandToCodexSkill(content, skillName) {
    const converted = (0, content_js_1.convertClaudeToCodexMarkdown)(content);
    const { frontmatter, body } = (0, base_js_1.extractFrontmatterAndBody)(converted);
    let description = `Run MAXSIM workflow ${skillName}.`;
    if (frontmatter) {
        const maybeDescription = extractFrontmatterField(frontmatter, 'description');
        if (maybeDescription) {
            description = maybeDescription;
        }
    }
    description = toSingleLine(description);
    const shortDescription = description.length > 180 ? `${description.slice(0, 177)}...` : description;
    const adapter = getCodexSkillAdapterHeader(skillName);
    return `---\nname: ${yamlQuote(skillName)}\ndescription: ${yamlQuote(description)}\nmetadata:\n  short-description: ${yamlQuote(shortDescription)}\n---\n\n${adapter}\n\n${body.trimStart()}`;
}
/**
 * Generate the Codex skill adapter header block.
 * Ported from install.js line ~437
 */
function getCodexSkillAdapterHeader(skillName) {
    const invocation = `$${skillName}`;
    return `<codex_skill_adapter>
Codex skills-first mode:
- This skill is invoked by mentioning \`${invocation}\`.
- Treat all user text after \`${invocation}\` as \`{{MAXSIM_ARGS}}\`.
- If no arguments are present, treat \`{{MAXSIM_ARGS}}\` as empty.

Legacy orchestration compatibility:
- Any \`Task(...)\` pattern in referenced workflow docs is legacy syntax.
- Implement equivalent behavior with Codex collaboration tools: \`spawn_agent\`, \`wait\`, \`send_input\`, and \`close_agent\`.
- Treat legacy \`subagent_type\` names as role hints in the spawned message.
</codex_skill_adapter>`;
}
//# sourceMappingURL=frontmatter.js.map