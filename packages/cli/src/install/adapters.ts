import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import chalk from 'chalk';

import type { RuntimeName } from '../adapters/index.js';
import {
  readSettings,
} from '../adapters/index.js';
import { getGlobalDir, getOpencodeGlobalDir } from './shared.js';

// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map<RuntimeName, null | undefined | string>();

/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
export function getCommitAttribution(runtime: RuntimeName, explicitConfigDir: string | null): null | undefined | string {
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
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 */
export function parseJsonc(content: string): Record<string, unknown> {
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
export function configureOpencodePermissions(isGlobal: boolean = true): void {
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
