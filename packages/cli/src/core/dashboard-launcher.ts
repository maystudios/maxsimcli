/**
 * Dashboard Launcher — Shared dashboard lifecycle utilities
 *
 * Used by both cli.ts (tool-router) and install.ts (npx entry point).
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { debugLog, errorMsg } from './core.js';

// ─── Constants ──────────────────────────────────────────────────────────────

export const DEFAULT_PORT = 3333;
export const PORT_RANGE_END = 3343;
export const HEALTH_TIMEOUT_MS = 1500;

// ─── Health check ───────────────────────────────────────────────────────────

/**
 * Check if a dashboard health endpoint is responding on the given port.
 */
export async function checkHealth(port: number, timeoutMs: number = HEALTH_TIMEOUT_MS): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json() as { status?: string };
      return data.status === 'ok';
    }
    return false;
  } catch (e) {
    debugLog('health-check-failed', { port, error: errorMsg(e) });
    return false;
  }
}

/**
 * Scan the port range for a running dashboard instance.
 * Returns the port number if found, null otherwise.
 */
export async function findRunningDashboard(timeoutMs: number = HEALTH_TIMEOUT_MS): Promise<number | null> {
  for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
    const running = await checkHealth(port, timeoutMs);
    if (running) return port;
  }
  return null;
}

// ─── Process management ─────────────────────────────────────────────────────

/**
 * Kill processes listening on the given port. Cross-platform.
 */
export function killProcessOnPort(port: number): void {
  if (process.platform === 'win32') {
    try {
      const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: 'utf-8',
      }).trim();
      const lines = result.split('\n');
      const pids = new Set<string>();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch (e) {
          debugLog('kill-process-on-port-taskkill-failed', { port, pid, error: errorMsg(e) });
        }
      }
    } catch (e) {
      debugLog('kill-process-on-port-netstat-failed', { port, platform: 'win32', error: errorMsg(e) });
    }
  } else {
    try {
      execSync(`lsof -i :${port} -t | xargs kill -SIGTERM 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {
      debugLog('kill-process-on-port-lsof-failed', { port, platform: process.platform, error: errorMsg(e) });
    }
  }
}

// ─── Server resolution ──────────────────────────────────────────────────────

/**
 * Resolve the dashboard server entry point path.
 * Tries: local project install, global install, @maxsim/dashboard package, monorepo walk.
 */
export function resolveDashboardServer(): string | null {
  // Strategy 0: Installed standalone build (production path)
  const localDashboard = path.join(process.cwd(), '.claude', 'dashboard', 'server.js');
  if (fs.existsSync(localDashboard)) return localDashboard;
  const globalDashboard = path.join(os.homedir(), '.claude', 'dashboard', 'server.js');
  if (fs.existsSync(globalDashboard)) return globalDashboard;

  // Strategy 1: Resolve from @maxsim/dashboard package
  try {
    const require_ = createRequire(import.meta.url);
    const pkgPath = require_.resolve('@maxsim/dashboard/package.json');
    const pkgDir = path.dirname(pkgPath);

    const serverJs = path.join(pkgDir, 'server.js');
    if (fs.existsSync(serverJs)) return serverJs;

    const serverTs = path.join(pkgDir, 'server.ts');
    if (fs.existsSync(serverTs)) return serverTs;
  } catch (e) {
    debugLog('resolve-dashboard-strategy1-failed', { strategy: '@maxsim/dashboard package', error: errorMsg(e) });
  }

  // Strategy 2: Walk up from this file to find the monorepo root
  try {
    let dir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, remove leading / from /C:/...
    if (process.platform === 'win32' && dir.startsWith('/')) {
      dir = dir.slice(1);
    }
    for (let i = 0; i < 5; i++) {
      const candidate = path.join(dir, 'packages', 'dashboard', 'server.ts');
      if (fs.existsSync(candidate)) return candidate;
      const candidateJs = path.join(dir, 'packages', 'dashboard', 'server.js');
      if (fs.existsSync(candidateJs)) return candidateJs;
      dir = path.dirname(dir);
    }
  } catch (e) {
    debugLog('resolve-dashboard-strategy2-failed', { strategy: 'monorepo walk', error: errorMsg(e) });
  }

  return null;
}

// ─── node-pty installation ──────────────────────────────────────────────────

/**
 * Ensure node-pty is installed in the dashboard directory.
 * Returns true if node-pty is available after this call.
 */
export function ensureNodePty(serverDir: string): boolean {
  const ptyModulePath = path.join(serverDir, 'node_modules', 'node-pty');
  if (fs.existsSync(ptyModulePath)) return true;

  // Ensure a package.json exists so npm install works
  const dashPkgPath = path.join(serverDir, 'package.json');
  if (!fs.existsSync(dashPkgPath)) {
    fs.writeFileSync(dashPkgPath, '{"private":true}\n');
  }

  try {
    execSync('npm install node-pty --save-optional --no-audit --no-fund --loglevel=error', {
      cwd: serverDir,
      stdio: 'inherit',
      timeout: 120_000,
    });
    return true;
  } catch (e) {
    debugLog('ensure-node-pty-install-failed', { serverDir, error: errorMsg(e) });
    return false;
  }
}

// ─── Dashboard config ───────────────────────────────────────────────────────

export interface DashboardConfig {
  projectCwd: string;
  networkMode: boolean;
}

/**
 * Read dashboard.json config from the parent directory of the dashboard dir.
 */
export function readDashboardConfig(serverPath: string): DashboardConfig {
  const dashboardDir = path.dirname(serverPath);
  const dashboardConfigPath = path.join(path.dirname(dashboardDir), 'dashboard.json');
  let projectCwd = process.cwd();
  let networkMode = false;

  if (fs.existsSync(dashboardConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(dashboardConfigPath, 'utf8')) as {
        projectCwd?: string;
        networkMode?: boolean;
      };
      if (config.projectCwd) projectCwd = config.projectCwd;
      networkMode = config.networkMode ?? false;
    } catch (e) {
      debugLog('read-dashboard-config-failed', { path: dashboardConfigPath, error: errorMsg(e) });
    }
  }

  return { projectCwd, networkMode };
}

// ─── Spawn ──────────────────────────────────────────────────────────────────

export interface SpawnDashboardOptions {
  serverPath: string;
  projectCwd: string;
  networkMode?: boolean;
  nodeEnv?: string;
}

/**
 * Spawn the dashboard server as a detached background process.
 * Returns the child process PID, or null if spawn failed.
 */
export function spawnDashboard(options: SpawnDashboardOptions): number | null {
  const { serverPath, projectCwd, networkMode = false, nodeEnv = 'production' } = options;
  const serverDir = path.dirname(serverPath);

  const isTsFile = serverPath.endsWith('.ts');
  const runner = 'node';
  const runnerArgs: string[] = isTsFile ? ['--import', 'tsx', serverPath] : [serverPath];

  const child = spawn(runner, runnerArgs, {
    cwd: serverDir,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      MAXSIM_PROJECT_CWD: projectCwd,
      MAXSIM_NETWORK_MODE: networkMode ? '1' : '0',
      NODE_ENV: isTsFile ? 'development' : nodeEnv,
    },
    // On Windows, use shell to ensure detached works correctly
    ...(process.platform === 'win32' ? { shell: true } : {}),
  });

  child.unref();
  return child.pid ?? null;
}

// ─── Poll for readiness ─────────────────────────────────────────────────────

/**
 * Poll the port range until a dashboard health endpoint responds.
 * Returns the URL if found within the timeout, null otherwise.
 */
export async function waitForDashboard(
  pollIntervalMs: number = 500,
  pollTimeoutMs: number = 20000,
  healthTimeoutMs: number = 1000,
): Promise<string | null> {
  const deadline = Date.now() + pollTimeoutMs;

  while (Date.now() < deadline) {
    await new Promise<void>(r => setTimeout(r, pollIntervalMs));
    for (let p = DEFAULT_PORT; p <= PORT_RANGE_END; p++) {
      const running = await checkHealth(p, healthTimeoutMs);
      if (running) return `http://localhost:${p}`;
    }
  }
  return null;
}
