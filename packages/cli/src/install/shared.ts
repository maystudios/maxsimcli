import * as fs from 'node:fs';
import * as path from 'node:path';
import fsExtra from 'fs-extra';

import type { RuntimeName, AdapterConfig } from '../adapters/index.js';
import {
  claudeAdapter,
  opencodeAdapter,
  geminiAdapter,
  codexAdapter,
} from '../adapters/index.js';

// Get version from package.json — read at runtime so semantic-release's version bump
// is reflected without needing to rebuild dist/install.cjs after the version bump.
export const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8')) as { version: string };

// Resolve template asset root — bundled into dist/assets/templates at publish time
export const templatesRoot = path.resolve(__dirname, 'assets', 'templates');

// Built-in skill names shipped with MAXSIM — used for cleanup during install/uninstall
export const builtInSkills = ['tdd', 'systematic-debugging', 'verification-before-completion', 'simplify', 'code-review', 'memory-management', 'using-maxsim'] as const;

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
export function getAdapter(runtime: RuntimeName): AdapterConfig {
  return adapterMap[runtime];
}

/**
 * Get the global config directory for a runtime, using adapter
 */
export function getGlobalDir(runtime: RuntimeName, explicitDir: string | null = null): string {
  return getAdapter(runtime).getGlobalDir(explicitDir);
}

/**
 * Get the config directory path relative to home for hook templating
 */
export function getConfigDirFromHome(runtime: RuntimeName, isGlobal: boolean): string {
  return getAdapter(runtime).getConfigDirFromHome(isGlobal);
}

/**
 * Get the local directory name for a runtime
 */
export function getDirName(runtime: RuntimeName): string {
  return getAdapter(runtime).dirName;
}

/**
 * Recursively remove a directory, handling Windows read-only file attributes.
 * fs-extra handles cross-platform edge cases (EPERM on Windows, symlinks, etc.)
 */
export function safeRmDir(dirPath: string): void {
  fsExtra.removeSync(dirPath);
}

/**
 * Recursively copy a directory (dereferences symlinks)
 */
export function copyDirRecursive(src: string, dest: string): void {
  fsExtra.copySync(src, dest, { dereference: true });
}

/**
 * Get the global config directory for OpenCode (for JSONC permissions)
 * OpenCode follows XDG Base Directory spec
 */
export function getOpencodeGlobalDir(): string {
  return opencodeAdapter.getGlobalDir();
}

/**
 * Verify a directory exists and contains files
 */
export function verifyInstalled(dirPath: string, description: string): boolean {
  if (!fs.existsSync(dirPath)) {
    console.error(
      `  \u2717 Failed to install ${description}: directory not created`,
    );
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(
        `  \u2717 Failed to install ${description}: directory is empty`,
      );
      return false;
    }
  } catch (e: unknown) {
    console.error(
      `  \u2717 Failed to install ${description}: ${(e as Error).message}`,
    );
    return false;
  }
  return true;
}

/**
 * Verify a file exists
 */
export function verifyFileInstalled(filePath: string, description: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(
      `  \u2717 Failed to install ${description}: file not created`,
    );
    return false;
  }
  return true;
}

export interface InstallResult {
  settingsPath: string | null;
  settings: Record<string, unknown> | null;
  statuslineCommand: string | null;
  runtime: RuntimeName;
}
