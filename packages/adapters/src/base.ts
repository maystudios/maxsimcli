/**
 * @maxsim/adapters — Shared base utilities extracted from bin/install.js
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';

/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
export function expandTilde(filePath: string): string {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Extract YAML frontmatter and body from markdown content.
 * Returns null frontmatter if content doesn't start with ---.
 */
export function extractFrontmatterAndBody(
  content: string,
): { frontmatter: string | null; body: string } {
  if (!content.startsWith('---')) {
    return { frontmatter: null, body: content };
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }

  return {
    frontmatter: content.substring(3, endIndex).trim(),
    body: content.substring(endIndex + 3),
  };
}

/**
 * Process Co-Authored-By lines based on attribution setting.
 * @param content - File content to process
 * @param attribution - null=remove, undefined=keep default, string=replace
 */
export function processAttribution(
  content: string,
  attribution: null | undefined | string,
): string {
  if (attribution === null) {
    return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, '');
  }
  if (attribution === undefined) {
    return content;
  }
  const safeAttribution = attribution.replace(/\$/g, '$$$$');
  return content.replace(
    /Co-Authored-By:.*$/gim,
    `Co-Authored-By: ${safeAttribution}`,
  );
}

/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 */
export function buildHookCommand(configDir: string, hookName: string): string {
  const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Read and parse settings.json, returning empty object if it doesn't exist.
 */
export function readSettings(
  settingsPath: string,
): Record<string, unknown> {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting.
 */
export function writeSettings(
  settingsPath: string,
  settings: Record<string, unknown>,
): void {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
