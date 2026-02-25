#!/usr/bin/env node
"use strict";
/**
 * Context Monitor - PostToolUse hook
 * Reads context metrics from the statusline bridge file and injects
 * warnings when context usage is high.
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
exports.DEBOUNCE_CALLS = exports.STALE_SECONDS = exports.CRITICAL_THRESHOLD = exports.WARNING_THRESHOLD = void 0;
exports.processContextMonitor = processContextMonitor;
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const shared_1 = require("./shared");
exports.WARNING_THRESHOLD = 35; // remaining_percentage <= 35%
exports.CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
exports.STALE_SECONDS = 60; // ignore metrics older than 60s
exports.DEBOUNCE_CALLS = 5; // min tool uses between warnings
function processContextMonitor(data) {
    const sessionId = data.session_id;
    if (!sessionId) {
        return null;
    }
    const tmpDir = os.tmpdir();
    const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);
    // If no metrics file, this is a subagent or fresh session -- exit silently
    if (!fs.existsSync(metricsPath)) {
        return null;
    }
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    // Ignore stale metrics
    if (metrics.timestamp && (now - metrics.timestamp) > exports.STALE_SECONDS) {
        return null;
    }
    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;
    // No warning needed
    if (remaining > exports.WARNING_THRESHOLD) {
        return null;
    }
    // Debounce: check if we warned recently
    const warnPath = path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;
    if (fs.existsSync(warnPath)) {
        try {
            warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
            firstWarn = false;
        }
        catch {
            // Corrupted file, reset
        }
    }
    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;
    const isCritical = remaining <= exports.CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';
    // Emit immediately on first warning, then debounce subsequent ones
    // Severity escalation (WARNING -> CRITICAL) bypasses debounce
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < exports.DEBOUNCE_CALLS && !severityEscalated) {
        // Update counter and exit without warning
        fs.writeFileSync(warnPath, JSON.stringify(warnData));
        return null;
    }
    // Reset debounce counter
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));
    // Build warning message
    let message;
    if (isCritical) {
        message = `CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
            'STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted. ' +
            'If using MAXSIM, run /maxsim:pause-work to save execution state.';
    }
    else {
        message = `CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
            'Begin wrapping up current task. Do not start new complex work. ' +
            'If using MAXSIM, consider /maxsim:pause-work to save state.';
    }
    return {
        hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext: message,
        },
    };
}
// Standalone entry
if (require.main === module) {
    (0, shared_1.readStdinJson)((data) => {
        const result = processContextMonitor(data);
        if (result) {
            process.stdout.write(JSON.stringify(result));
        }
    });
}
//# sourceMappingURL=maxsim-context-monitor.js.map