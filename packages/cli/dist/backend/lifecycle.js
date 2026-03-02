"use strict";
/**
 * Backend Lifecycle — Start, stop, health check, discovery
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackend = startBackend;
exports.stopBackend = stopBackend;
exports.getBackendStatus = getBackendStatus;
exports.isBackendRunning = isBackendRunning;
exports.findBackendPort = findBackendPort;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_child_process_1 = require("node:child_process");
const LOCK_FILE = '.planning/.backend-lock';
/**
 * Derive a deterministic port for a project path (range 3100-3199).
 * Simple hash mapped to 100-port range.
 */
function projectPort(projectCwd) {
    let hash = 0;
    for (const ch of projectCwd) {
        hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    }
    return 3100 + (Math.abs(hash) % 100);
}
function lockFilePath(projectCwd) {
    return node_path_1.default.join(projectCwd, LOCK_FILE);
}
function readLockFile(projectCwd) {
    try {
        return JSON.parse(node_fs_1.default.readFileSync(lockFilePath(projectCwd), 'utf-8'));
    }
    catch {
        return null;
    }
}
function writeLockFile(projectCwd, data) {
    const lockPath = lockFilePath(projectCwd);
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(lockPath), { recursive: true });
    node_fs_1.default.writeFileSync(lockPath, JSON.stringify(data, null, 2), 'utf-8');
}
function removeLockFile(projectCwd) {
    const lockPath = lockFilePath(projectCwd);
    try {
        node_fs_1.default.unlinkSync(lockPath);
    }
    catch {
        // may not exist
    }
}
/**
 * Make an HTTP request and return the parsed JSON body.
 * Uses native fetch (Node 22+).
 */
async function httpJson(method, url, timeoutMs = 5000) {
    try {
        const res = await fetch(url, {
            method,
            signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok)
            return null;
        return await res.json();
    }
    catch {
        return null;
    }
}
async function startBackend(projectCwd, opts) {
    // 1. Check if already running
    const existing = await getBackendStatus(projectCwd);
    if (existing && existing.status === 'ok') {
        return readLockFile(projectCwd);
    }
    // 2. Choose port
    const port = opts?.port ?? projectPort(projectCwd);
    const background = opts?.background ?? true;
    if (background) {
        // Spawn detached child process running backend-server.cjs
        const serverScript = node_path_1.default.join(__dirname, 'backend-server.cjs');
        const child = (0, node_child_process_1.spawn)(process.execPath, [serverScript], {
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
        const lockData = {
            pid: child.pid ?? 0,
            port,
            startedAt: Date.now(),
            cwd: projectCwd,
        };
        writeLockFile(projectCwd, lockData);
        return lockData;
    }
    else {
        // Foreground mode — import and start directly
        const { createBackendServer } = await import('./server.js');
        const server = createBackendServer({
            port,
            host: '127.0.0.1',
            projectCwd,
            enableTerminal: true,
            enableFileWatcher: true,
            enableMcp: true,
            logDir: node_path_1.default.join(projectCwd, '.planning', 'logs'),
        });
        await server.start();
        const lockData = {
            pid: process.pid,
            port: server.getPort(),
            startedAt: Date.now(),
            cwd: projectCwd,
        };
        writeLockFile(projectCwd, lockData);
        return lockData;
    }
}
async function stopBackend(projectCwd) {
    const lock = readLockFile(projectCwd);
    if (!lock)
        return false;
    // Try graceful shutdown via HTTP
    const result = await httpJson('POST', `http://127.0.0.1:${lock.port}/api/shutdown`);
    if (result) {
        removeLockFile(projectCwd);
        return true;
    }
    // Fallback: kill by PID
    try {
        process.kill(lock.pid, 'SIGTERM');
    }
    catch {
        // Process may already be dead
    }
    removeLockFile(projectCwd);
    return true;
}
async function getBackendStatus(projectCwd) {
    const lock = readLockFile(projectCwd);
    if (!lock)
        return null;
    const data = await httpJson('GET', `http://127.0.0.1:${lock.port}/api/health`);
    if (!data || data.status !== 'ok') {
        // Stale lock file — clean up
        removeLockFile(projectCwd);
        return null;
    }
    return data;
}
async function isBackendRunning(projectCwd) {
    const status = await getBackendStatus(projectCwd);
    return status !== null && status.status === 'ok';
}
function findBackendPort(projectCwd) {
    const lock = readLockFile(projectCwd);
    return lock ? lock.port : null;
}
//# sourceMappingURL=lifecycle.js.map