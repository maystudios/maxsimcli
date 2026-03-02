import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import fsExtra from 'fs-extra';

import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';
import { select, confirm } from '@inquirer/prompts';
import minimist from 'minimist';

import type { RuntimeName } from '../adapters/index.js';
import {
  processAttribution,
} from '../adapters/index.js';
import {
  pkg,
  templatesRoot,
  getGlobalDir,
  getDirName,
  safeRmDir,
  copyDirRecursive,
  verifyInstalled,
  verifyFileInstalled,
} from './shared.js';
import type { InstallResult } from './shared.js';
import { getCommitAttribution } from './adapters.js';
import { runDashboardSubcommand, applyFirewallRule } from './dashboard.js';
import {
  cleanupOrphanedFiles,
  installHookFiles,
  configureSettingsHooks,
  handleStatusline,
  finishInstall,
} from './hooks.js';
import { writeManifest, MANIFEST_NAME } from './manifest.js';
import { saveLocalPatches, reportLocalPatches } from './patches.js';
import {
  copyWithPathReplacement,
} from './copy.js';
import { uninstall } from './uninstall.js';

// Parse args
const args = process.argv.slice(2);
const argv = minimist(args, {
  boolean: ['global', 'local', 'claude', 'uninstall', 'help', 'version', 'force-statusline', 'network'],
  string: ['config-dir'],
  alias: { g: 'global', l: 'local', u: 'uninstall', h: 'help', c: 'config-dir' },
});
const hasGlobal = !!argv['global'];
const hasLocal = !!argv['local'];
const hasUninstall = !!argv['uninstall'];

const banner =
  '\n' +
  chalk.cyan(
    figlet.textSync('MAXSIM', { font: 'ANSI Shadow' })
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n'),
  ) +
  '\n' +
  '\n' +
  '  MAXSIM ' +
  chalk.dim('v' + pkg.version) +
  '\n' +
  '  A meta-prompting, context engineering and spec-driven\n' +
  '  development system for Claude Code.\n';

// Parse --config-dir argument
const explicitConfigDir: string | null = argv['config-dir'] || null;
const hasHelp = !!argv['help'];
const hasVersion = !!argv['version'];
const forceStatusline = !!argv['force-statusline'];

// Show version if requested (before banner for clean output)
if (hasVersion) {
  console.log(pkg.version);
  process.exit(0);
}

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(
    `  ${chalk.yellow('Usage:')} npx maxsimcli [options]\n\n  ${chalk.yellow('Options:')}\n    ${chalk.cyan('-g, --global')}              Install globally (to ~/.claude/)\n    ${chalk.cyan('-l, --local')}               Install locally (to current directory)\n    ${chalk.cyan('--claude')}                  Install for Claude Code\n    ${chalk.cyan('-u, --uninstall')}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${chalk.cyan('-c, --config-dir <path>')}   Specify custom config directory\n    ${chalk.cyan('-h, --help')}                Show this help message\n    ${chalk.cyan('--force-statusline')}        Replace existing statusline config\n\n  ${chalk.yellow('Examples:')}\n    ${chalk.dim('# Interactive install (prompts for location)')}\n    npx maxsimcli\n\n    ${chalk.dim('# Install for Claude Code globally')}\n    npx maxsimcli --claude --global\n\n    ${chalk.dim('# Install to custom config directory')}\n    npx maxsimcli --global --config-dir ~/.claude-work\n\n    ${chalk.dim('# Install to current project only')}\n    npx maxsimcli --local\n\n    ${chalk.dim('# Uninstall MAXSIM globally')}\n    npx maxsimcli --global --uninstall\n`,
  );
  process.exit(0);
}

async function install(
  isGlobal: boolean,
  runtime: RuntimeName = 'claude',
): Promise<InstallResult> {
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

  console.log(
    `  Installing for ${chalk.cyan('Claude Code')} to ${chalk.cyan(locationLabel)}\n`,
  );

  const failures: string[] = [];

  // Save any locally modified MAXSIM files before they get wiped
  saveLocalPatches(targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(targetDir);

  // Claude uses commands/maxsim/
  let spinner = ora({ text: 'Installing commands...', color: 'cyan' }).start();
  const commandsDir = path.join(targetDir, 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  const maxsimSrc = path.join(src, 'commands', 'maxsim');
  const maxsimDest = path.join(commandsDir, 'maxsim');
  copyWithPathReplacement(maxsimSrc, maxsimDest, pathPrefix, runtime, explicitConfigDir);
  if (verifyInstalled(maxsimDest, 'commands/maxsim')) {
    spinner.succeed(chalk.green('\u2713') + ' Installed commands/maxsim');
  } else {
    spinner.fail('Failed to install commands/maxsim');
    failures.push('commands/maxsim');
  }

  // Copy maxsim directory content (workflows, templates, references) with path replacement
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
      copyWithPathReplacement(subdirSrc, subdirDest, pathPrefix, runtime, explicitConfigDir);
    }
  }
  if (verifyInstalled(skillDest, 'maxsim')) {
    spinner.succeed(chalk.green('\u2713') + ' Installed maxsim');
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
    for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('maxsim-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
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
        content = processAttribution(content, getCommitAttribution(runtime, explicitConfigDir));
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      spinner.succeed(chalk.green('\u2713') + ' Installed agents');
    } else {
      spinner.fail('Failed to install agents');
      failures.push('agents');
    }
  }

  // Copy skills to agents/skills/ directory
  const skillsSrc = path.join(src, 'skills');
  if (fs.existsSync(skillsSrc)) {
    spinner = ora({ text: 'Installing skills...', color: 'cyan' }).start();
    const skillsDest = path.join(targetDir, 'agents', 'skills');

    // Remove old MAXSIM built-in skills before copying new ones (preserve user custom skills)
    if (fs.existsSync(skillsDest)) {
      const builtInSkills = ['tdd', 'systematic-debugging', 'verification-before-completion'];
      for (const skill of builtInSkills) {
        const skillDir = path.join(skillsDest, skill);
        if (fs.existsSync(skillDir)) {
          fs.rmSync(skillDir, { recursive: true });
        }
      }
    }

    // Copy skills directory recursively
    fsExtra.copySync(skillsSrc, skillsDest, { overwrite: true });

    // Process path prefixes in skill files
    const skillEntries = fs.readdirSync(skillsDest, { withFileTypes: true });
    for (const entry of skillEntries) {
      if (entry.isDirectory()) {
        const skillMd = path.join(skillsDest, entry.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          let content = fs.readFileSync(skillMd, 'utf8');
          const dirRegex = /~\/\.claude\//g;
          content = content.replace(dirRegex, pathPrefix);
          content = processAttribution(content, getCommitAttribution(runtime, explicitConfigDir));
          fs.writeFileSync(skillMd, content);
        }
      }
    }

    const installedSkillDirs = fs.readdirSync(skillsDest, { withFileTypes: true })
      .filter(e => e.isDirectory()).length;
    if (installedSkillDirs > 0) {
      spinner.succeed(chalk.green('\u2713') + ` Installed ${installedSkillDirs} skills to agents/skills/`);
    } else {
      spinner.fail('Failed to install skills');
      failures.push('agents/skills');
    }
  }

  // Copy CHANGELOG.md
  const changelogSrc = path.join(src, '..', 'CHANGELOG.md');
  const changelogDest = path.join(targetDir, 'maxsim', 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    spinner = ora({ text: 'Installing CHANGELOG.md...', color: 'cyan' }).start();
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      spinner.succeed(chalk.green('\u2713') + ' Installed CHANGELOG.md');
    } else {
      spinner.fail('Failed to install CHANGELOG.md');
      failures.push('CHANGELOG.md');
    }
  }

  // Copy CLAUDE.md
  const claudeMdSrc = path.join(src, 'CLAUDE.md');
  const claudeMdDest = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdSrc)) {
    spinner = ora({ text: 'Installing CLAUDE.md...', color: 'cyan' }).start();
    fs.copyFileSync(claudeMdSrc, claudeMdDest);
    if (verifyFileInstalled(claudeMdDest, 'CLAUDE.md')) {
      spinner.succeed(chalk.green('\u2713') + ' Installed CLAUDE.md');
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

  // Write package.json to force CommonJS mode for MAXSIM scripts
  const pkgJsonDest = path.join(targetDir, 'package.json');
  fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');
  console.log(
    `  ${chalk.green('\u2713')} Wrote package.json (CommonJS mode)`,
  );

  // Install maxsim-tools.cjs binary
  const toolSrc = path.resolve(__dirname, 'cli.cjs');
  const binDir = path.join(targetDir, 'maxsim', 'bin');
  const toolDest = path.join(binDir, 'maxsim-tools.cjs');
  if (fs.existsSync(toolSrc)) {
    fs.mkdirSync(binDir, { recursive: true });
    fs.copyFileSync(toolSrc, toolDest);
    console.log(`  ${chalk.green('\u2713')} Installed maxsim-tools.cjs`);
  } else {
    console.warn(`  ${chalk.yellow('!')} cli.cjs not found at ${toolSrc} — maxsim-tools.cjs not installed`);
    failures.push('maxsim-tools.cjs');
  }

  // Install mcp-server.cjs
  const mcpSrc = path.resolve(__dirname, 'mcp-server.cjs');
  const mcpDest = path.join(binDir, 'mcp-server.cjs');
  if (fs.existsSync(mcpSrc)) {
    fs.mkdirSync(binDir, { recursive: true });
    fs.copyFileSync(mcpSrc, mcpDest);
    console.log(`  ${chalk.green('\u2713')} Installed mcp-server.cjs`);
  } else {
    console.warn(`  ${chalk.yellow('!')} mcp-server.cjs not found — MCP server not installed`);
  }

  // Install hooks
  installHookFiles(targetDir, runtime, isGlobal, failures);

  // Copy dashboard
  const dashboardSrc = path.resolve(__dirname, 'assets', 'dashboard');
  if (fs.existsSync(dashboardSrc)) {
    let networkMode = false;
    try {
      networkMode = await confirm({
        message: 'Allow dashboard to be accessible on your local network? (adds firewall rule, enables QR code)',
        default: false,
      });
    } catch {
      // Non-interactive terminal — default to false
    }

    spinner = ora({ text: 'Installing dashboard...', color: 'cyan' }).start();
    const dashboardDest = path.join(targetDir, 'dashboard');
    safeRmDir(dashboardDest);
    copyDirRecursive(dashboardSrc, dashboardDest);

    const dashboardConfigDest = path.join(targetDir, 'dashboard.json');
    const projectCwd = isGlobal ? targetDir : process.cwd();
    fs.writeFileSync(dashboardConfigDest, JSON.stringify({ projectCwd, networkMode }, null, 2) + '\n');

    if (fs.existsSync(path.join(dashboardDest, 'server.js'))) {
      spinner.succeed(chalk.green('\u2713') + ' Installed dashboard');
    } else {
      spinner.succeed(chalk.green('\u2713') + ' Installed dashboard (server.js not found in bundle)');
    }

    if (networkMode) {
      applyFirewallRule(3333);
    }
  }

  // Write .mcp.json for Claude Code MCP server auto-discovery
  const mcpJsonPath = isGlobal
    ? path.join(targetDir, '..', '.mcp.json')
    : path.join(process.cwd(), '.mcp.json');
  let mcpConfig: Record<string, unknown> = {};

  if (fs.existsSync(mcpJsonPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
    } catch {
      // Corrupted file — start fresh
    }
  }

  const mcpServers = (mcpConfig.mcpServers as Record<string, unknown>) ?? {};
  mcpServers['maxsim'] = {
    command: 'node',
    args: ['.claude/maxsim/bin/mcp-server.cjs'],
    env: {},
  };
  mcpConfig.mcpServers = mcpServers;

  fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf-8');
  console.log(`  ${chalk.green('\u2713')} Configured .mcp.json for MCP server auto-discovery`);

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

  // Configure statusline and hooks in settings.json
  const { settingsPath, settings, statuslineCommand } = configureSettingsHooks(targetDir, runtime, isGlobal);

  return { settingsPath, settings, statuslineCommand, runtime };
}

/**
 * Prompt for install location
 */
async function promptLocation(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.log(
      chalk.yellow('Non-interactive terminal detected, defaulting to global install') + '\n',
    );
    return true; // isGlobal
  }

  const globalPath = getGlobalDir('claude', explicitConfigDir).replace(os.homedir(), '~');

  const choice = await select<'global' | 'local'>({
    message: 'Where would you like to install?',
    choices: [
      {
        name: 'Global  ' + chalk.dim(`(${globalPath})`) + '  — available in all projects',
        value: 'global',
      },
      {
        name: 'Local   ' + chalk.dim('(./.claude)') + '  — this project only',
        value: 'local',
      },
    ],
  });

  return choice === 'global';
}

/**
 * Prompt whether to enable Agent Teams (experimental feature)
 */
async function promptAgentTeams(): Promise<boolean> {
  console.log();
  console.log(chalk.cyan('  Agent Teams') + chalk.dim(' (experimental)'));
  console.log(chalk.dim('  Coordinate multiple Claude Code instances working in parallel.'));
  console.log(chalk.dim('  Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS in settings.json.'));
  console.log();

  return confirm({
    message: 'Enable Agent Teams?',
    default: false,
  });
}

/**
 * Install MAXSIM for Claude Code
 */
async function installForClaude(
  isGlobal: boolean,
  isInteractive: boolean,
): Promise<void> {
  const result = await install(isGlobal, 'claude');

  let shouldInstallStatusline = false;
  if (result.settings) {
    shouldInstallStatusline = await handleStatusline(
      result.settings,
      isInteractive,
      forceStatusline,
    );
  }

  // Prompt for Agent Teams
  let enableAgentTeams = false;
  if (isInteractive) {
    enableAgentTeams = await promptAgentTeams();
  }

  // Apply Agent Teams setting
  if (enableAgentTeams && result.settings) {
    const env = (result.settings.env as Record<string, unknown>) ?? {};
    env['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'] = '1';
    result.settings.env = env;
  }

  finishInstall(
    result.settingsPath,
    result.settings,
    result.statuslineCommand,
    shouldInstallStatusline,
    result.runtime,
    isGlobal,
  );
}

// Main logic
// Subcommand routing — intercept before install flow
const subcommand = argv._[0];

(async () => {
  // Dashboard subcommand
  if (subcommand === 'dashboard') {
    await runDashboardSubcommand(argv);
    return;
  }

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
    uninstall(hasGlobal, 'claude', explicitConfigDir);
  } else if (hasGlobal || hasLocal) {
    await installForClaude(hasGlobal, false);
  } else {
    if (!process.stdin.isTTY) {
      console.log(
        chalk.yellow('Non-interactive terminal detected, defaulting to Claude Code global install') + '\n',
      );
      await installForClaude(true, false);
    } else {
      const isGlobal = await promptLocation();
      await installForClaude(isGlobal, true);
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
