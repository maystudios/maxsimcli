"use strict";
/**
 * @maxsim/adapters — Runtime adapter registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.replacePathReferences = exports.convertClaudeToGeminiAgent = exports.stripSubTags = exports.convertClaudeToCodexMarkdown = exports.convertSlashCommandsToCodexSkillMentions = exports.getCodexSkillAdapterHeader = exports.convertClaudeCommandToCodexSkill = exports.convertClaudeToGeminiToml = exports.convertClaudeToOpencodeFrontmatter = exports.extractFrontmatterField = exports.yamlQuote = exports.toSingleLine = exports.colorNameToHex = exports.convertGeminiToolName = exports.convertToolName = exports.writeSettings = exports.readSettings = exports.buildHookCommand = exports.processAttribution = exports.extractFrontmatterAndBody = exports.expandTilde = exports.codexAdapter = exports.geminiAdapter = exports.opencodeAdapter = exports.installClaude = exports.claudeAdapter = void 0;
exports.getAllAdapters = getAllAdapters;
const claude_js_1 = require("./claude.js");
const opencode_js_1 = require("./opencode.js");
const gemini_js_1 = require("./gemini.js");
const codex_js_1 = require("./codex.js");
// Re-export adapters
var claude_js_2 = require("./claude.js");
Object.defineProperty(exports, "claudeAdapter", { enumerable: true, get: function () { return claude_js_2.claudeAdapter; } });
var claude_js_3 = require("./claude.js");
Object.defineProperty(exports, "installClaude", { enumerable: true, get: function () { return claude_js_3.installClaude; } });
var opencode_js_2 = require("./opencode.js");
Object.defineProperty(exports, "opencodeAdapter", { enumerable: true, get: function () { return opencode_js_2.opencodeAdapter; } });
var gemini_js_2 = require("./gemini.js");
Object.defineProperty(exports, "geminiAdapter", { enumerable: true, get: function () { return gemini_js_2.geminiAdapter; } });
var codex_js_2 = require("./codex.js");
Object.defineProperty(exports, "codexAdapter", { enumerable: true, get: function () { return codex_js_2.codexAdapter; } });
// Re-export base utilities
var base_js_1 = require("./base.js");
Object.defineProperty(exports, "expandTilde", { enumerable: true, get: function () { return base_js_1.expandTilde; } });
Object.defineProperty(exports, "extractFrontmatterAndBody", { enumerable: true, get: function () { return base_js_1.extractFrontmatterAndBody; } });
Object.defineProperty(exports, "processAttribution", { enumerable: true, get: function () { return base_js_1.processAttribution; } });
Object.defineProperty(exports, "buildHookCommand", { enumerable: true, get: function () { return base_js_1.buildHookCommand; } });
Object.defineProperty(exports, "readSettings", { enumerable: true, get: function () { return base_js_1.readSettings; } });
Object.defineProperty(exports, "writeSettings", { enumerable: true, get: function () { return base_js_1.writeSettings; } });
// Re-export transform functions
var tool_maps_js_1 = require("./transforms/tool-maps.js");
Object.defineProperty(exports, "convertToolName", { enumerable: true, get: function () { return tool_maps_js_1.convertToolName; } });
Object.defineProperty(exports, "convertGeminiToolName", { enumerable: true, get: function () { return tool_maps_js_1.convertGeminiToolName; } });
var frontmatter_js_1 = require("./transforms/frontmatter.js");
Object.defineProperty(exports, "colorNameToHex", { enumerable: true, get: function () { return frontmatter_js_1.colorNameToHex; } });
Object.defineProperty(exports, "toSingleLine", { enumerable: true, get: function () { return frontmatter_js_1.toSingleLine; } });
Object.defineProperty(exports, "yamlQuote", { enumerable: true, get: function () { return frontmatter_js_1.yamlQuote; } });
Object.defineProperty(exports, "extractFrontmatterField", { enumerable: true, get: function () { return frontmatter_js_1.extractFrontmatterField; } });
Object.defineProperty(exports, "convertClaudeToOpencodeFrontmatter", { enumerable: true, get: function () { return frontmatter_js_1.convertClaudeToOpencodeFrontmatter; } });
Object.defineProperty(exports, "convertClaudeToGeminiToml", { enumerable: true, get: function () { return frontmatter_js_1.convertClaudeToGeminiToml; } });
Object.defineProperty(exports, "convertClaudeCommandToCodexSkill", { enumerable: true, get: function () { return frontmatter_js_1.convertClaudeCommandToCodexSkill; } });
Object.defineProperty(exports, "getCodexSkillAdapterHeader", { enumerable: true, get: function () { return frontmatter_js_1.getCodexSkillAdapterHeader; } });
var content_js_1 = require("./transforms/content.js");
Object.defineProperty(exports, "convertSlashCommandsToCodexSkillMentions", { enumerable: true, get: function () { return content_js_1.convertSlashCommandsToCodexSkillMentions; } });
Object.defineProperty(exports, "convertClaudeToCodexMarkdown", { enumerable: true, get: function () { return content_js_1.convertClaudeToCodexMarkdown; } });
Object.defineProperty(exports, "stripSubTags", { enumerable: true, get: function () { return content_js_1.stripSubTags; } });
Object.defineProperty(exports, "convertClaudeToGeminiAgent", { enumerable: true, get: function () { return content_js_1.convertClaudeToGeminiAgent; } });
Object.defineProperty(exports, "replacePathReferences", { enumerable: true, get: function () { return content_js_1.replacePathReferences; } });
/**
 * Get all registered adapters.
 */
function getAllAdapters() {
    return [claude_js_1.claudeAdapter, opencode_js_1.opencodeAdapter, gemini_js_1.geminiAdapter, codex_js_1.codexAdapter];
}
//# sourceMappingURL=index.js.map