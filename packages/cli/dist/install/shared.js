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
exports.templatesRoot = exports.pkg = void 0;
exports.getAdapter = getAdapter;
exports.getGlobalDir = getGlobalDir;
exports.getConfigDirFromHome = getConfigDirFromHome;
exports.getDirName = getDirName;
exports.safeRmDir = safeRmDir;
exports.copyDirRecursive = copyDirRecursive;
exports.verifyInstalled = verifyInstalled;
exports.verifyFileInstalled = verifyFileInstalled;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const index_js_1 = require("../adapters/index.js");
// Get version from package.json — read at runtime so semantic-release's version bump
// is reflected without needing to rebuild dist/install.cjs after the version bump.
exports.pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8'));
// Resolve template asset root — bundled into dist/assets/templates at publish time
exports.templatesRoot = path.resolve(__dirname, 'assets', 'templates');
/**
 * Adapter registry keyed by runtime name
 */
const adapterMap = {
    claude: index_js_1.claudeAdapter,
};
/**
 * Get adapter for a runtime
 */
function getAdapter(runtime) {
    return adapterMap[runtime];
}
/**
 * Get the global config directory for a runtime, using adapter
 */
function getGlobalDir(runtime, explicitDir = null) {
    return getAdapter(runtime).getGlobalDir(explicitDir);
}
/**
 * Get the config directory path relative to home for hook templating
 */
function getConfigDirFromHome(runtime, isGlobal) {
    return getAdapter(runtime).getConfigDirFromHome(isGlobal);
}
/**
 * Get the local directory name for a runtime
 */
function getDirName(runtime) {
    return getAdapter(runtime).dirName;
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
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
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
//# sourceMappingURL=shared.js.map