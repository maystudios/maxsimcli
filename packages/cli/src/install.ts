import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

import chalk from 'chalk';
import ora from 'ora';
import { select, checkbox, confirm } from '@inquirer/prompts';

import type { RuntimeName, AdapterConfig } from '@maxsim/adapters';
import {
  claudeAdapter,
  opencodeAdapter,
  geminiAdapter,
  codexAdapter,
  expandTilde,
  processAttribution,
  buildHookCommand,
  readSettings,
  writeSettings,
  convertClaudeToOpencodeFrontmatter,
  convertClaudeToGeminiToml,
  convertClaudeCommandToCodexSkill,
  convertClaudeToCodexMarkdown,
  stripSubTags,
  convertClaudeToGeminiAgent,
} from '@maxsim/adapters';

// Get version from package.json
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string };

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
let selectedRuntimes: RuntimeName[] = [];
if (hasAll) {
  selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex'];
} else if (hasBoth) {
  selectedRuntimes = ['claude', 'opencode'];
} else {
  if (hasOpencode) selectedRuntimes.push('opencode');
  if (hasClaude) selectedRuntimes.push('claude');
  if (hasGemini) selectedRuntimes.push('gemini');
  if (hasCodex) selectedRuntimes.push('codex');
}

/**
 * Adapter registry keyed by runtime name
 */
const adapterMap: Record<RuntimeName, AdapterConfig> = {
  claude: claudeAdapter,
  opencode: opencodeAdapter,
  gemini: geminiAdapter,
  codex: codexAdapter,
};

/**
 * Get adapter for a runtime
 */
function getAdapter(runtime: RuntimeName): AdapterConfig {
  return adapterMap[runtime];
}

/**
 * Get the global config directory for a runtime, using adapter
 */
function getGlobalDir(runtime: RuntimeName, explicitDir: string | null = null): string {
  return getAdapter(runtime).getGlobalDir(explicitDir);
}

/**
 * Get the config directory path relative to home for hook templating
 */
function getConfigDirFromHome(runtime: RuntimeName, isGlobal: boolean): string {
  return getAdapter(runtime).getConfigDirFromHome(isGlobal);
}

/**
 * Get the local directory name for a runtime
 */
function getDirName(runtime: RuntimeName): string {
  return getAdapter(runtime).dirName;
}

/**
 * Get the global config directory for OpenCode (for JSONC permissions)
 * OpenCode follows XDG Base Directory spec
 */
function getOpencodeGlobalDir(): string {
  return opencodeAdapter.getGlobalDir();
}

const banner =
  '\n' +
  chalk.cyan(
    '  \u2588\u2588\u2557  \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\n' +
    '  \u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255a\u2588\u2588\u2557\u2588\u2588\u2554\u255d\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2551\n' +
    '  \u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551\n' +
    '  \u2588\u2588\u2551\u255a\u2588\u2588\u2554\u255d\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551 \u2588\u2588\u2554\u2588\u2588\u2557 \u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551\u255a\u2588\u2588\u2554\u255d\u2588\u2588\u2551\n' +
    '  \u2588\u2588\u2551 \u255a\u2550\u255d \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u255d \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551 \u255a\u2550\u255d \u2588\u2588\u2551\n' +
    '  \u255a\u2550\u255d     \u255a\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d\u255a\u2550\u255d     \u255a\u2550\u255d'
  ) +
  '\n' +
  '\n' +
  '  MAXSIM ' +
  chalk.dim('v' + pkg.version) +
  '\n' +
  '  A meta-prompting, context engineering and spec-driven\n' +
  '  development system for Claude Code, OpenCode, Gemini, and Codex.\n';

// Parse --config-dir argument
function parseConfigDirArg(): string | null {
  const configDirIndex = args.findIndex(
    (arg) => arg === '--config-dir' || arg === '-c',
  );
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${chalk.yellow('--config-dir requires a path argument')}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(
    (arg) => arg.startsWith('--config-dir=') || arg.startsWith('-c='),
  );
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(
        `  ${chalk.yellow('--config-dir requires a non-empty path')}`,
      );
      process.exit(1);
    }
    return value;
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const forceStatusline = args.includes('--force-statusline');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(
    `  ${chalk.yellow('Usage:')} npx maxsimcli [options]\n\n  ${chalk.yellow('Options:')}\n    ${chalk.cyan('-g, --global')}              Install globally (to config directory)\n    ${chalk.cyan('-l, --local')}               Install locally (to current directory)\n    ${chalk.cyan('--claude')}                  Install for Claude Code only\n    ${chalk.cyan('--opencode')}                Install for OpenCode only\n    ${chalk.cyan('--gemini')}                  Install for Gemini only\n    ${chalk.cyan('--codex')}                   Install for Codex only\n    ${chalk.cyan('--all')}                     Install for all runtimes\n    ${chalk.cyan('-u, --uninstall')}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${chalk.cyan('-c, --config-dir <path>')}   Specify custom config directory\n    ${chalk.cyan('-h, --help')}                Show this help message\n    ${chalk.cyan('--force-statusline')}        Replace existing statusline config\n\n  ${chalk.yellow('Examples:')}\n    ${chalk.dim('# Interactive install (prompts for runtime and location)')}\n    npx maxsimcli\n\n    ${chalk.dim('# Install for Claude Code globally')}\n    npx maxsimcli --claude --global\n\n    ${chalk.dim('# Install for Gemini globally')}\n    npx maxsimcli --gemini --global\n\n    ${chalk.dim('# Install for Codex globally')}\n    npx maxsimcli --codex --global\n\n    ${chalk.dim('# Install for all runtimes globally')}\n    npx maxsimcli --all --global\n\n    ${chalk.dim('# Install to custom config directory')}\n    npx maxsimcli --codex --global --config-dir ~/.codex-work\n\n    ${chalk.dim('# Install to current project only')}\n    npx maxsimcli --claude --local\n\n    ${chalk.dim('# Uninstall MAXSIM from Codex globally')}\n    npx maxsimcli --codex --global --uninstall\n\n  ${chalk.yellow('Notes:')}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_HOME environment variables.\n`,
  );
  process.exit(0);
}

// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map<RuntimeName, null | undefined | string>();

/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime: RuntimeName): null | undefined | string {
  if (attributionCache.has(runtime)) {
    return attributionCache.get(runtime);
  }

  let result: null | undefined | string;

  if (runtime === 'opencode') {
    const config = readSettings(
      path.join(getGlobalDir('opencode', null), 'opencode.json'),
    ) as Record<string, unknown>;
    result =
      (config as { disable_ai_attribution?: boolean }).disable_ai_attribution === true
        ? null
        : undefined;
  } else if (runtime === 'gemini') {
    const settings = readSettings(
      path.join(getGlobalDir('gemini', explicitConfigDir), 'settings.json'),
    ) as Record<string, unknown>;
    const attr = settings.attribution as { commit?: string } | undefined;
    if (!attr || attr.commit === undefined) {
      result = undefined;
    } else if (attr.commit === '') {
      result = null;
    } else {
      result = attr.commit;
    }
  } else if (runtime === 'claude') {
    const settings = readSettings(
      path.join(getGlobalDir('claude', explicitConfigDir), 'settings.json'),
    ) as Record<string, unknown>;
    const attr = settings.attribution as { commit?: string } | undefined;
    if (!attr || attr.commit === undefined) {
      result = undefined;
    } else if (attr.commit === '') {
      result = null;
    } else {
      result = attr.commit;
    }
  } else {
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
function copyFlattenedCommands(
  srcDir: string,
  destDir: string,
  prefix: string,
  pathPrefix: string,
  runtime: RuntimeName,
): void {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  if (fs.existsSync(destDir)) {
    for (const file of fs.readdirSync(destDir)) {
      if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(destDir, file));
      }
    }
  } else {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory()) {
      copyFlattenedCommands(
        srcPath,
        destDir,
        `${prefix}-${entry.name}`,
        pathPrefix,
        runtime,
      );
    } else if (entry.name.endsWith('.md')) {
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
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeToOpencodeFrontmatter(content);

      fs.writeFileSync(destPath, content);
    }
  }
}

function listCodexSkillNames(
  skillsDir: string,
  prefix: string = 'maxsim-',
): string[] {
  if (!fs.existsSync(skillsDir)) return [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .filter((entry) =>
      fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')),
    )
    .map((entry) => entry.name)
    .sort();
}

function copyCommandsAsCodexSkills(
  srcDir: string,
  skillsDir: string,
  prefix: string,
  pathPrefix: string,
  runtime: RuntimeName,
): void {
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

  function recurse(currentSrcDir: string, currentPrefix: string): void {
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
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeCommandToCodexSkill(content, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
function copyWithPathReplacement(
  srcDir: string,
  destDir: string,
  pathPrefix: string,
  runtime: RuntimeName,
  isCommand: boolean = false,
): void {
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
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, `./${dirName}/`);
      content = processAttribution(content, getCommitAttribution(runtime));

      if (isOpencode) {
        content = convertClaudeToOpencodeFrontmatter(content);
        fs.writeFileSync(destPath, content);
      } else if (runtime === 'gemini') {
        if (isCommand) {
          content = stripSubTags(content);
          const tomlContent = convertClaudeToGeminiToml(content);
          const tomlPath = destPath.replace(/\.md$/, '.toml');
          fs.writeFileSync(tomlPath, tomlContent);
        } else {
          fs.writeFileSync(destPath, content);
        }
      } else if (isCodex) {
        content = convertClaudeToCodexMarkdown(content);
        fs.writeFileSync(destPath, content);
      } else {
        fs.writeFileSync(destPath, content);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean up orphaned files from previous MAXSIM versions
 */
function cleanupOrphanedFiles(configDir: string): void {
  const orphanedFiles = [
    'hooks/maxsim-notify.sh',
    'hooks/statusline.js',
  ];

  for (const relPath of orphanedFiles) {
    const fullPath = path.join(configDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`  ${chalk.green('\u2713')} Removed orphaned ${relPath}`);
    }
  }
}

/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const orphanedHookPatterns = [
    'maxsim-notify.sh',
    'hooks/statusline.js',
    'maxsim-intel-index.js',
    'maxsim-intel-session.js',
    'maxsim-intel-prune.js',
  ];

  let cleanedHooks = false;

  interface HookEntry {
    hooks?: Array<{ command?: string }>;
  }

  const hooks = settings.hooks as Record<string, HookEntry[]> | undefined;
  if (hooks) {
    for (const eventType of Object.keys(hooks)) {
      const hookEntries = hooks[eventType];
      if (Array.isArray(hookEntries)) {
        const filtered = hookEntries.filter((entry: HookEntry) => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            const hasOrphaned = entry.hooks.some(
              (h) =>
                h.command &&
                orphanedHookPatterns.some((pattern) =>
                  h.command!.includes(pattern),
                ),
            );
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
    console.log(
      `  ${chalk.green('\u2713')} Removed orphaned hook registrations`,
    );
  }

  const statusLine = settings.statusLine as { command?: string } | undefined;
  if (
    statusLine &&
    statusLine.command &&
    statusLine.command.includes('statusline.js') &&
    !statusLine.command.includes('maxsim-statusline.js')
  ) {
    statusLine.command = statusLine.command.replace(
      /statusline\.js/,
      'maxsim-statusline.js',
    );
    console.log(
      `  ${chalk.green('\u2713')} Updated statusline path (statusline.js \u2192 maxsim-statusline.js)`,
    );
  }

  return settings;
}

/**
 * Uninstall MAXSIM from the specified directory for a specific runtime
 */
function uninstall(isGlobal: boolean, runtime: RuntimeName = 'claude'): void {
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
  if (runtime === 'opencode') runtimeLabel = 'OpenCode';
  if (runtime === 'gemini') runtimeLabel = 'Gemini';
  if (runtime === 'codex') runtimeLabel = 'Codex';

  console.log(
    `  Uninstalling MAXSIM from ${chalk.cyan(runtimeLabel)} at ${chalk.cyan(locationLabel)}\n`,
  );

  if (!fs.existsSync(targetDir)) {
    console.log(
      `  ${chalk.yellow('\u26a0')} Directory does not exist: ${locationLabel}`,
    );
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
      console.log(
        `  ${chalk.green('\u2713')} Removed MAXSIM commands from command/`,
      );
    }
  } else if (isCodex) {
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
        console.log(
          `  ${chalk.green('\u2713')} Removed ${skillCount} Codex skills`,
        );
      }
    }
  } else {
    const maxsimCommandsDir = path.join(targetDir, 'commands', 'maxsim');
    if (fs.existsSync(maxsimCommandsDir)) {
      fs.rmSync(maxsimCommandsDir, { recursive: true });
      removedCount++;
      console.log(`  ${chalk.green('\u2713')} Removed commands/maxsim/`);
    }
  }

  // 2. Remove maxsim directory
  const maxsimDir = path.join(targetDir, 'maxsim');
  if (fs.existsSync(maxsimDir)) {
    fs.rmSync(maxsimDir, { recursive: true });
    removedCount++;
    console.log(`  ${chalk.green('\u2713')} Removed maxsim/`);
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
      console.log(
        `  ${chalk.green('\u2713')} Removed ${agentCount} MAXSIM agents`,
      );
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
      console.log(
        `  ${chalk.green('\u2713')} Removed ${hookCount} MAXSIM hooks`,
      );
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
        console.log(
          `  ${chalk.green('\u2713')} Removed MAXSIM package.json`,
        );
      }
    } catch {
      // Ignore read errors
    }
  }

  // 6. Clean up settings.json
  const settingsPath = path.join(targetDir, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = readSettings(settingsPath);
    let settingsModified = false;

    interface StatusLine {
      command?: string;
      url?: string;
    }

    interface SettingsHookEntry {
      hooks?: Array<{ command?: string }>;
    }

    const statusLine = settings.statusLine as StatusLine | undefined;
    if (
      statusLine &&
      statusLine.command &&
      statusLine.command.includes('maxsim-statusline')
    ) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(
        `  ${chalk.green('\u2713')} Removed MAXSIM statusline from settings`,
      );
    }

    const settingsHooks = settings.hooks as
      | Record<string, SettingsHookEntry[]>
      | undefined;
    if (settingsHooks && settingsHooks.SessionStart) {
      const before = settingsHooks.SessionStart.length;
      settingsHooks.SessionStart = settingsHooks.SessionStart.filter(
        (entry: SettingsHookEntry) => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            const hasMaxsimHook = entry.hooks.some(
              (h) =>
                h.command &&
                (h.command.includes('maxsim-check-update') ||
                  h.command.includes('maxsim-statusline')),
            );
            return !hasMaxsimHook;
          }
          return true;
        },
      );
      if (settingsHooks.SessionStart.length < before) {
        settingsModified = true;
        console.log(
          `  ${chalk.green('\u2713')} Removed MAXSIM hooks from settings`,
        );
      }
      if (settingsHooks.SessionStart.length === 0) {
        delete settingsHooks.SessionStart;
      }
    }

    if (settingsHooks && settingsHooks.PostToolUse) {
      const before = settingsHooks.PostToolUse.length;
      settingsHooks.PostToolUse = settingsHooks.PostToolUse.filter(
        (entry: SettingsHookEntry) => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            const hasMaxsimHook = entry.hooks.some(
              (h) =>
                h.command &&
                h.command.includes('maxsim-context-monitor'),
            );
            return !hasMaxsimHook;
          }
          return true;
        },
      );
      if (settingsHooks.PostToolUse.length < before) {
        settingsModified = true;
        console.log(
          `  ${chalk.green('\u2713')} Removed context monitor hook from settings`,
        );
      }
      if (settingsHooks.PostToolUse.length === 0) {
        delete settingsHooks.PostToolUse;
      }
    }

    if (settingsHooks && Object.keys(settingsHooks).length === 0) {
      delete settings.hooks;
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
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
        const config = JSON.parse(
          fs.readFileSync(configPath, 'utf8'),
        ) as Record<string, unknown>;
        let modified = false;

        const permission = config.permission as
          | Record<string, Record<string, unknown>>
          | undefined;
        if (permission) {
          for (const permType of ['read', 'external_directory'] as const) {
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
          fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2) + '\n',
          );
          removedCount++;
          console.log(
            `  ${chalk.green('\u2713')} Removed MAXSIM permissions from opencode.json`,
          );
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }

  if (removedCount === 0) {
    console.log(
      `  ${chalk.yellow('\u26a0')} No MAXSIM files found to remove.`,
    );
  }

  console.log(`
  ${chalk.green('Done!')} MAXSIM has been uninstalled from ${runtimeLabel}.
  Your other files and settings have been preserved.
`);
}

/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 */
function parseJsonc(content: string): Record<string, unknown> {
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
    } else {
      if (char === '"') {
        inString = true;
        result += char;
        i++;
      } else if (char === '/' && next === '/') {
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
      } else if (char === '/' && next === '*') {
        i += 2;
        while (
          i < content.length - 1 &&
          !(content[i] === '*' && content[i + 1] === '/')
        ) {
          i++;
        }
        i += 2;
      } else {
        result += char;
        i++;
      }
    }
  }

  result = result.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(result) as Record<string, unknown>;
}

/**
 * Configure OpenCode permissions to allow reading MAXSIM reference docs
 */
function configureOpencodePermissions(isGlobal: boolean = true): void {
  const opencodeConfigDir = isGlobal
    ? getOpencodeGlobalDir()
    : path.join(process.cwd(), '.opencode');
  const configPath = path.join(opencodeConfigDir, 'opencode.json');

  fs.mkdirSync(opencodeConfigDir, { recursive: true });

  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = parseJsonc(content);
    } catch (e: unknown) {
      console.log(
        `  ${chalk.yellow('\u26a0')} Could not parse opencode.json - skipping permission config`,
      );
      console.log(
        `    ${chalk.dim(`Reason: ${(e as Error).message}`)}`,
      );
      console.log(
        `    ${chalk.dim('Your config was NOT modified. Fix the syntax manually if needed.')}`,
      );
      return;
    }
  }

  type PermissionConfig = Record<string, Record<string, string>>;
  if (!config.permission) {
    config.permission = {} as PermissionConfig;
  }
  const permission = config.permission as PermissionConfig;

  const defaultConfigDir = path.join(os.homedir(), '.config', 'opencode');
  const maxsimPath =
    opencodeConfigDir === defaultConfigDir
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

  if (
    !permission.external_directory ||
    typeof permission.external_directory !== 'object'
  ) {
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
  console.log(
    `  ${chalk.green('\u2713')} Configured read permission for MAXSIM docs`,
  );
}

/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath: string, description: string): boolean {
  if (!fs.existsSync(dirPath)) {
    console.error(
      `  ${chalk.yellow('\u2717')} Failed to install ${description}: directory not created`,
    );
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(
        `  ${chalk.yellow('\u2717')} Failed to install ${description}: directory is empty`,
      );
      return false;
    }
  } catch (e: unknown) {
    console.error(
      `  ${chalk.yellow('\u2717')} Failed to install ${description}: ${(e as Error).message}`,
    );
    return false;
  }
  return true;
}

/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath: string, description: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(
      `  ${chalk.yellow('\u2717')} Failed to install ${description}: file not created`,
    );
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
function fileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collect all files in dir with their hashes
 */
function generateManifest(
  dir: string,
  baseDir?: string,
): Record<string, string> {
  if (!baseDir) baseDir = dir;
  const manifest: Record<string, string> = {};
  if (!fs.existsSync(dir)) return manifest;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      Object.assign(manifest, generateManifest(fullPath, baseDir));
    } else {
      manifest[relPath] = fileHash(fullPath);
    }
  }
  return manifest;
}

interface Manifest {
  version: string;
  timestamp: string;
  files: Record<string, string>;
}

/**
 * Write file manifest after installation for future modification detection
 */
function writeManifest(
  configDir: string,
  runtime: RuntimeName = 'claude',
): Manifest {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const maxsimDir = path.join(configDir, 'maxsim');
  const commandsDir = path.join(configDir, 'commands', 'maxsim');
  const opencodeCommandDir = path.join(configDir, 'command');
  const codexSkillsDir = path.join(configDir, 'skills');
  const agentsDir = path.join(configDir, 'agents');
  const manifest: Manifest = {
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
        manifest.files['command/' + file] = fileHash(
          path.join(opencodeCommandDir, file),
        );
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
        manifest.files['agents/' + file] = fileHash(
          path.join(agentsDir, file),
        );
      }
    }
  }

  fs.writeFileSync(
    path.join(configDir, MANIFEST_NAME),
    JSON.stringify(manifest, null, 2),
  );
  return manifest;
}

interface BackupMeta {
  backed_up_at: string;
  from_version: string;
  files: string[];
}

/**
 * Detect user-modified MAXSIM files by comparing against install manifest.
 */
function saveLocalPatches(configDir: string): string[] {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  let manifest: Manifest;
  try {
    manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as Manifest;
  } catch {
    return [];
  }

  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const modified: string[] = [];

  for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
    const fullPath = path.join(configDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const currentHash = fileHash(fullPath);
    if (currentHash !== originalHash) {
      const backupPath = path.join(patchesDir, relPath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);
      modified.push(relPath);
    }
  }

  if (modified.length > 0) {
    const meta: BackupMeta = {
      backed_up_at: new Date().toISOString(),
      from_version: manifest.version,
      files: modified,
    };
    fs.writeFileSync(
      path.join(patchesDir, 'backup-meta.json'),
      JSON.stringify(meta, null, 2),
    );
    console.log(
      '  ' +
        chalk.yellow('i') +
        '  Found ' +
        modified.length +
        ' locally modified MAXSIM file(s) \u2014 backed up to ' +
        PATCHES_DIR_NAME +
        '/',
    );
    for (const f of modified) {
      console.log('     ' + chalk.dim(f));
    }
  }
  return modified;
}

/**
 * After install, report backed-up patches for user to reapply.
 */
function reportLocalPatches(
  configDir: string,
  runtime: RuntimeName = 'claude',
): string[] {
  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const metaPath = path.join(patchesDir, 'backup-meta.json');
  if (!fs.existsSync(metaPath)) return [];

  let meta: BackupMeta;
  try {
    meta = JSON.parse(
      fs.readFileSync(metaPath, 'utf8'),
    ) as BackupMeta;
  } catch {
    return [];
  }

  if (meta.files && meta.files.length > 0) {
    const reapplyCommand =
      runtime === 'opencode'
        ? '/maxsim-reapply-patches'
        : runtime === 'codex'
          ? '$maxsim-reapply-patches'
          : '/maxsim:reapply-patches';
    console.log('');
    console.log(
      '  ' +
        chalk.yellow('Local patches detected') +
        ' (from v' +
        meta.from_version +
        '):',
    );
    for (const f of meta.files) {
      console.log('     ' + chalk.cyan(f));
    }
    console.log('');
    console.log(
      '  Your modifications are saved in ' +
        chalk.cyan(PATCHES_DIR_NAME + '/'),
    );
    console.log(
      '  Run ' +
        chalk.cyan(reapplyCommand) +
        ' to merge them into the new version.',
    );
    console.log('  Or manually compare and merge the files.');
    console.log('');
  }
  return meta.files || [];
}

interface InstallResult {
  settingsPath: string | null;
  settings: Record<string, unknown> | null;
  statuslineCommand: string | null;
  runtime: RuntimeName;
}

function install(
  isGlobal: boolean,
  runtime: RuntimeName = 'claude',
): InstallResult {
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
  if (isOpencode) runtimeLabel = 'OpenCode';
  if (isGemini) runtimeLabel = 'Gemini';
  if (isCodex) runtimeLabel = 'Codex';

  console.log(
    `  Installing for ${chalk.cyan(runtimeLabel)} to ${chalk.cyan(locationLabel)}\n`,
  );

  const failures: string[] = [];

  // Save any locally modified MAXSIM files before they get wiped
  saveLocalPatches(targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(targetDir);

  // OpenCode uses command/ (flat), Codex uses skills/, Claude/Gemini use commands/maxsim/
  let spinner = ora({ text: 'Installing commands...', color: 'cyan' }).start();
  if (isOpencode) {
    const commandDir = path.join(targetDir, 'command');
    fs.mkdirSync(commandDir, { recursive: true });

    const maxsimSrc = path.join(src, 'commands', 'maxsim');
    copyFlattenedCommands(maxsimSrc, commandDir, 'maxsim', pathPrefix, runtime);
    if (verifyInstalled(commandDir, 'command/maxsim-*')) {
      const count = fs
        .readdirSync(commandDir)
        .filter((f) => f.startsWith('maxsim-')).length;
      spinner.succeed(chalk.green('✓') + ` Installed ${count} commands to command/`);
    } else {
      spinner.fail('Failed to install commands');
      failures.push('command/maxsim-*');
    }
  } else if (isCodex) {
    const skillsDir = path.join(targetDir, 'skills');
    const maxsimSrc = path.join(src, 'commands', 'maxsim');
    copyCommandsAsCodexSkills(maxsimSrc, skillsDir, 'maxsim', pathPrefix, runtime);
    const installedSkillNames = listCodexSkillNames(skillsDir);
    if (installedSkillNames.length > 0) {
      spinner.succeed(chalk.green('✓') + ` Installed ${installedSkillNames.length} skills to skills/`);
    } else {
      spinner.fail('Failed to install skills');
      failures.push('skills/maxsim-*');
    }
  } else {
    const commandsDir = path.join(targetDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });

    const maxsimSrc = path.join(src, 'commands', 'maxsim');
    const maxsimDest = path.join(commandsDir, 'maxsim');
    copyWithPathReplacement(maxsimSrc, maxsimDest, pathPrefix, runtime, true);
    if (verifyInstalled(maxsimDest, 'commands/maxsim')) {
      spinner.succeed(chalk.green('✓') + ' Installed commands/maxsim');
    } else {
      spinner.fail('Failed to install commands/maxsim');
      failures.push('commands/maxsim');
    }
  }

  // Copy maxsim directory content (workflows, templates, references) with path replacement
  // Templates package layout: workflows/, templates/, references/ at root
  // Install target: maxsim/workflows/, maxsim/templates/, maxsim/references/
  spinner = ora({ text: 'Installing workflows and templates...', color: 'cyan' }).start();
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
    spinner.succeed(chalk.green('✓') + ' Installed maxsim');
  } else {
    spinner.fail('Failed to install maxsim');
    failures.push('maxsim');
  }

  // Copy agents to agents directory
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    spinner = ora({ text: 'Installing agents...', color: 'cyan' }).start();
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
        let content = fs.readFileSync(
          path.join(agentsSrc, entry.name),
          'utf8',
        );
        const dirRegex = /~\/\.claude\//g;
        content = content.replace(dirRegex, pathPrefix);
        content = processAttribution(content, getCommitAttribution(runtime));
        if (isOpencode) {
          content = convertClaudeToOpencodeFrontmatter(content);
        } else if (isGemini) {
          content = convertClaudeToGeminiAgent(content);
        } else if (isCodex) {
          content = convertClaudeToCodexMarkdown(content);
        }
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      spinner.succeed(chalk.green('✓') + ' Installed agents');
    } else {
      spinner.fail('Failed to install agents');
      failures.push('agents');
    }
  }

  // Copy CHANGELOG.md (lives at repo root, one level above templates package)
  const changelogSrc = path.join(src, '..', 'CHANGELOG.md');
  const changelogDest = path.join(targetDir, 'maxsim', 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    spinner = ora({ text: 'Installing CHANGELOG.md...', color: 'cyan' }).start();
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      spinner.succeed(chalk.green('✓') + ' Installed CHANGELOG.md');
    } else {
      spinner.fail('Failed to install CHANGELOG.md');
      failures.push('CHANGELOG.md');
    }
  }

  // Copy CLAUDE.md (global MAXSIM context for Claude Code)
  const claudeMdSrc = path.join(src, 'CLAUDE.md');
  const claudeMdDest = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdSrc)) {
    spinner = ora({ text: 'Installing CLAUDE.md...', color: 'cyan' }).start();
    fs.copyFileSync(claudeMdSrc, claudeMdDest);
    if (verifyFileInstalled(claudeMdDest, 'CLAUDE.md')) {
      spinner.succeed(chalk.green('✓') + ' Installed CLAUDE.md');
    } else {
      spinner.fail('Failed to install CLAUDE.md');
      failures.push('CLAUDE.md');
    }
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'maxsim', 'VERSION');
  fs.writeFileSync(versionDest, pkg.version);
  if (verifyFileInstalled(versionDest, 'VERSION')) {
    console.log(
      `  ${chalk.green('\u2713')} Wrote VERSION (${pkg.version})`,
    );
  } else {
    failures.push('VERSION');
  }

  if (!isCodex) {
    // Write package.json to force CommonJS mode for MAXSIM scripts
    const pkgJsonDest = path.join(targetDir, 'package.json');
    fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');
    console.log(
      `  ${chalk.green('\u2713')} Wrote package.json (CommonJS mode)`,
    );

    // Copy hooks from bundled assets directory (copied from @maxsim/hooks/dist at build time)
    let hooksSrc: string | null = null;
    const bundledHooksDir = path.resolve(__dirname, 'assets', 'hooks');
    if (fs.existsSync(bundledHooksDir)) {
      hooksSrc = bundledHooksDir;
    } else {
      console.warn(`  ${chalk.yellow('!')} bundled hooks not found - hooks will not be installed`);
    }

    if (hooksSrc) {
      spinner = ora({ text: 'Installing hooks...', color: 'cyan' }).start();
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
        spinner.succeed(chalk.green('✓') + ' Installed hooks (bundled)');
      } else {
        spinner.fail('Failed to install hooks');
        failures.push('hooks');
      }
    }
  }

  if (failures.length > 0) {
    console.error(
      `\n  ${chalk.yellow('Installation incomplete!')} Failed: ${failures.join(', ')}`,
    );
    process.exit(1);
  }

  // Write file manifest for future modification detection
  writeManifest(targetDir, runtime);
  console.log(
    `  ${chalk.green('\u2713')} Wrote file manifest (${MANIFEST_NAME})`,
  );

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
  const settings = cleanupOrphanedHooks(readSettings(settingsPath));
  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'maxsim-statusline.js')
    : 'node ' + dirName + '/hooks/maxsim-statusline.js';
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'maxsim-check-update.js')
    : 'node ' + dirName + '/hooks/maxsim-check-update.js';
  const contextMonitorCommand = isGlobal
    ? buildHookCommand(targetDir, 'maxsim-context-monitor.js')
    : 'node ' + dirName + '/hooks/maxsim-context-monitor.js';

  // Enable experimental agents for Gemini CLI
  if (isGemini) {
    if (!settings.experimental) {
      settings.experimental = {};
    }
    const experimental = settings.experimental as Record<string, boolean>;
    if (!experimental.enableAgents) {
      experimental.enableAgents = true;
      console.log(
        `  ${chalk.green('\u2713')} Enabled experimental agents`,
      );
    }
  }

  interface InstallHookEntry {
    hooks?: Array<{ type: string; command: string }>;
  }

  // Configure SessionStart hook for update checking (skip for opencode)
  if (!isOpencode) {
    if (!settings.hooks) {
      settings.hooks = {};
    }
    const installHooks = settings.hooks as Record<string, InstallHookEntry[]>;
    if (!installHooks.SessionStart) {
      installHooks.SessionStart = [];
    }

    const hasMaxsimUpdateHook = installHooks.SessionStart.some(
      (entry: InstallHookEntry) =>
        entry.hooks &&
        entry.hooks.some(
          (h) => h.command && h.command.includes('maxsim-check-update'),
        ),
    );

    if (!hasMaxsimUpdateHook) {
      installHooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: updateCheckCommand,
          },
        ],
      });
      console.log(
        `  ${chalk.green('\u2713')} Configured update check hook`,
      );
    }

    // Configure PostToolUse hook for context window monitoring
    if (!installHooks.PostToolUse) {
      installHooks.PostToolUse = [];
    }

    const hasContextMonitorHook = installHooks.PostToolUse.some(
      (entry: InstallHookEntry) =>
        entry.hooks &&
        entry.hooks.some(
          (h) => h.command && h.command.includes('maxsim-context-monitor'),
        ),
    );

    if (!hasContextMonitorHook) {
      installHooks.PostToolUse.push({
        hooks: [
          {
            type: 'command',
            command: contextMonitorCommand,
          },
        ],
      });
      console.log(
        `  ${chalk.green('\u2713')} Configured context window monitor hook`,
      );
    }
  }

  return { settingsPath, settings, statuslineCommand, runtime };
}

/**
 * Apply statusline config, then print completion message
 */
function finishInstall(
  settingsPath: string | null,
  settings: Record<string, unknown> | null,
  statuslineCommand: string | null,
  shouldInstallStatusline: boolean,
  runtime: RuntimeName = 'claude',
  isGlobal: boolean = true,
): void {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';

  if (shouldInstallStatusline && !isOpencode && !isCodex) {
    settings!.statusLine = {
      type: 'command',
      command: statuslineCommand,
    };
    console.log(`  ${chalk.green('\u2713')} Configured statusline`);
  }

  if (!isCodex && settingsPath && settings) {
    writeSettings(settingsPath, settings);
  }

  if (isOpencode) {
    configureOpencodePermissions(isGlobal);
  }

  let program = 'Claude Code';
  if (runtime === 'opencode') program = 'OpenCode';
  if (runtime === 'gemini') program = 'Gemini';
  if (runtime === 'codex') program = 'Codex';

  let command = '/maxsim:help';
  if (runtime === 'opencode') command = '/maxsim-help';
  if (runtime === 'codex') command = '$maxsim-help';
  console.log(`
  ${chalk.green('Done!')} Launch ${program} and run ${chalk.cyan(command)}.

  ${chalk.cyan('Join the community:')} https://discord.gg/5JJgD5svVS
`);
}

/**
 * Handle statusline configuration — returns true if MAXSIM statusline should be installed
 */
async function handleStatusline(
  settings: Record<string, unknown>,
  isInteractive: boolean,
): Promise<boolean> {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) return true;
  if (forceStatusline) return true;

  if (!isInteractive) {
    console.log(
      chalk.yellow('⚠') + ' Skipping statusline (already configured)',
    );
    console.log(
      '  Use ' + chalk.cyan('--force-statusline') + ' to replace\n',
    );
    return false;
  }

  const statusLine = settings.statusLine as { command?: string; url?: string };
  const existingCmd = statusLine.command || statusLine.url || '(custom)';

  console.log();
  console.log(chalk.yellow('⚠  Existing statusline detected'));
  console.log();
  console.log('  Your current statusline:');
  console.log('    ' + chalk.dim(`command: ${existingCmd}`));
  console.log();
  console.log('  MAXSIM includes a statusline showing:');
  console.log('    • Model name');
  console.log('    • Current task (from todo list)');
  console.log('    • Context window usage (color-coded)');
  console.log();

  const shouldReplace = await confirm({
    message: 'Replace with MAXSIM statusline?',
    default: false,
  });

  return shouldReplace;
}

/**
 * Prompt for runtime selection (multi-select)
 */
async function promptRuntime(): Promise<RuntimeName[]> {
  const selected = await checkbox<RuntimeName>({
    message: 'Which runtime(s) would you like to install for?',
    choices: [
      { name: 'Claude Code  ' + chalk.dim('(~/.claude)'), value: 'claude', checked: true },
      { name: 'OpenCode     ' + chalk.dim('(~/.config/opencode)') + '  — open source, free models', value: 'opencode' },
      { name: 'Gemini       ' + chalk.dim('(~/.gemini)'), value: 'gemini' },
      { name: 'Codex        ' + chalk.dim('(~/.codex)'), value: 'codex' },
    ],
    instructions: chalk.dim('  (Space to select, Enter to confirm, A to toggle all)'),
    validate: (choices) => choices.length > 0 || 'Please select at least one runtime',
  });
  return selected;
}

/**
 * Prompt for install location
 */
async function promptLocation(runtimes: RuntimeName[]): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.log(
      chalk.yellow('Non-interactive terminal detected, defaulting to global install') + '\n',
    );
    return true; // isGlobal
  }

  const pathExamples = runtimes
    .map((r) => getGlobalDir(r, explicitConfigDir).replace(os.homedir(), '~'))
    .join(', ');

  const localExamples = runtimes.map((r) => `./${getDirName(r)}`).join(', ');

  const choice = await select<'global' | 'local'>({
    message: 'Where would you like to install?',
    choices: [
      {
        name: 'Global  ' + chalk.dim(`(${pathExamples})`) + '  — available in all projects',
        value: 'global',
      },
      {
        name: 'Local   ' + chalk.dim(`(${localExamples})`) + '  — this project only',
        value: 'local',
      },
    ],
  });

  return choice === 'global';
}

/**
 * Install MAXSIM for all selected runtimes
 */
async function installAllRuntimes(
  runtimes: RuntimeName[],
  isGlobal: boolean,
  isInteractive: boolean,
): Promise<void> {
  const results: InstallResult[] = [];

  for (const runtime of runtimes) {
    const result = install(isGlobal, runtime);
    results.push(result);
  }

  const statuslineRuntimes: RuntimeName[] = ['claude', 'gemini'];
  const primaryStatuslineResult = results.find((r) =>
    statuslineRuntimes.includes(r.runtime),
  );

  let shouldInstallStatusline = false;
  if (primaryStatuslineResult && primaryStatuslineResult.settings) {
    shouldInstallStatusline = await handleStatusline(
      primaryStatuslineResult.settings,
      isInteractive,
    );
  }

  for (const result of results) {
    const useStatusline =
      statuslineRuntimes.includes(result.runtime) && shouldInstallStatusline;
    finishInstall(
      result.settingsPath,
      result.settings,
      result.statuslineCommand,
      useStatusline,
      result.runtime,
      isGlobal,
    );
  }
}

// Main logic
(async () => {
  if (hasGlobal && hasLocal) {
    console.error(chalk.yellow('Cannot specify both --global and --local'));
    process.exit(1);
  } else if (explicitConfigDir && hasLocal) {
    console.error(chalk.yellow('Cannot use --config-dir with --local'));
    process.exit(1);
  } else if (hasUninstall) {
    if (!hasGlobal && !hasLocal) {
      console.error(chalk.yellow('--uninstall requires --global or --local'));
      process.exit(1);
    }
    const runtimes: RuntimeName[] =
      selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
    for (const runtime of runtimes) {
      uninstall(hasGlobal, runtime);
    }
  } else if (selectedRuntimes.length > 0) {
    if (!hasGlobal && !hasLocal) {
      const isGlobal = await promptLocation(selectedRuntimes);
      await installAllRuntimes(selectedRuntimes, isGlobal, true);
    } else {
      await installAllRuntimes(selectedRuntimes, hasGlobal, false);
    }
  } else if (hasGlobal || hasLocal) {
    await installAllRuntimes(['claude'], hasGlobal, false);
  } else {
    if (!process.stdin.isTTY) {
      console.log(
        chalk.yellow('Non-interactive terminal detected, defaulting to Claude Code global install') + '\n',
      );
      await installAllRuntimes(['claude'], true, false);
    } else {
      const runtimes = await promptRuntime();
      const isGlobal = await promptLocation(runtimes);
      await installAllRuntimes(runtimes, isGlobal, true);
    }
  }
})().catch((err: unknown) => {
  if (err instanceof Error && err.message.includes('User force closed')) {
    // User pressed Ctrl+C during an @inquirer/prompts prompt — exit cleanly
    console.log('\n' + chalk.yellow('Installation cancelled') + '\n');
    process.exit(0);
  }
  console.error(chalk.red('Unexpected error:'), err);
  process.exit(1);
});
