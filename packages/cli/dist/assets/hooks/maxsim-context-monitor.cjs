#!/usr/bin/env node
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
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_path = require("node:path");
node_path = __toESM(node_path);

//#region src/hooks/shared.ts
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

//#endregion
//#region src/hooks/maxsim-context-monitor.ts
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
exports.CRITICAL_THRESHOLD = CRITICAL_THRESHOLD;
exports.DEBOUNCE_CALLS = DEBOUNCE_CALLS;
exports.STALE_SECONDS = STALE_SECONDS;
exports.WARNING_THRESHOLD = WARNING_THRESHOLD;
exports.processContextMonitor = processContextMonitor;
//# sourceMappingURL=maxsim-context-monitor.cjs.map