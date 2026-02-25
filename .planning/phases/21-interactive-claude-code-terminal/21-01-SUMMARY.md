---
phase: 21-interactive-claude-code-terminal
plan: 01
subsystem: terminal
tags: [node-pty, xterm, websocket, pty, terminal]

requires:
  - phase: 20-dashboard-migrate-to-vite-express
    provides: Express server with WebSocket infrastructure
provides:
  - PTY process manager (spawn/kill/resize Claude Code as PTY)
  - Session store with 50k scrollback buffer
  - Terminal WebSocket endpoint at /ws/terminal
  - JSON message protocol for terminal I/O
affects: [21-02 frontend terminal component, 21-03 terminal UI]

tech-stack:
  added: [node-pty, @xterm/xterm, @xterm/addon-fit, @xterm/addon-serialize, @xterm/addon-webgl]
  patterns: [singleton PtyManager, ring buffer scrollback, dual WebSocket upgrade routing]

key-files:
  created:
    - packages/dashboard/src/terminal/pty-manager.ts
    - packages/dashboard/src/terminal/session-store.ts
  modified:
    - packages/dashboard/src/server.ts
    - packages/dashboard/tsdown.config.server.mts
    - packages/dashboard/package.json
    - packages/dashboard/tsconfig.server.json
    - package.json

decisions:
  - node-pty marked as external in tsdown (native C++ addon cannot be bundled)
  - node-pty added to pnpm onlyBuiltDependencies for build script approval
  - Terminal WebSocket at /ws/terminal separate from dashboard /api/ws
  - PtyManager uses singleton pattern for single terminal session

metrics:
  duration: 4min
  completed: 2026-02-25
  tasks: 2
  files: 7
requirements_completed: [DASH-TERM-01]
---

# Phase 21 Plan 01: Server-Side PTY Terminal Infrastructure Summary

Server-side PTY terminal with node-pty spawning Claude Code, WebSocket I/O streaming at /ws/terminal, and 50k entry scrollback buffer for reconnection.

## Tasks Completed

### Task 1: Install dependencies and configure build
- Added node-pty as runtime dependency (native addon for PTY spawning)
- Added @xterm/xterm and three addon packages as devDependencies
- Configured tsdown to externalize node-pty (cannot bundle native .node files)
- Added node-pty to pnpm onlyBuiltDependencies in root package.json
- Commit: b6a0e28

### Task 2: Create PTY manager, session store, and terminal WebSocket endpoint
- Created SessionStore class with 50k entry ring buffer scrollback
- Created PtyManager singleton with spawn/write/resize/kill/addClient/removeClient
- Added /ws/terminal WebSocket endpoint with JSON message protocol
- Dual WebSocket upgrade routing (dashboard + terminal) in server.ts
- Process cleanup on SIGINT/SIGTERM/exit to prevent zombie processes
- Status broadcast every 1s to connected clients
- Commit: 7b2bfe3

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added node-pty to pnpm onlyBuiltDependencies**
- **Found during:** Task 1
- **Issue:** pnpm 10 blocks build scripts for unapproved packages; node-pty requires native compilation
- **Fix:** Added node-pty to root package.json pnpm.onlyBuiltDependencies array
- **Files modified:** package.json

**2. [Rule 3 - Blocking] Added terminal source files to tsconfig.server.json**
- **Found during:** Task 1
- **Issue:** tsconfig.server.json only included src/server.ts; terminal/*.ts files would fail type-checking
- **Fix:** Added src/terminal/**/*.ts to include array
- **Files modified:** packages/dashboard/tsconfig.server.json

## Verification

- tsc --noEmit --project tsconfig.server.json passes with zero errors
- server.ts has dual WebSocket upgrade routing (/api/ws and /ws/terminal)
- pty-manager.ts exports PtyManager with spawn/write/resize/kill/addClient/removeClient
- session-store.ts exports SessionStore with 50k entry cap
