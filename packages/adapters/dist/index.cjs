Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_base = require('./base-BYHjQPHa.cjs');
const require_claude = require('./claude.cjs');
const require_frontmatter = require('./frontmatter-BsX2h21y.cjs');
const require_opencode = require('./opencode.cjs');
const require_gemini = require('./gemini.cjs');
const require_codex = require('./codex.cjs');

//#region src/index.ts
/**
* Get all registered adapters.
*/
function getAllAdapters() {
	return [
		require_claude.claudeAdapter,
		require_opencode.opencodeAdapter,
		require_gemini.geminiAdapter,
		require_codex.codexAdapter
	];
}

//#endregion
exports.buildHookCommand = require_base.buildHookCommand;
exports.claudeAdapter = require_claude.claudeAdapter;
exports.codexAdapter = require_codex.codexAdapter;
exports.colorNameToHex = require_frontmatter.colorNameToHex;
exports.convertClaudeCommandToCodexSkill = require_frontmatter.convertClaudeCommandToCodexSkill;
exports.convertClaudeToCodexMarkdown = require_frontmatter.convertClaudeToCodexMarkdown;
exports.convertClaudeToGeminiAgent = require_frontmatter.convertClaudeToGeminiAgent;
exports.convertClaudeToGeminiToml = require_frontmatter.convertClaudeToGeminiToml;
exports.convertClaudeToOpencodeFrontmatter = require_frontmatter.convertClaudeToOpencodeFrontmatter;
exports.convertGeminiToolName = require_frontmatter.convertGeminiToolName;
exports.convertSlashCommandsToCodexSkillMentions = require_frontmatter.convertSlashCommandsToCodexSkillMentions;
exports.convertToolName = require_frontmatter.convertToolName;
exports.expandTilde = require_base.expandTilde;
exports.extractFrontmatterAndBody = require_base.extractFrontmatterAndBody;
exports.extractFrontmatterField = require_frontmatter.extractFrontmatterField;
exports.geminiAdapter = require_gemini.geminiAdapter;
exports.getAllAdapters = getAllAdapters;
exports.getCodexSkillAdapterHeader = require_frontmatter.getCodexSkillAdapterHeader;
exports.installClaude = require_claude.installClaude;
exports.opencodeAdapter = require_opencode.opencodeAdapter;
exports.processAttribution = require_base.processAttribution;
exports.readSettings = require_base.readSettings;
exports.replacePathReferences = require_frontmatter.replacePathReferences;
exports.stripSubTags = require_frontmatter.stripSubTags;
exports.toSingleLine = require_frontmatter.toSingleLine;
exports.writeSettings = require_base.writeSettings;
exports.yamlQuote = require_frontmatter.yamlQuote;
//# sourceMappingURL=index.cjs.map