import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import chalk from 'chalk';

import type { RuntimeName } from '../adapters/index.js';
import { readSettings, writeSettings } from '../adapters/index.js';
import { getDirName, getGlobalDir, getOpencodeGlobalDir } from './shared.js';

/**
 * Uninstall MAXSIM from the specified directory for a specific runtime
 */
export function uninstall(isGlobal: boolean, runtime: RuntimeName = 'claude', explicitConfigDir: string | null = null): void {
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
