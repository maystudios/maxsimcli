"use strict";
/**
 * Dashboard Launcher — Shared dashboard lifecycle utilities
 *
 * Used by both cli.ts (tool-router) and install.ts (npx entry point).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEALTH_TIMEOUT_MS = exports.PORT_RANGE_END = exports.DEFAULT_PORT = void 0;
exports.checkHealth = checkHealth;
exports.findRunningDashboard = findRunningDashboard;
exports.killProcessOnPort = killProcessOnPort;
exports.resolveDashboardServer = resolveDashboardServer;
exports.ensureNodePty = ensureNodePty;
exports.readDashboardConfig = readDashboardConfig;
exports.spawnDashboard = spawnDashboard;
exports.waitForDashboard = waitForDashboard;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const node_child_process_1 = require("node:child_process");
const node_module_1 = require("node:module");
const core_js_1 = require("./core.js");
// ─── Constants ──────────────────────────────────────────────────────────────
exports.DEFAULT_PORT = 3333;
exports.PORT_RANGE_END = 3343;
exports.HEALTH_TIMEOUT_MS = 1500;
// ─── Health check ───────────────────────────────────────────────────────────
/**
 * Check if a dashboard health endpoint is responding on the given port.
 */
async function checkHealth(port, timeoutMs = exports.HEALTH_TIMEOUT_MS) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`http://localhost:${port}/api/health`, {
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            return data.status === 'ok';
        }
        return false;
    }
    catch (e) {
        (0, core_js_1.debugLog)('health-check-failed', { port, error: (0, core_js_1.errorMsg)(e) });
        return false;
    }
}
/**
 * Scan the port range for a running dashboard instance.
 * Returns the port number if found, null otherwise.
 */
async function findRunningDashboard(timeoutMs = exports.HEALTH_TIMEOUT_MS) {
    for (let port = exports.DEFAULT_PORT; port <= exports.PORT_RANGE_END; port++) {
        const running = await checkHealth(port, timeoutMs);
        if (running)
            return port;
    }
    return null;
}
// ─── Process management ─────────────────────────────────────────────────────
/**
 * Kill processes listening on the given port. Cross-platform.
 */
function killProcessOnPort(port) {
    if (process.platform === 'win32') {
        try {
            const result = (0, node_child_process_1.execSync)(`netstat -ano | findstr :${port} | findstr LISTENING`, {
                encoding: 'utf-8',
            }).trim();
            const lines = result.split('\n');
            const pids = new Set();
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0')
                    pids.add(pid);
            }
            for (const pid of pids) {
                try {
                    (0, node_child_process_1.execSync)(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                }
                catch (e) {
                    (0, core_js_1.debugLog)('kill-process-on-port-taskkill-failed', { port, pid, error: (0, core_js_1.errorMsg)(e) });
                }
            }
        }
        catch (e) {
            (0, core_js_1.debugLog)('kill-process-on-port-netstat-failed', { port, platform: 'win32', error: (0, core_js_1.errorMsg)(e) });
        }
    }
    else {
        try {
            (0, node_child_process_1.execSync)(`lsof -i :${port} -t | xargs kill -SIGTERM 2>/dev/null`, { stdio: 'ignore' });
        }
        catch (e) {
            (0, core_js_1.debugLog)('kill-process-on-port-lsof-failed', { port, platform: process.platform, error: (0, core_js_1.errorMsg)(e) });
        }
    }
}
// ─── Server resolution ──────────────────────────────────────────────────────
/**
 * Resolve the dashboard server entry point path.
 * Tries: local project install, global install, @maxsim/dashboard package, monorepo walk.
 */
function resolveDashboardServer() {
    // Strategy 0: Installed standalone build (production path)
    const localDashboard = node_path_1.default.join(process.cwd(), '.claude', 'dashboard', 'server.js');
    if (node_fs_1.default.existsSync(localDashboard))
        return localDashboard;
    const globalDashboard = node_path_1.default.join(node_os_1.default.homedir(), '.claude', 'dashboard', 'server.js');
    if (node_fs_1.default.existsSync(globalDashboard))
        return globalDashboard;
    // Strategy 1: Resolve from @maxsim/dashboard package
    try {
        const require_ = (0, node_module_1.createRequire)(import.meta.url);
        const pkgPath = require_.resolve('@maxsim/dashboard/package.json');
        const pkgDir = node_path_1.default.dirname(pkgPath);
        const serverJs = node_path_1.default.join(pkgDir, 'server.js');
        if (node_fs_1.default.existsSync(serverJs))
            return serverJs;
        const serverTs = node_path_1.default.join(pkgDir, 'server.ts');
        if (node_fs_1.default.existsSync(serverTs))
            return serverTs;
    }
    catch (e) {
        (0, core_js_1.debugLog)('resolve-dashboard-strategy1-failed', { strategy: '@maxsim/dashboard package', error: (0, core_js_1.errorMsg)(e) });
    }
    // Strategy 2: Walk up from this file to find the monorepo root
    try {
        let dir = node_path_1.default.dirname(new URL(import.meta.url).pathname);
        // On Windows, remove leading / from /C:/...
        if (process.platform === 'win32' && dir.startsWith('/')) {
            dir = dir.slice(1);
        }
        for (let i = 0; i < 5; i++) {
            const candidate = node_path_1.default.join(dir, 'packages', 'dashboard', 'server.ts');
            if (node_fs_1.default.existsSync(candidate))
                return candidate;
            const candidateJs = node_path_1.default.join(dir, 'packages', 'dashboard', 'server.js');
            if (node_fs_1.default.existsSync(candidateJs))
                return candidateJs;
            dir = node_path_1.default.dirname(dir);
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('resolve-dashboard-strategy2-failed', { strategy: 'monorepo walk', error: (0, core_js_1.errorMsg)(e) });
    }
    return null;
}
// ─── node-pty installation ──────────────────────────────────────────────────
/**
 * Ensure node-pty is installed in the dashboard directory.
 * Returns true if node-pty is available after this call.
 */
function ensureNodePty(serverDir) {
    const ptyModulePath = node_path_1.default.join(serverDir, 'node_modules', 'node-pty');
    if (node_fs_1.default.existsSync(ptyModulePath))
        return true;
    // Ensure a package.json exists so npm install works
    const dashPkgPath = node_path_1.default.join(serverDir, 'package.json');
    if (!node_fs_1.default.existsSync(dashPkgPath)) {
        node_fs_1.default.writeFileSync(dashPkgPath, '{"private":true}\n');
    }
    try {
        (0, node_child_process_1.execSync)('npm install node-pty --save-optional --no-audit --no-fund --loglevel=error', {
            cwd: serverDir,
            stdio: 'inherit',
            timeout: 120_000,
        });
        return true;
    }
    catch (e) {
        (0, core_js_1.debugLog)('ensure-node-pty-install-failed', { serverDir, error: (0, core_js_1.errorMsg)(e) });
        return false;
    }
}
/**
 * Read dashboard.json config from the parent directory of the dashboard dir.
 */
function readDashboardConfig(serverPath) {
    const dashboardDir = node_path_1.default.dirname(serverPath);
    const dashboardConfigPath = node_path_1.default.join(node_path_1.default.dirname(dashboardDir), 'dashboard.json');
    let projectCwd = process.cwd();
    let networkMode = false;
    if (node_fs_1.default.existsSync(dashboardConfigPath)) {
        try {
            const config = JSON.parse(node_fs_1.default.readFileSync(dashboardConfigPath, 'utf8'));
            if (config.projectCwd)
                projectCwd = config.projectCwd;
            networkMode = config.networkMode ?? false;
        }
        catch (e) {
            (0, core_js_1.debugLog)('read-dashboard-config-failed', { path: dashboardConfigPath, error: (0, core_js_1.errorMsg)(e) });
        }
    }
    return { projectCwd, networkMode };
}
/**
 * Spawn the dashboard server as a detached background process.
 * Returns the child process PID, or null if spawn failed.
 */
function spawnDashboard(options) {
    const { serverPath, projectCwd, networkMode = false, nodeEnv = 'production' } = options;
    const serverDir = node_path_1.default.dirname(serverPath);
    const isTsFile = serverPath.endsWith('.ts');
    const runner = 'node';
    const runnerArgs = isTsFile ? ['--import', 'tsx', serverPath] : [serverPath];
    const child = (0, node_child_process_1.spawn)(runner, runnerArgs, {
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
async function waitForDashboard(pollIntervalMs = 500, pollTimeoutMs = 20000, healthTimeoutMs = 1000) {
    const deadline = Date.now() + pollTimeoutMs;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, pollIntervalMs));
        for (let p = exports.DEFAULT_PORT; p <= exports.PORT_RANGE_END; p++) {
            const running = await checkHealth(p, healthTimeoutMs);
            if (running)
                return `http://localhost:${p}`;
        }
    }
    return null;
}
//# sourceMappingURL=dashboard-launcher.js.map