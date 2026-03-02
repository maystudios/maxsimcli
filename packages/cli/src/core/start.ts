/**
 * Start — Orchestrates Dashboard launch + browser open
 *
 * Provides a unified `maxsimcli start` entry point that:
 * 1. Checks for a running dashboard
 * 2. Starts the dashboard if needed
 * 3. Opens the browser
 * 4. Reports status
 */

import { exec } from 'node:child_process';

import {
  debugLog,
} from './core.js';

import {
  findRunningDashboard,
  resolveDashboardServer,
  readDashboardConfig,
  ensureNodePty,
  spawnDashboard,
  waitForDashboard,
  DEFAULT_PORT,
} from './dashboard-launcher.js';

import { cmdOk, cmdErr } from './types.js';
import type { CmdResult } from './types.js';

import path from 'node:path';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function openBrowser(url: string): void {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

  exec(cmd, (err) => {
    if (err) debugLog('open-browser-failed', err);
  });
}

// ─── Command ─────────────────────────────────────────────────────────────────

export async function cmdStart(
  cwd: string,
  options: { noBrowser?: boolean; networkMode?: boolean },
): Promise<CmdResult> {
  // 1. Check if dashboard is already running
  const existingPort = await findRunningDashboard();
  if (existingPort) {
    const url = `http://localhost:${existingPort}`;
    if (!options.noBrowser) openBrowser(url);
    return cmdOk({ started: true, url, already_running: true, port: existingPort }, url);
  }

  // 2. Resolve the dashboard server
  const serverPath = resolveDashboardServer();
  if (!serverPath) {
    return cmdErr('Dashboard server not found. Run `npx maxsimcli` to install first.');
  }

  const serverDir = path.dirname(serverPath);
  const dashConfig = readDashboardConfig(serverPath);

  // 3. Install node-pty if needed
  ensureNodePty(serverDir);

  // 4. Spawn the dashboard
  const pid = spawnDashboard({
    serverPath,
    projectCwd: dashConfig.projectCwd,
    networkMode: options.networkMode,
  });

  if (!pid) {
    return cmdErr('Failed to spawn dashboard process.');
  }

  // 5. Wait for dashboard to be ready
  const url = await waitForDashboard();
  if (url) {
    if (!options.noBrowser) openBrowser(url);
    return cmdOk({ started: true, url, already_running: false, pid }, url);
  } else {
    // Dashboard was spawned but health check didn't respond in time
    const fallbackUrl = `http://localhost:${DEFAULT_PORT}`;
    return cmdOk({
      started: true,
      url: fallbackUrl,
      already_running: false,
      pid,
      warning: 'Dashboard spawned but health check timed out. It may still be starting.',
    }, fallbackUrl);
  }
}
