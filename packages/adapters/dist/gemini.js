"use strict";
/**
 * @maxsim/adapters — Gemini adapter
 *
 * Ports the Gemini-specific logic from bin/install.js:
 *   - getGlobalDir('gemini', ...)         (lines 113-122)
 *   - getDirName('gemini')                (line 47)
 *   - getConfigDirFromHome('gemini', isGlobal) (line 69)
 *   - convertClaudeToGeminiToml + convertClaudeToGeminiAgent + stripSubTags
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
exports.stripSubTags = exports.convertClaudeToGeminiAgent = exports.convertClaudeToGeminiToml = exports.geminiAdapter = void 0;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const base_js_1 = require("./base.js");
const frontmatter_js_1 = require("./transforms/frontmatter.js");
Object.defineProperty(exports, "convertClaudeToGeminiToml", { enumerable: true, get: function () { return frontmatter_js_1.convertClaudeToGeminiToml; } });
const content_js_1 = require("./transforms/content.js");
Object.defineProperty(exports, "convertClaudeToGeminiAgent", { enumerable: true, get: function () { return content_js_1.convertClaudeToGeminiAgent; } });
Object.defineProperty(exports, "stripSubTags", { enumerable: true, get: function () { return content_js_1.stripSubTags; } });
/**
 * Get the global config directory for Gemini.
 * Priority: explicitDir > GEMINI_CONFIG_DIR env > ~/.gemini
 */
function getGlobalDir(explicitDir) {
    if (explicitDir) {
        return (0, base_js_1.expandTilde)(explicitDir);
    }
    if (process.env.GEMINI_CONFIG_DIR) {
        return (0, base_js_1.expandTilde)(process.env.GEMINI_CONFIG_DIR);
    }
    return path.join(os.homedir(), '.gemini');
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
    let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, '.gemini');
    result = (0, content_js_1.stripSubTags)(result);
    result = (0, frontmatter_js_1.convertClaudeToGeminiToml)(result);
    return result;
}
/**
 * Gemini adapter configuration.
 * Gemini uses nested command structure (commands/maxsim/*.toml).
 */
exports.geminiAdapter = {
    runtime: 'gemini',
    dirName: '.gemini',
    getGlobalDir,
    getConfigDirFromHome,
    transformContent,
    commandStructure: 'nested',
};
//# sourceMappingURL=gemini.js.map