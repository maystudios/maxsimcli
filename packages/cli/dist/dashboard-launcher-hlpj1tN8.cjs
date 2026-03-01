#!/usr/bin/env node
const require_install = require('./install.cjs');
let node_fs = require("node:fs");
node_fs = require_install.__toESM(node_fs);
let node_path = require("node:path");
node_path = require_install.__toESM(node_path);
let node_os = require("node:os");
node_os = require_install.__toESM(node_os);
let node_child_process = require("node:child_process");
let node_module = require("node:module");

//#region src/core/dashboard-launcher.ts
/**
* Dashboard Launcher — Shared dashboard lifecycle utilities
*
* Used by both cli.ts (tool-router) and install.ts (npx entry point).
*/
const DEFAULT_PORT = 3333;
const PORT_RANGE_END = 3343;
const HEALTH_TIMEOUT_MS = 1500;
/**
* Check if a dashboard health endpoint is responding on the given port.
*/
async function checkHealth(port, timeoutMs = HEALTH_TIMEOUT_MS) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(`http://localhost:${port}/api/health`, { signal: controller.signal });
		clearTimeout(timer);
		if (res.ok) return (await res.json()).status === "ok";
		return false;
	} catch {
		return false;
	}
}
/**
* Resolve the dashboard server entry point path.
* Tries: local project install, global install, @maxsim/dashboard package, monorepo walk.
*/
function resolveDashboardServer() {
	const localDashboard = node_path.default.join(process.cwd(), ".claude", "dashboard", "server.js");
	if (node_fs.default.existsSync(localDashboard)) return localDashboard;
	const globalDashboard = node_path.default.join(node_os.default.homedir(), ".claude", "dashboard", "server.js");
	if (node_fs.default.existsSync(globalDashboard)) return globalDashboard;
	try {
		const pkgPath = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href).resolve("@maxsim/dashboard/package.json");
		const pkgDir = node_path.default.dirname(pkgPath);
		const serverJs = node_path.default.join(pkgDir, "server.js");
		if (node_fs.default.existsSync(serverJs)) return serverJs;
		const serverTs = node_path.default.join(pkgDir, "server.ts");
		if (node_fs.default.existsSync(serverTs)) return serverTs;
	} catch {}
	try {
		let dir = node_path.default.dirname(new URL(require("url").pathToFileURL(__filename).href).pathname);
		if (process.platform === "win32" && dir.startsWith("/")) dir = dir.slice(1);
		for (let i = 0; i < 5; i++) {
			const candidate = node_path.default.join(dir, "packages", "dashboard", "server.ts");
			if (node_fs.default.existsSync(candidate)) return candidate;
			const candidateJs = node_path.default.join(dir, "packages", "dashboard", "server.js");
			if (node_fs.default.existsSync(candidateJs)) return candidateJs;
			dir = node_path.default.dirname(dir);
		}
	} catch {}
	return null;
}
/**
* Ensure node-pty is installed in the dashboard directory.
* Returns true if node-pty is available after this call.
*/
function ensureNodePty(serverDir) {
	const ptyModulePath = node_path.default.join(serverDir, "node_modules", "node-pty");
	if (node_fs.default.existsSync(ptyModulePath)) return true;
	const dashPkgPath = node_path.default.join(serverDir, "package.json");
	if (!node_fs.default.existsSync(dashPkgPath)) node_fs.default.writeFileSync(dashPkgPath, "{\"private\":true}\n");
	try {
		(0, node_child_process.execSync)("npm install node-pty --save-optional --no-audit --no-fund --loglevel=error", {
			cwd: serverDir,
			stdio: "inherit",
			timeout: 12e4
		});
		return true;
	} catch {
		return false;
	}
}
/**
* Read dashboard.json config from the parent directory of the dashboard dir.
*/
function readDashboardConfig(serverPath) {
	const dashboardDir = node_path.default.dirname(serverPath);
	const dashboardConfigPath = node_path.default.join(node_path.default.dirname(dashboardDir), "dashboard.json");
	let projectCwd = process.cwd();
	let networkMode = false;
	if (node_fs.default.existsSync(dashboardConfigPath)) try {
		const config = JSON.parse(node_fs.default.readFileSync(dashboardConfigPath, "utf8"));
		if (config.projectCwd) projectCwd = config.projectCwd;
		networkMode = config.networkMode ?? false;
	} catch {}
	return {
		projectCwd,
		networkMode
	};
}
/**
* Spawn the dashboard server as a detached background process.
* Returns the child process PID, or null if spawn failed.
*/
function spawnDashboard(options) {
	const { serverPath, projectCwd, networkMode = false, nodeEnv = "production" } = options;
	const serverDir = node_path.default.dirname(serverPath);
	const isTsFile = serverPath.endsWith(".ts");
	const child = (0, node_child_process.spawn)("node", isTsFile ? [
		"--import",
		"tsx",
		serverPath
	] : [serverPath], {
		cwd: serverDir,
		detached: true,
		stdio: "ignore",
		env: {
			...process.env,
			MAXSIM_PROJECT_CWD: projectCwd,
			MAXSIM_NETWORK_MODE: networkMode ? "1" : "0",
			NODE_ENV: isTsFile ? "development" : nodeEnv
		},
		...process.platform === "win32" ? { shell: true } : {}
	});
	child.unref();
	return child.pid ?? null;
}
/**
* Poll the port range until a dashboard health endpoint responds.
* Returns the URL if found within the timeout, null otherwise.
*/
async function waitForDashboard(pollIntervalMs = 500, pollTimeoutMs = 2e4, healthTimeoutMs = 1e3) {
	const deadline = Date.now() + pollTimeoutMs;
	while (Date.now() < deadline) {
		await new Promise((r) => setTimeout(r, pollIntervalMs));
		for (let p = DEFAULT_PORT; p <= PORT_RANGE_END; p++) if (await checkHealth(p, healthTimeoutMs)) return `http://localhost:${p}`;
	}
	return null;
}

//#endregion
exports.ensureNodePty = ensureNodePty;
exports.readDashboardConfig = readDashboardConfig;
exports.resolveDashboardServer = resolveDashboardServer;
exports.spawnDashboard = spawnDashboard;
exports.waitForDashboard = waitForDashboard;
//# sourceMappingURL=dashboard-launcher-hlpj1tN8.cjs.map