# Research: Terminal Management & Process Lifecycle

**Phase:** 03 — Backend Architecture Design
**Date:** 2026-03-02
**Scope:** Terminal emulation, persistent process management, daemon lifecycle

---

## 1. Current node-pty Usage

### Implementation Analysis

The current terminal implementation lives in `packages/dashboard/src/terminal/pty-manager.ts` as a singleton `PtyManager` class. Key characteristics:

- **Lazy-loading:** node-pty is loaded via `require('node-pty')` inside a try/catch at module level. If loading fails, terminal features degrade gracefully — the dashboard still starts but shows an error message in the terminal panel.
- **Single session:** Only one `PtySession` is active at a time. Calling `spawn()` kills any existing session first.
- **Shell delegation:** Spawns `cmd.exe /c claude` (Windows) or `/bin/sh -c claude` (Unix) rather than invoking `claude` directly, ensuring PATH resolution matches the user's environment.
- **Client management:** WebSocket clients connect and disconnect; the manager broadcasts output to all connected clients. When no clients remain, a 60-second disconnect timer kills the process.
- **Scrollback via SessionStore:** `session-store.ts` holds an in-memory string array (capped at 50,000 entries). New clients receive the full scrollback on connect. There is no disk persistence — scrollback is lost on server restart.
- **Status broadcast:** A 1-second interval broadcasts PID, uptime, memory, and activity status to all connected clients.

### What Works

1. Graceful degradation when node-pty is missing — dashboard remains functional without terminal.
2. Scrollback replay for reconnecting clients is seamless.
3. Guard against stale `onData`/`onExit` handlers after respawn prevents ghost messages from old processes.
4. The singleton pattern ensures a single source of truth for the terminal session.

### Pain Points

1. **node-pty installation friction:** The `ensureNodePty()` function in `dashboard-launcher.ts` runs `npm install node-pty` at install time, which requires a C++ compiler toolchain (Visual Studio on Windows, gcc/clang on Unix). This is the single biggest source of user installation failures.
2. **No session persistence across server restarts:** If the dashboard server crashes or is restarted, the running Claude Code process is killed and scrollback is lost.
3. **60-second kill timer is aggressive:** If a user closes their browser tab for more than 60 seconds, the Claude Code process is killed even if it was mid-task. This is disruptive for long-running operations.
4. **Memory reporting is inaccurate:** `getStatus()` reports `process.memoryUsage().rss` — the dashboard server's own memory, not the spawned Claude process's memory.
5. **No reconnection to orphaned processes:** If the dashboard server dies but the Claude process survives (which is unlikely given the pty relationship), there is no mechanism to reattach.
6. **Windows `cmd.exe` wrapping:** Using `cmd.exe /c claude` adds a wrapper process layer that complicates signal delivery and process tree management.

---

## 2. node-pty Cross-Platform Status

### Current State (2025-2026)

node-pty (v1.1.x) is maintained by Microsoft as part of the VS Code / xterm.js ecosystem. It requires native C++ compilation via node-gyp.

**Windows issues:**
- Requires Visual Studio Build Tools with C++ workload (multi-GB install).
- Node.js 22.x introduced build failures with `win_delay_load_hook.cc` compilation errors.
- MSB8040 errors requiring Spectre-mitigated libraries are common with newer VS 2022 installations.
- The `windows-build-tools` npm package that simplified setup is no longer maintained.

**Prebuild status:**
- PR #809 added support for loading native addons from a `prebuilds/` directory, making it possible to bundle node-pty without relying on the `../build/Release` path.
- Official prebuilt binaries from Microsoft are still not shipped with the npm package.
- Community forks providing prebuilds exist:
  - `node-pty-prebuilt-multiarch` (homebridge fork) — covers ia32, amd64, arm, aarch64 for macOS, Windows, Linux. Active but sometimes lags behind upstream.
  - `@anthropic-ai/node-pty-prebuilt` — used by Claude Code itself.
  - The CDKTF fork was archived in December 2025.

**Reliability verdict:** node-pty works well once compiled, but the compilation step is the #1 installation barrier for MAXSIM users. The prebuild ecosystem is fragmented and no single fork is universally reliable.

---

## 3. Alternative Terminal Management Approaches

### Option A: Use `@anthropic-ai/node-pty-prebuilt`

Claude Code itself uses a prebuilt fork of node-pty. If MAXSIM could depend on or reuse this package, it would eliminate compilation issues for users who already have Claude Code installed. However, this package is not published for general consumption and its API stability is not guaranteed.

### Option B: `node-pty-prebuilt-multiarch` (Homebridge fork)

Drop-in replacement for node-pty with prebuilt binaries for major platforms. Reduces installation friction significantly. Risk: maintained by the Homebridge community, not Microsoft. May lag behind upstream fixes.

### Option C: Headless PTY via `child_process` + VT parser

Instead of a real PTY, spawn Claude Code as a regular child process with `stdio: 'pipe'` and use a virtual terminal parser (e.g., `xterm-headless` from the xterm.js project) to process ANSI sequences server-side. This eliminates the native module dependency entirely.

**Trade-offs:**
- Pro: Zero native dependencies. Works everywhere Node.js works.
- Con: Claude Code expects a TTY for features like interactive prompts, colors, and cursor movement. A piped stdio would disable TTY detection (`process.stdout.isTTY` returns false), potentially degrading Claude Code's output or disabling interactive features.
- Mitigation: Setting `FORCE_COLOR=1` and using `script` (Unix) or `winpty` wrapper (Windows) can fake TTY detection, but this adds complexity.

### Option D: ConPTY / WinPTY directly via FFI

Use `ffi-napi` or `koffi` to call Windows ConPTY APIs directly, bypassing node-pty entirely. On Unix, use the `openpty()` syscall via similar FFI. This gives full control but requires maintaining platform-specific FFI bindings.

**Trade-offs:**
- Pro: No dependency on node-pty or its build chain.
- Con: Significant implementation effort. Must maintain bindings for Windows (ConPTY), macOS (posix_openpt), and Linux (openpty).

### Option E: WebSocket relay to existing Claude Code terminal

Rather than spawning a new Claude Code process inside a PTY, connect to a running Claude Code session via its own MCP interface or IPC. The dashboard becomes a viewer/proxy rather than owning the process.

**Trade-offs:**
- Pro: No PTY needed at all. Leverages Claude Code's own terminal management.
- Con: Claude Code does not currently expose a terminal-relay API. Would require upstream changes or reverse-engineering.

---

## 4. Persistent Process Lifecycle

The current architecture ties the Claude Code process lifetime to the dashboard server process. Key requirements for persistence (relevant to DASH-06, DASH-07):

### Survival scenarios

| Event | Current behavior | Desired behavior |
|-------|-----------------|------------------|
| Browser tab closed | 60s timer kills process | Process continues indefinitely |
| Dashboard server crash | Claude process dies (PTY fd closed) | Claude process continues; dashboard reconnects on restart |
| Editor restart | No impact (dashboard is separate) | No impact |
| System sleep/wake | Process continues if OS allows | Process continues; WebSocket reconnects |
| Machine reboot | Everything dies | User must manually restart via `maxsimcli start` |

### Achieving process persistence

**Strategy 1: Detached child process with PID tracking**

Spawn the Claude Code process as a detached child (already done for the dashboard server itself in `dashboard-launcher.ts`). Write the PID to a file. On reconnect, check if the PID is still alive and reattach the PTY.

Problem: PTY file descriptors cannot be "reattached" after the parent process exits. The PTY master/slave pair is tied to the process that opened it.

**Strategy 2: Terminal multiplexer (tmux/screen)**

Spawn Claude Code inside a tmux or screen session. The dashboard connects to the multiplexer session rather than owning the PTY directly.

- Pro: Mature, battle-tested persistence. Process survives server crash.
- Con: Requires tmux/screen installed. Not available on Windows without WSL.

**Strategy 3: Separate process manager owns the PTY**

A lightweight daemon process owns the PTY and Claude process. The dashboard server connects to this daemon via IPC (Unix socket or named pipe). If the dashboard dies, the daemon keeps the PTY alive.

- Pro: Clean separation. Dashboard becomes stateless.
- Con: Additional process to manage. Must be cross-platform.

**Strategy 4: Accept the limitation**

Keep the current model where the dashboard server owns the PTY. Focus on making the dashboard server itself persistent (see Section 5). If the server crashes, the terminal session is lost — but the `.planning/` state on disk is intact, so work can be resumed.

---

## 5. Process Manager Options

### For the Dashboard Server

The dashboard server (`server.ts`) must be a long-running background process. Current approach: `spawnDashboard()` in `dashboard-launcher.ts` uses `child_process.spawn()` with `detached: true` and `stdio: 'ignore'`, then calls `child.unref()`.

**Option A: Self-daemonization (current approach)**

The current `spawn()` + `detach` + `unref` pattern works for basic backgrounding. Missing pieces:
- No PID file — cannot reliably check if the process is still running.
- No automatic restart on crash.
- No log rotation.
- Kill relies on port scanning + `taskkill`/`lsof` rather than PID tracking.

**Hardening the current approach:**
1. Write PID to `~/.claude/dashboard/dashboard.pid` after spawn.
2. On startup, check PID file: if PID exists and process is alive, skip spawn.
3. On shutdown, remove PID file.
4. Stale PID detection: if PID file exists but process is dead (or listening on wrong port), remove and respawn.

**Option B: PM2**

PM2 is the dominant Node.js process manager (100M+ downloads). Features: auto-restart, log management, cluster mode, startup scripts (systemd/launchd/Windows service).

- Pro: Automatic restart on crash. Built-in log rotation. `pm2 startup` generates OS-native service configs.
- Con: Heavy dependency (~40MB). PM2 itself is a daemon that needs managing. Overkill for managing a single process. Users must install PM2 globally.

**Option C: OS-native service registration**

Register the dashboard as a system service: systemd (Linux), launchd (macOS), Windows Service (via `node-windows` or `windows-service`).

- Pro: Survives reboots. OS handles restart, logging.
- Con: Requires elevated permissions to install. Platform-specific code for each OS. Feels invasive for a dev tool.

**Option D: `daemonize-process` npm package**

Lightweight (single file) package that re-spawns the current process detached, then exits. The new process is adopted by init/PID 1.

- Pro: Simple, zero config.
- Con: Unix-only. No Windows support. No restart-on-crash.

**Recommendation for process management:** Harden the current self-daemonization approach (Option A) with PID file tracking and stale cleanup. This matches MAXSIM's philosophy of minimal dependencies and user-facing simplicity. PM2 or OS services could be documented as optional advanced setups.

---

## 6. Port Allocation Strategy

### Current Approach

`server.ts` uses a djb2 hash of the project path mapped to the range 3100-3199 (100 ports). If the preferred port is busy, `detect-port` finds the next available port.

`dashboard-launcher.ts` uses a different range: 3333-3343 (11 ports) for its `findRunningDashboard()` scan.

**Issue: The two port ranges do not overlap.** The server hashes to 3100-3199, but the launcher scans 3333-3343. This means `findRunningDashboard()` will never find a server started by `server.ts` directly, and vice versa. This is likely a bug or a leftover from a refactor.

### Evaluation

| Aspect | Assessment |
|--------|-----------|
| Range size (100 ports) | Sufficient for most users. Unlikely someone has 100+ projects. |
| Collision probability | djb2 hash mod 100 has ~50% collision probability at ~12 projects (birthday problem). `detect-port` fallback handles this. |
| Discoverability | Scanning 100 ports sequentially (with 500ms timeout each) takes up to 50 seconds worst case. Current implementation uses `Promise.all` with 500ms abort, so it is ~0.5s wall time. |
| Conflict with other services | 3100-3199 is not a well-known range, but not IANA-registered either. Risk of conflict with other dev tools is low but nonzero. |
| Port range mismatch | The dashboard-launcher range (3333-3343) vs server range (3100-3199) discrepancy needs resolution. |

### Recommendations

1. **Unify port ranges** — both `server.ts` and `dashboard-launcher.ts` should use the same range and hashing logic. Extract to a shared module.
2. **Increase range to 3100-3299** (200 ports) to reduce birthday-problem collisions for users with many projects.
3. **Store the resolved port** in `~/.claude/dashboard/dashboard.json` or a project-specific file so the launcher can read it directly instead of scanning.
4. **Consider higher port range** (e.g., 31000-31199) to further reduce conflict risk with other dev tools.

---

## 7. Graceful Shutdown, Crash Recovery, Stale PID Cleanup

### Graceful Shutdown

The current server registers an `unregisterMcpServerFromClaudeJson()` cleanup but does not have comprehensive signal handling. Recommended pattern:

```
SIGTERM/SIGINT received
  -> Stop accepting new WebSocket connections
  -> Send "shutting down" message to connected clients
  -> Kill PTY session (send SIGTERM to Claude process)
  -> Wait up to 5s for PTY process exit
  -> Unregister MCP server from .claude.json
  -> Remove PID file
  -> Close HTTP server
  -> Exit 0
```

On Windows, SIGTERM is not reliably delivered. Use `process.on('message', ...)` for IPC-based shutdown and handle `CTRL_C_EVENT` / `CTRL_BREAK_EVENT` via `process.on('SIGINT', ...)` (which Node.js does translate on Windows).

### Crash Recovery

When the server crashes (unhandled exception, OOM kill, SIGKILL):
1. PID file remains on disk with a stale PID.
2. The port may be released by the OS (TCP `TIME_WAIT` clears in ~60s).
3. PTY child process (Claude Code) may be killed by the OS (pty master fd closed) or orphaned.

**Recovery flow on next start:**
1. Read PID file.
2. Check if PID is alive (`kill -0` on Unix, `tasklist /FI "PID eq ..."` on Windows).
3. If alive, check if it is listening on the expected port (health check).
4. If health check passes: reuse existing instance.
5. If PID is dead or health check fails: remove stale PID file, start fresh.

### Stale PID Cleanup Pattern

```typescript
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0); // signal 0 = existence check
    return true;
  } catch {
    return false;
  }
}
```

On Windows, `process.kill(pid, 0)` works in Node.js but may give false positives if the PID has been reused by another process. Supplement with a port health check to confirm identity.

### Lock File Alternative

Instead of (or in addition to) PID files, use a filesystem lock via `fs.open()` with `O_EXCL` or the `proper-lockfile` npm package. The lock is automatically released when the process exits (including crashes). This avoids the stale-PID problem entirely.

---

## 8. The `maxsimcli start` Vision (DASH-06)

### Current Implementation

`packages/cli/src/core/start.ts` implements `cmdStart()` which:
1. Scans for a running dashboard (port scan).
2. Resolves the dashboard server entry point.
3. Installs node-pty if missing.
4. Spawns the dashboard as a detached background process.
5. Polls for readiness.
6. Opens the browser.

This already fulfills the basic DASH-06 requirement ("single command starts all three services"), since the dashboard server hosts the HTTP server, MCP server, and terminal.

### Gaps vs. the Vision

1. **No status feedback during startup:** The CLI spawns the server and polls silently. Users see no progress indication.
2. **No stop command integration:** `maxsimcli stop` is not implemented as a counterpart.
3. **No restart command:** Must stop + start manually.
4. **No multi-project awareness:** `maxsimcli start` does not indicate which project a running dashboard belongs to.
5. **node-pty install blocks startup:** `ensureNodePty()` can take 30-120 seconds and runs synchronously in the start path.

### Recommended `maxsimcli start` Flow

```
$ maxsimcli start
  [1/4] Checking for running dashboard...     (port scan)
  [2/4] Resolving dashboard server...         (file resolution)
  [3/4] Starting backend services...          (spawn detached)
  [4/4] Waiting for readiness...              (health poll)

  Dashboard:  http://localhost:3142
  MCP:        http://localhost:3142/mcp
  Terminal:   Available (node-pty loaded)
  PID:        12345
  Project:    /home/user/my-project
```

With corresponding `maxsimcli stop` and `maxsimcli status` commands.

---

## Recommendations

### Short-term (next phase)

1. **Switch to a prebuilt node-pty fork** (`node-pty-prebuilt-multiarch` or investigate reusing the Anthropic fork) to eliminate compilation requirements. If prebuilts are unavailable for a platform, fall back to the current `npm install node-pty` approach.

2. **Unify port allocation** between `server.ts` (3100-3199 hash range) and `dashboard-launcher.ts` (3333-3343 scan range). Extract hashing logic to a shared module. Store the resolved port in a known location.

3. **Add PID file management** to the dashboard server lifecycle: write on start, remove on clean shutdown, validate-and-cleanup on next start.

4. **Extend the disconnect timer** from 60 seconds to 10-15 minutes, or make it configurable, to avoid killing long-running Claude processes when the user briefly closes their browser.

### Medium-term

5. **Implement graceful shutdown** with proper signal handling on both Unix and Windows, including MCP unregistration, PTY cleanup, and PID file removal.

6. **Add `maxsimcli stop` and `maxsimcli status`** commands that use PID file + health check to manage the lifecycle.

7. **Implement crash recovery** via stale PID detection on startup.

### Long-term

8. **Evaluate headless PTY approach** (Option C from Section 3) as a fallback for environments where no node-pty variant can be installed. This would provide a degraded but functional terminal experience with zero native dependencies.

9. **Consider a separate PTY daemon** (Strategy 3 from Section 4) if users need terminal sessions to survive dashboard restarts. This adds complexity but enables true session persistence.

10. **Do not adopt PM2 or OS-native services** — the added dependency weight and installation complexity do not match MAXSIM's target audience (individual developers using `npx`). The self-daemonization approach with proper PID management is sufficient.

---

*Research completed: 2026-03-02*
*Relevant requirements: DASH-03, DASH-06, DASH-07, GUARD-01, GUARD-04*
