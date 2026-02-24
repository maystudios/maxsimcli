"use strict";
/**
 * @maxsim/adapters — Shared base utilities extracted from bin/install.js
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
exports.expandTilde = expandTilde;
exports.extractFrontmatterAndBody = extractFrontmatterAndBody;
exports.processAttribution = processAttribution;
exports.buildHookCommand = buildHookCommand;
exports.readSettings = readSettings;
exports.writeSettings = writeSettings;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const fs = __importStar(require("node:fs"));
/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
function expandTilde(filePath) {
    if (filePath && filePath.startsWith('~/')) {
        return path.join(os.homedir(), filePath.slice(2));
    }
    return filePath;
}
/**
 * Extract YAML frontmatter and body from markdown content.
 * Returns null frontmatter if content doesn't start with ---.
 */
function extractFrontmatterAndBody(content) {
    if (!content.startsWith('---')) {
        return { frontmatter: null, body: content };
    }
    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) {
        return { frontmatter: null, body: content };
    }
    return {
        frontmatter: content.substring(3, endIndex).trim(),
        body: content.substring(endIndex + 3),
    };
}
/**
 * Process Co-Authored-By lines based on attribution setting.
 * @param content - File content to process
 * @param attribution - null=remove, undefined=keep default, string=replace
 */
function processAttribution(content, attribution) {
    if (attribution === null) {
        return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, '');
    }
    if (attribution === undefined) {
        return content;
    }
    const safeAttribution = attribution.replace(/\$/g, '$$$$');
    return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}
/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 */
function buildHookCommand(configDir, hookName) {
    const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
    return `node "${hooksPath}"`;
}
/**
 * Read and parse settings.json, returning empty object if it doesn't exist.
 */
function readSettings(settingsPath) {
    if (fs.existsSync(settingsPath)) {
        try {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        catch {
            return {};
        }
    }
    return {};
}
/**
 * Write settings.json with proper formatting.
 */
function writeSettings(settingsPath, settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
//# sourceMappingURL=base.js.map