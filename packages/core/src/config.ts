/**
 * Config — Planning config CRUD operations
 *
 * Ported from maxsim/bin/lib/config.cjs
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { output, error } from './core.js';
import type { PlanningConfig, WorkflowConfig } from './types.js';
import { PLANNING_CONFIG_DEFAULTS } from './types.js';

// ─── Config CRUD commands ───────────────────────────────────────────────────

export function cmdConfigEnsureSection(cwd: string, raw: boolean): void {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const planningDir = path.join(cwd, '.planning');

  try {
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }
  } catch (err: unknown) {
    error('Failed to create .planning directory: ' + (err as Error).message);
  }

  if (fs.existsSync(configPath)) {
    const result = { created: false, reason: 'already_exists' };
    output(result, raw, 'exists');
    return;
  }

  // Detect Brave Search API key availability
  const homedir = os.homedir();
  const braveKeyFile = path.join(homedir, '.maxsim', 'brave_api_key');
  const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs.existsSync(braveKeyFile));

  // Load user-level defaults from ~/.maxsim/defaults.json if available
  const globalDefaultsPath = path.join(homedir, '.maxsim', 'defaults.json');
  let userDefaults: Partial<PlanningConfig> = {};
  try {
    if (fs.existsSync(globalDefaultsPath)) {
      userDefaults = JSON.parse(fs.readFileSync(globalDefaultsPath, 'utf-8')) as Partial<PlanningConfig>;
    }
  } catch {
    // Ignore malformed global defaults, fall back to hardcoded
  }

  const hardcoded: PlanningConfig = {
    ...PLANNING_CONFIG_DEFAULTS,
    brave_search: hasBraveSearch,
  };

  const defaults: PlanningConfig = {
    ...hardcoded,
    ...userDefaults,
    workflow: {
      ...hardcoded.workflow,
      ...(userDefaults.workflow || {}),
    } as WorkflowConfig,
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf-8');
    const result = { created: true, path: '.planning/config.json' };
    output(result, raw, 'created');
  } catch (err: unknown) {
    error('Failed to create config.json: ' + (err as Error).message);
  }
}

export function cmdConfigSet(cwd: string, keyPath: string | undefined, value: string | undefined, raw: boolean): void {
  const configPath = path.join(cwd, '.planning', 'config.json');

  if (!keyPath) {
    error('Usage: config-set <key.path> <value>');
  }

  // Parse value (handle booleans and numbers)
  let parsedValue: string | boolean | number | undefined = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (value !== undefined && !isNaN(Number(value)) && value !== '') parsedValue = Number(value);

  // Load existing config or start with empty object
  let config: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    }
  } catch (err: unknown) {
    error('Failed to read config.json: ' + (err as Error).message);
  }

  // Set nested value using dot notation
  const keys = keyPath!.split('.');
  let current: Record<string, unknown> = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = parsedValue;

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    const result = { updated: true, key: keyPath, value: parsedValue };
    output(result, raw, `${keyPath}=${parsedValue}`);
  } catch (err: unknown) {
    error('Failed to write config.json: ' + (err as Error).message);
  }
}

export function cmdConfigGet(cwd: string, keyPath: string | undefined, raw: boolean): void {
  const configPath = path.join(cwd, '.planning', 'config.json');

  if (!keyPath) {
    error('Usage: config-get <key.path>');
  }

  let config: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    } else {
      error('No config.json found at ' + configPath);
    }
  } catch (err: unknown) {
    if ((err as Error).message.startsWith('No config.json')) throw err;
    error('Failed to read config.json: ' + (err as Error).message);
  }

  const keys = keyPath!.split('.');
  let current: unknown = config;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      error(`Key not found: ${keyPath}`);
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (current === undefined) {
    error(`Key not found: ${keyPath}`);
  }

  output(current, raw, String(current));
}
