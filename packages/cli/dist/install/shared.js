"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtInSkills = exports.templatesRoot = exports.pkg = void 0;
exports.getGlobalDir = getGlobalDir;
exports.getConfigDirFromHome = getConfigDirFromHome;
exports.getDirName = getDirName;
exports.safeRmDir = safeRmDir;
exports.copyDirRecursive = copyDirRecursive;
exports.verifyInstalled = verifyInstalled;
exports.verifyFileInstalled = verifyFileInstalled;
exports.verifyInstallComplete = verifyInstallComplete;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const index_js_1 = require("../adapters/index.js");
// Get version from package.json — read at runtime so semantic-release's version bump
// is reflected without needing to rebuild dist/install.cjs after the version bump.
exports.pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8'));
// Resolve template asset root — bundled into dist/assets/templates at publish time
exports.templatesRoot = path.resolve(__dirname, 'assets', 'templates');
// Built-in skill names shipped with MAXSIM — used for cleanup during install/uninstall
exports.builtInSkills = ['tdd', 'systematic-debugging', 'verification-before-completion', 'simplify', 'code-review', 'memory-management', 'using-maxsim'];
/**
 * Get the global config directory, using the Claude adapter
 */
function getGlobalDir(explicitDir = null) {
    return index_js_1.claudeAdapter.getGlobalDir(explicitDir);
}
/**
 * Get the config directory path relative to home for hook templating
 */
function getConfigDirFromHome(isGlobal) {
    return index_js_1.claudeAdapter.getConfigDirFromHome(isGlobal);
}
/**
 * Get the local directory name
 */
function getDirName() {
    return index_js_1.claudeAdapter.dirName;
}
/**
 * Recursively remove a directory, handling Windows read-only file attributes.
 * fs-extra handles cross-platform edge cases (EPERM on Windows, symlinks, etc.)
 */
function safeRmDir(dirPath) {
    fs_extra_1.default.removeSync(dirPath);
}
/**
 * Recursively copy a directory (dereferences symlinks)
 */
function copyDirRecursive(src, dest) {
    fs_extra_1.default.copySync(src, dest, { dereference: true });
}
/**
 * Verify a directory exists and contains files.
 * If expectedFiles is provided, also checks that those specific files exist inside the directory.
 */
function verifyInstalled(dirPath, description, expectedFiles) {
    if (!fs.existsSync(dirPath)) {
        console.error(`  \u2717 Failed to install ${description}: directory not created`);
        return false;
    }
    try {
        const entries = fs.readdirSync(dirPath);
        if (entries.length === 0) {
            console.error(`  \u2717 Failed to install ${description}: directory is empty`);
            return false;
        }
    }
    catch (e) {
        console.error(`  \u2717 Failed to install ${description}: ${e.message}`);
        return false;
    }
    if (expectedFiles && expectedFiles.length > 0) {
        const missing = expectedFiles.filter(f => !fs.existsSync(path.join(dirPath, f)));
        if (missing.length > 0) {
            console.error(`  \u2717 Failed to install ${description}: missing files: ${missing.join(', ')}`);
            return false;
        }
    }
    return true;
}
/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath, description) {
    if (!fs.existsSync(filePath)) {
        console.error(`  \u2717 Failed to install ${description}: file not created`);
        return false;
    }
    return true;
}
/**
 * Verify that all major install components are present. Uses the manifest
 * (if available) to check individual files; otherwise falls back to
 * directory-level checks.
 *
 * Returns an object with `complete` (boolean) and `missing` (list of
 * component names that are absent or incomplete).
 */
function verifyInstallComplete(configDir, _runtime, manifest = null) {
    const missing = [];
    // If a manifest exists, verify every file in it is still present
    if (manifest && manifest.files) {
        for (const relPath of Object.keys(manifest.files)) {
            if (!fs.existsSync(path.join(configDir, relPath))) {
                missing.push(relPath);
            }
        }
        return { complete: missing.length === 0, missing };
    }
    // Fallback: directory-level checks for major components
    const components = [
        { dir: path.join(configDir, 'maxsim'), label: 'maxsim (workflows/templates)' },
        { dir: path.join(configDir, 'agents'), label: 'agents' },
        { dir: path.join(configDir, 'commands', 'maxsim'), label: 'commands' },
        { dir: path.join(configDir, 'hooks'), label: 'hooks' },
    ];
    for (const { dir, label } of components) {
        if (!fs.existsSync(dir)) {
            missing.push(label);
        }
        else {
            try {
                const entries = fs.readdirSync(dir);
                if (entries.length === 0)
                    missing.push(label);
            }
            catch {
                missing.push(label);
            }
        }
    }
    return { complete: missing.length === 0, missing };
}
//# sourceMappingURL=shared.js.map