/**
 * @maxsim/adapters — Frontmatter conversion functions for opencode, gemini, codex
 *
 * Ported from bin/install.js lines ~308-711
 */

import { extractFrontmatterAndBody } from '../base.js';
import { convertToolName } from './tool-maps.js';
import { convertClaudeToCodexMarkdown } from './content.js';

/** Color name to hex mapping for opencode compatibility */
export const colorNameToHex: Record<string, string> = {
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
export function toSingleLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Quote a value for YAML using JSON.stringify */
export function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

/** Extract a single-line field value from YAML frontmatter text */
export function extractFrontmatterField(
  frontmatter: string,
  fieldName: string,
): string | null {
  const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return null;
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
export function convertClaudeToOpencodeFrontmatter(content: string): string {
  // Replace tool name references in content (applies to all files)
  let convertedContent = content;
  convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, 'question');
  convertedContent = convertedContent.replace(/\bSlashCommand\b/g, 'skill');
  convertedContent = convertedContent.replace(/\bTodoWrite\b/g, 'todowrite');
  convertedContent = convertedContent.replace(/\/maxsim:/g, '/maxsim-');
  convertedContent = convertedContent.replace(/~\/\.claude\b/g, '~/.config/opencode');
  convertedContent = convertedContent.replace(
    /subagent_type="general-purpose"/g,
    'subagent_type="general"',
  );

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
  const newLines: string[] = [];
  let inAllowedTools = false;
  const allowedTools: string[] = [];

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
      const hexColor = colorNameToHex[colorValue];
      if (hexColor) {
        newLines.push(`color: "${hexColor}"`);
      } else if (colorValue.startsWith('#')) {
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
      } else if (trimmed && !trimmed.startsWith('-')) {
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
      newLines.push(`  ${convertToolName(tool)}: true`);
    }
  }

  const newFrontmatter = newLines.join('\n').trim();
  return `---\n${newFrontmatter}\n---${body}`;
}

/**
 * Convert Claude Code markdown command to Gemini TOML format.
 * Ported from install.js line ~677
 */
export function convertClaudeToGeminiToml(content: string): string {
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
export function convertClaudeCommandToCodexSkill(
  content: string,
  skillName: string,
): string {
  const converted = convertClaudeToCodexMarkdown(content);
  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  let description = `Run MAXSIM workflow ${skillName}.`;
  if (frontmatter) {
    const maybeDescription = extractFrontmatterField(frontmatter, 'description');
    if (maybeDescription) {
      description = maybeDescription;
    }
  }
  description = toSingleLine(description);
  const shortDescription =
    description.length > 180 ? `${description.slice(0, 177)}...` : description;
  const adapter = getCodexSkillAdapterHeader(skillName);

  return `---\nname: ${yamlQuote(skillName)}\ndescription: ${yamlQuote(description)}\nmetadata:\n  short-description: ${yamlQuote(shortDescription)}\n---\n\n${adapter}\n\n${body.trimStart()}`;
}

/**
 * Generate the Codex skill adapter header block.
 * Ported from install.js line ~437
 */
export function getCodexSkillAdapterHeader(skillName: string): string {
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
