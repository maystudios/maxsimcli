/**
 * Backend Lifecycle — Start, stop, health check, discovery
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { BackendLockFile, BackendStatus } from './types.js';

const LOCK_FILE = '.planning/.backend-lock';

/**
 * Derive a deterministic port for a project path (range 3100-3199).
 * Simple hash mapped to 100-port range.
 */
function projectPort(projectCwd: string): number {
  let hash = 0;
  for (const ch of projectCwd) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  }
  return 3100 + (Math.abs(hash) % 100);
}

function lockFilePath(projectCwd: string): string {
  return path.join(projectCwd, LOCK_FILE);
}

function readLockFile(projectCwd: string): BackendLockFile | null {
  try {
    return JSON.parse(fs.readFileSync(lockFilePath(projectCwd), 'utf-8'));
  } catch {
    return null;
  }
}

function writeLockFile(projectCwd: string, data: BackendLockFile): void {
  const lockPath = lockFilePath(projectCwd);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify(data, null, 2), 'utf-8');
}

function removeLockFile(projectCwd: string): void {
  const lockPath = lockFilePath(projectCwd);
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // may not exist
  }
}

/**
 * Make an HTTP request and return the parsed JSON body.
 * Uses native fetch (Node 22+).
 */
async function httpJson(
  method: string,
  url: string,
  timeoutMs: number = 5000,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      method,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function startBackend(
  projectCwd: string,
  opts?: { port?: number; background?: boolean },
): Promise<BackendLockFile> {
  // 1. Check if already running
  const existing = await getBackendStatus(projectCwd);
  if (existing && existing.status === 'ok') {
    return readLockFile(projectCwd)!;
  }

  // 2. Choose port
  const port = opts?.port ?? projectPort(projectCwd);
  const background = opts?.background ?? true;

  if (background) {
    // Spawn detached child process running backend-server.cjs
    const serverScript = path.join(__dirname, 'backend-server.cjs');
    const child = spawn(process.execPath, [serverScript], {
      cwd: projectCwd,
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        MAXSIM_PORT: String(port),
        MAXSIM_PROJECT_CWD: projectCwd,
      },
      ...(process.platform === 'win32' ? { shell: true } : {}),
    });
    child.unref();

    const lockData: BackendLockFile = {
      pid: child.pid ?? 0,
      port,
      startedAt: Date.now(),
      cwd: projectCwd,
    };

    writeLockFile(projectCwd, lockData);
    return lockData;
  } else {
    // Foreground mode — import and start directly
    const { createBackendServer } = await import('./server.js');
    const server = createBackendServer({
      port,
      host: '127.0.0.1',
      projectCwd,
      enableTerminal: true,
      enableFileWatcher: true,
      enableMcp: true,
      logDir: path.join(projectCwd, '.planning', 'logs'),
    });

    await server.start();

    const lockData: BackendLockFile = {
      pid: process.pid,
      port: server.getPort(),
      startedAt: Date.now(),
      cwd: projectCwd,
    };

    writeLockFile(projectCwd, lockData);
    return lockData;
  }
}

export async function stopBackend(projectCwd: string): Promise<boolean> {
  const lock = readLockFile(projectCwd);
  if (!lock) return false;

  // Try graceful shutdown via HTTP
  const result = await httpJson('POST', `http://127.0.0.1:${lock.port}/api/shutdown`);
  if (result) {
    removeLockFile(projectCwd);
    return true;
  }

  // Fallback: kill by PID
  try {
    process.kill(lock.pid, 'SIGTERM');
  } catch {
    // Process may already be dead
  }

  removeLockFile(projectCwd);
  return true;
}

export async function getBackendStatus(projectCwd: string): Promise<BackendStatus | null> {
  const lock = readLockFile(projectCwd);
  if (!lock) return null;

  const data = await httpJson('GET', `http://127.0.0.1:${lock.port}/api/health`);
  if (!data || data.status !== 'ok') {
    // Stale lock file — clean up
    removeLockFile(projectCwd);
    return null;
  }

  return data as unknown as BackendStatus;
}

export async function isBackendRunning(projectCwd: string): Promise<boolean> {
  const status = await getBackendStatus(projectCwd);
  return status !== null && status.status === 'ok';
}

export function findBackendPort(projectCwd: string): number | null {
  const lock = readLockFile(projectCwd);
  return lock ? lock.port : null;
}
