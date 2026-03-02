#!/usr/bin/env node
const require_cli = require('./cli.cjs');
let node_fs = require("node:fs");
node_fs = require_cli.__toESM(node_fs);
let node_path = require("node:path");
node_path = require_cli.__toESM(node_path);
let node_child_process = require("node:child_process");

//#region src/backend/lifecycle.ts
/**
* Backend Lifecycle — Start, stop, health check, discovery
*/
const LOCK_FILE = ".planning/.backend-lock";
/**
* Derive a deterministic port for a project path (range 3100-3199).
* Simple hash mapped to 100-port range.
*/
function projectPort(projectCwd) {
	let hash = 0;
	for (const ch of projectCwd) hash = (hash << 5) - hash + ch.charCodeAt(0) | 0;
	return 3100 + Math.abs(hash) % 100;
}
function lockFilePath(projectCwd) {
	return node_path.default.join(projectCwd, LOCK_FILE);
}
function readLockFile(projectCwd) {
	try {
		return JSON.parse(node_fs.default.readFileSync(lockFilePath(projectCwd), "utf-8"));
	} catch {
		return null;
	}
}
function writeLockFile(projectCwd, data) {
	const lockPath = lockFilePath(projectCwd);
	node_fs.default.mkdirSync(node_path.default.dirname(lockPath), { recursive: true });
	node_fs.default.writeFileSync(lockPath, JSON.stringify(data, null, 2), "utf-8");
}
function removeLockFile(projectCwd) {
	const lockPath = lockFilePath(projectCwd);
	try {
		node_fs.default.unlinkSync(lockPath);
	} catch {}
}
/**
* Make an HTTP request and return the parsed JSON body.
* Uses native fetch (Node 22+).
*/
async function httpJson(method, url, timeoutMs = 5e3) {
	try {
		const res = await fetch(url, {
			method,
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}
async function startBackend(projectCwd, opts) {
	const existing = await getBackendStatus(projectCwd);
	if (existing && existing.status === "ok") return readLockFile(projectCwd);
	const port = opts?.port ?? projectPort(projectCwd);
	if (opts?.background ?? true) {
		const serverScript = node_path.default.join(__dirname, "backend-server.cjs");
		const child = (0, node_child_process.spawn)(process.execPath, [serverScript], {
			cwd: projectCwd,
			detached: true,
			stdio: "ignore",
			env: {
				...process.env,
				MAXSIM_PORT: String(port),
				MAXSIM_PROJECT_CWD: projectCwd
			},
			...process.platform === "win32" ? { shell: true } : {}
		});
		child.unref();
		const lockData = {
			pid: child.pid ?? 0,
			port,
			startedAt: Date.now(),
			cwd: projectCwd
		};
		writeLockFile(projectCwd, lockData);
		return lockData;
	} else {
		const { createBackendServer } = await Promise.resolve().then(() => require("./server-BFjpYgFI.cjs"));
		const server = createBackendServer({
			port,
			host: "127.0.0.1",
			projectCwd,
			enableTerminal: true,
			enableFileWatcher: true,
			enableMcp: true,
			logDir: node_path.default.join(projectCwd, ".planning", "logs")
		});
		await server.start();
		const lockData = {
			pid: process.pid,
			port: server.getPort(),
			startedAt: Date.now(),
			cwd: projectCwd
		};
		writeLockFile(projectCwd, lockData);
		return lockData;
	}
}
async function stopBackend(projectCwd) {
	const lock = readLockFile(projectCwd);
	if (!lock) return false;
	if (await httpJson("POST", `http://127.0.0.1:${lock.port}/api/shutdown`)) {
		removeLockFile(projectCwd);
		return true;
	}
	try {
		process.kill(lock.pid, "SIGTERM");
	} catch {}
	removeLockFile(projectCwd);
	return true;
}
async function getBackendStatus(projectCwd) {
	const lock = readLockFile(projectCwd);
	if (!lock) return null;
	const data = await httpJson("GET", `http://127.0.0.1:${lock.port}/api/health`);
	if (!data || data.status !== "ok") {
		removeLockFile(projectCwd);
		return null;
	}
	return data;
}

//#endregion
exports.getBackendStatus = getBackendStatus;
exports.startBackend = startBackend;
exports.stopBackend = stopBackend;
//# sourceMappingURL=lifecycle-B6gdn2NV.cjs.map