Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_base = require('./base-BYHjQPHa.cjs');
const require_frontmatter = require('./frontmatter-BsX2h21y.cjs');
let node_path = require("node:path");
node_path = require_base.__toESM(node_path);
let node_os = require("node:os");
node_os = require_base.__toESM(node_os);

//#region src/gemini.ts
/**
* @maxsim/adapters — Gemini adapter
*
* Ports the Gemini-specific logic from bin/install.js:
*   - getGlobalDir('gemini', ...)         (lines 113-122)
*   - getDirName('gemini')                (line 47)
*   - getConfigDirFromHome('gemini', isGlobal) (line 69)
*   - convertClaudeToGeminiToml + convertClaudeToGeminiAgent + stripSubTags
*/
/**
* Get the global config directory for Gemini.
* Priority: explicitDir > GEMINI_CONFIG_DIR env > ~/.gemini
*/
function getGlobalDir(explicitDir) {
	if (explicitDir) return require_base.expandTilde(explicitDir);
	if (process.env.GEMINI_CONFIG_DIR) return require_base.expandTilde(process.env.GEMINI_CONFIG_DIR);
	return node_path.join(node_os.homedir(), ".gemini");
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
	let result = require_frontmatter.replacePathReferences(content, pathPrefix, ".gemini");
	result = require_frontmatter.stripSubTags(result);
	result = require_frontmatter.convertClaudeToGeminiToml(result);
	return result;
}
/**
* Gemini adapter configuration.
* Gemini uses nested command structure (commands/maxsim/*.toml).
*/
const geminiAdapter = {
	runtime: "gemini",
	dirName: ".gemini",
	getGlobalDir,
	getConfigDirFromHome,
	transformContent,
	commandStructure: "nested"
};

//#endregion
exports.convertClaudeToGeminiAgent = require_frontmatter.convertClaudeToGeminiAgent;
exports.convertClaudeToGeminiToml = require_frontmatter.convertClaudeToGeminiToml;
exports.geminiAdapter = geminiAdapter;
exports.stripSubTags = require_frontmatter.stripSubTags;
//# sourceMappingURL=gemini.cjs.map