const require_base = require('./base-BYHjQPHa.cjs');

//#region src/transforms/tool-maps.ts
/**
* @maxsim/adapters — Tool name mappings per runtime
*
* Ported from bin/install.js lines ~327-390
*/
/** Tool name mapping from Claude Code to OpenCode */
const claudeToOpencodeTools = {
	AskUserQuestion: "question",
	SlashCommand: "skill",
	TodoWrite: "todowrite",
	WebFetch: "webfetch",
	WebSearch: "websearch"
};
/** Tool name mapping from Claude Code to Gemini CLI */
const claudeToGeminiTools = {
	Read: "read_file",
	Write: "write_file",
	Edit: "replace",
	Bash: "run_shell_command",
	Glob: "glob",
	Grep: "search_file_content",
	WebSearch: "google_web_search",
	WebFetch: "web_fetch",
	TodoWrite: "write_todos",
	AskUserQuestion: "ask_user"
};
/**
* Convert a Claude Code tool name to OpenCode format.
* - Applies special mappings (AskUserQuestion -> question, etc.)
* - Converts to lowercase (except MCP tools which keep their format)
*/
function convertToolName(claudeTool) {
	if (claudeToOpencodeTools[claudeTool]) return claudeToOpencodeTools[claudeTool];
	if (claudeTool.startsWith("mcp__")) return claudeTool;
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
	if (claudeTool.startsWith("mcp__")) return null;
	if (claudeTool === "Task") return null;
	if (claudeToGeminiTools[claudeTool]) return claudeToGeminiTools[claudeTool];
	return claudeTool.toLowerCase();
}

//#endregion
//#region src/transforms/content.ts
/**
* @maxsim/adapters — Content transformation utilities
*
* Ported from bin/install.js lines ~423-564
*/
/**
* Convert /maxsim:command-name to $maxsim-command-name for Codex skill mentions.
* Ported from install.js line ~423
*/
function convertSlashCommandsToCodexSkillMentions(content) {
	let converted = content.replace(/\/maxsim:([a-z0-9-]+)/gi, (_, commandName) => {
		return `$maxsim-${String(commandName).toLowerCase()}`;
	});
	converted = converted.replace(/\/maxsim-help\b/g, "$maxsim-help");
	return converted;
}
/**
* Convert Claude markdown to Codex markdown format.
* Replaces slash commands and $ARGUMENTS placeholder.
* Ported from install.js line ~431
*/
function convertClaudeToCodexMarkdown(content) {
	let converted = convertSlashCommandsToCodexSkillMentions(content);
	converted = converted.replace(/\$ARGUMENTS\b/g, "{{MAXSIM_ARGS}}");
	return converted;
}
/**
* Strip HTML <sub> tags for Gemini CLI output.
* Terminals don't support subscript -- converts <sub>text</sub> to italic *(text)*.
* Ported from install.js line ~474
*/
function stripSubTags(content) {
	return content.replace(/<sub>(.*?)<\/sub>/g, "*($1)*");
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
	if (!content.startsWith("---")) return content;
	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) return content;
	const frontmatter = content.substring(3, endIndex).trim();
	const body = content.substring(endIndex + 3);
	const lines = frontmatter.split("\n");
	const newLines = [];
	let inAllowedTools = false;
	const tools = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("allowed-tools:")) {
			inAllowedTools = true;
			continue;
		}
		if (trimmed.startsWith("tools:")) {
			const toolsValue = trimmed.substring(6).trim();
			if (toolsValue) {
				const parsed = toolsValue.split(",").map((t) => t.trim()).filter((t) => t);
				for (const t of parsed) {
					const mapped = convertGeminiToolName(t);
					if (mapped) tools.push(mapped);
				}
			} else inAllowedTools = true;
			continue;
		}
		if (trimmed.startsWith("color:")) continue;
		if (inAllowedTools) {
			if (trimmed.startsWith("- ")) {
				const mapped = convertGeminiToolName(trimmed.substring(2).trim());
				if (mapped) tools.push(mapped);
				continue;
			} else if (trimmed && !trimmed.startsWith("-")) inAllowedTools = false;
		}
		if (!inAllowedTools) newLines.push(line);
	}
	if (tools.length > 0) {
		newLines.push("tools:");
		for (const tool of tools) newLines.push(`  - ${tool}`);
	}
	return `---\n${newLines.join("\n").trim()}\n---${stripSubTags(body.replace(/\$\{(\w+)\}/g, "$$$1"))}`;
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

//#endregion
//#region src/transforms/frontmatter.ts
/**
* @maxsim/adapters — Frontmatter conversion functions for opencode, gemini, codex
*
* Ported from bin/install.js lines ~308-711
*/
/** Color name to hex mapping for opencode compatibility */
const colorNameToHex = {
	cyan: "#00FFFF",
	red: "#FF0000",
	green: "#00FF00",
	blue: "#0000FF",
	yellow: "#FFFF00",
	magenta: "#FF00FF",
	orange: "#FFA500",
	purple: "#800080",
	pink: "#FFC0CB",
	white: "#FFFFFF",
	black: "#000000",
	gray: "#808080",
	grey: "#808080"
};
/** Collapse whitespace to single line */
function toSingleLine(value) {
	return value.replace(/\s+/g, " ").trim();
}
/** Quote a value for YAML using JSON.stringify */
function yamlQuote(value) {
	return JSON.stringify(value);
}
/** Extract a single-line field value from YAML frontmatter text */
function extractFrontmatterField(frontmatter, fieldName) {
	const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, "m");
	const match = frontmatter.match(regex);
	if (!match) return null;
	return match[1].trim().replace(/^['"]|['"]$/g, "");
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
	let convertedContent = content;
	convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, "question");
	convertedContent = convertedContent.replace(/\bSlashCommand\b/g, "skill");
	convertedContent = convertedContent.replace(/\bTodoWrite\b/g, "todowrite");
	convertedContent = convertedContent.replace(/\/maxsim:/g, "/maxsim-");
	convertedContent = convertedContent.replace(/~\/\.claude\b/g, "~/.config/opencode");
	convertedContent = convertedContent.replace(/subagent_type="general-purpose"/g, "subagent_type=\"general\"");
	if (!convertedContent.startsWith("---")) return convertedContent;
	const endIndex = convertedContent.indexOf("---", 3);
	if (endIndex === -1) return convertedContent;
	const frontmatter = convertedContent.substring(3, endIndex).trim();
	const body = convertedContent.substring(endIndex + 3);
	const lines = frontmatter.split("\n");
	const newLines = [];
	let inAllowedTools = false;
	const allowedTools = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("allowed-tools:")) {
			inAllowedTools = true;
			continue;
		}
		if (trimmed.startsWith("tools:")) {
			const toolsValue = trimmed.substring(6).trim();
			if (toolsValue) {
				const tools = toolsValue.split(",").map((t) => t.trim()).filter((t) => t);
				allowedTools.push(...tools);
			}
			continue;
		}
		if (trimmed.startsWith("name:")) continue;
		if (trimmed.startsWith("color:")) {
			const colorValue = trimmed.substring(6).trim().toLowerCase();
			const hexColor = colorNameToHex[colorValue];
			if (hexColor) newLines.push(`color: "${hexColor}"`);
			else if (colorValue.startsWith("#")) {
				if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(colorValue)) newLines.push(line);
			}
			continue;
		}
		if (inAllowedTools) {
			if (trimmed.startsWith("- ")) {
				allowedTools.push(trimmed.substring(2).trim());
				continue;
			} else if (trimmed && !trimmed.startsWith("-")) inAllowedTools = false;
		}
		if (!inAllowedTools) newLines.push(line);
	}
	if (allowedTools.length > 0) {
		newLines.push("tools:");
		for (const tool of allowedTools) newLines.push(`  ${convertToolName(tool)}: true`);
	}
	return `---\n${newLines.join("\n").trim()}\n---${body}`;
}
/**
* Convert Claude Code markdown command to Gemini TOML format.
* Ported from install.js line ~677
*/
function convertClaudeToGeminiToml(content) {
	if (!content.startsWith("---")) return `prompt = ${JSON.stringify(content)}\n`;
	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) return `prompt = ${JSON.stringify(content)}\n`;
	const frontmatter = content.substring(3, endIndex).trim();
	const body = content.substring(endIndex + 3).trim();
	let description = "";
	const lines = frontmatter.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("description:")) {
			description = trimmed.substring(12).trim();
			break;
		}
	}
	let toml = "";
	if (description) toml += `description = ${JSON.stringify(description)}\n`;
	toml += `prompt = ${JSON.stringify(body)}\n`;
	return toml;
}
/**
* Convert Claude command to Codex skill format with adapter header.
* Ported from install.js line ~452
*/
function convertClaudeCommandToCodexSkill(content, skillName) {
	const { frontmatter, body } = require_base.extractFrontmatterAndBody(convertClaudeToCodexMarkdown(content));
	let description = `Run MAXSIM workflow ${skillName}.`;
	if (frontmatter) {
		const maybeDescription = extractFrontmatterField(frontmatter, "description");
		if (maybeDescription) description = maybeDescription;
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

//#endregion
Object.defineProperty(exports, 'colorNameToHex', {
  enumerable: true,
  get: function () {
    return colorNameToHex;
  }
});
Object.defineProperty(exports, 'convertClaudeCommandToCodexSkill', {
  enumerable: true,
  get: function () {
    return convertClaudeCommandToCodexSkill;
  }
});
Object.defineProperty(exports, 'convertClaudeToCodexMarkdown', {
  enumerable: true,
  get: function () {
    return convertClaudeToCodexMarkdown;
  }
});
Object.defineProperty(exports, 'convertClaudeToGeminiAgent', {
  enumerable: true,
  get: function () {
    return convertClaudeToGeminiAgent;
  }
});
Object.defineProperty(exports, 'convertClaudeToGeminiToml', {
  enumerable: true,
  get: function () {
    return convertClaudeToGeminiToml;
  }
});
Object.defineProperty(exports, 'convertClaudeToOpencodeFrontmatter', {
  enumerable: true,
  get: function () {
    return convertClaudeToOpencodeFrontmatter;
  }
});
Object.defineProperty(exports, 'convertGeminiToolName', {
  enumerable: true,
  get: function () {
    return convertGeminiToolName;
  }
});
Object.defineProperty(exports, 'convertSlashCommandsToCodexSkillMentions', {
  enumerable: true,
  get: function () {
    return convertSlashCommandsToCodexSkillMentions;
  }
});
Object.defineProperty(exports, 'convertToolName', {
  enumerable: true,
  get: function () {
    return convertToolName;
  }
});
Object.defineProperty(exports, 'extractFrontmatterField', {
  enumerable: true,
  get: function () {
    return extractFrontmatterField;
  }
});
Object.defineProperty(exports, 'getCodexSkillAdapterHeader', {
  enumerable: true,
  get: function () {
    return getCodexSkillAdapterHeader;
  }
});
Object.defineProperty(exports, 'replacePathReferences', {
  enumerable: true,
  get: function () {
    return replacePathReferences;
  }
});
Object.defineProperty(exports, 'stripSubTags', {
  enumerable: true,
  get: function () {
    return stripSubTags;
  }
});
Object.defineProperty(exports, 'toSingleLine', {
  enumerable: true,
  get: function () {
    return toSingleLine;
  }
});
Object.defineProperty(exports, 'yamlQuote', {
  enumerable: true,
  get: function () {
    return yamlQuote;
  }
});
//# sourceMappingURL=frontmatter-BsX2h21y.cjs.map