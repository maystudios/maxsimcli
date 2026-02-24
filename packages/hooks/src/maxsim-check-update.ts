#!/usr/bin/env node
/**
 * Check for MAXSIM updates in background, write result to cache.
 * Called by SessionStart hook - runs once per session.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawn } from 'node:child_process';
import { CLAUDE_DIR } from './shared';

export interface UpdateCheckResult {
  update_available: boolean;
  installed: string;
  latest: string;
  checked: number;
}

export interface CheckForUpdateOptions {
  homeDir: string;
  cwd: string;
}

export function checkForUpdate(options: CheckForUpdateOptions): void {
  const { homeDir, cwd } = options;
  const cacheDir = path.join(homeDir, CLAUDE_DIR, 'cache');
  const cacheFile = path.join(cacheDir, 'maxsim-update-check.json');

  // VERSION file locations (check project first, then global)
  const projectVersionFile = path.join(cwd, CLAUDE_DIR, 'maxsim', 'VERSION');
  const globalVersionFile = path.join(homeDir, CLAUDE_DIR, 'maxsim', 'VERSION');

  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Run check in background (spawn background process, windowsHide prevents console flash)
  const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const projectVersionFile = ${JSON.stringify(projectVersionFile)};
  const globalVersionFile = ${JSON.stringify(globalVersionFile)};

  // Check project directory first (local install), then global
  let installed = '0.0.0';
  try {
    if (fs.existsSync(projectVersionFile)) {
      installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    } else if (fs.existsSync(globalVersionFile)) {
      installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    }
  } catch (e) {}

  let latest = null;
  try {
    latest = execSync('npm view maxsimcli version', { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
  } catch (e) {}

  const result = {
    update_available: latest && installed !== latest,
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000)
  };

  fs.writeFileSync(cacheFile, JSON.stringify(result));
`], {
    stdio: 'ignore',
    windowsHide: true,
    detached: true,
  });

  child.unref();
}

// Standalone entry
if (require.main === module) {
  checkForUpdate({ homeDir: os.homedir(), cwd: process.cwd() });
}
