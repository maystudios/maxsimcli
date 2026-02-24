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
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_child_process = require("node:child_process");

//#region src/shared.ts
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
exports.checkForUpdate = checkForUpdate;
//# sourceMappingURL=maxsim-check-update.cjs.map