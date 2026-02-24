#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_readline = require("node:readline");
node_readline = __toESM(node_readline);
let node_crypto = require("node:crypto");
node_crypto = __toESM(node_crypto);

//#region ../adapters/dist/base.js
var require_base = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — Shared base utilities extracted from bin/install.js
	*/
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.expandTilde = expandTilde;
	exports.extractFrontmatterAndBody = extractFrontmatterAndBody;
	exports.processAttribution = processAttribution;
	exports.buildHookCommand = buildHookCommand;
	exports.readSettings = readSettings;
	exports.writeSettings = writeSettings;
	const path$4 = __importStar(require("node:path"));
	const os$4 = __importStar(require("node:os"));
	const fs = __importStar(require("node:fs"));
	/**
	* Expand ~ to home directory (shell doesn't expand in env vars passed to node)
	*/
	function expandTilde(filePath) {
		if (filePath && filePath.startsWith("~/")) return path$4.join(os$4.homedir(), filePath.slice(2));
		return filePath;
	}
	/**
	* Extract YAML frontmatter and body from markdown content.
	* Returns null frontmatter if content doesn't start with ---.
	*/
	function extractFrontmatterAndBody(content) {
		if (!content.startsWith("---")) return {
			frontmatter: null,
			body: content
		};
		const endIndex = content.indexOf("---", 3);
		if (endIndex === -1) return {
			frontmatter: null,
			body: content
		};
		return {
			frontmatter: content.substring(3, endIndex).trim(),
			body: content.substring(endIndex + 3)
		};
	}
	/**
	* Process Co-Authored-By lines based on attribution setting.
	* @param content - File content to process
	* @param attribution - null=remove, undefined=keep default, string=replace
	*/
	function processAttribution(content, attribution) {
		if (attribution === null) return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, "");
		if (attribution === void 0) return content;
		const safeAttribution = attribution.replace(/\$/g, "$$$$");
		return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
	}
	/**
	* Build a hook command path using forward slashes for cross-platform compatibility.
	*/
	function buildHookCommand(configDir, hookName) {
		return `node "${configDir.replace(/\\/g, "/") + "/hooks/" + hookName}"`;
	}
	/**
	* Read and parse settings.json, returning empty object if it doesn't exist.
	*/
	function readSettings(settingsPath) {
		if (fs.existsSync(settingsPath)) try {
			return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
		} catch {
			return {};
		}
		return {};
	}
	/**
	* Write settings.json with proper formatting.
	*/
	function writeSettings(settingsPath, settings) {
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
	}
}));

//#endregion
//#region ../adapters/dist/claude.js
var require_claude = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — Claude Code adapter
	*
	* Ports the Claude-specific logic from bin/install.js:
	*   - getGlobalDir('claude', ...)  (lines 135-142)
	*   - getDirName('claude')         (line 49)
	*   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
	*   - copyWithPathReplacement for Claude (lines 839-892)
	*/
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.claudeAdapter = void 0;
	exports.installClaude = installClaude;
	const path$3 = __importStar(require("node:path"));
	const os$3 = __importStar(require("node:os"));
	const base_js_1 = require_base();
	/**
	* Get the global config directory for Claude Code.
	* Priority: explicitDir > CLAUDE_CONFIG_DIR env > ~/.claude
	*/
	function getGlobalDir(explicitDir) {
		if (explicitDir) return (0, base_js_1.expandTilde)(explicitDir);
		if (process.env.CLAUDE_CONFIG_DIR) return (0, base_js_1.expandTilde)(process.env.CLAUDE_CONFIG_DIR);
		return path$3.join(os$3.homedir(), ".claude");
	}
	/**
	* Get the config directory path relative to home for hook templating.
	* Used for path.join(homeDir, '<configDir>', ...) replacement in hooks.
	*/
	function getConfigDirFromHome(isGlobal) {
		return "'.claude'";
	}
	/**
	* Transform markdown content for Claude Code installation.
	* For Claude, this is path replacement only — no frontmatter conversion needed.
	* Replaces ~/.claude/ and ./.claude/ references with the actual install path prefix.
	*/
	function transformContent(content, pathPrefix) {
		const globalClaudeRegex = /~\/\.claude\//g;
		const localClaudeRegex = /\.\/\.claude\//g;
		let result = content.replace(globalClaudeRegex, pathPrefix);
		result = result.replace(localClaudeRegex, `./.claude/`);
		return result;
	}
	/**
	* Claude Code adapter configuration.
	* Claude uses nested command structure (commands/maxsim/*.md).
	*/
	exports.claudeAdapter = {
		runtime: "claude",
		dirName: ".claude",
		getGlobalDir,
		getConfigDirFromHome,
		transformContent,
		commandStructure: "nested"
	};
	/**
	* Install Claude Code adapter files.
	* Stub — actual install orchestration will be implemented in Phase 5.
	*/
	function installClaude() {
		throw new Error("installClaude() not yet implemented — see Phase 5");
	}
}));

//#endregion
//#region ../adapters/dist/transforms/tool-maps.js
var require_tool_maps = /* @__PURE__ */ __commonJSMin(((exports) => {
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
}));

//#endregion
//#region ../adapters/dist/transforms/content.js
var require_content = /* @__PURE__ */ __commonJSMin(((exports) => {
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
	const tool_maps_js_1 = require_tool_maps();
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
						const mapped = (0, tool_maps_js_1.convertGeminiToolName)(t);
						if (mapped) tools.push(mapped);
					}
				} else inAllowedTools = true;
				continue;
			}
			if (trimmed.startsWith("color:")) continue;
			if (inAllowedTools) {
				if (trimmed.startsWith("- ")) {
					const mapped = (0, tool_maps_js_1.convertGeminiToolName)(trimmed.substring(2).trim());
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
}));

//#endregion
//#region ../adapters/dist/transforms/frontmatter.js
var require_frontmatter = /* @__PURE__ */ __commonJSMin(((exports) => {
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
	const base_js_1 = require_base();
	const tool_maps_js_1 = require_tool_maps();
	const content_js_1 = require_content();
	/** Color name to hex mapping for opencode compatibility */
	exports.colorNameToHex = {
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
				const hexColor = exports.colorNameToHex[colorValue];
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
			for (const tool of allowedTools) newLines.push(`  ${(0, tool_maps_js_1.convertToolName)(tool)}: true`);
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
		const converted = (0, content_js_1.convertClaudeToCodexMarkdown)(content);
		const { frontmatter, body } = (0, base_js_1.extractFrontmatterAndBody)(converted);
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
}));

//#endregion
//#region ../adapters/dist/opencode.js
var require_opencode = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — OpenCode adapter
	*
	* Ports the OpenCode-specific logic from bin/install.js:
	*   - getOpencodeGlobalDir()           (lines 79-97)
	*   - getGlobalDir('opencode', ...)    (lines 104-111)
	*   - getDirName('opencode')           (line 46)
	*   - getConfigDirFromHome('opencode', isGlobal) (lines 58-68)
	*   - convertClaudeToOpencodeFrontmatter + path replacement
	*/
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.opencodeAdapter = void 0;
	const path$2 = __importStar(require("node:path"));
	const os$2 = __importStar(require("node:os"));
	const base_js_1 = require_base();
	const frontmatter_js_1 = require_frontmatter();
	const content_js_1 = require_content();
	/**
	* Get the global config directory for OpenCode.
	* OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/.
	* Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
	*/
	function getOpencodeGlobalDir() {
		if (process.env.OPENCODE_CONFIG_DIR) return (0, base_js_1.expandTilde)(process.env.OPENCODE_CONFIG_DIR);
		if (process.env.OPENCODE_CONFIG) return path$2.dirname((0, base_js_1.expandTilde)(process.env.OPENCODE_CONFIG));
		if (process.env.XDG_CONFIG_HOME) return path$2.join((0, base_js_1.expandTilde)(process.env.XDG_CONFIG_HOME), "opencode");
		return path$2.join(os$2.homedir(), ".config", "opencode");
	}
	/**
	* Get the global config directory for OpenCode.
	* Priority: explicitDir > env vars (via getOpencodeGlobalDir)
	*/
	function getGlobalDir(explicitDir) {
		if (explicitDir) return (0, base_js_1.expandTilde)(explicitDir);
		return getOpencodeGlobalDir();
	}
	/**
	* Get the config directory path relative to home for hook templating.
	*/
	function getConfigDirFromHome(isGlobal) {
		if (!isGlobal) return "'.opencode'";
		return "'.config', 'opencode'";
	}
	/**
	* Transform markdown content for OpenCode installation.
	* Applies frontmatter conversion and path replacement.
	*/
	function transformContent(content, pathPrefix) {
		let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, ".opencode");
		result = result.replace(/~\/\.opencode\//g, pathPrefix);
		result = (0, frontmatter_js_1.convertClaudeToOpencodeFrontmatter)(result);
		return result;
	}
	/**
	* OpenCode adapter configuration.
	* OpenCode uses flat command structure (command/maxsim-*.md).
	*/
	exports.opencodeAdapter = {
		runtime: "opencode",
		dirName: ".opencode",
		getGlobalDir,
		getConfigDirFromHome,
		transformContent,
		commandStructure: "flat"
	};
}));

//#endregion
//#region ../adapters/dist/gemini.js
var require_gemini = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — Gemini adapter
	*
	* Ports the Gemini-specific logic from bin/install.js:
	*   - getGlobalDir('gemini', ...)         (lines 113-122)
	*   - getDirName('gemini')                (line 47)
	*   - getConfigDirFromHome('gemini', isGlobal) (line 69)
	*   - convertClaudeToGeminiToml + convertClaudeToGeminiAgent + stripSubTags
	*/
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.stripSubTags = exports.convertClaudeToGeminiAgent = exports.convertClaudeToGeminiToml = exports.geminiAdapter = void 0;
	const path$1 = __importStar(require("node:path"));
	const os$1 = __importStar(require("node:os"));
	const base_js_1 = require_base();
	const frontmatter_js_1 = require_frontmatter();
	Object.defineProperty(exports, "convertClaudeToGeminiToml", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.convertClaudeToGeminiToml;
		}
	});
	const content_js_1 = require_content();
	Object.defineProperty(exports, "convertClaudeToGeminiAgent", {
		enumerable: true,
		get: function() {
			return content_js_1.convertClaudeToGeminiAgent;
		}
	});
	Object.defineProperty(exports, "stripSubTags", {
		enumerable: true,
		get: function() {
			return content_js_1.stripSubTags;
		}
	});
	/**
	* Get the global config directory for Gemini.
	* Priority: explicitDir > GEMINI_CONFIG_DIR env > ~/.gemini
	*/
	function getGlobalDir(explicitDir) {
		if (explicitDir) return (0, base_js_1.expandTilde)(explicitDir);
		if (process.env.GEMINI_CONFIG_DIR) return (0, base_js_1.expandTilde)(process.env.GEMINI_CONFIG_DIR);
		return path$1.join(os$1.homedir(), ".gemini");
	}
	/**
	* Get the config directory path relative to home for hook templating.
	*/
	function getConfigDirFromHome(_isGlobal) {
		return "'.gemini'";
	}
	/**
	* Transform markdown content for Gemini installation.
	* Applies TOML conversion for commands, agent conversion for agents,
	* stripSubTags, and path replacement.
	*/
	function transformContent(content, pathPrefix) {
		let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, ".gemini");
		result = (0, content_js_1.stripSubTags)(result);
		result = (0, frontmatter_js_1.convertClaudeToGeminiToml)(result);
		return result;
	}
	/**
	* Gemini adapter configuration.
	* Gemini uses nested command structure (commands/maxsim/*.toml).
	*/
	exports.geminiAdapter = {
		runtime: "gemini",
		dirName: ".gemini",
		getGlobalDir,
		getConfigDirFromHome,
		transformContent,
		commandStructure: "nested"
	};
}));

//#endregion
//#region ../adapters/dist/codex.js
var require_codex = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — Codex adapter
	*
	* Ports the Codex-specific logic from bin/install.js:
	*   - getGlobalDir('codex', ...)         (lines 124-133)
	*   - getDirName('codex')                (line 48)
	*   - getConfigDirFromHome('codex', isGlobal) (line 70)
	*   - convertClaudeCommandToCodexSkill + convertClaudeToCodexMarkdown
	*/
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || (function() {
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		return function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.convertClaudeToCodexMarkdown = exports.convertClaudeCommandToCodexSkill = exports.codexAdapter = void 0;
	const path = __importStar(require("node:path"));
	const os = __importStar(require("node:os"));
	const base_js_1 = require_base();
	const frontmatter_js_1 = require_frontmatter();
	Object.defineProperty(exports, "convertClaudeCommandToCodexSkill", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.convertClaudeCommandToCodexSkill;
		}
	});
	const content_js_1 = require_content();
	Object.defineProperty(exports, "convertClaudeToCodexMarkdown", {
		enumerable: true,
		get: function() {
			return content_js_1.convertClaudeToCodexMarkdown;
		}
	});
	/**
	* Get the global config directory for Codex.
	* Priority: explicitDir > CODEX_HOME env > ~/.codex
	*/
	function getGlobalDir(explicitDir) {
		if (explicitDir) return (0, base_js_1.expandTilde)(explicitDir);
		if (process.env.CODEX_HOME) return (0, base_js_1.expandTilde)(process.env.CODEX_HOME);
		return path.join(os.homedir(), ".codex");
	}
	/**
	* Get the config directory path relative to home for hook templating.
	*/
	function getConfigDirFromHome(_isGlobal) {
		return "'.codex'";
	}
	/**
	* Transform markdown content for Codex installation.
	* Applies Codex markdown conversion and path replacement.
	*/
	function transformContent(content, pathPrefix) {
		let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, ".codex");
		result = result.replace(/~\/\.codex\//g, pathPrefix);
		result = (0, frontmatter_js_1.convertClaudeCommandToCodexSkill)(result);
		return result;
	}
	/**
	* Codex adapter configuration.
	* Codex uses skill-based command structure (skills/maxsim-star/SKILL.md).
	*/
	exports.codexAdapter = {
		runtime: "codex",
		dirName: ".codex",
		getGlobalDir,
		getConfigDirFromHome,
		transformContent,
		commandStructure: "skills"
	};
}));

//#endregion
//#region ../adapters/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* @maxsim/adapters — Runtime adapter registry
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.replacePathReferences = exports.convertClaudeToGeminiAgent = exports.stripSubTags = exports.convertClaudeToCodexMarkdown = exports.convertSlashCommandsToCodexSkillMentions = exports.getCodexSkillAdapterHeader = exports.convertClaudeCommandToCodexSkill = exports.convertClaudeToGeminiToml = exports.convertClaudeToOpencodeFrontmatter = exports.extractFrontmatterField = exports.yamlQuote = exports.toSingleLine = exports.colorNameToHex = exports.convertGeminiToolName = exports.convertToolName = exports.writeSettings = exports.readSettings = exports.buildHookCommand = exports.processAttribution = exports.extractFrontmatterAndBody = exports.expandTilde = exports.codexAdapter = exports.geminiAdapter = exports.opencodeAdapter = exports.installClaude = exports.claudeAdapter = void 0;
	const claude_js_1 = require_claude();
	const opencode_js_1 = require_opencode();
	const gemini_js_1 = require_gemini();
	const codex_js_1 = require_codex();
	var claude_js_2 = require_claude();
	Object.defineProperty(exports, "claudeAdapter", {
		enumerable: true,
		get: function() {
			return claude_js_2.claudeAdapter;
		}
	});
	var claude_js_3 = require_claude();
	Object.defineProperty(exports, "installClaude", {
		enumerable: true,
		get: function() {
			return claude_js_3.installClaude;
		}
	});
	var opencode_js_2 = require_opencode();
	Object.defineProperty(exports, "opencodeAdapter", {
		enumerable: true,
		get: function() {
			return opencode_js_2.opencodeAdapter;
		}
	});
	var gemini_js_2 = require_gemini();
	Object.defineProperty(exports, "geminiAdapter", {
		enumerable: true,
		get: function() {
			return gemini_js_2.geminiAdapter;
		}
	});
	var codex_js_2 = require_codex();
	Object.defineProperty(exports, "codexAdapter", {
		enumerable: true,
		get: function() {
			return codex_js_2.codexAdapter;
		}
	});
	var base_js_1 = require_base();
	Object.defineProperty(exports, "expandTilde", {
		enumerable: true,
		get: function() {
			return base_js_1.expandTilde;
		}
	});
	Object.defineProperty(exports, "extractFrontmatterAndBody", {
		enumerable: true,
		get: function() {
			return base_js_1.extractFrontmatterAndBody;
		}
	});
	Object.defineProperty(exports, "processAttribution", {
		enumerable: true,
		get: function() {
			return base_js_1.processAttribution;
		}
	});
	Object.defineProperty(exports, "buildHookCommand", {
		enumerable: true,
		get: function() {
			return base_js_1.buildHookCommand;
		}
	});
	Object.defineProperty(exports, "readSettings", {
		enumerable: true,
		get: function() {
			return base_js_1.readSettings;
		}
	});
	Object.defineProperty(exports, "writeSettings", {
		enumerable: true,
		get: function() {
			return base_js_1.writeSettings;
		}
	});
	var tool_maps_js_1 = require_tool_maps();
	Object.defineProperty(exports, "convertToolName", {
		enumerable: true,
		get: function() {
			return tool_maps_js_1.convertToolName;
		}
	});
	Object.defineProperty(exports, "convertGeminiToolName", {
		enumerable: true,
		get: function() {
			return tool_maps_js_1.convertGeminiToolName;
		}
	});
	var frontmatter_js_1 = require_frontmatter();
	Object.defineProperty(exports, "colorNameToHex", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.colorNameToHex;
		}
	});
	Object.defineProperty(exports, "toSingleLine", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.toSingleLine;
		}
	});
	Object.defineProperty(exports, "yamlQuote", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.yamlQuote;
		}
	});
	Object.defineProperty(exports, "extractFrontmatterField", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.extractFrontmatterField;
		}
	});
	Object.defineProperty(exports, "convertClaudeToOpencodeFrontmatter", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.convertClaudeToOpencodeFrontmatter;
		}
	});
	Object.defineProperty(exports, "convertClaudeToGeminiToml", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.convertClaudeToGeminiToml;
		}
	});
	Object.defineProperty(exports, "convertClaudeCommandToCodexSkill", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.convertClaudeCommandToCodexSkill;
		}
	});
	Object.defineProperty(exports, "getCodexSkillAdapterHeader", {
		enumerable: true,
		get: function() {
			return frontmatter_js_1.getCodexSkillAdapterHeader;
		}
	});
	var content_js_1 = require_content();
	Object.defineProperty(exports, "convertSlashCommandsToCodexSkillMentions", {
		enumerable: true,
		get: function() {
			return content_js_1.convertSlashCommandsToCodexSkillMentions;
		}
	});
	Object.defineProperty(exports, "convertClaudeToCodexMarkdown", {
		enumerable: true,
		get: function() {
			return content_js_1.convertClaudeToCodexMarkdown;
		}
	});
	Object.defineProperty(exports, "stripSubTags", {
		enumerable: true,
		get: function() {
			return content_js_1.stripSubTags;
		}
	});
	Object.defineProperty(exports, "convertClaudeToGeminiAgent", {
		enumerable: true,
		get: function() {
			return content_js_1.convertClaudeToGeminiAgent;
		}
	});
	Object.defineProperty(exports, "replacePathReferences", {
		enumerable: true,
		get: function() {
			return content_js_1.replacePathReferences;
		}
	});
}));

//#endregion
//#region package.json
var require_package = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"name": "maxsimcli",
		"version": "1.0.4",
		"private": false,
		"description": "A meta-prompting, context engineering and spec-driven development system for Claude Code, OpenCode, Gemini and Codex by MayStudios.",
		"bin": { "maxsimcli": "./dist/install.cjs" },
		"main": "./dist/cli.cjs",
		"types": "./dist/cli.d.cts",
		"files": ["dist"],
		"engines": { "node": ">=22.0.0" },
		"keywords": [
			"claude",
			"claude-code",
			"ai",
			"meta-prompting",
			"context-engineering",
			"spec-driven-development",
			"gemini",
			"gemini-cli",
			"codex",
			"codex-cli"
		],
		"author": "MayStudios",
		"license": "MIT",
		"repository": {
			"type": "git",
			"url": "git+https://github.com/maystudios/maxsim.git"
		},
		"homepage": "https://github.com/maystudios/maxsim",
		"bugs": { "url": "https://github.com/maystudios/maxsim/issues" },
		"dependencies": {},
		"devDependencies": {
			"@maxsim/adapters": "workspace:*",
			"@maxsim/core": "workspace:*",
			"@maxsim/templates": "workspace:*",
			"@maxsim/hooks": "workspace:*",
			"@types/node": "^25.3.0"
		}
	};
}));

//#endregion
//#region src/install.ts
var import_dist = require_dist();
const cyan = "\x1B[36m";
const green = "\x1B[32m";
const yellow = "\x1B[33m";
const dim = "\x1B[2m";
const reset = "\x1B[0m";
const pkg = require_package();
const templatesRoot = node_path.resolve(__dirname, "assets", "templates");
const args = process.argv.slice(2);
const hasGlobal = args.includes("--global") || args.includes("-g");
const hasLocal = args.includes("--local") || args.includes("-l");
const hasOpencode = args.includes("--opencode");
const hasClaude = args.includes("--claude");
const hasGemini = args.includes("--gemini");
const hasCodex = args.includes("--codex");
const hasBoth = args.includes("--both");
const hasAll = args.includes("--all");
const hasUninstall = args.includes("--uninstall") || args.includes("-u");
let selectedRuntimes = [];
if (hasAll) selectedRuntimes = [
	"claude",
	"opencode",
	"gemini",
	"codex"
];
else if (hasBoth) selectedRuntimes = ["claude", "opencode"];
else {
	if (hasOpencode) selectedRuntimes.push("opencode");
	if (hasClaude) selectedRuntimes.push("claude");
	if (hasGemini) selectedRuntimes.push("gemini");
	if (hasCodex) selectedRuntimes.push("codex");
}
/**
* Adapter registry keyed by runtime name
*/
const adapterMap = {
	claude: import_dist.claudeAdapter,
	opencode: import_dist.opencodeAdapter,
	gemini: import_dist.geminiAdapter,
	codex: import_dist.codexAdapter
};
/**
* Get adapter for a runtime
*/
function getAdapter(runtime) {
	return adapterMap[runtime];
}
/**
* Get the global config directory for a runtime, using adapter
*/
function getGlobalDir(runtime, explicitDir = null) {
	return getAdapter(runtime).getGlobalDir(explicitDir);
}
/**
* Get the config directory path relative to home for hook templating
*/
function getConfigDirFromHome(runtime, isGlobal) {
	return getAdapter(runtime).getConfigDirFromHome(isGlobal);
}
/**
* Get the local directory name for a runtime
*/
function getDirName(runtime) {
	return getAdapter(runtime).dirName;
}
/**
* Get the global config directory for OpenCode (for JSONC permissions)
* OpenCode follows XDG Base Directory spec
*/
function getOpencodeGlobalDir() {
	return import_dist.opencodeAdapter.getGlobalDir();
}
const banner = "\n" + cyan + "  ██╗  ██╗ █████╗ ██╗  ██╗███████╗██╗██╗  ██╗\n  ███╗███║██╔══██╗╚██╗██╔╝██╔════╝██║███╗███║\n  ██╔████╔██║███████║ ╚███╔╝ ███████╗██║██╔████╔██║\n  ██║╚██╔╝██║██╔══██║ ██╔██╗ ╚════██║██║██║╚██╔╝██║\n  ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗███████║██║██║ ╚═╝ ██║\n  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝\x1B[0m\n\n  MAXSIM \x1B[2mv" + pkg.version + reset + "\n  A meta-prompting, context engineering and spec-driven\n  development system for Claude Code, OpenCode, Gemini, and Codex.\n";
function parseConfigDirArg() {
	const configDirIndex = args.findIndex((arg) => arg === "--config-dir" || arg === "-c");
	if (configDirIndex !== -1) {
		const nextArg = args[configDirIndex + 1];
		if (!nextArg || nextArg.startsWith("-")) {
			console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
			process.exit(1);
		}
		return nextArg;
	}
	const configDirArg = args.find((arg) => arg.startsWith("--config-dir=") || arg.startsWith("-c="));
	if (configDirArg) {
		const value = configDirArg.split("=")[1];
		if (!value) {
			console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
			process.exit(1);
		}
		return value;
	}
	return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes("--help") || args.includes("-h");
const forceStatusline = args.includes("--force-statusline");
console.log(banner);
if (hasHelp) {
	console.log(`  ${yellow}Usage:${reset} npx maxsimcli [options]\n\n  ${yellow}Options:${reset}\n    ${cyan}-g, --global${reset}              Install globally (to config directory)\n    ${cyan}-l, --local${reset}               Install locally (to current directory)\n    ${cyan}--claude${reset}                  Install for Claude Code only\n    ${cyan}--opencode${reset}                Install for OpenCode only\n    ${cyan}--gemini${reset}                  Install for Gemini only\n    ${cyan}--codex${reset}                   Install for Codex only\n    ${cyan}--all${reset}                     Install for all runtimes\n    ${cyan}-u, --uninstall${reset}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory\n    ${cyan}-h, --help${reset}                Show this help message\n    ${cyan}--force-statusline${reset}        Replace existing statusline config\n\n  ${yellow}Examples:${reset}\n    ${dim}# Interactive install (prompts for runtime and location)${reset}\n    npx maxsimcli\n\n    ${dim}# Install for Claude Code globally${reset}\n    npx maxsimcli --claude --global\n\n    ${dim}# Install for Gemini globally${reset}\n    npx maxsimcli --gemini --global\n\n    ${dim}# Install for Codex globally${reset}\n    npx maxsimcli --codex --global\n\n    ${dim}# Install for all runtimes globally${reset}\n    npx maxsimcli --all --global\n\n    ${dim}# Install to custom config directory${reset}\n    npx maxsimcli --codex --global --config-dir ~/.codex-work\n\n    ${dim}# Install to current project only${reset}\n    npx maxsimcli --claude --local\n\n    ${dim}# Uninstall MAXSIM from Codex globally${reset}\n    npx maxsimcli --codex --global --uninstall\n\n  ${yellow}Notes:${reset}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_HOME environment variables.\n`);
	process.exit(0);
}
const attributionCache = /* @__PURE__ */ new Map();
/**
* Get commit attribution setting for a runtime
* @returns null = remove, undefined = keep default, string = custom
*/
function getCommitAttribution(runtime) {
	if (attributionCache.has(runtime)) return attributionCache.get(runtime);
	let result;
	if (runtime === "opencode") result = (0, import_dist.readSettings)(node_path.join(getGlobalDir("opencode", null), "opencode.json")).disable_ai_attribution === true ? null : void 0;
	else if (runtime === "gemini") {
		const attr = (0, import_dist.readSettings)(node_path.join(getGlobalDir("gemini", explicitConfigDir), "settings.json")).attribution;
		if (!attr || attr.commit === void 0) result = void 0;
		else if (attr.commit === "") result = null;
		else result = attr.commit;
	} else if (runtime === "claude") {
		const attr = (0, import_dist.readSettings)(node_path.join(getGlobalDir("claude", explicitConfigDir), "settings.json")).attribution;
		if (!attr || attr.commit === void 0) result = void 0;
		else if (attr.commit === "") result = null;
		else result = attr.commit;
	} else result = void 0;
	attributionCache.set(runtime, result);
	return result;
}
/**
* Copy commands to a flat structure for OpenCode
* OpenCode expects: command/maxsim-help.md (invoked as /maxsim-help)
* Source structure: commands/maxsim/help.md
*/
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
	if (!node_fs.existsSync(srcDir)) return;
	if (node_fs.existsSync(destDir)) {
		for (const file of node_fs.readdirSync(destDir)) if (file.startsWith(`${prefix}-`) && file.endsWith(".md")) node_fs.unlinkSync(node_path.join(destDir, file));
	} else node_fs.mkdirSync(destDir, { recursive: true });
	const entries = node_fs.readdirSync(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = node_path.join(srcDir, entry.name);
		if (entry.isDirectory()) copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
		else if (entry.name.endsWith(".md")) {
			const destName = `${prefix}-${entry.name.replace(".md", "")}.md`;
			const destPath = node_path.join(destDir, destName);
			let content = node_fs.readFileSync(srcPath, "utf8");
			const globalClaudeRegex = /~\/\.claude\//g;
			const localClaudeRegex = /\.\/\.claude\//g;
			const opencodeDirRegex = /~\/\.opencode\//g;
			content = content.replace(globalClaudeRegex, pathPrefix);
			content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
			content = content.replace(opencodeDirRegex, pathPrefix);
			content = (0, import_dist.processAttribution)(content, getCommitAttribution(runtime));
			content = (0, import_dist.convertClaudeToOpencodeFrontmatter)(content);
			node_fs.writeFileSync(destPath, content);
		}
	}
}
function listCodexSkillNames(skillsDir, prefix = "maxsim-") {
	if (!node_fs.existsSync(skillsDir)) return [];
	return node_fs.readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix)).filter((entry) => node_fs.existsSync(node_path.join(skillsDir, entry.name, "SKILL.md"))).map((entry) => entry.name).sort();
}
function copyCommandsAsCodexSkills(srcDir, skillsDir, prefix, pathPrefix, runtime) {
	if (!node_fs.existsSync(srcDir)) return;
	node_fs.mkdirSync(skillsDir, { recursive: true });
	const existing = node_fs.readdirSync(skillsDir, { withFileTypes: true });
	for (const entry of existing) if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) node_fs.rmSync(node_path.join(skillsDir, entry.name), { recursive: true });
	function recurse(currentSrcDir, currentPrefix) {
		const entries = node_fs.readdirSync(currentSrcDir, { withFileTypes: true });
		for (const entry of entries) {
			const srcPath = node_path.join(currentSrcDir, entry.name);
			if (entry.isDirectory()) {
				recurse(srcPath, `${currentPrefix}-${entry.name}`);
				continue;
			}
			if (!entry.name.endsWith(".md")) continue;
			const skillName = `${currentPrefix}-${entry.name.replace(".md", "")}`;
			const skillDir = node_path.join(skillsDir, skillName);
			node_fs.mkdirSync(skillDir, { recursive: true });
			let content = node_fs.readFileSync(srcPath, "utf8");
			const globalClaudeRegex = /~\/\.claude\//g;
			const localClaudeRegex = /\.\/\.claude\//g;
			const codexDirRegex = /~\/\.codex\//g;
			content = content.replace(globalClaudeRegex, pathPrefix);
			content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
			content = content.replace(codexDirRegex, pathPrefix);
			content = (0, import_dist.processAttribution)(content, getCommitAttribution(runtime));
			content = (0, import_dist.convertClaudeCommandToCodexSkill)(content, skillName);
			node_fs.writeFileSync(node_path.join(skillDir, "SKILL.md"), content);
		}
	}
	recurse(srcDir, prefix);
}
/**
* Recursively copy directory, replacing paths in .md files
* Deletes existing destDir first to remove orphaned files from previous versions
*/
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, isCommand = false) {
	const isOpencode = runtime === "opencode";
	const isCodex = runtime === "codex";
	const dirName = getDirName(runtime);
	if (node_fs.existsSync(destDir)) node_fs.rmSync(destDir, { recursive: true });
	node_fs.mkdirSync(destDir, { recursive: true });
	const entries = node_fs.readdirSync(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = node_path.join(srcDir, entry.name);
		const destPath = node_path.join(destDir, entry.name);
		if (entry.isDirectory()) copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, isCommand);
		else if (entry.name.endsWith(".md")) {
			let content = node_fs.readFileSync(srcPath, "utf8");
			const globalClaudeRegex = /~\/\.claude\//g;
			const localClaudeRegex = /\.\/\.claude\//g;
			content = content.replace(globalClaudeRegex, pathPrefix);
			content = content.replace(localClaudeRegex, `./${dirName}/`);
			content = (0, import_dist.processAttribution)(content, getCommitAttribution(runtime));
			if (isOpencode) {
				content = (0, import_dist.convertClaudeToOpencodeFrontmatter)(content);
				node_fs.writeFileSync(destPath, content);
			} else if (runtime === "gemini") if (isCommand) {
				content = (0, import_dist.stripSubTags)(content);
				const tomlContent = (0, import_dist.convertClaudeToGeminiToml)(content);
				const tomlPath = destPath.replace(/\.md$/, ".toml");
				node_fs.writeFileSync(tomlPath, tomlContent);
			} else node_fs.writeFileSync(destPath, content);
			else if (isCodex) {
				content = (0, import_dist.convertClaudeToCodexMarkdown)(content);
				node_fs.writeFileSync(destPath, content);
			} else node_fs.writeFileSync(destPath, content);
		} else node_fs.copyFileSync(srcPath, destPath);
	}
}
/**
* Clean up orphaned files from previous MAXSIM versions
*/
function cleanupOrphanedFiles(configDir) {
	for (const relPath of ["hooks/maxsim-notify.sh", "hooks/statusline.js"]) {
		const fullPath = node_path.join(configDir, relPath);
		if (node_fs.existsSync(fullPath)) {
			node_fs.unlinkSync(fullPath);
			console.log(`  ${green}\u2713${reset} Removed orphaned ${relPath}`);
		}
	}
}
/**
* Clean up orphaned hook registrations from settings.json
*/
function cleanupOrphanedHooks(settings) {
	const orphanedHookPatterns = [
		"maxsim-notify.sh",
		"hooks/statusline.js",
		"maxsim-intel-index.js",
		"maxsim-intel-session.js",
		"maxsim-intel-prune.js"
	];
	let cleanedHooks = false;
	const hooks = settings.hooks;
	if (hooks) for (const eventType of Object.keys(hooks)) {
		const hookEntries = hooks[eventType];
		if (Array.isArray(hookEntries)) hooks[eventType] = hookEntries.filter((entry) => {
			if (entry.hooks && Array.isArray(entry.hooks)) {
				if (entry.hooks.some((h) => h.command && orphanedHookPatterns.some((pattern) => h.command.includes(pattern)))) {
					cleanedHooks = true;
					return false;
				}
			}
			return true;
		});
	}
	if (cleanedHooks) console.log(`  ${green}\u2713${reset} Removed orphaned hook registrations`);
	const statusLine = settings.statusLine;
	if (statusLine && statusLine.command && statusLine.command.includes("statusline.js") && !statusLine.command.includes("maxsim-statusline.js")) {
		statusLine.command = statusLine.command.replace(/statusline\.js/, "maxsim-statusline.js");
		console.log(`  ${green}\u2713${reset} Updated statusline path (statusline.js \u2192 maxsim-statusline.js)`);
	}
	return settings;
}
/**
* Uninstall MAXSIM from the specified directory for a specific runtime
*/
function uninstall(isGlobal, runtime = "claude") {
	const isOpencode = runtime === "opencode";
	const isCodex = runtime === "codex";
	const dirName = getDirName(runtime);
	const targetDir = isGlobal ? getGlobalDir(runtime, explicitConfigDir) : node_path.join(process.cwd(), dirName);
	const locationLabel = isGlobal ? targetDir.replace(node_os.homedir(), "~") : targetDir.replace(process.cwd(), ".");
	let runtimeLabel = "Claude Code";
	if (runtime === "opencode") runtimeLabel = "OpenCode";
	if (runtime === "gemini") runtimeLabel = "Gemini";
	if (runtime === "codex") runtimeLabel = "Codex";
	console.log(`  Uninstalling MAXSIM from ${cyan}${runtimeLabel}${reset} at ${cyan}${locationLabel}${reset}\n`);
	if (!node_fs.existsSync(targetDir)) {
		console.log(`  ${yellow}\u26a0${reset} Directory does not exist: ${locationLabel}`);
		console.log(`  Nothing to uninstall.\n`);
		return;
	}
	let removedCount = 0;
	if (isOpencode) {
		const commandDir = node_path.join(targetDir, "command");
		if (node_fs.existsSync(commandDir)) {
			const files = node_fs.readdirSync(commandDir);
			for (const file of files) if (file.startsWith("maxsim-") && file.endsWith(".md")) {
				node_fs.unlinkSync(node_path.join(commandDir, file));
				removedCount++;
			}
			console.log(`  ${green}\u2713${reset} Removed MAXSIM commands from command/`);
		}
	} else if (isCodex) {
		const skillsDir = node_path.join(targetDir, "skills");
		if (node_fs.existsSync(skillsDir)) {
			let skillCount = 0;
			const entries = node_fs.readdirSync(skillsDir, { withFileTypes: true });
			for (const entry of entries) if (entry.isDirectory() && entry.name.startsWith("maxsim-")) {
				node_fs.rmSync(node_path.join(skillsDir, entry.name), { recursive: true });
				skillCount++;
			}
			if (skillCount > 0) {
				removedCount++;
				console.log(`  ${green}\u2713${reset} Removed ${skillCount} Codex skills`);
			}
		}
	} else {
		const maxsimCommandsDir = node_path.join(targetDir, "commands", "maxsim");
		if (node_fs.existsSync(maxsimCommandsDir)) {
			node_fs.rmSync(maxsimCommandsDir, { recursive: true });
			removedCount++;
			console.log(`  ${green}\u2713${reset} Removed commands/maxsim/`);
		}
	}
	const maxsimDir = node_path.join(targetDir, "maxsim");
	if (node_fs.existsSync(maxsimDir)) {
		node_fs.rmSync(maxsimDir, { recursive: true });
		removedCount++;
		console.log(`  ${green}\u2713${reset} Removed maxsim/`);
	}
	const agentsDir = node_path.join(targetDir, "agents");
	if (node_fs.existsSync(agentsDir)) {
		const files = node_fs.readdirSync(agentsDir);
		let agentCount = 0;
		for (const file of files) if (file.startsWith("maxsim-") && file.endsWith(".md")) {
			node_fs.unlinkSync(node_path.join(agentsDir, file));
			agentCount++;
		}
		if (agentCount > 0) {
			removedCount++;
			console.log(`  ${green}\u2713${reset} Removed ${agentCount} MAXSIM agents`);
		}
	}
	const hooksDir = node_path.join(targetDir, "hooks");
	if (node_fs.existsSync(hooksDir)) {
		const maxsimHooks = [
			"maxsim-statusline.js",
			"maxsim-check-update.js",
			"maxsim-check-update.sh",
			"maxsim-context-monitor.js"
		];
		let hookCount = 0;
		for (const hook of maxsimHooks) {
			const hookPath = node_path.join(hooksDir, hook);
			if (node_fs.existsSync(hookPath)) {
				node_fs.unlinkSync(hookPath);
				hookCount++;
			}
		}
		if (hookCount > 0) {
			removedCount++;
			console.log(`  ${green}\u2713${reset} Removed ${hookCount} MAXSIM hooks`);
		}
	}
	const pkgJsonPath = node_path.join(targetDir, "package.json");
	if (node_fs.existsSync(pkgJsonPath)) try {
		if (node_fs.readFileSync(pkgJsonPath, "utf8").trim() === "{\"type\":\"commonjs\"}") {
			node_fs.unlinkSync(pkgJsonPath);
			removedCount++;
			console.log(`  ${green}\u2713${reset} Removed MAXSIM package.json`);
		}
	} catch {}
	const settingsPath = node_path.join(targetDir, "settings.json");
	if (node_fs.existsSync(settingsPath)) {
		const settings = (0, import_dist.readSettings)(settingsPath);
		let settingsModified = false;
		const statusLine = settings.statusLine;
		if (statusLine && statusLine.command && statusLine.command.includes("maxsim-statusline")) {
			delete settings.statusLine;
			settingsModified = true;
			console.log(`  ${green}\u2713${reset} Removed MAXSIM statusline from settings`);
		}
		const settingsHooks = settings.hooks;
		if (settingsHooks && settingsHooks.SessionStart) {
			const before = settingsHooks.SessionStart.length;
			settingsHooks.SessionStart = settingsHooks.SessionStart.filter((entry) => {
				if (entry.hooks && Array.isArray(entry.hooks)) return !entry.hooks.some((h) => h.command && (h.command.includes("maxsim-check-update") || h.command.includes("maxsim-statusline")));
				return true;
			});
			if (settingsHooks.SessionStart.length < before) {
				settingsModified = true;
				console.log(`  ${green}\u2713${reset} Removed MAXSIM hooks from settings`);
			}
			if (settingsHooks.SessionStart.length === 0) delete settingsHooks.SessionStart;
		}
		if (settingsHooks && settingsHooks.PostToolUse) {
			const before = settingsHooks.PostToolUse.length;
			settingsHooks.PostToolUse = settingsHooks.PostToolUse.filter((entry) => {
				if (entry.hooks && Array.isArray(entry.hooks)) return !entry.hooks.some((h) => h.command && h.command.includes("maxsim-context-monitor"));
				return true;
			});
			if (settingsHooks.PostToolUse.length < before) {
				settingsModified = true;
				console.log(`  ${green}\u2713${reset} Removed context monitor hook from settings`);
			}
			if (settingsHooks.PostToolUse.length === 0) delete settingsHooks.PostToolUse;
		}
		if (settingsHooks && Object.keys(settingsHooks).length === 0) delete settings.hooks;
		if (settingsModified) {
			(0, import_dist.writeSettings)(settingsPath, settings);
			removedCount++;
		}
	}
	if (isOpencode) {
		const opencodeConfigDir = isGlobal ? getOpencodeGlobalDir() : node_path.join(process.cwd(), ".opencode");
		const configPath = node_path.join(opencodeConfigDir, "opencode.json");
		if (node_fs.existsSync(configPath)) try {
			const config = JSON.parse(node_fs.readFileSync(configPath, "utf8"));
			let modified = false;
			const permission = config.permission;
			if (permission) {
				for (const permType of ["read", "external_directory"]) if (permission[permType]) {
					const keys = Object.keys(permission[permType]);
					for (const key of keys) if (key.includes("maxsim")) {
						delete permission[permType][key];
						modified = true;
					}
					if (Object.keys(permission[permType]).length === 0) delete permission[permType];
				}
				if (Object.keys(permission).length === 0) delete config.permission;
			}
			if (modified) {
				node_fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
				removedCount++;
				console.log(`  ${green}\u2713${reset} Removed MAXSIM permissions from opencode.json`);
			}
		} catch {}
	}
	if (removedCount === 0) console.log(`  ${yellow}\u26a0${reset} No MAXSIM files found to remove.`);
	console.log(`
  ${green}Done!${reset} MAXSIM has been uninstalled from ${runtimeLabel}.
  Your other files and settings have been preserved.
`);
}
/**
* Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
*/
function parseJsonc(content) {
	if (content.charCodeAt(0) === 65279) content = content.slice(1);
	let result = "";
	let inString = false;
	let i = 0;
	while (i < content.length) {
		const char = content[i];
		const next = content[i + 1];
		if (inString) {
			result += char;
			if (char === "\\" && i + 1 < content.length) {
				result += next;
				i += 2;
				continue;
			}
			if (char === "\"") inString = false;
			i++;
		} else if (char === "\"") {
			inString = true;
			result += char;
			i++;
		} else if (char === "/" && next === "/") while (i < content.length && content[i] !== "\n") i++;
		else if (char === "/" && next === "*") {
			i += 2;
			while (i < content.length - 1 && !(content[i] === "*" && content[i + 1] === "/")) i++;
			i += 2;
		} else {
			result += char;
			i++;
		}
	}
	result = result.replace(/,(\s*[}\]])/g, "$1");
	return JSON.parse(result);
}
/**
* Configure OpenCode permissions to allow reading MAXSIM reference docs
*/
function configureOpencodePermissions(isGlobal = true) {
	const opencodeConfigDir = isGlobal ? getOpencodeGlobalDir() : node_path.join(process.cwd(), ".opencode");
	const configPath = node_path.join(opencodeConfigDir, "opencode.json");
	node_fs.mkdirSync(opencodeConfigDir, { recursive: true });
	let config = {};
	if (node_fs.existsSync(configPath)) try {
		config = parseJsonc(node_fs.readFileSync(configPath, "utf8"));
	} catch (e) {
		console.log(`  ${yellow}\u26a0${reset} Could not parse opencode.json - skipping permission config`);
		console.log(`    ${dim}Reason: ${e.message}${reset}`);
		console.log(`    ${dim}Your config was NOT modified. Fix the syntax manually if needed.${reset}`);
		return;
	}
	if (!config.permission) config.permission = {};
	const permission = config.permission;
	const maxsimPath = opencodeConfigDir === node_path.join(node_os.homedir(), ".config", "opencode") ? "~/.config/opencode/maxsim/*" : `${opencodeConfigDir.replace(/\\/g, "/")}/maxsim/*`;
	let modified = false;
	if (!permission.read || typeof permission.read !== "object") permission.read = {};
	if (permission.read[maxsimPath] !== "allow") {
		permission.read[maxsimPath] = "allow";
		modified = true;
	}
	if (!permission.external_directory || typeof permission.external_directory !== "object") permission.external_directory = {};
	if (permission.external_directory[maxsimPath] !== "allow") {
		permission.external_directory[maxsimPath] = "allow";
		modified = true;
	}
	if (!modified) return;
	node_fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
	console.log(`  ${green}\u2713${reset} Configured read permission for MAXSIM docs`);
}
/**
* Verify a directory exists and contains files
*/
function verifyInstalled(dirPath, description) {
	if (!node_fs.existsSync(dirPath)) {
		console.error(`  ${yellow}\u2717${reset} Failed to install ${description}: directory not created`);
		return false;
	}
	try {
		if (node_fs.readdirSync(dirPath).length === 0) {
			console.error(`  ${yellow}\u2717${reset} Failed to install ${description}: directory is empty`);
			return false;
		}
	} catch (e) {
		console.error(`  ${yellow}\u2717${reset} Failed to install ${description}: ${e.message}`);
		return false;
	}
	return true;
}
/**
* Verify a file exists
*/
function verifyFileInstalled(filePath, description) {
	if (!node_fs.existsSync(filePath)) {
		console.error(`  ${yellow}\u2717${reset} Failed to install ${description}: file not created`);
		return false;
	}
	return true;
}
const PATCHES_DIR_NAME = "maxsim-local-patches";
const MANIFEST_NAME = "maxsim-file-manifest.json";
/**
* Compute SHA256 hash of file contents
*/
function fileHash(filePath) {
	const content = node_fs.readFileSync(filePath);
	return node_crypto.createHash("sha256").update(content).digest("hex");
}
/**
* Recursively collect all files in dir with their hashes
*/
function generateManifest(dir, baseDir) {
	if (!baseDir) baseDir = dir;
	const manifest = {};
	if (!node_fs.existsSync(dir)) return manifest;
	const entries = node_fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = node_path.join(dir, entry.name);
		const relPath = node_path.relative(baseDir, fullPath).replace(/\\/g, "/");
		if (entry.isDirectory()) Object.assign(manifest, generateManifest(fullPath, baseDir));
		else manifest[relPath] = fileHash(fullPath);
	}
	return manifest;
}
/**
* Write file manifest after installation for future modification detection
*/
function writeManifest(configDir, runtime = "claude") {
	const isOpencode = runtime === "opencode";
	const isCodex = runtime === "codex";
	const maxsimDir = node_path.join(configDir, "maxsim");
	const commandsDir = node_path.join(configDir, "commands", "maxsim");
	const opencodeCommandDir = node_path.join(configDir, "command");
	const codexSkillsDir = node_path.join(configDir, "skills");
	const agentsDir = node_path.join(configDir, "agents");
	const manifest = {
		version: pkg.version,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		files: {}
	};
	const maxsimHashes = generateManifest(maxsimDir);
	for (const [rel, hash] of Object.entries(maxsimHashes)) manifest.files["maxsim/" + rel] = hash;
	if (!isOpencode && !isCodex && node_fs.existsSync(commandsDir)) {
		const cmdHashes = generateManifest(commandsDir);
		for (const [rel, hash] of Object.entries(cmdHashes)) manifest.files["commands/maxsim/" + rel] = hash;
	}
	if (isOpencode && node_fs.existsSync(opencodeCommandDir)) {
		for (const file of node_fs.readdirSync(opencodeCommandDir)) if (file.startsWith("maxsim-") && file.endsWith(".md")) manifest.files["command/" + file] = fileHash(node_path.join(opencodeCommandDir, file));
	}
	if (isCodex && node_fs.existsSync(codexSkillsDir)) for (const skillName of listCodexSkillNames(codexSkillsDir)) {
		const skillHashes = generateManifest(node_path.join(codexSkillsDir, skillName));
		for (const [rel, hash] of Object.entries(skillHashes)) manifest.files[`skills/${skillName}/${rel}`] = hash;
	}
	if (node_fs.existsSync(agentsDir)) {
		for (const file of node_fs.readdirSync(agentsDir)) if (file.startsWith("maxsim-") && file.endsWith(".md")) manifest.files["agents/" + file] = fileHash(node_path.join(agentsDir, file));
	}
	node_fs.writeFileSync(node_path.join(configDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
	return manifest;
}
/**
* Detect user-modified MAXSIM files by comparing against install manifest.
*/
function saveLocalPatches(configDir) {
	const manifestPath = node_path.join(configDir, MANIFEST_NAME);
	if (!node_fs.existsSync(manifestPath)) return [];
	let manifest;
	try {
		manifest = JSON.parse(node_fs.readFileSync(manifestPath, "utf8"));
	} catch {
		return [];
	}
	const patchesDir = node_path.join(configDir, PATCHES_DIR_NAME);
	const modified = [];
	for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
		const fullPath = node_path.join(configDir, relPath);
		if (!node_fs.existsSync(fullPath)) continue;
		if (fileHash(fullPath) !== originalHash) {
			const backupPath = node_path.join(patchesDir, relPath);
			node_fs.mkdirSync(node_path.dirname(backupPath), { recursive: true });
			node_fs.copyFileSync(fullPath, backupPath);
			modified.push(relPath);
		}
	}
	if (modified.length > 0) {
		const meta = {
			backed_up_at: (/* @__PURE__ */ new Date()).toISOString(),
			from_version: manifest.version,
			files: modified
		};
		node_fs.writeFileSync(node_path.join(patchesDir, "backup-meta.json"), JSON.stringify(meta, null, 2));
		console.log("  " + yellow + "i\x1B[0m  Found " + modified.length + " locally modified MAXSIM file(s) — backed up to maxsim-local-patches/");
		for (const f of modified) console.log("     " + dim + f + reset);
	}
	return modified;
}
/**
* After install, report backed-up patches for user to reapply.
*/
function reportLocalPatches(configDir, runtime = "claude") {
	const patchesDir = node_path.join(configDir, PATCHES_DIR_NAME);
	const metaPath = node_path.join(patchesDir, "backup-meta.json");
	if (!node_fs.existsSync(metaPath)) return [];
	let meta;
	try {
		meta = JSON.parse(node_fs.readFileSync(metaPath, "utf8"));
	} catch {
		return [];
	}
	if (meta.files && meta.files.length > 0) {
		const reapplyCommand = runtime === "opencode" ? "/maxsim-reapply-patches" : runtime === "codex" ? "$maxsim-reapply-patches" : "/maxsim:reapply-patches";
		console.log("");
		console.log("  " + yellow + "Local patches detected\x1B[0m (from v" + meta.from_version + "):");
		for (const f of meta.files) console.log("     " + cyan + f + reset);
		console.log("");
		console.log("  Your modifications are saved in " + cyan + PATCHES_DIR_NAME + "/\x1B[0m");
		console.log("  Run " + cyan + reapplyCommand + reset + " to merge them into the new version.");
		console.log("  Or manually compare and merge the files.");
		console.log("");
	}
	return meta.files || [];
}
function install(isGlobal, runtime = "claude") {
	const isOpencode = runtime === "opencode";
	const isGemini = runtime === "gemini";
	const isCodex = runtime === "codex";
	const dirName = getDirName(runtime);
	const src = templatesRoot;
	const targetDir = isGlobal ? getGlobalDir(runtime, explicitConfigDir) : node_path.join(process.cwd(), dirName);
	const locationLabel = isGlobal ? targetDir.replace(node_os.homedir(), "~") : targetDir.replace(process.cwd(), ".");
	const pathPrefix = isGlobal ? `${targetDir.replace(/\\/g, "/")}/` : `./${dirName}/`;
	let runtimeLabel = "Claude Code";
	if (isOpencode) runtimeLabel = "OpenCode";
	if (isGemini) runtimeLabel = "Gemini";
	if (isCodex) runtimeLabel = "Codex";
	console.log(`  Installing for ${cyan}${runtimeLabel}${reset} to ${cyan}${locationLabel}${reset}\n`);
	const failures = [];
	saveLocalPatches(targetDir);
	cleanupOrphanedFiles(targetDir);
	if (isOpencode) {
		const commandDir = node_path.join(targetDir, "command");
		node_fs.mkdirSync(commandDir, { recursive: true });
		copyFlattenedCommands(node_path.join(src, "commands", "maxsim"), commandDir, "maxsim", pathPrefix, runtime);
		if (verifyInstalled(commandDir, "command/maxsim-*")) {
			const count = node_fs.readdirSync(commandDir).filter((f) => f.startsWith("maxsim-")).length;
			console.log(`  ${green}\u2713${reset} Installed ${count} commands to command/`);
		} else failures.push("command/maxsim-*");
	} else if (isCodex) {
		const skillsDir = node_path.join(targetDir, "skills");
		copyCommandsAsCodexSkills(node_path.join(src, "commands", "maxsim"), skillsDir, "maxsim", pathPrefix, runtime);
		const installedSkillNames = listCodexSkillNames(skillsDir);
		if (installedSkillNames.length > 0) console.log(`  ${green}\u2713${reset} Installed ${installedSkillNames.length} skills to skills/`);
		else failures.push("skills/maxsim-*");
	} else {
		const commandsDir = node_path.join(targetDir, "commands");
		node_fs.mkdirSync(commandsDir, { recursive: true });
		const maxsimSrc = node_path.join(src, "commands", "maxsim");
		const maxsimDest = node_path.join(commandsDir, "maxsim");
		copyWithPathReplacement(maxsimSrc, maxsimDest, pathPrefix, runtime, true);
		if (verifyInstalled(maxsimDest, "commands/maxsim")) console.log(`  ${green}\u2713${reset} Installed commands/maxsim`);
		else failures.push("commands/maxsim");
	}
	const skillDest = node_path.join(targetDir, "maxsim");
	const maxsimSubdirs = [
		"workflows",
		"templates",
		"references"
	];
	if (node_fs.existsSync(skillDest)) node_fs.rmSync(skillDest, { recursive: true });
	node_fs.mkdirSync(skillDest, { recursive: true });
	for (const subdir of maxsimSubdirs) {
		const subdirSrc = node_path.join(src, subdir);
		if (node_fs.existsSync(subdirSrc)) copyWithPathReplacement(subdirSrc, node_path.join(skillDest, subdir), pathPrefix, runtime);
	}
	if (verifyInstalled(skillDest, "maxsim")) console.log(`  ${green}\u2713${reset} Installed maxsim`);
	else failures.push("maxsim");
	const agentsSrc = node_path.join(src, "agents");
	if (node_fs.existsSync(agentsSrc)) {
		const agentsDest = node_path.join(targetDir, "agents");
		node_fs.mkdirSync(agentsDest, { recursive: true });
		if (node_fs.existsSync(agentsDest)) {
			for (const file of node_fs.readdirSync(agentsDest)) if (file.startsWith("maxsim-") && file.endsWith(".md")) node_fs.unlinkSync(node_path.join(agentsDest, file));
		}
		const agentEntries = node_fs.readdirSync(agentsSrc, { withFileTypes: true });
		for (const entry of agentEntries) if (entry.isFile() && entry.name.endsWith(".md")) {
			let content = node_fs.readFileSync(node_path.join(agentsSrc, entry.name), "utf8");
			content = content.replace(/~\/\.claude\//g, pathPrefix);
			content = (0, import_dist.processAttribution)(content, getCommitAttribution(runtime));
			if (isOpencode) content = (0, import_dist.convertClaudeToOpencodeFrontmatter)(content);
			else if (isGemini) content = (0, import_dist.convertClaudeToGeminiAgent)(content);
			else if (isCodex) content = (0, import_dist.convertClaudeToCodexMarkdown)(content);
			node_fs.writeFileSync(node_path.join(agentsDest, entry.name), content);
		}
		if (verifyInstalled(agentsDest, "agents")) console.log(`  ${green}\u2713${reset} Installed agents`);
		else failures.push("agents");
	}
	const changelogSrc = node_path.join(src, "..", "CHANGELOG.md");
	const changelogDest = node_path.join(targetDir, "maxsim", "CHANGELOG.md");
	if (node_fs.existsSync(changelogSrc)) {
		node_fs.copyFileSync(changelogSrc, changelogDest);
		if (verifyFileInstalled(changelogDest, "CHANGELOG.md")) console.log(`  ${green}\u2713${reset} Installed CHANGELOG.md`);
		else failures.push("CHANGELOG.md");
	}
	const claudeMdSrc = node_path.join(src, "CLAUDE.md");
	const claudeMdDest = node_path.join(targetDir, "CLAUDE.md");
	if (node_fs.existsSync(claudeMdSrc)) {
		node_fs.copyFileSync(claudeMdSrc, claudeMdDest);
		if (verifyFileInstalled(claudeMdDest, "CLAUDE.md")) console.log(`  ${green}\u2713${reset} Installed CLAUDE.md`);
		else failures.push("CLAUDE.md");
	}
	const versionDest = node_path.join(targetDir, "maxsim", "VERSION");
	node_fs.writeFileSync(versionDest, pkg.version);
	if (verifyFileInstalled(versionDest, "VERSION")) console.log(`  ${green}\u2713${reset} Wrote VERSION (${pkg.version})`);
	else failures.push("VERSION");
	if (!isCodex) {
		const pkgJsonDest = node_path.join(targetDir, "package.json");
		node_fs.writeFileSync(pkgJsonDest, "{\"type\":\"commonjs\"}\n");
		console.log(`  ${green}\u2713${reset} Wrote package.json (CommonJS mode)`);
		let hooksSrc = null;
		const bundledHooksDir = node_path.resolve(__dirname, "assets", "hooks");
		if (node_fs.existsSync(bundledHooksDir)) hooksSrc = bundledHooksDir;
		else console.warn(`  ${yellow}!${reset} bundled hooks not found - hooks will not be installed`);
		if (hooksSrc) {
			const hooksDest = node_path.join(targetDir, "hooks");
			node_fs.mkdirSync(hooksDest, { recursive: true });
			const hookEntries = node_fs.readdirSync(hooksSrc);
			const configDirReplacement = getConfigDirFromHome(runtime, isGlobal);
			for (const entry of hookEntries) {
				const srcFile = node_path.join(hooksSrc, entry);
				if (node_fs.statSync(srcFile).isFile() && entry.endsWith(".cjs") && !entry.includes(".d.")) {
					const destName = entry.replace(/\.cjs$/, ".js");
					const destFile = node_path.join(hooksDest, destName);
					let content = node_fs.readFileSync(srcFile, "utf8");
					content = content.replace(/'\.claude'/g, configDirReplacement);
					node_fs.writeFileSync(destFile, content);
				}
			}
			if (verifyInstalled(hooksDest, "hooks")) console.log(`  ${green}\u2713${reset} Installed hooks (bundled)`);
			else failures.push("hooks");
		}
	}
	if (failures.length > 0) {
		console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(", ")}`);
		process.exit(1);
	}
	writeManifest(targetDir, runtime);
	console.log(`  ${green}\u2713${reset} Wrote file manifest (${MANIFEST_NAME})`);
	reportLocalPatches(targetDir, runtime);
	if (isCodex) return {
		settingsPath: null,
		settings: null,
		statuslineCommand: null,
		runtime
	};
	const settingsPath = node_path.join(targetDir, "settings.json");
	const settings = cleanupOrphanedHooks((0, import_dist.readSettings)(settingsPath));
	const statuslineCommand = isGlobal ? (0, import_dist.buildHookCommand)(targetDir, "maxsim-statusline.js") : "node " + dirName + "/hooks/maxsim-statusline.js";
	const updateCheckCommand = isGlobal ? (0, import_dist.buildHookCommand)(targetDir, "maxsim-check-update.js") : "node " + dirName + "/hooks/maxsim-check-update.js";
	const contextMonitorCommand = isGlobal ? (0, import_dist.buildHookCommand)(targetDir, "maxsim-context-monitor.js") : "node " + dirName + "/hooks/maxsim-context-monitor.js";
	if (isGemini) {
		if (!settings.experimental) settings.experimental = {};
		const experimental = settings.experimental;
		if (!experimental.enableAgents) {
			experimental.enableAgents = true;
			console.log(`  ${green}\u2713${reset} Enabled experimental agents`);
		}
	}
	if (!isOpencode) {
		if (!settings.hooks) settings.hooks = {};
		const installHooks = settings.hooks;
		if (!installHooks.SessionStart) installHooks.SessionStart = [];
		if (!installHooks.SessionStart.some((entry) => entry.hooks && entry.hooks.some((h) => h.command && h.command.includes("maxsim-check-update")))) {
			installHooks.SessionStart.push({ hooks: [{
				type: "command",
				command: updateCheckCommand
			}] });
			console.log(`  ${green}\u2713${reset} Configured update check hook`);
		}
		if (!installHooks.PostToolUse) installHooks.PostToolUse = [];
		if (!installHooks.PostToolUse.some((entry) => entry.hooks && entry.hooks.some((h) => h.command && h.command.includes("maxsim-context-monitor")))) {
			installHooks.PostToolUse.push({ hooks: [{
				type: "command",
				command: contextMonitorCommand
			}] });
			console.log(`  ${green}\u2713${reset} Configured context window monitor hook`);
		}
	}
	return {
		settingsPath,
		settings,
		statuslineCommand,
		runtime
	};
}
/**
* Apply statusline config, then print completion message
*/
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = "claude", isGlobal = true) {
	const isOpencode = runtime === "opencode";
	const isCodex = runtime === "codex";
	if (shouldInstallStatusline && !isOpencode && !isCodex) {
		settings.statusLine = {
			type: "command",
			command: statuslineCommand
		};
		console.log(`  ${green}\u2713${reset} Configured statusline`);
	}
	if (!isCodex && settingsPath && settings) (0, import_dist.writeSettings)(settingsPath, settings);
	if (isOpencode) configureOpencodePermissions(isGlobal);
	let program = "Claude Code";
	if (runtime === "opencode") program = "OpenCode";
	if (runtime === "gemini") program = "Gemini";
	if (runtime === "codex") program = "Codex";
	let command = "/maxsim:help";
	if (runtime === "opencode") command = "/maxsim-help";
	if (runtime === "codex") command = "$maxsim-help";
	console.log(`
  ${green}Done!${reset} Launch ${program} and run ${cyan}${command}${reset}.

  ${cyan}Join the community:${reset} https://discord.gg/5JJgD5svVS
`);
}
/**
* Handle statusline configuration with optional prompt
*/
function handleStatusline(settings, isInteractive, callback) {
	if (!(settings.statusLine != null)) {
		callback(true);
		return;
	}
	if (forceStatusline) {
		callback(true);
		return;
	}
	if (!isInteractive) {
		console.log(`  ${yellow}\u26a0${reset} Skipping statusline (already configured)`);
		console.log(`    Use ${cyan}--force-statusline${reset} to replace\n`);
		callback(false);
		return;
	}
	const statusLine = settings.statusLine;
	const existingCmd = statusLine.command || statusLine.url || "(custom)";
	const rl = node_readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	console.log(`
  ${yellow}\u26a0${reset} Existing statusline detected\n
  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  MAXSIM includes a statusline showing:
    \u2022 Model name
    \u2022 Current task (from todo list)
    \u2022 Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with MAXSIM statusline
`);
	rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
		rl.close();
		callback((answer.trim() || "1") === "2");
	});
}
/**
* Prompt for runtime selection
*/
function promptRuntime(callback) {
	const rl = node_readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	let answered = false;
	rl.on("close", () => {
		if (!answered) {
			answered = true;
			console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
			process.exit(0);
		}
	});
	console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}\n\n  ${cyan}1${reset}) Claude Code ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) OpenCode    ${dim}(~/.config/opencode)${reset} - open source, free models
  ${cyan}3${reset}) Gemini      ${dim}(~/.gemini)${reset}
  ${cyan}4${reset}) Codex       ${dim}(~/.codex)${reset}
  ${cyan}5${reset}) All
`);
	rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
		answered = true;
		rl.close();
		const choice = answer.trim() || "1";
		if (choice === "5") callback([
			"claude",
			"opencode",
			"gemini",
			"codex"
		]);
		else if (choice === "4") callback(["codex"]);
		else if (choice === "3") callback(["gemini"]);
		else if (choice === "2") callback(["opencode"]);
		else callback(["claude"]);
	});
}
/**
* Prompt for install location
*/
function promptLocation(runtimes) {
	if (!process.stdin.isTTY) {
		console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
		installAllRuntimes(runtimes, true, false);
		return;
	}
	const rl = node_readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	let answered = false;
	rl.on("close", () => {
		if (!answered) {
			answered = true;
			console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
			process.exit(0);
		}
	});
	const pathExamples = runtimes.map((r) => {
		return getGlobalDir(r, explicitConfigDir).replace(node_os.homedir(), "~");
	}).join(", ");
	const localExamples = runtimes.map((r) => `./${getDirName(r)}`).join(", ");
	console.log(`  ${yellow}Where would you like to install?${reset}\n\n  ${cyan}1${reset}) Global ${dim}(${pathExamples})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(${localExamples})${reset} - this project only
`);
	rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
		answered = true;
		rl.close();
		installAllRuntimes(runtimes, (answer.trim() || "1") !== "2", true);
	});
}
/**
* Install MAXSIM for all selected runtimes
*/
function installAllRuntimes(runtimes, isGlobal, isInteractive) {
	const results = [];
	for (const runtime of runtimes) {
		const result = install(isGlobal, runtime);
		results.push(result);
	}
	const statuslineRuntimes = ["claude", "gemini"];
	const primaryStatuslineResult = results.find((r) => statuslineRuntimes.includes(r.runtime));
	const finalize = (shouldInstallStatusline) => {
		for (const result of results) {
			const useStatusline = statuslineRuntimes.includes(result.runtime) && shouldInstallStatusline;
			finishInstall(result.settingsPath, result.settings, result.statuslineCommand, useStatusline, result.runtime, isGlobal);
		}
	};
	if (primaryStatuslineResult && primaryStatuslineResult.settings) handleStatusline(primaryStatuslineResult.settings, isInteractive, finalize);
	else finalize(false);
}
if (hasGlobal && hasLocal) {
	console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
	process.exit(1);
} else if (explicitConfigDir && hasLocal) {
	console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
	process.exit(1);
} else if (hasUninstall) {
	if (!hasGlobal && !hasLocal) {
		console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
		process.exit(1);
	}
	const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ["claude"];
	for (const runtime of runtimes) uninstall(hasGlobal, runtime);
} else if (selectedRuntimes.length > 0) if (!hasGlobal && !hasLocal) promptLocation(selectedRuntimes);
else installAllRuntimes(selectedRuntimes, hasGlobal, false);
else if (hasGlobal || hasLocal) installAllRuntimes(["claude"], hasGlobal, false);
else if (!process.stdin.isTTY) {
	console.log(`  ${yellow}Non-interactive terminal detected, defaulting to Claude Code global install${reset}\n`);
	installAllRuntimes(["claude"], true, false);
} else promptRuntime((runtimes) => {
	promptLocation(runtimes);
});

//#endregion
//# sourceMappingURL=install.cjs.map