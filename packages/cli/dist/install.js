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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const crypto = __importStar(require("node:crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const ora_1 = __importDefault(require("ora"));
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("./adapters/index.js");
// Get version from package.json — read at runtime so semantic-release's version bump
// is reflected without needing to rebuild dist/install.cjs after the version bump.
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8'));
// Resolve template asset root — bundled into dist/assets/templates at publish time
const templatesRoot = path.resolve(__dirname, 'assets', 'templates');
// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasOpencode = args.includes('--opencode');
const hasClaude = args.includes('--claude');
const hasGemini = args.includes('--gemini');
const hasCodex = args.includes('--codex');
const hasBoth = args.includes('--both'); // Legacy flag, keeps working
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
// Runtime selection - can be set by flags or interactive prompt
let selectedRuntimes = [];
if (hasAll) {
    selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex'];
}
else if (hasBoth) {
    selectedRuntimes = ['claude', 'opencode'];
}
else {
    if (hasOpencode)
        selectedRuntimes.push('opencode');
    if (hasClaude)
        selectedRuntimes.push('claude');
    if (hasGemini)
        selectedRuntimes.push('gemini');
    if (hasCodex)
        selectedRuntimes.push('codex');
}
/**
 * Walk up from cwd to find the MAXSIM monorepo root (has packages/dashboard/src/server.ts)
 */
function findMonorepoRoot(startDir) {
    let dir = startDir;
    for (let i = 0; i < 10; i++) {
        if (fs.existsSync(path.join(dir, 'packages', 'dashboard', 'src', 'server.ts'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return null;
}
/**
 * Adapter registry keyed by runtime name
 */
const adapterMap = {
    claude: index_js_1.claudeAdapter,
    opencode: index_js_1.opencodeAdapter,
    gemini: index_js_1.geminiAdapter,
    codex: index_js_1.codexAdapter,
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
 * Get the global config directory for OpenCode (for JSONC permissions)
 * OpenCode follows XDG Base Directory spec
 */
function getOpencodeGlobalDir() {
    return index_js_1.opencodeAdapter.getGlobalDir();
}
const banner = '\n' +
    chalk_1.default.cyan(figlet_1.default.textSync('MAXSIM', { font: 'ANSI Shadow' })
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n')) +
    '\n' +
    '\n' +
    '  MAXSIM ' +
    chalk_1.default.dim('v' + pkg.version) +
    '\n' +
    '  A meta-prompting, context engineering and spec-driven\n' +
    '  development system for Claude Code, OpenCode, Gemini, and Codex.\n';
// Parse --config-dir argument
function parseConfigDirArg() {
    const configDirIndex = args.findIndex((arg) => arg === '--config-dir' || arg === '-c');
    if (configDirIndex !== -1) {
        const nextArg = args[configDirIndex + 1];
        if (!nextArg || nextArg.startsWith('-')) {
            console.error(`  ${chalk_1.default.yellow('--config-dir requires a path argument')}`);
            process.exit(1);
        }
        return nextArg;
    }
    const configDirArg = args.find((arg) => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
    if (configDirArg) {
        const value = configDirArg.split('=')[1];
        if (!value) {
            console.error(`  ${chalk_1.default.yellow('--config-dir requires a non-empty path')}`);
            process.exit(1);
        }
        return value;
    }
    return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const hasVersion = args.includes('--version');
const forceStatusline = args.includes('--force-statusline');
// Show version if requested (before banner for clean output)
if (hasVersion) {
    console.log(pkg.version);
    process.exit(0);
}
console.log(banner);
// Show help if requested
if (hasHelp) {
    console.log(`  ${chalk_1.default.yellow('Usage:')} npx maxsimcli [options]\n\n  ${chalk_1.default.yellow('Options:')}\n    ${chalk_1.default.cyan('-g, --global')}              Install globally (to config directory)\n    ${chalk_1.default.cyan('-l, --local')}               Install locally (to current directory)\n    ${chalk_1.default.cyan('--claude')}                  Install for Claude Code only\n    ${chalk_1.default.cyan('--opencode')}                Install for OpenCode only\n    ${chalk_1.default.cyan('--gemini')}                  Install for Gemini only\n    ${chalk_1.default.cyan('--codex')}                   Install for Codex only\n    ${chalk_1.default.cyan('--all')}                     Install for all runtimes\n    ${chalk_1.default.cyan('-u, --uninstall')}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${chalk_1.default.cyan('-c, --config-dir <path>')}   Specify custom config directory\n    ${chalk_1.default.cyan('-h, --help')}                Show this help message\n    ${chalk_1.default.cyan('--force-statusline')}        Replace existing statusline config\n\n  ${chalk_1.default.yellow('Examples:')}\n    ${chalk_1.default.dim('# Interactive install (prompts for runtime and location)')}\n    npx maxsimcli\n\n    ${chalk_1.default.dim('# Install for Claude Code globally')}\n    npx maxsimcli --claude --global\n\n    ${chalk_1.default.dim('# Install for Gemini globally')}\n    npx maxsimcli --gemini --global\n\n    ${chalk_1.default.dim('# Install for Codex globally')}\n    npx maxsimcli --codex --global\n\n    ${chalk_1.default.dim('# Install for all runtimes globally')}\n    npx maxsimcli --all --global\n\n    ${chalk_1.default.dim('# Install to custom config directory')}\n    npx maxsimcli --codex --global --config-dir ~/.codex-work\n\n    ${chalk_1.default.dim('# Install to current project only')}\n    npx maxsimcli --claude --local\n\n    ${chalk_1.default.dim('# Uninstall MAXSIM from Codex globally')}\n    npx maxsimcli --codex --global --uninstall\n\n  ${chalk_1.default.yellow('Notes:')}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_HOME environment variables.\n`);
    process.exit(0);
}
// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map();
/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime) {
    if (attributionCache.has(runtime)) {
        return attributionCache.get(runtime);
    }
    let result;
    if (runtime === 'opencode') {
        const config = (0, index_js_1.readSettings)(path.join(getGlobalDir('opencode', null), 'opencode.json'));
        result =
            config.disable_ai_attribution === true
                ? null
                : undefined;
    }
    else if (runtime === 'gemini') {
        const settings = (0, index_js_1.readSettings)(path.join(getGlobalDir('gemini', explicitConfigDir), 'settings.json'));
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
        const settings = (0, index_js_1.readSettings)(path.join(getGlobalDir('claude', explicitConfigDir), 'settings.json'));
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
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/maxsim-help.md (invoked as /maxsim-help)
 * Source structure: commands/maxsim/help.md
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    if (fs.existsSync(destDir)) {
        for (const file of fs.readdirSync(destDir)) {
            if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
                fs.unlinkSync(path.join(destDir, file));
            }
        }
    }
    else {
        fs.mkdirSync(destDir, { recursive: true });
    }
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        if (entry.isDirectory()) {
            copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
        }
        else if (entry.name.endsWith('.md')) {
            const baseName = entry.name.replace('.md', '');
            const destName = `${prefix}-${baseName}.md`;
            const destPath = path.join(destDir, destName);
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            const opencodeDirRegex = /~\/\.opencode\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
            content = content.replace(opencodeDirRegex, pathPrefix);
            content = (0, index_js_1.processAttribution)(content, getCommitAttribution(runtime));
            content = (0, index_js_1.convertClaudeToOpencodeFrontmatter)(content);
            fs.writeFileSync(destPath, content);
        }
    }
}
function listCodexSkillNames(skillsDir, prefix = 'maxsim-') {
    if (!fs.existsSync(skillsDir))
        return [];
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
        .filter((entry) => fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
        .map((entry) => entry.name)
        .sort();
}
function copyCommandsAsCodexSkills(srcDir, skillsDir, prefix, pathPrefix, runtime) {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    fs.mkdirSync(skillsDir, { recursive: true });
    const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of existing) {
        if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
            fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
        }
    }
    function recurse(currentSrcDir, currentPrefix) {
        const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(currentSrcDir, entry.name);
            if (entry.isDirectory()) {
                recurse(srcPath, `${currentPrefix}-${entry.name}`);
                continue;
            }
            if (!entry.name.endsWith('.md')) {
                continue;
            }
            const baseName = entry.name.replace('.md', '');
            const skillName = `${currentPrefix}-${baseName}`;
            const skillDir = path.join(skillsDir, skillName);
            fs.mkdirSync(skillDir, { recursive: true });
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            const codexDirRegex = /~\/\.codex\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
            content = content.replace(codexDirRegex, pathPrefix);
            content = (0, index_js_1.processAttribution)(content, getCommitAttribution(runtime));
            content = (0, index_js_1.convertClaudeCommandToCodexSkill)(content, skillName);
            fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
        }
    }
    recurse(srcDir, prefix);
}
/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, isCommand = false) {
    const isOpencode = runtime === 'opencode';
    const isCodex = runtime === 'codex';
    const dirName = getDirName(runtime);
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true });
    }
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, isCommand);
        }
        else if (entry.name.endsWith('.md')) {
            let content = fs.readFileSync(srcPath, 'utf8');
            const globalClaudeRegex = /~\/\.claude\//g;
            const localClaudeRegex = /\.\/\.claude\//g;
            content = content.replace(globalClaudeRegex, pathPrefix);
            content = content.replace(localClaudeRegex, `./${dirName}/`);
            content = (0, index_js_1.processAttribution)(content, getCommitAttribution(runtime));
            if (isOpencode) {
                content = (0, index_js_1.convertClaudeToOpencodeFrontmatter)(content);
                fs.writeFileSync(destPath, content);
            }
            else if (runtime === 'gemini') {
                if (isCommand) {
                    content = (0, index_js_1.stripSubTags)(content);
                    const tomlContent = (0, index_js_1.convertClaudeToGeminiToml)(content);
                    const tomlPath = destPath.replace(/\.md$/, '.toml');
                    fs.writeFileSync(tomlPath, tomlContent);
                }
                else {
                    fs.writeFileSync(destPath, content);
                }
            }
            else if (isCodex) {
                content = (0, index_js_1.convertClaudeToCodexMarkdown)(content);
                fs.writeFileSync(destPath, content);
            }
            else {
                fs.writeFileSync(destPath, content);
            }
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
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
 * Uninstall MAXSIM from the specified directory for a specific runtime
 */
function uninstall(isGlobal, runtime = 'claude') {
    const isOpencode = runtime === 'opencode';
    const isCodex = runtime === 'codex';
    const dirName = getDirName(runtime);
    const targetDir = isGlobal
        ? getGlobalDir(runtime, explicitConfigDir)
        : path.join(process.cwd(), dirName);
    const locationLabel = isGlobal
        ? targetDir.replace(os.homedir(), '~')
        : targetDir.replace(process.cwd(), '.');
    let runtimeLabel = 'Claude Code';
    if (runtime === 'opencode')
        runtimeLabel = 'OpenCode';
    if (runtime === 'gemini')
        runtimeLabel = 'Gemini';
    if (runtime === 'codex')
        runtimeLabel = 'Codex';
    console.log(`  Uninstalling MAXSIM from ${chalk_1.default.cyan(runtimeLabel)} at ${chalk_1.default.cyan(locationLabel)}\n`);
    if (!fs.existsSync(targetDir)) {
        console.log(`  ${chalk_1.default.yellow('\u26a0')} Directory does not exist: ${locationLabel}`);
        console.log(`  Nothing to uninstall.\n`);
        return;
    }
    let removedCount = 0;
    // 1. Remove MAXSIM commands/skills
    if (isOpencode) {
        const commandDir = path.join(targetDir, 'command');
        if (fs.existsSync(commandDir)) {
            const files = fs.readdirSync(commandDir);
            for (const file of files) {
                if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                    fs.unlinkSync(path.join(commandDir, file));
                    removedCount++;
                }
            }
            console.log(`  ${chalk_1.default.green('\u2713')} Removed MAXSIM commands from command/`);
        }
    }
    else if (isCodex) {
        const skillsDir = path.join(targetDir, 'skills');
        if (fs.existsSync(skillsDir)) {
            let skillCount = 0;
            const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith('maxsim-')) {
                    fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
                    skillCount++;
                }
            }
            if (skillCount > 0) {
                removedCount++;
                console.log(`  ${chalk_1.default.green('\u2713')} Removed ${skillCount} Codex skills`);
            }
        }
    }
    else {
        const maxsimCommandsDir = path.join(targetDir, 'commands', 'maxsim');
        if (fs.existsSync(maxsimCommandsDir)) {
            fs.rmSync(maxsimCommandsDir, { recursive: true });
            removedCount++;
            console.log(`  ${chalk_1.default.green('\u2713')} Removed commands/maxsim/`);
        }
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
    // 7. For OpenCode, clean up permissions from opencode.json
    if (isOpencode) {
        const opencodeConfigDir = isGlobal
            ? getOpencodeGlobalDir()
            : path.join(process.cwd(), '.opencode');
        const configPath = path.join(opencodeConfigDir, 'opencode.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                let modified = false;
                const permission = config.permission;
                if (permission) {
                    for (const permType of ['read', 'external_directory']) {
                        if (permission[permType]) {
                            const keys = Object.keys(permission[permType]);
                            for (const key of keys) {
                                if (key.includes('maxsim')) {
                                    delete permission[permType][key];
                                    modified = true;
                                }
                            }
                            if (Object.keys(permission[permType]).length === 0) {
                                delete permission[permType];
                            }
                        }
                    }
                    if (Object.keys(permission).length === 0) {
                        delete config.permission;
                    }
                }
                if (modified) {
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
                    removedCount++;
                    console.log(`  ${chalk_1.default.green('\u2713')} Removed MAXSIM permissions from opencode.json`);
                }
            }
            catch {
                // Ignore JSON parse errors
            }
        }
    }
    if (removedCount === 0) {
        console.log(`  ${chalk_1.default.yellow('\u26a0')} No MAXSIM files found to remove.`);
    }
    console.log(`
  ${chalk_1.default.green('Done!')} MAXSIM has been uninstalled from ${runtimeLabel}.
  Your other files and settings have been preserved.
`);
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
        ? getOpencodeGlobalDir()
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
/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
    if (!fs.existsSync(dirPath)) {
        console.error(`  ${chalk_1.default.yellow('\u2717')} Failed to install ${description}: directory not created`);
        return false;
    }
    try {
        const entries = fs.readdirSync(dirPath);
        if (entries.length === 0) {
            console.error(`  ${chalk_1.default.yellow('\u2717')} Failed to install ${description}: directory is empty`);
            return false;
        }
    }
    catch (e) {
        console.error(`  ${chalk_1.default.yellow('\u2717')} Failed to install ${description}: ${e.message}`);
        return false;
    }
    return true;
}
/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath, description) {
    if (!fs.existsSync(filePath)) {
        console.error(`  ${chalk_1.default.yellow('\u2717')} Failed to install ${description}: file not created`);
        return false;
    }
    return true;
}
// ──────────────────────────────────────────────────────
// Local Patch Persistence
// ──────────────────────────────────────────────────────
const PATCHES_DIR_NAME = 'maxsim-local-patches';
const MANIFEST_NAME = 'maxsim-file-manifest.json';
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
function writeManifest(configDir, runtime = 'claude') {
    const isOpencode = runtime === 'opencode';
    const isCodex = runtime === 'codex';
    const maxsimDir = path.join(configDir, 'maxsim');
    const commandsDir = path.join(configDir, 'commands', 'maxsim');
    const opencodeCommandDir = path.join(configDir, 'command');
    const codexSkillsDir = path.join(configDir, 'skills');
    const agentsDir = path.join(configDir, 'agents');
    const manifest = {
        version: pkg.version,
        timestamp: new Date().toISOString(),
        files: {},
    };
    const maxsimHashes = generateManifest(maxsimDir);
    for (const [rel, hash] of Object.entries(maxsimHashes)) {
        manifest.files['maxsim/' + rel] = hash;
    }
    if (!isOpencode && !isCodex && fs.existsSync(commandsDir)) {
        const cmdHashes = generateManifest(commandsDir);
        for (const [rel, hash] of Object.entries(cmdHashes)) {
            manifest.files['commands/maxsim/' + rel] = hash;
        }
    }
    if (isOpencode && fs.existsSync(opencodeCommandDir)) {
        for (const file of fs.readdirSync(opencodeCommandDir)) {
            if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                manifest.files['command/' + file] = fileHash(path.join(opencodeCommandDir, file));
            }
        }
    }
    if (isCodex && fs.existsSync(codexSkillsDir)) {
        for (const skillName of listCodexSkillNames(codexSkillsDir)) {
            const skillRoot = path.join(codexSkillsDir, skillName);
            const skillHashes = generateManifest(skillRoot);
            for (const [rel, hash] of Object.entries(skillHashes)) {
                manifest.files[`skills/${skillName}/${rel}`] = hash;
            }
        }
    }
    if (fs.existsSync(agentsDir)) {
        for (const file of fs.readdirSync(agentsDir)) {
            if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                manifest.files['agents/' + file] = fileHash(path.join(agentsDir, file));
            }
        }
    }
    fs.writeFileSync(path.join(configDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
    return manifest;
}
/**
 * Detect user-modified MAXSIM files by comparing against install manifest.
 */
function saveLocalPatches(configDir) {
    const manifestPath = path.join(configDir, MANIFEST_NAME);
    if (!fs.existsSync(manifestPath))
        return [];
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    catch {
        return [];
    }
    const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
    const modified = [];
    for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
        const fullPath = path.join(configDir, relPath);
        if (!fs.existsSync(fullPath))
            continue;
        const currentHash = fileHash(fullPath);
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
            PATCHES_DIR_NAME +
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
function reportLocalPatches(configDir, runtime = 'claude') {
    const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
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
        const reapplyCommand = runtime === 'opencode'
            ? '/maxsim-reapply-patches'
            : runtime === 'codex'
                ? '$maxsim-reapply-patches'
                : '/maxsim:reapply-patches';
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
            chalk_1.default.cyan(PATCHES_DIR_NAME + '/'));
        console.log('  Run ' +
            chalk_1.default.cyan(reapplyCommand) +
            ' to merge them into the new version.');
        console.log('  Or manually compare and merge the files.');
        console.log('');
    }
    return meta.files || [];
}
function install(isGlobal, runtime = 'claude') {
    const isOpencode = runtime === 'opencode';
    const isGemini = runtime === 'gemini';
    const isCodex = runtime === 'codex';
    const dirName = getDirName(runtime);
    const src = templatesRoot;
    const targetDir = isGlobal
        ? getGlobalDir(runtime, explicitConfigDir)
        : path.join(process.cwd(), dirName);
    const locationLabel = isGlobal
        ? targetDir.replace(os.homedir(), '~')
        : targetDir.replace(process.cwd(), '.');
    const pathPrefix = isGlobal
        ? `${targetDir.replace(/\\/g, '/')}/`
        : `./${dirName}/`;
    let runtimeLabel = 'Claude Code';
    if (isOpencode)
        runtimeLabel = 'OpenCode';
    if (isGemini)
        runtimeLabel = 'Gemini';
    if (isCodex)
        runtimeLabel = 'Codex';
    console.log(`  Installing for ${chalk_1.default.cyan(runtimeLabel)} to ${chalk_1.default.cyan(locationLabel)}\n`);
    const failures = [];
    // Save any locally modified MAXSIM files before they get wiped
    saveLocalPatches(targetDir);
    // Clean up orphaned files from previous versions
    cleanupOrphanedFiles(targetDir);
    // OpenCode uses command/ (flat), Codex uses skills/, Claude/Gemini use commands/maxsim/
    let spinner = (0, ora_1.default)({ text: 'Installing commands...', color: 'cyan' }).start();
    if (isOpencode) {
        const commandDir = path.join(targetDir, 'command');
        fs.mkdirSync(commandDir, { recursive: true });
        const maxsimSrc = path.join(src, 'commands', 'maxsim');
        copyFlattenedCommands(maxsimSrc, commandDir, 'maxsim', pathPrefix, runtime);
        if (verifyInstalled(commandDir, 'command/maxsim-*')) {
            const count = fs
                .readdirSync(commandDir)
                .filter((f) => f.startsWith('maxsim-')).length;
            spinner.succeed(chalk_1.default.green('✓') + ` Installed ${count} commands to command/`);
        }
        else {
            spinner.fail('Failed to install commands');
            failures.push('command/maxsim-*');
        }
    }
    else if (isCodex) {
        const skillsDir = path.join(targetDir, 'skills');
        const maxsimSrc = path.join(src, 'commands', 'maxsim');
        copyCommandsAsCodexSkills(maxsimSrc, skillsDir, 'maxsim', pathPrefix, runtime);
        const installedSkillNames = listCodexSkillNames(skillsDir);
        if (installedSkillNames.length > 0) {
            spinner.succeed(chalk_1.default.green('✓') + ` Installed ${installedSkillNames.length} skills to skills/`);
        }
        else {
            spinner.fail('Failed to install skills');
            failures.push('skills/maxsim-*');
        }
    }
    else {
        const commandsDir = path.join(targetDir, 'commands');
        fs.mkdirSync(commandsDir, { recursive: true });
        const maxsimSrc = path.join(src, 'commands', 'maxsim');
        const maxsimDest = path.join(commandsDir, 'maxsim');
        copyWithPathReplacement(maxsimSrc, maxsimDest, pathPrefix, runtime, true);
        if (verifyInstalled(maxsimDest, 'commands/maxsim')) {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed commands/maxsim');
        }
        else {
            spinner.fail('Failed to install commands/maxsim');
            failures.push('commands/maxsim');
        }
    }
    // Copy maxsim directory content (workflows, templates, references) with path replacement
    // Templates package layout: workflows/, templates/, references/ at root
    // Install target: maxsim/workflows/, maxsim/templates/, maxsim/references/
    spinner = (0, ora_1.default)({ text: 'Installing workflows and templates...', color: 'cyan' }).start();
    const skillDest = path.join(targetDir, 'maxsim');
    const maxsimSubdirs = ['workflows', 'templates', 'references'];
    if (fs.existsSync(skillDest)) {
        fs.rmSync(skillDest, { recursive: true });
    }
    fs.mkdirSync(skillDest, { recursive: true });
    for (const subdir of maxsimSubdirs) {
        const subdirSrc = path.join(src, subdir);
        if (fs.existsSync(subdirSrc)) {
            const subdirDest = path.join(skillDest, subdir);
            copyWithPathReplacement(subdirSrc, subdirDest, pathPrefix, runtime);
        }
    }
    if (verifyInstalled(skillDest, 'maxsim')) {
        spinner.succeed(chalk_1.default.green('✓') + ' Installed maxsim');
    }
    else {
        spinner.fail('Failed to install maxsim');
        failures.push('maxsim');
    }
    // Copy agents to agents directory
    const agentsSrc = path.join(src, 'agents');
    if (fs.existsSync(agentsSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing agents...', color: 'cyan' }).start();
        const agentsDest = path.join(targetDir, 'agents');
        fs.mkdirSync(agentsDest, { recursive: true });
        // Remove old MAXSIM agents before copying new ones
        if (fs.existsSync(agentsDest)) {
            for (const file of fs.readdirSync(agentsDest)) {
                if (file.startsWith('maxsim-') && file.endsWith('.md')) {
                    fs.unlinkSync(path.join(agentsDest, file));
                }
            }
        }
        const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
        for (const entry of agentEntries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
                const dirRegex = /~\/\.claude\//g;
                content = content.replace(dirRegex, pathPrefix);
                content = (0, index_js_1.processAttribution)(content, getCommitAttribution(runtime));
                if (isOpencode) {
                    content = (0, index_js_1.convertClaudeToOpencodeFrontmatter)(content);
                }
                else if (isGemini) {
                    content = (0, index_js_1.convertClaudeToGeminiAgent)(content);
                }
                else if (isCodex) {
                    content = (0, index_js_1.convertClaudeToCodexMarkdown)(content);
                }
                fs.writeFileSync(path.join(agentsDest, entry.name), content);
            }
        }
        if (verifyInstalled(agentsDest, 'agents')) {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed agents');
        }
        else {
            spinner.fail('Failed to install agents');
            failures.push('agents');
        }
    }
    // Copy CHANGELOG.md (lives at repo root, one level above templates package)
    const changelogSrc = path.join(src, '..', 'CHANGELOG.md');
    const changelogDest = path.join(targetDir, 'maxsim', 'CHANGELOG.md');
    if (fs.existsSync(changelogSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing CHANGELOG.md...', color: 'cyan' }).start();
        fs.copyFileSync(changelogSrc, changelogDest);
        if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed CHANGELOG.md');
        }
        else {
            spinner.fail('Failed to install CHANGELOG.md');
            failures.push('CHANGELOG.md');
        }
    }
    // Copy CLAUDE.md (global MAXSIM context for Claude Code)
    const claudeMdSrc = path.join(src, 'CLAUDE.md');
    const claudeMdDest = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(claudeMdSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing CLAUDE.md...', color: 'cyan' }).start();
        fs.copyFileSync(claudeMdSrc, claudeMdDest);
        if (verifyFileInstalled(claudeMdDest, 'CLAUDE.md')) {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed CLAUDE.md');
        }
        else {
            spinner.fail('Failed to install CLAUDE.md');
            failures.push('CLAUDE.md');
        }
    }
    // Write VERSION file
    const versionDest = path.join(targetDir, 'maxsim', 'VERSION');
    fs.writeFileSync(versionDest, pkg.version);
    if (verifyFileInstalled(versionDest, 'VERSION')) {
        console.log(`  ${chalk_1.default.green('\u2713')} Wrote VERSION (${pkg.version})`);
    }
    else {
        failures.push('VERSION');
    }
    if (!isCodex) {
        // Write package.json to force CommonJS mode for MAXSIM scripts
        const pkgJsonDest = path.join(targetDir, 'package.json');
        fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');
        console.log(`  ${chalk_1.default.green('\u2713')} Wrote package.json (CommonJS mode)`);
        // Install maxsim-tools.cjs binary — workflows call `node ~/.claude/maxsim/bin/maxsim-tools.cjs`
        const toolSrc = path.resolve(__dirname, 'cli.cjs');
        const binDir = path.join(targetDir, 'maxsim', 'bin');
        const toolDest = path.join(binDir, 'maxsim-tools.cjs');
        if (fs.existsSync(toolSrc)) {
            fs.mkdirSync(binDir, { recursive: true });
            fs.copyFileSync(toolSrc, toolDest);
            console.log(`  ${chalk_1.default.green('\u2713')} Installed maxsim-tools.cjs`);
        }
        else {
            console.warn(`  ${chalk_1.default.yellow('!')} cli.cjs not found at ${toolSrc} — maxsim-tools.cjs not installed`);
            failures.push('maxsim-tools.cjs');
        }
        // Copy hooks from bundled assets directory (copied from @maxsim/hooks/dist at build time)
        let hooksSrc = null;
        const bundledHooksDir = path.resolve(__dirname, 'assets', 'hooks');
        if (fs.existsSync(bundledHooksDir)) {
            hooksSrc = bundledHooksDir;
        }
        else {
            console.warn(`  ${chalk_1.default.yellow('!')} bundled hooks not found - hooks will not be installed`);
        }
        if (hooksSrc) {
            spinner = (0, ora_1.default)({ text: 'Installing hooks...', color: 'cyan' }).start();
            const hooksDest = path.join(targetDir, 'hooks');
            fs.mkdirSync(hooksDest, { recursive: true });
            const hookEntries = fs.readdirSync(hooksSrc);
            const configDirReplacement = getConfigDirFromHome(runtime, isGlobal);
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
            if (verifyInstalled(hooksDest, 'hooks')) {
                spinner.succeed(chalk_1.default.green('✓') + ' Installed hooks (bundled)');
            }
            else {
                spinner.fail('Failed to install hooks');
                failures.push('hooks');
            }
        }
    }
    // Copy dashboard Vite+Express build (if bundled in dist/assets/dashboard/)
    // The dashboard now ships as: server.js (tsdown-bundled Express) + client/ (Vite static)
    // No node_modules/ needed at destination — all server deps are bundled inline.
    const dashboardSrc = path.resolve(__dirname, 'assets', 'dashboard');
    if (fs.existsSync(dashboardSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing dashboard...', color: 'cyan' }).start();
        const dashboardDest = path.join(targetDir, 'dashboard');
        // Clean existing dashboard to prevent stale files from old installs
        safeRmDir(dashboardDest);
        copyDirRecursive(dashboardSrc, dashboardDest);
        // Write dashboard.json NEXT TO dashboard/ dir (survives overwrites on upgrade)
        const dashboardConfigDest = path.join(targetDir, 'dashboard.json');
        const projectCwd = isGlobal ? targetDir : process.cwd();
        fs.writeFileSync(dashboardConfigDest, JSON.stringify({ projectCwd }, null, 2) + '\n');
        if (fs.existsSync(path.join(dashboardDest, 'server.js'))) {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed dashboard');
        }
        else {
            spinner.succeed(chalk_1.default.green('✓') + ' Installed dashboard (server.js not found in bundle)');
        }
    }
    if (failures.length > 0) {
        console.error(`\n  ${chalk_1.default.yellow('Installation incomplete!')} Failed: ${failures.join(', ')}`);
        process.exit(1);
    }
    // Write file manifest for future modification detection
    writeManifest(targetDir, runtime);
    console.log(`  ${chalk_1.default.green('\u2713')} Wrote file manifest (${MANIFEST_NAME})`);
    // Report any backed-up local patches
    reportLocalPatches(targetDir, runtime);
    if (isCodex) {
        return {
            settingsPath: null,
            settings: null,
            statuslineCommand: null,
            runtime,
        };
    }
    // Configure statusline and hooks in settings.json
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
    // Enable experimental agents for Gemini CLI
    if (isGemini) {
        if (!settings.experimental) {
            settings.experimental = {};
        }
        const experimental = settings.experimental;
        if (!experimental.enableAgents) {
            experimental.enableAgents = true;
            console.log(`  ${chalk_1.default.green('\u2713')} Enabled experimental agents`);
        }
    }
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
    return { settingsPath, settings, statuslineCommand, runtime };
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
        configureOpencodePermissions(isGlobal);
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
/**
 * Handle statusline configuration — returns true if MAXSIM statusline should be installed
 */
async function handleStatusline(settings, isInteractive) {
    const hasExisting = settings.statusLine != null;
    if (!hasExisting)
        return true;
    if (forceStatusline)
        return true;
    if (!isInteractive) {
        console.log(chalk_1.default.yellow('⚠') + ' Skipping statusline (already configured)');
        console.log('  Use ' + chalk_1.default.cyan('--force-statusline') + ' to replace\n');
        return false;
    }
    const statusLine = settings.statusLine;
    const existingCmd = statusLine.command || statusLine.url || '(custom)';
    console.log();
    console.log(chalk_1.default.yellow('⚠  Existing statusline detected'));
    console.log();
    console.log('  Your current statusline:');
    console.log('    ' + chalk_1.default.dim(`command: ${existingCmd}`));
    console.log();
    console.log('  MAXSIM includes a statusline showing:');
    console.log('    • Model name');
    console.log('    • Current task (from todo list)');
    console.log('    • Context window usage (color-coded)');
    console.log();
    const shouldReplace = await (0, prompts_1.confirm)({
        message: 'Replace with MAXSIM statusline?',
        default: false,
    });
    return shouldReplace;
}
/**
 * Prompt for runtime selection (multi-select)
 */
async function promptRuntime() {
    const selected = await (0, prompts_1.checkbox)({
        message: 'Which runtime(s) would you like to install for?',
        choices: [
            { name: 'Claude Code  ' + chalk_1.default.dim('(~/.claude)'), value: 'claude', checked: true },
            { name: 'OpenCode     ' + chalk_1.default.dim('(~/.config/opencode)') + '  — open source, free models', value: 'opencode' },
            { name: 'Gemini       ' + chalk_1.default.dim('(~/.gemini)'), value: 'gemini' },
            { name: 'Codex        ' + chalk_1.default.dim('(~/.codex)'), value: 'codex' },
        ],
        validate: (choices) => choices.length > 0 || 'Please select at least one runtime',
    });
    return selected;
}
/**
 * Prompt for install location
 */
async function promptLocation(runtimes) {
    if (!process.stdin.isTTY) {
        console.log(chalk_1.default.yellow('Non-interactive terminal detected, defaulting to global install') + '\n');
        return true; // isGlobal
    }
    const pathExamples = runtimes
        .map((r) => getGlobalDir(r, explicitConfigDir).replace(os.homedir(), '~'))
        .join(', ');
    const localExamples = runtimes.map((r) => `./${getDirName(r)}`).join(', ');
    const choice = await (0, prompts_1.select)({
        message: 'Where would you like to install?',
        choices: [
            {
                name: 'Global  ' + chalk_1.default.dim(`(${pathExamples})`) + '  — available in all projects',
                value: 'global',
            },
            {
                name: 'Local   ' + chalk_1.default.dim(`(${localExamples})`) + '  — this project only',
                value: 'local',
            },
        ],
    });
    return choice === 'global';
}
/**
 * Prompt whether to enable Agent Teams (Claude only, experimental feature)
 */
async function promptAgentTeams() {
    console.log();
    console.log(chalk_1.default.cyan('  Agent Teams') + chalk_1.default.dim(' (experimental)'));
    console.log(chalk_1.default.dim('  Coordinate multiple Claude Code instances working in parallel.'));
    console.log(chalk_1.default.dim('  Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS in settings.json.'));
    console.log();
    return (0, prompts_1.confirm)({
        message: 'Enable Agent Teams?',
        default: false,
    });
}
/**
 * Install MAXSIM for all selected runtimes
 */
async function installAllRuntimes(runtimes, isGlobal, isInteractive) {
    const results = [];
    for (const runtime of runtimes) {
        const result = install(isGlobal, runtime);
        results.push(result);
    }
    const statuslineRuntimes = ['claude', 'gemini'];
    const primaryStatuslineResult = results.find((r) => statuslineRuntimes.includes(r.runtime));
    let shouldInstallStatusline = false;
    if (primaryStatuslineResult && primaryStatuslineResult.settings) {
        shouldInstallStatusline = await handleStatusline(primaryStatuslineResult.settings, isInteractive);
    }
    // Prompt for Agent Teams if Claude is in the selected runtimes
    let enableAgentTeams = false;
    if (isInteractive && runtimes.includes('claude')) {
        enableAgentTeams = await promptAgentTeams();
    }
    for (const result of results) {
        const useStatusline = statuslineRuntimes.includes(result.runtime) && shouldInstallStatusline;
        // Apply Agent Teams setting for Claude
        if (result.runtime === 'claude' && enableAgentTeams && result.settings) {
            const env = result.settings.env ?? {};
            env['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'] = '1';
            result.settings.env = env;
        }
        finishInstall(result.settingsPath, result.settings, result.statuslineCommand, useStatusline, result.runtime, isGlobal);
    }
}
// Main logic
// Subcommand routing — intercept before install flow
const subcommand = args.find(a => !a.startsWith('-'));
(async () => {
    // Dashboard subcommand
    if (subcommand === 'dashboard') {
        const { spawn: spawnDash, execSync: execSyncDash } = await import('node:child_process');
        // Always refresh dashboard from bundled assets before launching.
        // This ensures users get the latest version (fixes broken ESM builds, etc.)
        const dashboardAssetSrc = path.resolve(__dirname, 'assets', 'dashboard');
        const installDir = path.join(process.cwd(), '.claude');
        const installDashDir = path.join(installDir, 'dashboard');
        if (fs.existsSync(dashboardAssetSrc)) {
            // Preserve node_modules (contains native addons like node-pty) across refreshes
            const nodeModulesDir = path.join(installDashDir, 'node_modules');
            const nodeModulesTmp = path.join(installDir, '_dashboard_node_modules_tmp');
            const hadNodeModules = fs.existsSync(nodeModulesDir);
            if (hadNodeModules) {
                fs.renameSync(nodeModulesDir, nodeModulesTmp);
            }
            // Clean existing dashboard dir to prevent stale files from old installs
            safeRmDir(installDashDir);
            fs.mkdirSync(installDashDir, { recursive: true });
            // Dashboard is now Vite+Express: server.js (self-contained) + client/ (static)
            // No node_modules/ hoisting needed — all deps are bundled into server.js by tsdown.
            copyDirRecursive(dashboardAssetSrc, installDashDir);
            // Restore node_modules if it was preserved
            if (hadNodeModules && fs.existsSync(nodeModulesTmp)) {
                fs.renameSync(nodeModulesTmp, nodeModulesDir);
            }
            // Write/update dashboard.json
            const dashConfigPath = path.join(installDir, 'dashboard.json');
            if (!fs.existsSync(dashConfigPath)) {
                fs.writeFileSync(dashConfigPath, JSON.stringify({ projectCwd: process.cwd() }, null, 2) + '\n');
            }
        }
        // Resolve server path: local project first, then global
        const localDashboard = path.join(process.cwd(), '.claude', 'dashboard', 'server.js');
        const globalDashboard = path.join(os.homedir(), '.claude', 'dashboard', 'server.js');
        let serverPath = null;
        if (fs.existsSync(localDashboard)) {
            serverPath = localDashboard;
        }
        else if (fs.existsSync(globalDashboard)) {
            serverPath = globalDashboard;
        }
        if (!serverPath) {
            console.log(chalk_1.default.yellow('\n  Dashboard not available.\n'));
            console.log('  Install MAXSIM first: ' + chalk_1.default.cyan('npx maxsimcli@latest') + '\n');
            process.exit(0);
        }
        // Read projectCwd from dashboard.json (one level up from dashboard/ dir)
        const dashboardDir = path.dirname(serverPath);
        const dashboardConfigPath = path.join(path.dirname(dashboardDir), 'dashboard.json');
        let projectCwd = process.cwd();
        if (fs.existsSync(dashboardConfigPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(dashboardConfigPath, 'utf8'));
                if (config.projectCwd) {
                    projectCwd = config.projectCwd;
                }
            }
            catch {
                // Use default cwd
            }
        }
        // node-pty is a native addon that cannot be bundled — auto-install if missing
        const dashDirForPty = path.dirname(serverPath);
        const ptyModulePath = path.join(dashDirForPty, 'node_modules', 'node-pty');
        if (!fs.existsSync(ptyModulePath)) {
            console.log(chalk_1.default.gray('  Installing node-pty for terminal support...'));
            try {
                // Ensure a package.json exists so npm install works in the dashboard dir
                const dashPkgPath = path.join(dashDirForPty, 'package.json');
                if (!fs.existsSync(dashPkgPath)) {
                    fs.writeFileSync(dashPkgPath, '{"private":true}\n');
                }
                execSyncDash('npm install node-pty --save-optional --no-audit --no-fund --loglevel=error', {
                    cwd: dashDirForPty,
                    stdio: 'inherit',
                    timeout: 120_000,
                });
            }
            catch {
                console.warn(chalk_1.default.yellow('  node-pty installation failed — terminal will be unavailable.'));
            }
        }
        console.log(chalk_1.default.blue('Starting dashboard...'));
        console.log(chalk_1.default.gray(`  Project: ${projectCwd}`));
        console.log(chalk_1.default.gray(`  Server:  ${serverPath}\n`));
        // Use stdio: 'ignore' (fully detached) — a piped stderr causes the server to crash on
        // Windows when the read-end is closed after the parent reads the ready message (EPIPE).
        const child = spawnDash(process.execPath, [serverPath], {
            cwd: dashboardDir,
            detached: true,
            stdio: 'ignore',
            env: {
                ...process.env,
                MAXSIM_PROJECT_CWD: projectCwd,
                NODE_ENV: 'production',
            },
        });
        child.unref();
        // Poll /api/health until the server is ready (or 20s timeout).
        // Health polling avoids any pipe between parent and child, so the server
        // process stays alive after the parent exits.
        const POLL_INTERVAL_MS = 500;
        const POLL_TIMEOUT_MS = 20000;
        const HEALTH_TIMEOUT_MS = 1000;
        const DEFAULT_PORT = 3333;
        const PORT_RANGE_END = 3343;
        let foundUrl = null;
        const deadline = Date.now() + POLL_TIMEOUT_MS;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            for (let p = DEFAULT_PORT; p <= PORT_RANGE_END; p++) {
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
                    const res = await fetch(`http://localhost:${p}/api/health`, { signal: controller.signal });
                    clearTimeout(timer);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === 'ok') {
                            foundUrl = `http://localhost:${p}`;
                            break;
                        }
                    }
                }
                catch { /* not ready yet */ }
            }
            if (foundUrl)
                break;
        }
        if (foundUrl) {
            console.log(chalk_1.default.green(`  Dashboard ready at ${foundUrl}`));
        }
        else {
            console.log(chalk_1.default.yellow('\n  Dashboard did not respond after 20s. The server may still be starting — check http://localhost:3333'));
        }
        process.exit(0);
    }
    if (hasGlobal && hasLocal) {
        console.error(chalk_1.default.yellow('Cannot specify both --global and --local'));
        process.exit(1);
    }
    else if (explicitConfigDir && hasLocal) {
        console.error(chalk_1.default.yellow('Cannot use --config-dir with --local'));
        process.exit(1);
    }
    else if (hasUninstall) {
        if (!hasGlobal && !hasLocal) {
            console.error(chalk_1.default.yellow('--uninstall requires --global or --local'));
            process.exit(1);
        }
        const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
        for (const runtime of runtimes) {
            uninstall(hasGlobal, runtime);
        }
    }
    else if (selectedRuntimes.length > 0) {
        if (!hasGlobal && !hasLocal) {
            const isGlobal = await promptLocation(selectedRuntimes);
            await installAllRuntimes(selectedRuntimes, isGlobal, true);
        }
        else {
            await installAllRuntimes(selectedRuntimes, hasGlobal, false);
        }
    }
    else if (hasGlobal || hasLocal) {
        await installAllRuntimes(['claude'], hasGlobal, false);
    }
    else {
        if (!process.stdin.isTTY) {
            console.log(chalk_1.default.yellow('Non-interactive terminal detected, defaulting to Claude Code global install') + '\n');
            await installAllRuntimes(['claude'], true, false);
        }
        else {
            const runtimes = await promptRuntime();
            const isGlobal = await promptLocation(runtimes);
            await installAllRuntimes(runtimes, isGlobal, true);
        }
    }
})().catch((err) => {
    if (err instanceof Error && err.message.includes('User force closed')) {
        // User pressed Ctrl+C during an @inquirer/prompts prompt — exit cleanly
        console.log('\n' + chalk_1.default.yellow('Installation cancelled') + '\n');
        process.exit(0);
    }
    console.error(chalk_1.default.red('Unexpected error:'), err);
    process.exit(1);
});
//# sourceMappingURL=install.js.map