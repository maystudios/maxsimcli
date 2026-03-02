import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import chalk from 'chalk';

import { readSettings, writeSettings } from '../adapters/index.js';
import { getDirName, getGlobalDir } from './shared.js';

/**
 * Uninstall MAXSIM from the specified directory
 */
export function uninstall(isGlobal: boolean, explicitConfigDir: string | null = null): void {
  const dirName = getDirName();

  const targetDir = isGlobal
    ? getGlobalDir(explicitConfigDir)
    : path.join(process.cwd(), dirName);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  console.log(
    `  Uninstalling MAXSIM from ${chalk.cyan('Claude Code')} at ${chalk.cyan(locationLabel)}\n`,
  );

  if (!fs.existsSync(targetDir)) {
    console.log(
      `  ${chalk.yellow('\u26a0')} Directory does not exist: ${locationLabel}`,
    );
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // 1. Remove MAXSIM commands (nested: commands/maxsim/)
  const maxsimCommandsDir = path.join(targetDir, 'commands', 'maxsim');
  if (fs.existsSync(maxsimCommandsDir)) {
    fs.rmSync(maxsimCommandsDir, { recursive: true });
    removedCount++;
    console.log(`  ${chalk.green('\u2713')} Removed commands/maxsim/`);
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

  if (removedCount === 0) {
    console.log(
      `  ${chalk.yellow('\u26a0')} No MAXSIM files found to remove.`,
    );
  }

  console.log(`
  ${chalk.green('Done!')} MAXSIM has been uninstalled from Claude Code.
  Your other files and settings have been preserved.
`);
}
