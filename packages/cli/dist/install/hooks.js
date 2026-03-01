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
exports.cleanupOrphanedFiles = cleanupOrphanedFiles;
exports.cleanupOrphanedHooks = cleanupOrphanedHooks;
exports.installHookFiles = installHookFiles;
exports.configureSettingsHooks = configureSettingsHooks;
exports.handleStatusline = handleStatusline;
exports.finishInstall = finishInstall;
const fs = __importStar(require("node:fs"));
const chalk_1 = __importDefault(require("chalk"));
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("../adapters/index.js");
const adapters_js_1 = require("./adapters.js");
const shared_js_1 = require("./shared.js");
const path = __importStar(require("node:path"));
const ora_1 = __importDefault(require("ora"));
/**
 * Clean up orphaned files from previous MAXSIM versions
 */
function cleanupOrphanedFiles(configDir) {
    const orphanedFiles = [
        'hooks/maxsim-notify.sh',
        'hooks/statusline.js',
    ];
    for (const relPath of orphanedFiles) {
        const fullPath = path.join(configDir, relPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`  ${chalk_1.default.green('\u2713')} Removed orphaned ${relPath}`);
        }
    }
}
/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(settings) {
    const orphanedHookPatterns = [
        'maxsim-notify.sh',
        'hooks/statusline.js',
        'maxsim-intel-index.js',
        'maxsim-intel-session.js',
        'maxsim-intel-prune.js',
    ];
    let cleanedHooks = false;
    const hooks = settings.hooks;
    if (hooks) {
        for (const eventType of Object.keys(hooks)) {
            const hookEntries = hooks[eventType];
            if (Array.isArray(hookEntries)) {
                const filtered = hookEntries.filter((entry) => {
                    if (entry.hooks && Array.isArray(entry.hooks)) {
                        const hasOrphaned = entry.hooks.some((h) => h.command &&
                            orphanedHookPatterns.some((pattern) => h.command.includes(pattern)));
                        if (hasOrphaned) {
                            cleanedHooks = true;
                            return false;
                        }
                    }
                    return true;
                });
                hooks[eventType] = filtered;
            }
        }
    }
    if (cleanedHooks) {
        console.log(`  ${chalk_1.default.green('\u2713')} Removed orphaned hook registrations`);
    }
    const statusLine = settings.statusLine;
    if (statusLine &&
        statusLine.command &&
        statusLine.command.includes('statusline.js') &&
        !statusLine.command.includes('maxsim-statusline.js')) {
        statusLine.command = statusLine.command.replace(/statusline\.js/, 'maxsim-statusline.js');
        console.log(`  ${chalk_1.default.green('\u2713')} Updated statusline path (statusline.js \u2192 maxsim-statusline.js)`);
    }
    return settings;
}
/**
 * Install hook files and configure settings.json for a runtime
 */
function installHookFiles(targetDir, runtime, isGlobal, failures) {
    const dirName = (0, shared_js_1.getDirName)(runtime);
    const isCodex = runtime === 'codex';
    if (isCodex)
        return;
    // Copy hooks from bundled assets directory
    let hooksSrc = null;
    const bundledHooksDir = path.resolve(__dirname, 'assets', 'hooks');
    if (fs.existsSync(bundledHooksDir)) {
        hooksSrc = bundledHooksDir;
    }
    else {
        console.warn(`  ${chalk_1.default.yellow('!')} bundled hooks not found - hooks will not be installed`);
    }
    if (hooksSrc) {
        const spinner = (0, ora_1.default)({ text: 'Installing hooks...', color: 'cyan' }).start();
        const hooksDest = path.join(targetDir, 'hooks');
        fs.mkdirSync(hooksDest, { recursive: true });
        const hookEntries = fs.readdirSync(hooksSrc);
        const configDirReplacement = (0, shared_js_1.getConfigDirFromHome)(runtime, isGlobal);
        for (const entry of hookEntries) {
            const srcFile = path.join(hooksSrc, entry);
            if (fs.statSync(srcFile).isFile() && entry.endsWith('.cjs') && !entry.includes('.d.')) {
                const destName = entry.replace(/\.cjs$/, '.js');
                const destFile = path.join(hooksDest, destName);
                let content = fs.readFileSync(srcFile, 'utf8');
                content = content.replace(/'\.claude'/g, configDirReplacement);
                fs.writeFileSync(destFile, content);
            }
        }
        if ((0, shared_js_1.verifyInstalled)(hooksDest, 'hooks')) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed hooks (bundled)');
        }
        else {
            spinner.fail('Failed to install hooks');
            failures.push('hooks');
        }
    }
}
/**
 * Configure hooks and statusline in settings.json
 */
function configureSettingsHooks(targetDir, runtime, isGlobal) {
    const dirName = (0, shared_js_1.getDirName)(runtime);
    const isOpencode = runtime === 'opencode';
    const settingsPath = path.join(targetDir, 'settings.json');
    const settings = cleanupOrphanedHooks((0, index_js_1.readSettings)(settingsPath));
    const statuslineCommand = isGlobal
        ? (0, index_js_1.buildHookCommand)(targetDir, 'maxsim-statusline.js')
        : 'node ' + dirName + '/hooks/maxsim-statusline.js';
    const updateCheckCommand = isGlobal
        ? (0, index_js_1.buildHookCommand)(targetDir, 'maxsim-check-update.js')
        : 'node ' + dirName + '/hooks/maxsim-check-update.js';
    const contextMonitorCommand = isGlobal
        ? (0, index_js_1.buildHookCommand)(targetDir, 'maxsim-context-monitor.js')
        : 'node ' + dirName + '/hooks/maxsim-context-monitor.js';
    // Configure SessionStart hook for update checking (skip for opencode)
    if (!isOpencode) {
        if (!settings.hooks) {
            settings.hooks = {};
        }
        const installHooks = settings.hooks;
        if (!installHooks.SessionStart) {
            installHooks.SessionStart = [];
        }
        const hasMaxsimUpdateHook = installHooks.SessionStart.some((entry) => entry.hooks &&
            entry.hooks.some((h) => h.command && h.command.includes('maxsim-check-update')));
        if (!hasMaxsimUpdateHook) {
            installHooks.SessionStart.push({
                hooks: [
                    {
                        type: 'command',
                        command: updateCheckCommand,
                    },
                ],
            });
            console.log(`  ${chalk_1.default.green('\u2713')} Configured update check hook`);
        }
        // Configure PostToolUse hook for context window monitoring
        if (!installHooks.PostToolUse) {
            installHooks.PostToolUse = [];
        }
        const hasContextMonitorHook = installHooks.PostToolUse.some((entry) => entry.hooks &&
            entry.hooks.some((h) => h.command && h.command.includes('maxsim-context-monitor')));
        if (!hasContextMonitorHook) {
            installHooks.PostToolUse.push({
                hooks: [
                    {
                        type: 'command',
                        command: contextMonitorCommand,
                    },
                ],
            });
            console.log(`  ${chalk_1.default.green('\u2713')} Configured context window monitor hook`);
        }
    }
    return { settingsPath, settings, statuslineCommand, updateCheckCommand, contextMonitorCommand };
}
/**
 * Handle statusline configuration — returns true if MAXSIM statusline should be installed
 */
async function handleStatusline(settings, isInteractive, forceStatusline) {
    const hasExisting = settings.statusLine != null;
    if (!hasExisting)
        return true;
    if (forceStatusline)
        return true;
    if (!isInteractive) {
        console.log(chalk_1.default.yellow('\u26a0') + ' Skipping statusline (already configured)');
        console.log('  Use ' + chalk_1.default.cyan('--force-statusline') + ' to replace\n');
        return false;
    }
    const statusLine = settings.statusLine;
    const existingCmd = statusLine.command || statusLine.url || '(custom)';
    console.log();
    console.log(chalk_1.default.yellow('\u26a0  Existing statusline detected'));
    console.log();
    console.log('  Your current statusline:');
    console.log('    ' + chalk_1.default.dim(`command: ${existingCmd}`));
    console.log();
    console.log('  MAXSIM includes a statusline showing:');
    console.log('    \u2022 Model name');
    console.log('    \u2022 Current task (from todo list)');
    console.log('    \u2022 Context window usage (color-coded)');
    console.log();
    const shouldReplace = await (0, prompts_1.confirm)({
        message: 'Replace with MAXSIM statusline?',
        default: false,
    });
    return shouldReplace;
}
/**
 * Apply statusline config, then print completion message
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = 'claude', isGlobal = true) {
    const isOpencode = runtime === 'opencode';
    const isCodex = runtime === 'codex';
    if (shouldInstallStatusline && !isOpencode && !isCodex) {
        settings.statusLine = {
            type: 'command',
            command: statuslineCommand,
        };
        console.log(`  ${chalk_1.default.green('\u2713')} Configured statusline`);
    }
    if (!isCodex && settingsPath && settings) {
        (0, index_js_1.writeSettings)(settingsPath, settings);
    }
    if (isOpencode) {
        (0, adapters_js_1.configureOpencodePermissions)(isGlobal);
    }
    let program = 'Claude Code';
    if (runtime === 'opencode')
        program = 'OpenCode';
    if (runtime === 'gemini')
        program = 'Gemini';
    if (runtime === 'codex')
        program = 'Codex';
    let command = '/maxsim:help';
    if (runtime === 'opencode')
        command = '/maxsim-help';
    if (runtime === 'codex')
        command = '$maxsim-help';
    console.log(`
  ${chalk_1.default.green('Done!')} Launch ${program} and run ${chalk_1.default.cyan(command)}.

  ${chalk_1.default.cyan('Join the community:')} https://discord.gg/5JJgD5svVS
`);
}
//# sourceMappingURL=hooks.js.map