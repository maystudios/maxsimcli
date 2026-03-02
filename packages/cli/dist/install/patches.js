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
exports.PATCHES_DIR_NAME = void 0;
exports.saveLocalPatches = saveLocalPatches;
exports.reportLocalPatches = reportLocalPatches;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const manifest_js_1 = require("./manifest.js");
exports.PATCHES_DIR_NAME = 'maxsim-local-patches';
/**
 * Detect user-modified MAXSIM files by comparing against install manifest.
 */
function saveLocalPatches(configDir) {
    const manifest = (0, manifest_js_1.readManifest)(configDir);
    if (!manifest)
        return [];
    const patchesDir = path.join(configDir, exports.PATCHES_DIR_NAME);
    const modified = [];
    for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
        const fullPath = path.join(configDir, relPath);
        if (!fs.existsSync(fullPath))
            continue;
        const currentHash = (0, manifest_js_1.fileHash)(fullPath);
        if (currentHash !== originalHash) {
            const backupPath = path.join(patchesDir, relPath);
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            fs.copyFileSync(fullPath, backupPath);
            modified.push(relPath);
        }
    }
    if (modified.length > 0) {
        const meta = {
            backed_up_at: new Date().toISOString(),
            from_version: manifest.version,
            files: modified,
        };
        fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify(meta, null, 2));
        console.log('  ' +
            chalk_1.default.yellow('i') +
            '  Found ' +
            modified.length +
            ' locally modified MAXSIM file(s) \u2014 backed up to ' +
            exports.PATCHES_DIR_NAME +
            '/');
        for (const f of modified) {
            console.log('     ' + chalk_1.default.dim(f));
        }
    }
    return modified;
}
/**
 * After install, report backed-up patches for user to reapply.
 */
function reportLocalPatches(configDir) {
    const patchesDir = path.join(configDir, exports.PATCHES_DIR_NAME);
    const metaPath = path.join(patchesDir, 'backup-meta.json');
    if (!fs.existsSync(metaPath))
        return [];
    let meta;
    try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    catch {
        return [];
    }
    if (meta.files && meta.files.length > 0) {
        console.log('');
        console.log('  ' +
            chalk_1.default.yellow('Local patches detected') +
            ' (from v' +
            meta.from_version +
            '):');
        for (const f of meta.files) {
            console.log('     ' + chalk_1.default.cyan(f));
        }
        console.log('');
        console.log('  Your modifications are saved in ' +
            chalk_1.default.cyan(exports.PATCHES_DIR_NAME + '/'));
        console.log('  Run ' +
            chalk_1.default.cyan('/maxsim:reapply-patches') +
            ' to merge them into the new version.');
        console.log('  Or manually compare and merge the files.');
        console.log('');
    }
    return meta.files || [];
}
//# sourceMappingURL=patches.js.map