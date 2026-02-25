Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_child_process = require("node:child_process");

//#region src/shared.ts
/**
* Shared utilities for MAXSIM hooks.
*/
/**
* Read all stdin as a string, then invoke callback with parsed JSON.
* Used by context-monitor and statusline hooks.
*/
function readStdinJson(callback) {
	let input = "";
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", (chunk) => input += chunk);
	process.stdin.on("end", () => {
		try {
			callback(JSON.parse(input));
		} catch {
			process.exit(0);
		}
	});
}
/** The '.claude' path segment -- template marker replaced during install. */
const CLAUDE_DIR = ".claude";

//#endregion
//#region src/maxsim-check-update.ts
/**
* Check for MAXSIM updates in background, write result to cache.
* Called by SessionStart hook - runs once per session.
*/
function checkForUpdate(options) {
	const { homeDir, cwd } = options;
	const cacheDir = node_path.join(homeDir, CLAUDE_DIR, "cache");
	const cacheFile = node_path.join(cacheDir, "maxsim-update-check.json");
	const projectVersionFile = node_path.join(cwd, CLAUDE_DIR, "maxsim", "VERSION");
	const globalVersionFile = node_path.join(homeDir, CLAUDE_DIR, "maxsim", "VERSION");
	if (!node_fs.existsSync(cacheDir)) node_fs.mkdirSync(cacheDir, { recursive: true });
	(0, node_child_process.spawn)(process.execPath, ["-e", `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const projectVersionFile = ${JSON.stringify(projectVersionFile)};
  const globalVersionFile = ${JSON.stringify(globalVersionFile)};

  // Check project directory first (local install), then global
  let installed = '0.0.0';
  try {
    if (fs.existsSync(projectVersionFile)) {
      installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    } else if (fs.existsSync(globalVersionFile)) {
      installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    }
  } catch (e) {}

  let latest = null;
  try {
    latest = execSync('npm view maxsimcli version', { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
  } catch (e) {}

  const result = {
    update_available: latest && installed !== latest,
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000)
  };

  fs.writeFileSync(cacheFile, JSON.stringify(result));
`], {
		stdio: "ignore",
		windowsHide: true,
		detached: true
	}).unref();
}
if (require.main === module) checkForUpdate({
	homeDir: node_os.homedir(),
	cwd: process.cwd()
});

//#endregion
//#region src/maxsim-context-monitor.ts
/**
* Context Monitor - PostToolUse hook
* Reads context metrics from the statusline bridge file and injects
* warnings when context usage is high.
*/
const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;
function processContextMonitor(data) {
	const sessionId = data.session_id;
	if (!sessionId) return null;
	const tmpDir = node_os.tmpdir();
	const metricsPath = node_path.join(tmpDir, `claude-ctx-${sessionId}.json`);
	if (!node_fs.existsSync(metricsPath)) return null;
	const metrics = JSON.parse(node_fs.readFileSync(metricsPath, "utf8"));
	const now = Math.floor(Date.now() / 1e3);
	if (metrics.timestamp && now - metrics.timestamp > STALE_SECONDS) return null;
	const remaining = metrics.remaining_percentage;
	const usedPct = metrics.used_pct;
	if (remaining > WARNING_THRESHOLD) return null;
	const warnPath = node_path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
	let warnData = {
		callsSinceWarn: 0,
		lastLevel: null
	};
	let firstWarn = true;
	if (node_fs.existsSync(warnPath)) try {
		warnData = JSON.parse(node_fs.readFileSync(warnPath, "utf8"));
		firstWarn = false;
	} catch {}
	warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;
	const isCritical = remaining <= CRITICAL_THRESHOLD;
	const currentLevel = isCritical ? "critical" : "warning";
	const severityEscalated = currentLevel === "critical" && warnData.lastLevel === "warning";
	if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
		node_fs.writeFileSync(warnPath, JSON.stringify(warnData));
		return null;
	}
	warnData.callsSinceWarn = 0;
	warnData.lastLevel = currentLevel;
	node_fs.writeFileSync(warnPath, JSON.stringify(warnData));
	let message;
	if (isCritical) message = `CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted. If using MAXSIM, run /maxsim:pause-work to save execution state.`;
	else message = `CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. Begin wrapping up current task. Do not start new complex work. If using MAXSIM, consider /maxsim:pause-work to save state.`;
	return { hookSpecificOutput: {
		hookEventName: "PostToolUse",
		additionalContext: message
	} };
}
if (require.main === module) readStdinJson((data) => {
	const result = processContextMonitor(data);
	if (result) process.stdout.write(JSON.stringify(result));
});

//#endregion
//#region src/maxsim-statusline.ts
/**
* Claude Code Statusline - MAXSIM Edition
* Shows: model | current task | directory | context usage
*/
function formatStatusline(data) {
	const model = data.model?.display_name || "Claude";
	const dir = data.workspace?.current_dir || process.cwd();
	const session = data.session_id || "";
	const remaining = data.context_window?.remaining_percentage;
	let ctx = "";
	if (remaining != null) {
		const rem = Math.round(remaining);
		const rawUsed = Math.max(0, Math.min(100, 100 - rem));
		const used = Math.min(100, Math.round(rawUsed / 80 * 100));
		if (session) try {
			const bridgePath = node_path.join(node_os.tmpdir(), `claude-ctx-${session}.json`);
			const bridgeData = JSON.stringify({
				session_id: session,
				remaining_percentage: remaining,
				used_pct: used,
				timestamp: Math.floor(Date.now() / 1e3)
			});
			node_fs.writeFileSync(bridgePath, bridgeData);
		} catch {}
		const filled = Math.floor(used / 10);
		const bar = "█".repeat(filled) + "░".repeat(10 - filled);
		if (used < 63) ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
		else if (used < 81) ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
		else if (used < 95) ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
		else ctx = ` \x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
	}
	let task = "";
	const homeDir = node_os.homedir();
	const todosDir = node_path.join(homeDir, CLAUDE_DIR, "todos");
	if (session && node_fs.existsSync(todosDir)) try {
		const files = node_fs.readdirSync(todosDir).filter((f) => f.startsWith(session) && f.includes("-agent-") && f.endsWith(".json")).map((f) => ({
			name: f,
			mtime: node_fs.statSync(node_path.join(todosDir, f)).mtime
		})).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
		if (files.length > 0) try {
			const inProgress = JSON.parse(node_fs.readFileSync(node_path.join(todosDir, files[0].name), "utf8")).find((t) => t.status === "in_progress");
			if (inProgress) task = inProgress.activeForm || "";
		} catch {}
	} catch {}
	let maxsimUpdate = "";
	const cacheFile = node_path.join(homeDir, CLAUDE_DIR, "cache", "maxsim-update-check.json");
	if (node_fs.existsSync(cacheFile)) try {
		if (JSON.parse(node_fs.readFileSync(cacheFile, "utf8")).update_available) maxsimUpdate = "\x1B[33m⬆ /maxsim:update\x1B[0m │ ";
	} catch {}
	const dirname = node_path.basename(dir);
	if (task) return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
	else return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
}
if (require.main === module) readStdinJson((data) => {
	process.stdout.write(formatStatusline(data));
});

//#endregion
exports.CRITICAL_THRESHOLD = CRITICAL_THRESHOLD;
exports.DEBOUNCE_CALLS = DEBOUNCE_CALLS;
exports.STALE_SECONDS = STALE_SECONDS;
exports.WARNING_THRESHOLD = WARNING_THRESHOLD;
exports.checkForUpdate = checkForUpdate;
exports.formatStatusline = formatStatusline;
exports.processContextMonitor = processContextMonitor;
//# sourceMappingURL=index.cjs.map