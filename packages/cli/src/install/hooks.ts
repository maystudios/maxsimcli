import * as fs from 'node:fs';

import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';

import type { RuntimeName } from '../adapters/index.js';
import {
  readSettings,
  writeSettings,
  buildHookCommand,
} from '../adapters/index.js';
import { getDirName, getConfigDirFromHome, verifyInstalled } from './shared.js';
import * as path from 'node:path';
import ora from 'ora';

/**
 * Clean up orphaned files from previous MAXSIM versions
 */
export function cleanupOrphanedFiles(configDir: string): void {
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
export function cleanupOrphanedHooks(
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
 * Install hook files and configure settings.json for a runtime
 */
export function installHookFiles(
  targetDir: string,
  runtime: RuntimeName,
  isGlobal: boolean,
  failures: string[],
): void {

  // Copy hooks from bundled assets directory
  let hooksSrc: string | null = null;
  const bundledHooksDir = path.resolve(__dirname, 'assets', 'hooks');
  if (fs.existsSync(bundledHooksDir)) {
    hooksSrc = bundledHooksDir;
  } else {
    console.warn(`  ${chalk.yellow('!')} bundled hooks not found - hooks will not be installed`);
  }

  if (hooksSrc) {
    const spinner = ora({ text: 'Installing hooks...', color: 'cyan' }).start();
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
      spinner.succeed(chalk.green('\u2713') + ' Installed hooks (bundled)');
    } else {
      spinner.fail('Failed to install hooks');
      failures.push('hooks');
    }
  }
}

/**
 * Configure hooks and statusline in settings.json
 */
export function configureSettingsHooks(
  targetDir: string,
  runtime: RuntimeName,
  isGlobal: boolean,
): { settingsPath: string; settings: Record<string, unknown>; statuslineCommand: string; updateCheckCommand: string; contextMonitorCommand: string } {
  const dirName = getDirName(runtime);

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

  interface InstallHookEntry {
    hooks?: Array<{ type: string; command: string }>;
  }

  // Configure SessionStart hook for update checking
  {
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

  return { settingsPath, settings, statuslineCommand, updateCheckCommand, contextMonitorCommand };
}

/**
 * Handle statusline configuration — returns true if MAXSIM statusline should be installed
 */
export async function handleStatusline(
  settings: Record<string, unknown>,
  isInteractive: boolean,
  forceStatusline: boolean,
): Promise<boolean> {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) return true;
  if (forceStatusline) return true;

  if (!isInteractive) {
    console.log(
      chalk.yellow('\u26a0') + ' Skipping statusline (already configured)',
    );
    console.log(
      '  Use ' + chalk.cyan('--force-statusline') + ' to replace\n',
    );
    return false;
  }

  const statusLine = settings.statusLine as { command?: string; url?: string };
  const existingCmd = statusLine.command || statusLine.url || '(custom)';

  console.log();
  console.log(chalk.yellow('\u26a0  Existing statusline detected'));
  console.log();
  console.log('  Your current statusline:');
  console.log('    ' + chalk.dim(`command: ${existingCmd}`));
  console.log();
  console.log('  MAXSIM includes a statusline showing:');
  console.log('    \u2022 Model name');
  console.log('    \u2022 Current task (from todo list)');
  console.log('    \u2022 Context window usage (color-coded)');
  console.log();

  const shouldReplace = await confirm({
    message: 'Replace with MAXSIM statusline?',
    default: false,
  });

  return shouldReplace;
}

/**
 * Apply statusline config, then print completion message
 */
export function finishInstall(
  settingsPath: string | null,
  settings: Record<string, unknown> | null,
  statuslineCommand: string | null,
  shouldInstallStatusline: boolean,
  _runtime: RuntimeName = 'claude',
  _isGlobal: boolean = true,
): void {
  if (shouldInstallStatusline) {
    settings!.statusLine = {
      type: 'command',
      command: statuslineCommand,
    };
    console.log(`  ${chalk.green('\u2713')} Configured statusline`);
  }

  if (settingsPath && settings) {
    writeSettings(settingsPath, settings);
  }

  console.log(`
  ${chalk.green('Done!')} Launch Claude Code and run ${chalk.cyan('/maxsim:help')}.

  ${chalk.cyan('Join the community:')} https://discord.gg/5JJgD5svVS
`);
}
