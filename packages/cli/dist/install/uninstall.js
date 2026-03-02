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
exports.uninstall = uninstall;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const chalk_1 = __importDefault(require("chalk"));
const index_js_1 = require("../adapters/index.js");
const shared_js_1 = require("./shared.js");
/**
 * Uninstall MAXSIM from the specified directory
 */
function uninstall(isGlobal, explicitConfigDir = null) {
    const dirName = (0, shared_js_1.getDirName)();
    const targetDir = isGlobal
        ? (0, shared_js_1.getGlobalDir)(explicitConfigDir)
        : path.join(process.cwd(), dirName);
    const locationLabel = isGlobal
        ? targetDir.replace(os.homedir(), '~')
        : targetDir.replace(process.cwd(), '.');
    console.log(`  Uninstalling MAXSIM from ${chalk_1.default.cyan('Claude Code')} at ${chalk_1.default.cyan(locationLabel)}\n`);
    if (!fs.existsSync(targetDir)) {
        console.log(`  ${chalk_1.default.yellow('\u26a0')} Directory does not exist: ${locationLabel}`);
        console.log(`  Nothing to uninstall.\n`);
        return;
    }
    let removedCount = 0;
    // 1. Remove MAXSIM commands (nested: commands/maxsim/)
    const maxsimCommandsDir = path.join(targetDir, 'commands', 'maxsim');
    if (fs.existsSync(maxsimCommandsDir)) {
        fs.rmSync(maxsimCommandsDir, { recursive: true });
        removedCount++;
        console.log(`  ${chalk_1.default.green('\u2713')} Removed commands/maxsim/`);
    }
    // 2. Remove maxsim directory
    const maxsimDir = path.join(targetDir, 'maxsim');
    if (fs.existsSync(maxsimDir)) {
        fs.rmSync(maxsimDir, { recursive: true });
        removedCount++;
        console.log(`  ${chalk_1.default.green('\u2713')} Removed maxsim/`);
    }
    // 3. Remove MAXSIM agents
    const agentsDir = path.join(targetDir, 'agents');
    if (fs.existsSync(agentsDir)) {
        const files = fs.readdirSync(agentsDir);
        let agentCount = 0;
        for (const file of files) {
            if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                fs.unlinkSync(path.join(agentsDir, file));
                agentCount++;
            }
        }
        if (agentCount > 0) {
            removedCount++;
            console.log(`  ${chalk_1.default.green('\u2713')} Removed ${agentCount} MAXSIM agents`);
        }
    }
    // 4. Remove MAXSIM hooks
    const hooksDir = path.join(targetDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
        const maxsimHooks = [
            'maxsim-statusline.js',
            'maxsim-check-update.js',
            'maxsim-check-update.sh',
            'maxsim-context-monitor.js',
        ];
        let hookCount = 0;
        for (const hook of maxsimHooks) {
            const hookPath = path.join(hooksDir, hook);
            if (fs.existsSync(hookPath)) {
                fs.unlinkSync(hookPath);
                hookCount++;
            }
        }
        if (hookCount > 0) {
            removedCount++;
            console.log(`  ${chalk_1.default.green('\u2713')} Removed ${hookCount} MAXSIM hooks`);
        }
    }
    // 5. Remove MAXSIM package.json (CommonJS mode marker)
    const pkgJsonPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        try {
            const content = fs.readFileSync(pkgJsonPath, 'utf8').trim();
            if (content === '{"type":"commonjs"}') {
                fs.unlinkSync(pkgJsonPath);
                removedCount++;
                console.log(`  ${chalk_1.default.green('\u2713')} Removed MAXSIM package.json`);
            }
        }
        catch {
            // Ignore read errors
        }
    }
    // 6. Clean up settings.json
    const settingsPath = path.join(targetDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = (0, index_js_1.readSettings)(settingsPath);
        let settingsModified = false;
        const statusLine = settings.statusLine;
        if (statusLine &&
            statusLine.command &&
            statusLine.command.includes('maxsim-statusline')) {
            delete settings.statusLine;
            settingsModified = true;
            console.log(`  ${chalk_1.default.green('\u2713')} Removed MAXSIM statusline from settings`);
        }
        const settingsHooks = settings.hooks;
        if (settingsHooks && settingsHooks.SessionStart) {
            const before = settingsHooks.SessionStart.length;
            settingsHooks.SessionStart = settingsHooks.SessionStart.filter((entry) => {
                if (entry.hooks && Array.isArray(entry.hooks)) {
                    const hasMaxsimHook = entry.hooks.some((h) => h.command &&
                        (h.command.includes('maxsim-check-update') ||
                            h.command.includes('maxsim-statusline')));
                    return !hasMaxsimHook;
                }
                return true;
            });
            if (settingsHooks.SessionStart.length < before) {
                settingsModified = true;
                console.log(`  ${chalk_1.default.green('\u2713')} Removed MAXSIM hooks from settings`);
            }
            if (settingsHooks.SessionStart.length === 0) {
                delete settingsHooks.SessionStart;
            }
        }
        if (settingsHooks && settingsHooks.PostToolUse) {
            const before = settingsHooks.PostToolUse.length;
            settingsHooks.PostToolUse = settingsHooks.PostToolUse.filter((entry) => {
                if (entry.hooks && Array.isArray(entry.hooks)) {
                    const hasMaxsimHook = entry.hooks.some((h) => h.command &&
                        h.command.includes('maxsim-context-monitor'));
                    return !hasMaxsimHook;
                }
                return true;
            });
            if (settingsHooks.PostToolUse.length < before) {
                settingsModified = true;
                console.log(`  ${chalk_1.default.green('\u2713')} Removed context monitor hook from settings`);
            }
            if (settingsHooks.PostToolUse.length === 0) {
                delete settingsHooks.PostToolUse;
            }
        }
        if (settingsHooks && Object.keys(settingsHooks).length === 0) {
            delete settings.hooks;
        }
        if (settingsModified) {
            (0, index_js_1.writeSettings)(settingsPath, settings);
            removedCount++;
        }
    }
    if (removedCount === 0) {
        console.log(`  ${chalk_1.default.yellow('\u26a0')} No MAXSIM files found to remove.`);
    }
    console.log(`
  ${chalk_1.default.green('Done!')} MAXSIM has been uninstalled from Claude Code.
  Your other files and settings have been preserved.
`);
}
//# sourceMappingURL=uninstall.js.map