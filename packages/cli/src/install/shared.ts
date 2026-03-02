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
import type { Manifest } from './manifest.js';

// Get version from package.json — read at runtime so semantic-release's version bump
// is reflected without needing to rebuild dist/install.cjs after the version bump.
export const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8')) as { version: string };

// Resolve template asset root — bundled into dist/assets/templates at publish time
export const templatesRoot = path.resolve(__dirname, 'assets', 'templates');

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
 * Verify a directory exists and contains files.
 * If expectedFiles is provided, also checks that those specific files exist inside the directory.
 */
export function verifyInstalled(dirPath: string, description: string, expectedFiles?: string[]): boolean {
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
  if (expectedFiles && expectedFiles.length > 0) {
    const missing = expectedFiles.filter(f => !fs.existsSync(path.join(dirPath, f)));
    if (missing.length > 0) {
      console.error(
        `  \u2717 Failed to install ${description}: missing files: ${missing.join(', ')}`,
      );
      return false;
    }
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

/**
 * Verify that all major install components are present. Uses the manifest
 * (if available) to check individual files; otherwise falls back to
 * directory-level checks.
 *
 * Returns an object with `complete` (boolean) and `missing` (list of
 * component names that are absent or incomplete).
 */
export function verifyInstallComplete(
  configDir: string,
  runtime: RuntimeName,
  manifest: Manifest | null = null,
): { complete: boolean; missing: string[] } {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const missing: string[] = [];

  // If a manifest exists, verify every file in it is still present
  if (manifest && manifest.files) {
    for (const relPath of Object.keys(manifest.files)) {
      if (!fs.existsSync(path.join(configDir, relPath))) {
        missing.push(relPath);
      }
    }
    return { complete: missing.length === 0, missing };
  }

  // Fallback: directory-level checks for major components
  const components: Array<{ dir: string; label: string }> = [
    { dir: path.join(configDir, 'maxsim'), label: 'maxsim (workflows/templates)' },
    { dir: path.join(configDir, 'agents'), label: 'agents' },
  ];

  if (isOpencode) {
    components.push({ dir: path.join(configDir, 'command'), label: 'commands' });
  } else if (isCodex) {
    components.push({ dir: path.join(configDir, 'skills'), label: 'skills' });
  } else {
    components.push({ dir: path.join(configDir, 'commands', 'maxsim'), label: 'commands' });
  }

  if (!isCodex) {
    components.push({ dir: path.join(configDir, 'hooks'), label: 'hooks' });
  }

  for (const { dir, label } of components) {
    if (!fs.existsSync(dir)) {
      missing.push(label);
    } else {
      try {
        const entries = fs.readdirSync(dir);
        if (entries.length === 0) missing.push(label);
      } catch {
        missing.push(label);
      }
    }
  }

  return { complete: missing.length === 0, missing };
}
