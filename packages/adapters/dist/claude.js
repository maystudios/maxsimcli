"use strict";
/**
 * @maxsim/adapters — Claude Code adapter
 *
 * Ports the Claude-specific logic from bin/install.js:
 *   - getGlobalDir('claude', ...)  (lines 135-142)
 *   - getDirName('claude')         (line 49)
 *   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
 *   - copyWithPathReplacement for Claude (lines 839-892)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeAdapter = void 0;
exports.installClaude = installClaude;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const base_js_1 = require("./base.js");
/**
 * Get the global config directory for Claude Code.
 * Priority: explicitDir > CLAUDE_CONFIG_DIR env > ~/.claude
 */
function getGlobalDir(explicitDir) {
    if (explicitDir) {
        return (0, base_js_1.expandTilde)(explicitDir);
    }
    if (process.env.CLAUDE_CONFIG_DIR) {
        return (0, base_js_1.expandTilde)(process.env.CLAUDE_CONFIG_DIR);
    }
    return path.join(os.homedir(), '.claude');
}
/**
 * Get the config directory path relative to home for hook templating.
 * Used for path.join(homeDir, '<configDir>', ...) replacement in hooks.
 */
function getConfigDirFromHome(isGlobal) {
    // Both global and local use '.claude' for Claude Code
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
    runtime: 'claude',
    dirName: '.claude',
    getGlobalDir,
    getConfigDirFromHome,
    transformContent,
    commandStructure: 'nested',
};
/**
 * Install Claude Code adapter files.
 * Stub — actual install orchestration will be implemented in Phase 5.
 */
function installClaude() {
    // Phase 5 will implement the full install orchestration.
    // The adapter exposes this function per CONTEXT.md decision.
    throw new Error('installClaude() not yet implemented — see Phase 5');
}
//# sourceMappingURL=claude.js.map