"use strict";
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
exports.opencodeAdapter = void 0;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const base_js_1 = require("./base.js");
const frontmatter_js_1 = require("./transforms/frontmatter.js");
const content_js_1 = require("./transforms/content.js");
/**
 * Get the global config directory for OpenCode.
 * OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/.
 * Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
function getOpencodeGlobalDir() {
    if (process.env.OPENCODE_CONFIG_DIR) {
        return (0, base_js_1.expandTilde)(process.env.OPENCODE_CONFIG_DIR);
    }
    if (process.env.OPENCODE_CONFIG) {
        return path.dirname((0, base_js_1.expandTilde)(process.env.OPENCODE_CONFIG));
    }
    if (process.env.XDG_CONFIG_HOME) {
        return path.join((0, base_js_1.expandTilde)(process.env.XDG_CONFIG_HOME), 'opencode');
    }
    return path.join(os.homedir(), '.config', 'opencode');
}
/**
 * Get the global config directory for OpenCode.
 * Priority: explicitDir > env vars (via getOpencodeGlobalDir)
 */
function getGlobalDir(explicitDir) {
    if (explicitDir) {
        return (0, base_js_1.expandTilde)(explicitDir);
    }
    return getOpencodeGlobalDir();
}
/**
 * Get the config directory path relative to home for hook templating.
 */
function getConfigDirFromHome(isGlobal) {
    if (!isGlobal) {
        return "'.opencode'";
    }
    return "'.config', 'opencode'";
}
/**
 * Transform markdown content for OpenCode installation.
 * Applies frontmatter conversion and path replacement.
 */
function transformContent(content, pathPrefix) {
    let result = (0, content_js_1.replacePathReferences)(content, pathPrefix, '.opencode');
    // Also replace ~/.opencode/ references
    result = result.replace(/~\/\.opencode\//g, pathPrefix);
    result = (0, frontmatter_js_1.convertClaudeToOpencodeFrontmatter)(result);
    return result;
}
/**
 * OpenCode adapter configuration.
 * OpenCode uses flat command structure (command/maxsim-*.md).
 */
exports.opencodeAdapter = {
    runtime: 'opencode',
    dirName: '.opencode',
    getGlobalDir,
    getConfigDirFromHome,
    transformContent,
    commandStructure: 'flat',
};
//# sourceMappingURL=opencode.js.map