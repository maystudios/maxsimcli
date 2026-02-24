Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_base = require('./base-BYHjQPHa.cjs');
const require_frontmatter = require('./frontmatter-BsX2h21y.cjs');
let node_path = require("node:path");
node_path = require_base.__toESM(node_path);
let node_os = require("node:os");
node_os = require_base.__toESM(node_os);

//#region src/codex.ts
/**
* @maxsim/adapters — Codex adapter
*
* Ports the Codex-specific logic from bin/install.js:
*   - getGlobalDir('codex', ...)         (lines 124-133)
*   - getDirName('codex')                (line 48)
*   - getConfigDirFromHome('codex', isGlobal) (line 70)
*   - convertClaudeCommandToCodexSkill + convertClaudeToCodexMarkdown
*/
/**
* Get the global config directory for Codex.
* Priority: explicitDir > CODEX_HOME env > ~/.codex
*/
function getGlobalDir(explicitDir) {
	if (explicitDir) return require_base.expandTilde(explicitDir);
	if (process.env.CODEX_HOME) return require_base.expandTilde(process.env.CODEX_HOME);
	return node_path.join(node_os.homedir(), ".codex");
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
	let result = require_frontmatter.replacePathReferences(content, pathPrefix, ".codex");
	result = result.replace(/~\/\.codex\//g, pathPrefix);
	result = require_frontmatter.convertClaudeCommandToCodexSkill(result);
	return result;
}
/**
* Codex adapter configuration.
* Codex uses skill-based command structure (skills/maxsim-star/SKILL.md).
*/
const codexAdapter = {
	runtime: "codex",
	dirName: ".codex",
	getGlobalDir,
	getConfigDirFromHome,
	transformContent,
	commandStructure: "skills"
};

//#endregion
exports.codexAdapter = codexAdapter;
exports.convertClaudeCommandToCodexSkill = require_frontmatter.convertClaudeCommandToCodexSkill;
exports.convertClaudeToCodexMarkdown = require_frontmatter.convertClaudeToCodexMarkdown;
//# sourceMappingURL=codex.cjs.map