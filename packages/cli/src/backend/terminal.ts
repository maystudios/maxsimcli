/**
 * Backend Terminal — PTY management and scrollback session store
 *
 * Adapted from packages/dashboard/src/terminal/pty-manager.ts and session-store.ts.
 * Provides terminal support with graceful degradation when node-pty is unavailable.
 */

import type { WebSocket } from 'ws';

// ─── Session Store ──────────────────────────────────────────────────────────

const MAX_SCROLLBACK = 50_000;

export class SessionStore {
  private scrollback: string[] = [];

  append(data: string): void {
    this.scrollback.push(data);
    if (this.scrollback.length > MAX_SCROLLBACK * 1.5) {
      this.scrollback = this.scrollback.slice(-MAX_SCROLLBACK);
    }
  }

  getAll(): string {
    return this.scrollback.join('');
  }

  clear(): void {
    this.scrollback = [];
  }
}

// ─── PTY Manager ────────────────────────────────────────────────────────────

type IPty = import('node-pty').IPty;

// Lazy-load node-pty — it's a native C++ addon that may not be available
let pty: typeof import('node-pty') | null = null;
let ptyLoadError: string | null = null;
try {
  pty = require('node-pty');
} catch (err) {
  ptyLoadError = err instanceof Error ? err.message : String(err);
}

interface PtySession {
  process: IPty;
  pid: number;
  startTime: number;
  cwd: string;
  skipPermissions: boolean;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  store: SessionStore;
}

interface PtyStatus {
  pid: number;
  uptime: number;
  cwd: string;
  memoryMB: number;
  isActive: boolean;
  skipPermissions: boolean;
  alive: boolean;
}

const DISCONNECT_TIMEOUT_MS = 60_000;
const STATUS_INTERVAL_MS = 1_000;
const ACTIVE_THRESHOLD_MS = 2_000;

function ptyLog(level: string, ...args: unknown[]): void {
  const ts = new Date().toISOString();
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  console.error(`[${ts}] [${level}] [pty-manager] ${msg}`);
}

export class PtyManager {
  private static instance: PtyManager | null = null;
  private session: PtySession | null = null;
  private connectedClients = new Set<WebSocket>();
  private lastOutputTime = 0;
  private statusInterval: ReturnType<typeof setInterval> | null = null;

  static getInstance(): PtyManager {
    if (!PtyManager.instance) {
      PtyManager.instance = new PtyManager();
    }
    return PtyManager.instance;
  }

  spawn(opts: {
    skipPermissions: boolean;
    cwd: string;
    cols?: number;
    rows?: number;
  }): void {
    if (!pty) {
      ptyLog('ERROR', `node-pty not available: ${ptyLoadError}`);
      this.broadcastToClients({
        type: 'output',
        data: `\r\n\x1b[31mTerminal unavailable: node-pty is not installed.\r\nError: ${ptyLoadError}\r\nRun: npm install node-pty\x1b[0m\r\n`,
      });
      return;
    }

    if (this.session) {
      ptyLog('INFO', 'Killing existing session before spawn');
      this.kill();
    }

    const isWin = process.platform === 'win32';
    const shell = isWin ? 'cmd.exe' : '/bin/sh';
    const claudeCmd = `claude${opts.skipPermissions ? ' --dangerously-skip-permissions' : ''}`;
    const shellArgs = isWin ? ['/c', claudeCmd] : ['-c', claudeCmd];

    ptyLog('INFO', `Spawning: shell=${shell}, args=${JSON.stringify(shellArgs)}, cwd=${opts.cwd}`);

    const proc = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: opts.cols ?? 120,
      rows: opts.rows ?? 30,
      cwd: opts.cwd,
      env: process.env as Record<string, string>,
    });

    ptyLog('INFO', `Process spawned with pid=${proc.pid}`);

    const store = new SessionStore();

    this.session = {
      process: proc,
      pid: proc.pid,
      startTime: Date.now(),
      cwd: opts.cwd,
      skipPermissions: opts.skipPermissions,
      disconnectTimer: null,
      store,
    };

    this.lastOutputTime = Date.now();

    proc.onData((data: string) => {
      this.lastOutputTime = Date.now();
      store.append(data);
      if (this.session?.pid === proc.pid) {
        this.broadcastToClients({ type: 'output', data });
      }
    });

    proc.onExit(({ exitCode }: { exitCode: number }) => {
      ptyLog('INFO', `Process exited with code=${exitCode}`);
      if (this.session?.pid !== proc.pid) {
        ptyLog('INFO', `Ignoring stale exit for old pid=${proc.pid}`);
        return;
      }
      this.broadcastToClients({ type: 'exit', code: exitCode });
      this.stopStatusBroadcast();
      this.session = null;
    });

    this.broadcastToClients({ type: 'started', pid: proc.pid });
    this.startStatusBroadcast();
  }

  write(data: string): void {
    if (this.session) {
      this.session.process.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (this.session) {
      this.session.process.resize(cols, rows);
    }
  }

  kill(): void {
    if (this.session) {
      this.stopStatusBroadcast();
      try {
        this.session.process.kill();
      } catch {
        // process may already be dead
      }
      if (this.session.disconnectTimer) {
        clearTimeout(this.session.disconnectTimer);
      }
      this.session = null;
    }
  }

  getStatus(): PtyStatus | null {
    if (!this.session) return null;
    return {
      pid: this.session.pid,
      uptime: Math.floor((Date.now() - this.session.startTime) / 1000),
      cwd: this.session.cwd,
      memoryMB: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
      isActive: Date.now() - this.lastOutputTime < ACTIVE_THRESHOLD_MS,
      skipPermissions: this.session.skipPermissions,
      alive: true,
    };
  }

  addClient(ws: WebSocket): void {
    this.connectedClients.add(ws);

    if (this.session?.disconnectTimer) {
      clearTimeout(this.session.disconnectTimer);
      this.session.disconnectTimer = null;
    }

    if (this.session) {
      const scrollback = this.session.store.getAll();
      if (scrollback) {
        ws.send(JSON.stringify({ type: 'scrollback', data: scrollback }));
      }
      const status = this.getStatus();
      if (status) {
        ws.send(JSON.stringify({ type: 'status', ...status }));
      }
    }
  }

  removeClient(ws: WebSocket): void {
    this.connectedClients.delete(ws);

    if (this.connectedClients.size === 0 && this.session) {
      this.session.disconnectTimer = setTimeout(() => {
        console.error('[pty] No clients connected for 60s, killing process');
        this.kill();
      }, DISCONNECT_TIMEOUT_MS);
    }
  }

  isAlive(): boolean {
    return this.session !== null;
  }

  isAvailable(): boolean {
    return pty !== null;
  }

  private broadcastToClients(message: Record<string, unknown>): void {
    const data = JSON.stringify(message);
    for (const client of this.connectedClients) {
      if ((client as { readyState: number }).readyState === 1 /* WebSocket.OPEN */) {
        client.send(data);
      }
    }
  }

  private startStatusBroadcast(): void {
    this.stopStatusBroadcast();
    this.statusInterval = setInterval(() => {
      const status = this.getStatus();
      if (status) {
        this.broadcastToClients({ type: 'status', ...status });
      }
    }, STATUS_INTERVAL_MS);
  }

  private stopStatusBroadcast(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }
}
