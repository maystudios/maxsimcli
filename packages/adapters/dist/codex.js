"use strict";
/**
 * @maxsim/adapters — Codex adapter
 *
 * Ports the Codex-specific logic from bin/install.js:
 *   - getGlobalDir('codex', ...)         (lines 124-133)
 *   - getDirName('codex')                (line 48)
 *   - getConfigDirFromHome('codex', isGlobal) (line 70)
 *   - convertClaudeCommandToCodexSkill + convertClaudeToCodexMarkdown
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
exports.convertClaudeToCodexMarkdown = exports.convertClaudeCommandToCodexSkill = exports.codexAdapter = void 0;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const base_js_1 = require("./base.js");
const frontmatter_js_1 = require("./transforms/frontmatter.js");
Object.defineProperty(exports, "convertClaudeCommandToCodexSkill", { enumerable: true, get: function () { return frontmatter_js_1.convertClaudeCommandToCodexSkill; } });
const content_js_1 = require("./transforms/content.js");
Object.defineProperty(exports, "convertClaudeToCodexMarkdown", { enumerable: true, get: function () { return content_js_1.convertClaudeToCodexMarkdown; } });
/**
 * Get the global config directory for Codex.
 * Priority: explicitDir > CODEX_HOME env > ~/.codex
 */
function getGlobalDir(explicitDir) {
    if (explicitDir) {
        return (0, base_js_1.expandTilde)(explicitDir);
    }
    if (process.env.CODEX_HOME) {
        return (0, base_js_1.expandTilde)(process.env.CODEX_HOME);
    }
    return path.join(os.homedir(), '.codex');
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
    let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, '.codex');
    result = result.replace(/~\/\.codex\//g, pathPrefix);
    result = (0, frontmatter_js_1.convertClaudeCommandToCodexSkill)(result);
    return result;
}
/**
 * Codex adapter configuration.
 * Codex uses skill-based command structure (skills/maxsim-star/SKILL.md).
 */
exports.codexAdapter = {
    runtime: 'codex',
    dirName: '.codex',
    getGlobalDir,
    getConfigDirFromHome,
    transformContent,
    commandStructure: 'skills',
};
//# sourceMappingURL=codex.js.map