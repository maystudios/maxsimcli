"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isElevated = isElevated;
exports.applyFirewallRule = applyFirewallRule;
exports.findMonorepoRoot = findMonorepoRoot;
exports.runDashboardSubcommand = runDashboardSubcommand;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const node_child_process_1 = require("node:child_process");
const chalk_1 = __importDefault(require("chalk"));
const shared_js_1 = require("./shared.js");
/** Check whether the current process is running with admin/root privileges. */
function isElevated() {
    if (process.platform === 'win32') {
        try {
            (0, node_child_process_1.execSync)('net session', { stdio: 'pipe' });
            return true;
        }
        catch {
            return false;
        }
    }
    // Linux / macOS: check if uid is 0
    return process.getuid?.() === 0;
}
/**
 * Add a firewall rule to allow inbound traffic on the given port.
 * Handles Windows (netsh), Linux (ufw / iptables), and macOS (no rule needed).
 */
function applyFirewallRule(port) {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            const cmd = `netsh advfirewall firewall add rule name="MAXSIM Dashboard" dir=in action=allow protocol=TCP localport=${port}`;
            if (isElevated()) {
                (0, node_child_process_1.execSync)(cmd, { stdio: 'pipe' });
                console.log(chalk_1.default.green('  \u2713 Windows Firewall rule added for port ' + port));
            }
            else {
                // Trigger UAC elevation via PowerShell — this opens the Windows UAC dialog
                console.log(chalk_1.default.gray('  Requesting administrator privileges for firewall rule...'));
                const psCmd = `Start-Process cmd -ArgumentList '/c ${cmd}' -Verb RunAs -Wait`;
                (0, node_child_process_1.execSync)(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'pipe' });
                console.log(chalk_1.default.green('  \u2713 Windows Firewall rule added for port ' + port));
            }
        }
        else if (platform === 'linux') {
            const sudoPrefix = isElevated() ? '' : 'sudo ';
            try {
                (0, node_child_process_1.execSync)(`${sudoPrefix}ufw allow ${port}/tcp`, { stdio: 'pipe' });
                console.log(chalk_1.default.green('  \u2713 UFW rule added for port ' + port));
            }
            catch {
                try {
                    (0, node_child_process_1.execSync)(`${sudoPrefix}iptables -A INPUT -p tcp --dport ${port} -j ACCEPT`, { stdio: 'pipe' });
                    console.log(chalk_1.default.green('  \u2713 iptables rule added for port ' + port));
                }
                catch {
                    console.log(chalk_1.default.yellow(`  \u26a0 Could not add firewall rule automatically. Run: sudo ufw allow ${port}/tcp`));
                }
            }
        }
        else if (platform === 'darwin') {
            // macOS does not block inbound connections by default — no rule needed
            console.log(chalk_1.default.gray('  macOS: No firewall rule needed (inbound connections are allowed by default)'));
        }
    }
    catch (err) {
        console.warn(chalk_1.default.yellow(`  \u26a0 Firewall rule failed: ${err.message}`));
        console.warn(chalk_1.default.gray(`  You may need to manually allow port ${port} through your firewall.`));
    }
}
/**
 * Walk up from cwd to find the MAXSIM monorepo root (has packages/dashboard/src/server.ts)
 */
function findMonorepoRoot(startDir) {
    let dir = startDir;
    for (let i = 0; i < 10; i++) {
        if (fs.existsSync(path.join(dir, 'packages', 'dashboard', 'src', 'server.ts'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return null;
}
/**
 * Handle the `dashboard` subcommand — refresh assets, install node-pty, launch server
 */
async function runDashboardSubcommand(argv) {
    const { spawn: spawnDash, execSync: execSyncDash } = await import('node:child_process');
    // Always refresh dashboard from bundled assets before launching.
    const dashboardAssetSrc = path.resolve(__dirname, 'assets', 'dashboard');
    const installDir = path.join(process.cwd(), '.claude');
    const installDashDir = path.join(installDir, 'dashboard');
    if (fs.existsSync(dashboardAssetSrc)) {
        // Preserve node_modules (contains native addons like node-pty) across refreshes
        const nodeModulesDir = path.join(installDashDir, 'node_modules');
        const nodeModulesTmp = path.join(installDir, '_dashboard_node_modules_tmp');
        const hadNodeModules = fs.existsSync(nodeModulesDir);
        if (hadNodeModules) {
            fs.renameSync(nodeModulesDir, nodeModulesTmp);
        }
        // Clean existing dashboard dir to prevent stale files from old installs
        (0, shared_js_1.safeRmDir)(installDashDir);
        fs.mkdirSync(installDashDir, { recursive: true });
        // Dashboard is now Vite+Express: server.js (self-contained) + client/ (static)
        (0, shared_js_1.copyDirRecursive)(dashboardAssetSrc, installDashDir);
        // Restore node_modules if it was preserved
        if (hadNodeModules && fs.existsSync(nodeModulesTmp)) {
            fs.renameSync(nodeModulesTmp, nodeModulesDir);
        }
        // Write/update dashboard.json
        const dashConfigPath = path.join(installDir, 'dashboard.json');
        if (!fs.existsSync(dashConfigPath)) {
            fs.writeFileSync(dashConfigPath, JSON.stringify({ projectCwd: process.cwd() }, null, 2) + '\n');
        }
    }
    // Resolve server path: local project first, then global
    const localDashboard = path.join(process.cwd(), '.claude', 'dashboard', 'server.js');
    const globalDashboard = path.join(os.homedir(), '.claude', 'dashboard', 'server.js');
    let serverPath = null;
    if (fs.existsSync(localDashboard)) {
        serverPath = localDashboard;
    }
    else if (fs.existsSync(globalDashboard)) {
        serverPath = globalDashboard;
    }
    if (!serverPath) {
        console.log(chalk_1.default.yellow('\n  Dashboard not available.\n'));
        console.log('  Install MAXSIM first: ' + chalk_1.default.cyan('npx maxsimcli@latest') + '\n');
        process.exit(0);
    }
    // --network flag overrides stored config (lets users enable network mode ad-hoc)
    const forceNetwork = !!argv['network'];
    // Read projectCwd from dashboard.json (one level up from dashboard/ dir)
    const dashboardDir = path.dirname(serverPath);
    const dashboardConfigPath = path.join(path.dirname(dashboardDir), 'dashboard.json');
    let projectCwd = process.cwd();
    let networkMode = forceNetwork;
    if (fs.existsSync(dashboardConfigPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(dashboardConfigPath, 'utf8'));
            if (config.projectCwd) {
                projectCwd = config.projectCwd;
            }
            if (!forceNetwork) {
                networkMode = config.networkMode ?? false;
            }
        }
        catch {
            // Use default cwd
        }
    }
    // node-pty is a native addon that cannot be bundled — auto-install if missing
    const dashDirForPty = path.dirname(serverPath);
    const ptyModulePath = path.join(dashDirForPty, 'node_modules', 'node-pty');
    if (!fs.existsSync(ptyModulePath)) {
        console.log(chalk_1.default.gray('  Installing node-pty for terminal support...'));
        try {
            // Ensure a package.json exists so npm install works in the dashboard dir
            const dashPkgPath = path.join(dashDirForPty, 'package.json');
            if (!fs.existsSync(dashPkgPath)) {
                fs.writeFileSync(dashPkgPath, '{"private":true}\n');
            }
            execSyncDash('npm install node-pty --save-optional --no-audit --no-fund --loglevel=error', {
                cwd: dashDirForPty,
                stdio: 'inherit',
                timeout: 120_000,
            });
        }
        catch {
            console.warn(chalk_1.default.yellow('  node-pty installation failed — terminal will be unavailable.'));
        }
    }
    console.log(chalk_1.default.blue('Starting dashboard...'));
    console.log(chalk_1.default.gray(`  Project: ${projectCwd}`));
    console.log(chalk_1.default.gray(`  Server:  ${serverPath}`));
    if (networkMode) {
        console.log(chalk_1.default.gray('  Network: enabled (local network access + QR code)'));
    }
    console.log('');
    // Use stdio: 'ignore' (fully detached) — a piped stderr causes the server to crash on
    // Windows when the read-end is closed after the parent reads the ready message (EPIPE).
    const child = spawnDash(process.execPath, [serverPath], {
        cwd: dashboardDir,
        detached: true,
        stdio: 'ignore',
        env: {
            ...process.env,
            MAXSIM_PROJECT_CWD: projectCwd,
            MAXSIM_NETWORK_MODE: networkMode ? '1' : '0',
            NODE_ENV: 'production',
        },
    });
    child.unref();
    // Poll /api/health until the server is ready (or 20s timeout).
    const POLL_INTERVAL_MS = 500;
    const POLL_TIMEOUT_MS = 20000;
    const HEALTH_TIMEOUT_MS = 1000;
    const DEFAULT_PORT = 3333;
    const PORT_RANGE_END = 3343;
    let foundUrl = null;
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        for (let p = DEFAULT_PORT; p <= PORT_RANGE_END; p++) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
                const res = await fetch(`http://localhost:${p}/api/health`, { signal: controller.signal });
                clearTimeout(timer);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ok') {
                        foundUrl = `http://localhost:${p}`;
                        break;
                    }
                }
            }
            catch { /* not ready yet */ }
        }
        if (foundUrl)
            break;
    }
    if (foundUrl) {
        console.log(chalk_1.default.green(`  Dashboard ready at ${foundUrl}`));
    }
    else {
        console.log(chalk_1.default.yellow('\n  Dashboard did not respond after 20s. The server may still be starting — check http://localhost:3333'));
    }
    process.exit(0);
}
//# sourceMappingURL=dashboard.js.map