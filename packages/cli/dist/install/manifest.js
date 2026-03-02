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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANIFEST_NAME = void 0;
exports.fileHash = fileHash;
exports.generateManifest = generateManifest;
exports.writeManifest = writeManifest;
exports.readManifest = readManifest;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const crypto = __importStar(require("node:crypto"));
const shared_js_1 = require("./shared.js");
exports.MANIFEST_NAME = 'maxsim-file-manifest.json';
/**
 * Compute SHA256 hash of file contents
 */
function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Recursively collect all files in dir with their hashes
 */
function generateManifest(dir, baseDir) {
    if (!baseDir)
        baseDir = dir;
    const manifest = {};
    if (!fs.existsSync(dir))
        return manifest;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            Object.assign(manifest, generateManifest(fullPath, baseDir));
        }
        else {
            manifest[relPath] = fileHash(fullPath);
        }
    }
    return manifest;
}
/**
 * Write file manifest after installation for future modification detection
 */
function writeManifest(configDir) {
    const maxsimDir = path.join(configDir, 'maxsim');
    const commandsDir = path.join(configDir, 'commands', 'maxsim');
    const agentsDir = path.join(configDir, 'agents');
    const manifest = {
        version: shared_js_1.pkg.version,
        timestamp: new Date().toISOString(),
        files: {},
    };
    const maxsimHashes = generateManifest(maxsimDir);
    for (const [rel, hash] of Object.entries(maxsimHashes)) {
        manifest.files['maxsim/' + rel] = hash;
    }
    if (fs.existsSync(commandsDir)) {
        const cmdHashes = generateManifest(commandsDir);
        for (const [rel, hash] of Object.entries(cmdHashes)) {
            manifest.files['commands/maxsim/' + rel] = hash;
        }
    }
    if (fs.existsSync(agentsDir)) {
        for (const file of fs.readdirSync(agentsDir)) {
            if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                manifest.files['agents/' + file] = fileHash(path.join(agentsDir, file));
            }
        }
    }
    // Include skills in manifest (skills/<skill-name>/*)
    const skillsManifestDir = path.join(configDir, 'skills');
    if (!isCodex && fs.existsSync(skillsManifestDir)) {
        const skillHashes = generateManifest(skillsManifestDir);
        for (const [rel, hash] of Object.entries(skillHashes)) {
            manifest.files['skills/' + rel] = hash;
        }
    }
    fs.writeFileSync(path.join(configDir, exports.MANIFEST_NAME), JSON.stringify(manifest, null, 2));
    return manifest;
}
/**
 * Read an existing manifest from the config directory, or return null if none exists / is invalid
 */
function readManifest(configDir) {
    const manifestPath = path.join(configDir, exports.MANIFEST_NAME);
    if (!fs.existsSync(manifestPath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=manifest.js.map