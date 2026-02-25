#!/usr/bin/env node
/**
 * Context Monitor - PostToolUse hook
 * Reads context metrics from the statusline bridge file and injects
 * warnings when context usage is high.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { readStdinJson, CLAUDE_DIR } from './shared';

export const WARNING_THRESHOLD = 35;  // remaining_percentage <= 35%
export const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
export const STALE_SECONDS = 60;      // ignore metrics older than 60s
export const DEBOUNCE_CALLS = 5;      // min tool uses between warnings

export interface ContextMonitorInput {
  session_id?: string;
}

export interface ContextMonitorOutput {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  };
}

interface BridgeMetrics {
  session_id: string;
  remaining_percentage: number;
  used_pct: number;
  timestamp: number;
}

interface WarnState {
  callsSinceWarn: number;
  lastLevel: string | null;
}

export function processContextMonitor(data: ContextMonitorInput): ContextMonitorOutput | null {
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

  const metrics: BridgeMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);

  // Ignore stale metrics
  if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
    return null;
  }

  const remaining = metrics.remaining_percentage;
  const usedPct = metrics.used_pct;

  // No warning needed
  if (remaining > WARNING_THRESHOLD) {
    return null;
  }

  // Debounce: check if we warned recently
  const warnPath = path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
  let warnData: WarnState = { callsSinceWarn: 0, lastLevel: null };
  let firstWarn = true;

  if (fs.existsSync(warnPath)) {
    try {
      warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
      firstWarn = false;
    } catch {
      // Corrupted file, reset
    }
  }

  warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

  const isCritical = remaining <= CRITICAL_THRESHOLD;
  const currentLevel = isCritical ? 'critical' : 'warning';

  // Emit immediately on first warning, then debounce subsequent ones
  // Severity escalation (WARNING -> CRITICAL) bypasses debounce
  const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
  if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
    // Update counter and exit without warning
    fs.writeFileSync(warnPath, JSON.stringify(warnData));
    return null;
  }

  // Reset debounce counter
  warnData.callsSinceWarn = 0;
  warnData.lastLevel = currentLevel;
  fs.writeFileSync(warnPath, JSON.stringify(warnData));

  // Build warning message
  let message: string;
  if (isCritical) {
    message = `CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
      'STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted. ' +
      'If using MAXSIM, run /maxsim:pause-work to save execution state.';
  } else {
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
  readStdinJson<ContextMonitorInput>((data) => {
    const result = processContextMonitor(data);
    if (result) {
      process.stdout.write(JSON.stringify(result));
    }
  });
}
