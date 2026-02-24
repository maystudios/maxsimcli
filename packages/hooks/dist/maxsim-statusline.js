#!/usr/bin/env node
"use strict";
/**
 * Claude Code Statusline - MAXSIM Edition
 * Shows: model | current task | directory | context usage
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
exports.formatStatusline = formatStatusline;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const shared_1 = require("./shared");
function formatStatusline(data) {
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;
    // Context window display (shows USED percentage scaled to 80% limit)
    let ctx = '';
    if (remaining != null) {
        const rem = Math.round(remaining);
        const rawUsed = Math.max(0, Math.min(100, 100 - rem));
        // Scale: 80% real usage = 100% displayed
        const used = Math.min(100, Math.round((rawUsed / 80) * 100));
        // Write context metrics to bridge file for the context-monitor PostToolUse hook.
        if (session) {
            try {
                const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
                const bridgeData = JSON.stringify({
                    session_id: session,
                    remaining_percentage: remaining,
                    used_pct: used,
                    timestamp: Math.floor(Date.now() / 1000),
                });
                fs.writeFileSync(bridgePath, bridgeData);
            }
            catch {
                // Silent fail -- bridge is best-effort, don't break statusline
            }
        }
        // Build progress bar (10 segments)
        const filled = Math.floor(used / 10);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
        // Color based on scaled usage
        if (used < 63) {
            ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
        }
        else if (used < 81) {
            ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
        }
        else if (used < 95) {
            ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
        }
        else {
            ctx = ` \x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
        }
    }
    // Current task from todos
    let task = '';
    const homeDir = os.homedir();
    const todosDir = path.join(homeDir, shared_1.CLAUDE_DIR, 'todos');
    if (session && fs.existsSync(todosDir)) {
        try {
            const files = fs.readdirSync(todosDir)
                .filter((f) => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
                .map((f) => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            if (files.length > 0) {
                try {
                    const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
                    const inProgress = todos.find((t) => t.status === 'in_progress');
                    if (inProgress)
                        task = inProgress.activeForm || '';
                }
                catch {
                    // ignore
                }
            }
        }
        catch {
            // Silently fail on file system errors - don't break statusline
        }
    }
    // MAXSIM update available?
    let maxsimUpdate = '';
    const cacheFile = path.join(homeDir, shared_1.CLAUDE_DIR, 'cache', 'maxsim-update-check.json');
    if (fs.existsSync(cacheFile)) {
        try {
            const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            if (cache.update_available) {
                maxsimUpdate = '\x1b[33m\u2B06 /maxsim:update\x1b[0m \u2502 ';
            }
        }
        catch {
            // ignore
        }
    }
    // Output
    const dirname = path.basename(dir);
    if (task) {
        return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
    }
    else {
        return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
    }
}
// Standalone entry
if (require.main === module) {
    (0, shared_1.readStdinJson)((data) => {
        process.stdout.write(formatStatusline(data));
    });
}
//# sourceMappingURL=maxsim-statusline.js.map