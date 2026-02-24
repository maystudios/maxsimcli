#!/usr/bin/env node
"use strict";
/**
 * Check for MAXSIM updates in background, write result to cache.
 * Called by SessionStart hook - runs once per session.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdate = checkForUpdate;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const node_child_process_1 = require("node:child_process");
const shared_1 = require("./shared");
function checkForUpdate(options) {
    const { homeDir, cwd } = options;
    const cacheDir = path.join(homeDir, shared_1.CLAUDE_DIR, 'cache');
    const cacheFile = path.join(cacheDir, 'maxsim-update-check.json');
    // VERSION file locations (check project first, then global)
    const projectVersionFile = path.join(cwd, shared_1.CLAUDE_DIR, 'maxsim', 'VERSION');
    const globalVersionFile = path.join(homeDir, shared_1.CLAUDE_DIR, 'maxsim', 'VERSION');
    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    // Run check in background (spawn background process, windowsHide prevents console flash)
    const child = (0, node_child_process_1.spawn)(process.execPath, ['-e', `
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
        stdio: 'ignore',
        windowsHide: true,
        detached: true,
    });
    child.unref();
}
// Standalone entry
if (require.main === module) {
    checkForUpdate({ homeDir: os.homedir(), cwd: process.cwd() });
}
//# sourceMappingURL=maxsim-check-update.js.map