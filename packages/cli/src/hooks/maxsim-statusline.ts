#!/usr/bin/env node
/**
 * Claude Code Statusline - MAXSIM Edition
 * Shows: model | current task | directory | context usage
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readStdinJson, CLAUDE_DIR } from './shared';

export interface StatuslineInput {
  model?: { display_name?: string };
  workspace?: { current_dir?: string };
  session_id?: string;
  context_window?: { remaining_percentage?: number };
}

export function formatStatusline(data: StatuslineInput): string {
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
      } catch {
        // Silent fail -- bridge is best-effort, don't break statusline
      }
    }

    // Build progress bar (10 segments)
    const filled = Math.floor(used / 10);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

    // Color based on scaled usage
    if (used < 63) {
      ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
    } else if (used < 81) {
      ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
    } else if (used < 95) {
      ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
    } else {
      ctx = ` \x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
    }
  }

  // Current task from todos
  let task = '';
  const homeDir = os.homedir();
  const todosDir = path.join(homeDir, CLAUDE_DIR, 'todos');
  if (session && fs.existsSync(todosDir)) {
    try {
      const files = fs.readdirSync(todosDir)
        .filter((f: string) => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
        .map((f: string) => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
        .sort((a: { mtime: Date }, b: { mtime: Date }) => b.mtime.getTime() - a.mtime.getTime());

      if (files.length > 0) {
        try {
          const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
          const inProgress = todos.find((t: { status: string; activeForm?: string }) => t.status === 'in_progress');
          if (inProgress) task = inProgress.activeForm || '';
        } catch {
          // ignore
        }
      }
    } catch {
      // Silently fail on file system errors - don't break statusline
    }
  }

  // MAXSIM update available?
  let maxsimUpdate = '';
  const cacheFile = path.join(homeDir, CLAUDE_DIR, 'cache', 'maxsim-update-check.json');
  if (fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cache.update_available) {
        maxsimUpdate = '\x1b[33m\u2B06 /maxsim:update\x1b[0m \u2502 ';
      }
    } catch {
      // ignore
    }
  }

  // Output
  const dirname = path.basename(dir);
  if (task) {
    return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
  } else {
    return `${maxsimUpdate}\x1b[2m${model}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`;
  }
}

// Standalone entry
if (require.main === module) {
  readStdinJson<StatuslineInput>((data) => {
    process.stdout.write(formatStatusline(data));
  });
}
