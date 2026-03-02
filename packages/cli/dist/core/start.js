"use strict";
/**
 * Start — Orchestrates Dashboard launch + browser open
 *
 * Provides a unified `maxsimcli start` entry point that:
 * 1. Checks for a running dashboard
 * 2. Starts the dashboard if needed
 * 3. Opens the browser
 * 4. Reports status
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdStart = cmdStart;
const node_child_process_1 = require("node:child_process");
const core_js_1 = require("./core.js");
const dashboard_launcher_js_1 = require("./dashboard-launcher.js");
const node_path_1 = __importDefault(require("node:path"));
// ─── Helpers ─────────────────────────────────────────────────────────────────
function openBrowser(url) {
    const cmd = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;
    (0, node_child_process_1.exec)(cmd, (err) => {
        if (err)
            (0, core_js_1.debugLog)('open-browser-failed', err);
    });
}
// ─── Command ─────────────────────────────────────────────────────────────────
async function cmdStart(cwd, options, raw) {
    // 1. Check if dashboard is already running
    const existingPort = await (0, dashboard_launcher_js_1.findRunningDashboard)();
    if (existingPort) {
        const url = `http://localhost:${existingPort}`;
        if (!options.noBrowser)
            openBrowser(url);
        (0, core_js_1.output)({ started: true, url, already_running: true, port: existingPort }, raw, url);
        return;
    }
    // 2. Resolve the dashboard server
    const serverPath = (0, dashboard_launcher_js_1.resolveDashboardServer)();
    if (!serverPath) {
        (0, core_js_1.error)('Dashboard server not found. Run `npx maxsimcli` to install first.');
    }
    const serverDir = node_path_1.default.dirname(serverPath);
    const dashConfig = (0, dashboard_launcher_js_1.readDashboardConfig)(serverPath);
    // 3. Install node-pty if needed
    (0, dashboard_launcher_js_1.ensureNodePty)(serverDir);
    // 4. Spawn the dashboard
    const pid = (0, dashboard_launcher_js_1.spawnDashboard)({
        serverPath,
        projectCwd: dashConfig.projectCwd,
        networkMode: options.networkMode,
    });
    if (!pid) {
        (0, core_js_1.error)('Failed to spawn dashboard process.');
    }
    // 5. Wait for dashboard to be ready
    const url = await (0, dashboard_launcher_js_1.waitForDashboard)();
    if (url) {
        if (!options.noBrowser)
            openBrowser(url);
        (0, core_js_1.output)({ started: true, url, already_running: false, pid }, raw, url);
    }
    else {
        // Dashboard was spawned but health check didn't respond in time
        const fallbackUrl = `http://localhost:${dashboard_launcher_js_1.DEFAULT_PORT}`;
        (0, core_js_1.output)({
            started: true,
            url: fallbackUrl,
            already_running: false,
            pid,
            warning: 'Dashboard spawned but health check timed out. It may still be starting.',
        }, raw, fallbackUrl);
    }
}
//# sourceMappingURL=start.js.map