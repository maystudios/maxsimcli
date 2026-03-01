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
exports.getCommitAttribution = getCommitAttribution;
exports.parseJsonc = parseJsonc;
exports.configureOpencodePermissions = configureOpencodePermissions;
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const index_js_1 = require("../adapters/index.js");
const shared_js_1 = require("./shared.js");
// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map();
/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime, explicitConfigDir) {
    if (attributionCache.has(runtime)) {
        return attributionCache.get(runtime);
    }
    let result;
    if (runtime === 'opencode') {
        const config = (0, index_js_1.readSettings)(path.join((0, shared_js_1.getGlobalDir)('opencode', null), 'opencode.json'));
        result =
            config.disable_ai_attribution === true
                ? null
                : undefined;
    }
    else if (runtime === 'gemini') {
        const settings = (0, index_js_1.readSettings)(path.join((0, shared_js_1.getGlobalDir)('gemini', explicitConfigDir), 'settings.json'));
        const attr = settings.attribution;
        if (!attr || attr.commit === undefined) {
            result = undefined;
        }
        else if (attr.commit === '') {
            result = null;
        }
        else {
            result = attr.commit;
        }
    }
    else if (runtime === 'claude') {
        const settings = (0, index_js_1.readSettings)(path.join((0, shared_js_1.getGlobalDir)('claude', explicitConfigDir), 'settings.json'));
        const attr = settings.attribution;
        if (!attr || attr.commit === undefined) {
            result = undefined;
        }
        else if (attr.commit === '') {
            result = null;
        }
        else {
            result = attr.commit;
        }
    }
    else {
        result = undefined;
    }
    attributionCache.set(runtime, result);
    return result;
}
/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 */
function parseJsonc(content) {
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
    }
    let result = '';
    let inString = false;
    let i = 0;
    while (i < content.length) {
        const char = content[i];
        const next = content[i + 1];
        if (inString) {
            result += char;
            if (char === '\\' && i + 1 < content.length) {
                result += next;
                i += 2;
                continue;
            }
            if (char === '"') {
                inString = false;
            }
            i++;
        }
        else {
            if (char === '"') {
                inString = true;
                result += char;
                i++;
            }
            else if (char === '/' && next === '/') {
                while (i < content.length && content[i] !== '\n') {
                    i++;
                }
            }
            else if (char === '/' && next === '*') {
                i += 2;
                while (i < content.length - 1 &&
                    !(content[i] === '*' && content[i + 1] === '/')) {
                    i++;
                }
                i += 2;
            }
            else {
                result += char;
                i++;
            }
        }
    }
    result = result.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(result);
}
/**
 * Configure OpenCode permissions to allow reading MAXSIM reference docs
 */
function configureOpencodePermissions(isGlobal = true) {
    const opencodeConfigDir = isGlobal
        ? (0, shared_js_1.getOpencodeGlobalDir)()
        : path.join(process.cwd(), '.opencode');
    const configPath = path.join(opencodeConfigDir, 'opencode.json');
    fs.mkdirSync(opencodeConfigDir, { recursive: true });
    let config = {};
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            config = parseJsonc(content);
        }
        catch (e) {
            console.log(`  ${chalk_1.default.yellow('\u26a0')} Could not parse opencode.json - skipping permission config`);
            console.log(`    ${chalk_1.default.dim(`Reason: ${e.message}`)}`);
            console.log(`    ${chalk_1.default.dim('Your config was NOT modified. Fix the syntax manually if needed.')}`);
            return;
        }
    }
    if (!config.permission) {
        config.permission = {};
    }
    const permission = config.permission;
    const defaultConfigDir = path.join(os.homedir(), '.config', 'opencode');
    const maxsimPath = opencodeConfigDir === defaultConfigDir
        ? '~/.config/opencode/maxsim/*'
        : `${opencodeConfigDir.replace(/\\/g, '/')}/maxsim/*`;
    let modified = false;
    if (!permission.read || typeof permission.read !== 'object') {
        permission.read = {};
    }
    if (permission.read[maxsimPath] !== 'allow') {
        permission.read[maxsimPath] = 'allow';
        modified = true;
    }
    if (!permission.external_directory ||
        typeof permission.external_directory !== 'object') {
        permission.external_directory = {};
    }
    if (permission.external_directory[maxsimPath] !== 'allow') {
        permission.external_directory[maxsimPath] = 'allow';
        modified = true;
    }
    if (!modified) {
        return;
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`  ${chalk_1.default.green('\u2713')} Configured read permission for MAXSIM docs`);
}
//# sourceMappingURL=adapters.js.map