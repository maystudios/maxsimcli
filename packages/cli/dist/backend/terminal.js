"use strict";
/**
 * Backend Terminal — PTY management and scrollback session store
 *
 * Adapted from packages/dashboard/src/terminal/pty-manager.ts and session-store.ts.
 * Provides terminal support with graceful degradation when node-pty is unavailable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PtyManager = exports.SessionStore = void 0;
// ─── Session Store ──────────────────────────────────────────────────────────
const MAX_SCROLLBACK = 50_000;
class SessionStore {
    scrollback = [];
    append(data) {
        this.scrollback.push(data);
        if (this.scrollback.length > MAX_SCROLLBACK * 1.5) {
            this.scrollback = this.scrollback.slice(-MAX_SCROLLBACK);
        }
    }
    getAll() {
        return this.scrollback.join('');
    }
    clear() {
        this.scrollback = [];
    }
}
exports.SessionStore = SessionStore;
// Lazy-load node-pty — it's a native C++ addon that may not be available
let pty = null;
let ptyLoadError = null;
try {
    pty = require('node-pty');
}
catch (err) {
    ptyLoadError = err instanceof Error ? err.message : String(err);
}
const DISCONNECT_TIMEOUT_MS = 60_000;
const STATUS_INTERVAL_MS = 1_000;
const ACTIVE_THRESHOLD_MS = 2_000;
function ptyLog(level, ...args) {
    const ts = new Date().toISOString();
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    console.error(`[${ts}] [${level}] [pty-manager] ${msg}`);
}
class PtyManager {
    static instance = null;
    session = null;
    connectedClients = new Set();
    lastOutputTime = 0;
    statusInterval = null;
    static getInstance() {
        if (!PtyManager.instance) {
            PtyManager.instance = new PtyManager();
        }
        return PtyManager.instance;
    }
    spawn(opts) {
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
            env: process.env,
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
        proc.onData((data) => {
            this.lastOutputTime = Date.now();
            store.append(data);
            if (this.session?.pid === proc.pid) {
                this.broadcastToClients({ type: 'output', data });
            }
        });
        proc.onExit(({ exitCode }) => {
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
    write(data) {
        if (this.session) {
            this.session.process.write(data);
        }
    }
    resize(cols, rows) {
        if (this.session) {
            this.session.process.resize(cols, rows);
        }
    }
    kill() {
        if (this.session) {
            this.stopStatusBroadcast();
            try {
                this.session.process.kill();
            }
            catch {
                // process may already be dead
            }
            if (this.session.disconnectTimer) {
                clearTimeout(this.session.disconnectTimer);
            }
            this.session = null;
        }
    }
    getStatus() {
        if (!this.session)
            return null;
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
    addClient(ws) {
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
    removeClient(ws) {
        this.connectedClients.delete(ws);
        if (this.connectedClients.size === 0 && this.session) {
            this.session.disconnectTimer = setTimeout(() => {
                console.error('[pty] No clients connected for 60s, killing process');
                this.kill();
            }, DISCONNECT_TIMEOUT_MS);
        }
    }
    isAlive() {
        return this.session !== null;
    }
    isAvailable() {
        return pty !== null;
    }
    broadcastToClients(message) {
        const data = JSON.stringify(message);
        for (const client of this.connectedClients) {
            if (client.readyState === 1 /* WebSocket.OPEN */) {
                client.send(data);
            }
        }
    }
    startStatusBroadcast() {
        this.stopStatusBroadcast();
        this.statusInterval = setInterval(() => {
            const status = this.getStatus();
            if (status) {
                this.broadcastToClients({ type: 'status', ...status });
            }
        }, STATUS_INTERVAL_MS);
    }
    stopStatusBroadcast() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }
}
exports.PtyManager = PtyManager;
//# sourceMappingURL=terminal.js.map