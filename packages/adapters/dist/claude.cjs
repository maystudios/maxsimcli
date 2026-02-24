Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_base = require('./base-BYHjQPHa.cjs');
let node_path = require("node:path");
node_path = require_base.__toESM(node_path);
let node_os = require("node:os");
node_os = require_base.__toESM(node_os);

//#region src/claude.ts
/**
* @maxsim/adapters — Claude Code adapter
*
* Ports the Claude-specific logic from bin/install.js:
*   - getGlobalDir('claude', ...)  (lines 135-142)
*   - getDirName('claude')         (line 49)
*   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
*   - copyWithPathReplacement for Claude (lines 839-892)
*/
/**
* Get the global config directory for Claude Code.
* Priority: explicitDir > CLAUDE_CONFIG_DIR env > ~/.claude
*/
function getGlobalDir(explicitDir) {
	if (explicitDir) return require_base.expandTilde(explicitDir);
	if (process.env.CLAUDE_CONFIG_DIR) return require_base.expandTilde(process.env.CLAUDE_CONFIG_DIR);
	return node_path.join(node_os.homedir(), ".claude");
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
const claudeAdapter = {
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

//#endregion
exports.claudeAdapter = claudeAdapter;
exports.installClaude = installClaude;
//# sourceMappingURL=claude.cjs.map