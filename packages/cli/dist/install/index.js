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
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const ora_1 = __importDefault(require("ora"));
const prompts_1 = require("@inquirer/prompts");
const minimist_1 = __importDefault(require("minimist"));
const index_js_1 = require("../adapters/index.js");
const shared_js_1 = require("./shared.js");
const adapters_js_1 = require("./adapters.js");
const dashboard_js_1 = require("./dashboard.js");
const hooks_js_1 = require("./hooks.js");
const manifest_js_1 = require("./manifest.js");
const patches_js_1 = require("./patches.js");
const copy_js_1 = require("./copy.js");
const uninstall_js_1 = require("./uninstall.js");
// Parse args
const args = process.argv.slice(2);
const argv = (0, minimist_1.default)(args, {
    boolean: ['global', 'local', 'opencode', 'claude', 'gemini', 'codex', 'both', 'all', 'uninstall', 'help', 'version', 'force-statusline', 'network'],
    string: ['config-dir'],
    alias: { g: 'global', l: 'local', u: 'uninstall', h: 'help', c: 'config-dir' },
});
const hasGlobal = !!argv['global'];
const hasLocal = !!argv['local'];
const hasOpencode = !!argv['opencode'];
const hasClaude = !!argv['claude'];
const hasGemini = !!argv['gemini'];
const hasCodex = !!argv['codex'];
const hasBoth = !!argv['both']; // Legacy flag, keeps working
const hasAll = !!argv['all'];
const hasUninstall = !!argv['uninstall'];
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
const banner = '\n' +
    chalk_1.default.cyan(figlet_1.default.textSync('MAXSIM', { font: 'ANSI Shadow' })
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n')) +
    '\n' +
    '\n' +
    '  MAXSIM ' +
    chalk_1.default.dim('v' + shared_js_1.pkg.version) +
    '\n' +
    '  A meta-prompting, context engineering and spec-driven\n' +
    '  development system for Claude Code, OpenCode, Gemini, and Codex.\n';
// Parse --config-dir argument
const explicitConfigDir = argv['config-dir'] || null;
const hasHelp = !!argv['help'];
const hasVersion = !!argv['version'];
const forceStatusline = !!argv['force-statusline'];
// Show version if requested (before banner for clean output)
if (hasVersion) {
    console.log(shared_js_1.pkg.version);
    process.exit(0);
}
console.log(banner);
// Show help if requested
if (hasHelp) {
    console.log(`  ${chalk_1.default.yellow('Usage:')} npx maxsimcli [options]\n\n  ${chalk_1.default.yellow('Options:')}\n    ${chalk_1.default.cyan('-g, --global')}              Install globally (to config directory)\n    ${chalk_1.default.cyan('-l, --local')}               Install locally (to current directory)\n    ${chalk_1.default.cyan('--claude')}                  Install for Claude Code only\n    ${chalk_1.default.cyan('--opencode')}                Install for OpenCode only\n    ${chalk_1.default.cyan('--gemini')}                  Install for Gemini only\n    ${chalk_1.default.cyan('--codex')}                   Install for Codex only\n    ${chalk_1.default.cyan('--all')}                     Install for all runtimes\n    ${chalk_1.default.cyan('-u, --uninstall')}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${chalk_1.default.cyan('-c, --config-dir <path>')}   Specify custom config directory\n    ${chalk_1.default.cyan('-h, --help')}                Show this help message\n    ${chalk_1.default.cyan('--force-statusline')}        Replace existing statusline config\n\n  ${chalk_1.default.yellow('Examples:')}\n    ${chalk_1.default.dim('# Interactive install (prompts for runtime and location)')}\n    npx maxsimcli\n\n    ${chalk_1.default.dim('# Install for Claude Code globally')}\n    npx maxsimcli --claude --global\n\n    ${chalk_1.default.dim('# Install for Gemini globally')}\n    npx maxsimcli --gemini --global\n\n    ${chalk_1.default.dim('# Install for Codex globally')}\n    npx maxsimcli --codex --global\n\n    ${chalk_1.default.dim('# Install for all runtimes globally')}\n    npx maxsimcli --all --global\n\n    ${chalk_1.default.dim('# Install to custom config directory')}\n    npx maxsimcli --codex --global --config-dir ~/.codex-work\n\n    ${chalk_1.default.dim('# Install to current project only')}\n    npx maxsimcli --claude --local\n\n    ${chalk_1.default.dim('# Uninstall MAXSIM from Codex globally')}\n    npx maxsimcli --codex --global --uninstall\n\n  ${chalk_1.default.yellow('Notes:')}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_HOME environment variables.\n`);
    process.exit(0);
}
async function install(isGlobal, runtime = 'claude') {
    const isOpencode = runtime === 'opencode';
    const isGemini = runtime === 'gemini';
    const isCodex = runtime === 'codex';
    const dirName = (0, shared_js_1.getDirName)(runtime);
    const src = shared_js_1.templatesRoot;
    const targetDir = isGlobal
        ? (0, shared_js_1.getGlobalDir)(runtime, explicitConfigDir)
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
    (0, patches_js_1.saveLocalPatches)(targetDir);
    // Clean up orphaned files from previous versions
    (0, hooks_js_1.cleanupOrphanedFiles)(targetDir);
    // OpenCode uses command/ (flat), Codex uses skills/, Claude/Gemini use commands/maxsim/
    let spinner = (0, ora_1.default)({ text: 'Installing commands...', color: 'cyan' }).start();
    if (isOpencode) {
        const commandDir = path.join(targetDir, 'command');
        fs.mkdirSync(commandDir, { recursive: true });
        const maxsimSrc = path.join(src, 'commands', 'maxsim');
        (0, copy_js_1.copyFlattenedCommands)(maxsimSrc, commandDir, 'maxsim', pathPrefix, runtime, explicitConfigDir);
        if ((0, shared_js_1.verifyInstalled)(commandDir, 'command/maxsim-*')) {
            const count = fs
                .readdirSync(commandDir)
                .filter((f) => f.startsWith('maxsim-')).length;
            spinner.succeed(chalk_1.default.green('\u2713') + ` Installed ${count} commands to command/`);
        }
        else {
            spinner.fail('Failed to install commands');
            failures.push('command/maxsim-*');
        }
    }
    else if (isCodex) {
        const skillsDir = path.join(targetDir, 'skills');
        const maxsimSrc = path.join(src, 'commands', 'maxsim');
        (0, copy_js_1.copyCommandsAsCodexSkills)(maxsimSrc, skillsDir, 'maxsim', pathPrefix, runtime, explicitConfigDir);
        const installedSkillNames = (0, copy_js_1.listCodexSkillNames)(skillsDir);
        if (installedSkillNames.length > 0) {
            spinner.succeed(chalk_1.default.green('\u2713') + ` Installed ${installedSkillNames.length} skills to skills/`);
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
        (0, copy_js_1.copyWithPathReplacement)(maxsimSrc, maxsimDest, pathPrefix, runtime, explicitConfigDir, true);
        if ((0, shared_js_1.verifyInstalled)(maxsimDest, 'commands/maxsim')) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed commands/maxsim');
        }
        else {
            spinner.fail('Failed to install commands/maxsim');
            failures.push('commands/maxsim');
        }
    }
    // Copy maxsim directory content (workflows, templates, references) with path replacement
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
            (0, copy_js_1.copyWithPathReplacement)(subdirSrc, subdirDest, pathPrefix, runtime, explicitConfigDir);
        }
    }
    if ((0, shared_js_1.verifyInstalled)(skillDest, 'maxsim')) {
        spinner.succeed(chalk_1.default.green('\u2713') + ' Installed maxsim');
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
                content = (0, index_js_1.processAttribution)(content, (0, adapters_js_1.getCommitAttribution)(runtime, explicitConfigDir));
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
        if ((0, shared_js_1.verifyInstalled)(agentsDest, 'agents')) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed agents');
        }
        else {
            spinner.fail('Failed to install agents');
            failures.push('agents');
        }
    }
    // Remove legacy agents/skills/ directory (skills moved to skills/ in v1.x)
    const legacySkillsDir = path.join(targetDir, 'agents', 'skills');
    if (fs.existsSync(legacySkillsDir)) {
        fs.rmSync(legacySkillsDir, { recursive: true });
        console.log(`  ${chalk_1.default.green('\u2713')} Removed legacy agents/skills/ directory`);
    }
    // Copy skills to skills/ directory
    const skillsSrc = path.join(src, 'skills');
    if (fs.existsSync(skillsSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing skills...', color: 'cyan' }).start();
        const skillsDest = path.join(targetDir, 'skills');
        // Remove old MAXSIM built-in skills before copying new ones (preserve user custom skills)
        if (fs.existsSync(skillsDest)) {
            for (const skill of shared_js_1.builtInSkills) {
                const skillDir = path.join(skillsDest, skill);
                if (fs.existsSync(skillDir)) {
                    fs.rmSync(skillDir, { recursive: true });
                }
            }
        }
        // Copy skills directory recursively
        fs_extra_1.default.copySync(skillsSrc, skillsDest, { overwrite: true });
        // Process path prefixes in skill files
        const skillEntries = fs.readdirSync(skillsDest, { withFileTypes: true });
        for (const entry of skillEntries) {
            if (entry.isDirectory()) {
                const skillMd = path.join(skillsDest, entry.name, 'SKILL.md');
                if (fs.existsSync(skillMd)) {
                    let content = fs.readFileSync(skillMd, 'utf8');
                    const dirRegex = /~\/\.claude\//g;
                    content = content.replace(dirRegex, pathPrefix);
                    content = (0, index_js_1.processAttribution)(content, (0, adapters_js_1.getCommitAttribution)(runtime, explicitConfigDir));
                    fs.writeFileSync(skillMd, content);
                }
            }
        }
        const installedSkillDirs = fs.readdirSync(skillsDest, { withFileTypes: true })
            .filter(e => e.isDirectory()).length;
        if (installedSkillDirs > 0) {
            spinner.succeed(chalk_1.default.green('\u2713') + ` Installed ${installedSkillDirs} skills to skills/`);
        }
        else {
            spinner.fail('Failed to install skills');
            failures.push('skills');
        }
    }
    // Copy CHANGELOG.md
    const changelogSrc = path.join(src, '..', 'CHANGELOG.md');
    const changelogDest = path.join(targetDir, 'maxsim', 'CHANGELOG.md');
    if (fs.existsSync(changelogSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing CHANGELOG.md...', color: 'cyan' }).start();
        fs.copyFileSync(changelogSrc, changelogDest);
        if ((0, shared_js_1.verifyFileInstalled)(changelogDest, 'CHANGELOG.md')) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed CHANGELOG.md');
        }
        else {
            spinner.fail('Failed to install CHANGELOG.md');
            failures.push('CHANGELOG.md');
        }
    }
    // Copy CLAUDE.md
    const claudeMdSrc = path.join(src, 'CLAUDE.md');
    const claudeMdDest = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(claudeMdSrc)) {
        spinner = (0, ora_1.default)({ text: 'Installing CLAUDE.md...', color: 'cyan' }).start();
        fs.copyFileSync(claudeMdSrc, claudeMdDest);
        if ((0, shared_js_1.verifyFileInstalled)(claudeMdDest, 'CLAUDE.md')) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed CLAUDE.md');
        }
        else {
            spinner.fail('Failed to install CLAUDE.md');
            failures.push('CLAUDE.md');
        }
    }
    // Write VERSION file
    const versionDest = path.join(targetDir, 'maxsim', 'VERSION');
    fs.writeFileSync(versionDest, shared_js_1.pkg.version);
    if ((0, shared_js_1.verifyFileInstalled)(versionDest, 'VERSION')) {
        console.log(`  ${chalk_1.default.green('\u2713')} Wrote VERSION (${shared_js_1.pkg.version})`);
    }
    else {
        failures.push('VERSION');
    }
    if (!isCodex) {
        // Write package.json to force CommonJS mode for MAXSIM scripts
        const pkgJsonDest = path.join(targetDir, 'package.json');
        fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');
        console.log(`  ${chalk_1.default.green('\u2713')} Wrote package.json (CommonJS mode)`);
        // Install maxsim-tools.cjs binary
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
        // Install mcp-server.cjs
        const mcpSrc = path.resolve(__dirname, 'mcp-server.cjs');
        const mcpDest = path.join(binDir, 'mcp-server.cjs');
        if (fs.existsSync(mcpSrc)) {
            fs.mkdirSync(binDir, { recursive: true });
            fs.copyFileSync(mcpSrc, mcpDest);
            console.log(`  ${chalk_1.default.green('\u2713')} Installed mcp-server.cjs`);
        }
        else {
            console.warn(`  ${chalk_1.default.yellow('!')} mcp-server.cjs not found — MCP server not installed`);
        }
        // Install hooks
        (0, hooks_js_1.installHookFiles)(targetDir, runtime, isGlobal, failures);
    }
    // Copy dashboard
    const dashboardSrc = path.resolve(__dirname, 'assets', 'dashboard');
    if (fs.existsSync(dashboardSrc)) {
        let networkMode = false;
        try {
            networkMode = await (0, prompts_1.confirm)({
                message: 'Allow dashboard to be accessible on your local network? (adds firewall rule, enables QR code)',
                default: false,
            });
        }
        catch {
            // Non-interactive terminal — default to false
        }
        spinner = (0, ora_1.default)({ text: 'Installing dashboard...', color: 'cyan' }).start();
        const dashboardDest = path.join(targetDir, 'dashboard');
        (0, shared_js_1.safeRmDir)(dashboardDest);
        (0, shared_js_1.copyDirRecursive)(dashboardSrc, dashboardDest);
        const dashboardConfigDest = path.join(targetDir, 'dashboard.json');
        const projectCwd = isGlobal ? targetDir : process.cwd();
        fs.writeFileSync(dashboardConfigDest, JSON.stringify({ projectCwd, networkMode }, null, 2) + '\n');
        if (fs.existsSync(path.join(dashboardDest, 'server.js'))) {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed dashboard');
        }
        else {
            spinner.succeed(chalk_1.default.green('\u2713') + ' Installed dashboard (server.js not found in bundle)');
        }
        if (networkMode) {
            (0, dashboard_js_1.applyFirewallRule)(3333);
        }
    }
    // Write .mcp.json for Claude Code MCP server auto-discovery
    if (!isOpencode && !isCodex && !isGemini) {
        const mcpJsonPath = isGlobal
            ? path.join(targetDir, '..', '.mcp.json')
            : path.join(process.cwd(), '.mcp.json');
        let mcpConfig = {};
        if (fs.existsSync(mcpJsonPath)) {
            try {
                mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
            }
            catch {
                // Corrupted file — start fresh
            }
        }
        const mcpServers = mcpConfig.mcpServers ?? {};
        mcpServers['maxsim'] = {
            command: 'node',
            args: ['.claude/maxsim/bin/mcp-server.cjs'],
            env: {},
        };
        mcpConfig.mcpServers = mcpServers;
        fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf-8');
        console.log(`  ${chalk_1.default.green('\u2713')} Configured .mcp.json for MCP server auto-discovery`);
    }
    if (failures.length > 0) {
        console.error(`\n  ${chalk_1.default.yellow('Installation incomplete!')} Failed: ${failures.join(', ')}`);
        process.exit(1);
    }
    // Write file manifest for future modification detection
    (0, manifest_js_1.writeManifest)(targetDir, runtime);
    console.log(`  ${chalk_1.default.green('\u2713')} Wrote file manifest (${manifest_js_1.MANIFEST_NAME})`);
    // Report any backed-up local patches
    (0, patches_js_1.reportLocalPatches)(targetDir, runtime);
    if (isCodex) {
        return {
            settingsPath: null,
            settings: null,
            statuslineCommand: null,
            runtime,
        };
    }
    // Configure statusline and hooks in settings.json
    const { settingsPath, settings, statuslineCommand } = (0, hooks_js_1.configureSettingsHooks)(targetDir, runtime, isGlobal);
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
    return { settingsPath, settings, statuslineCommand, runtime };
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
        .map((r) => (0, shared_js_1.getGlobalDir)(r, explicitConfigDir).replace(os.homedir(), '~'))
        .join(', ');
    const localExamples = runtimes.map((r) => `./${(0, shared_js_1.getDirName)(r)}`).join(', ');
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
        const result = await install(isGlobal, runtime);
        results.push(result);
    }
    const statuslineRuntimes = ['claude', 'gemini'];
    const primaryStatuslineResult = results.find((r) => statuslineRuntimes.includes(r.runtime));
    let shouldInstallStatusline = false;
    if (primaryStatuslineResult && primaryStatuslineResult.settings) {
        shouldInstallStatusline = await (0, hooks_js_1.handleStatusline)(primaryStatuslineResult.settings, isInteractive, forceStatusline);
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
        (0, hooks_js_1.finishInstall)(result.settingsPath, result.settings, result.statuslineCommand, useStatusline, result.runtime, isGlobal);
    }
}
// Main logic
// Subcommand routing — intercept before install flow
const subcommand = argv._[0];
(async () => {
    // Dashboard subcommand
    if (subcommand === 'dashboard') {
        await (0, dashboard_js_1.runDashboardSubcommand)(argv);
        return;
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
            (0, uninstall_js_1.uninstall)(hasGlobal, runtime, explicitConfigDir);
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
//# sourceMappingURL=index.js.map