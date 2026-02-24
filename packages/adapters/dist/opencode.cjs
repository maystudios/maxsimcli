Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_base = require('./base-BYHjQPHa.cjs');
const require_frontmatter = require('./frontmatter-BsX2h21y.cjs');
let node_path = require("node:path");
node_path = require_base.__toESM(node_path);
let node_os = require("node:os");
node_os = require_base.__toESM(node_os);

//#region src/opencode.ts
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
/**
* Get the global config directory for OpenCode.
* OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/.
* Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
*/
function getOpencodeGlobalDir() {
	if (process.env.OPENCODE_CONFIG_DIR) return require_base.expandTilde(process.env.OPENCODE_CONFIG_DIR);
	if (process.env.OPENCODE_CONFIG) return node_path.dirname(require_base.expandTilde(process.env.OPENCODE_CONFIG));
	if (process.env.XDG_CONFIG_HOME) return node_path.join(require_base.expandTilde(process.env.XDG_CONFIG_HOME), "opencode");
	return node_path.join(node_os.homedir(), ".config", "opencode");
}
/**
* Get the global config directory for OpenCode.
* Priority: explicitDir > env vars (via getOpencodeGlobalDir)
*/
function getGlobalDir(explicitDir) {
	if (explicitDir) return require_base.expandTilde(explicitDir);
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
	let result = require_frontmatter.replacePathReferences(content, pathPrefix, ".opencode");
	result = result.replace(/~\/\.opencode\//g, pathPrefix);
	result = require_frontmatter.convertClaudeToOpencodeFrontmatter(result);
	return result;
}
/**
* OpenCode adapter configuration.
* OpenCode uses flat command structure (command/maxsim-*.md).
*/
const opencodeAdapter = {
	runtime: "opencode",
	dirName: ".opencode",
	getGlobalDir,
	getConfigDirFromHome,
	transformContent,
	commandStructure: "flat"
};

//#endregion
exports.opencodeAdapter = opencodeAdapter;
//# sourceMappingURL=opencode.cjs.map