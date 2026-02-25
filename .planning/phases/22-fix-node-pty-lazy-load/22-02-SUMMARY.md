---
phase: "22"
plan: "02"
subsystem: e2e-tests
tags: [e2e, dashboard, node-pty, websocket, degraded-mode]
dependency_graph:
  requires: [22-01]
  provides: [e2e-pty-absent-coverage]
  affects: [packages/e2e]
tech_stack:
  added: [ws]
  patterns: [curl-based-websocket-verification, fileParallelism-false]
key_files:
  created:
    - packages/e2e/src/dashboard-pty-absent.test.ts
  modified:
    - packages/e2e/package.json
    - packages/e2e/vitest.config.ts
decisions:
  - "curl for WebSocket upgrade verification instead of ws/native WebSocket (vitest fork workers have networking quirks that prevent ws library from completing WebSocket handshakes)"
  - "fileParallelism: false in vitest config to prevent port conflicts between dashboard test files"
  - "Raw TCP verification of 101 Switching Protocols instead of full frame parsing (curl-based approach is reliable across vitest worker contexts)"
metrics:
  duration: "19min"
  completed: "2026-02-25"
requirements_completed: []
---

# Phase 22 Plan 02: E2E Test for Absent node-pty Summary

E2E test validates dashboard server boots and operates correctly when node-pty is absent, covering health check, all read APIs, and WebSocket upgrade returning 101

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add ws devDependency to e2e package | a7dbc36 | packages/e2e/package.json |
| 2 | Create dashboard-pty-absent.test.ts | 24d6b98 | packages/e2e/src/dashboard-pty-absent.test.ts, packages/e2e/vitest.config.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Port collision between dashboard test files**
- **Found during:** Task 2
- **Issue:** Dashboard test files spawning servers concurrently caused EADDRINUSE on port 3334
- **Fix:** Added `fileParallelism: false` to vitest.config.ts
- **Files modified:** packages/e2e/vitest.config.ts
- **Commit:** 24d6b98

**2. [Rule 3 - Blocking] WebSocket client libraries hang in vitest fork workers**
- **Found during:** Task 2
- **Issue:** Both `ws` npm package and native `globalThis.WebSocket` hang indefinitely in vitest fork workers -- no `open`, `error`, or `message` events fire. Raw `net.connect` and `http.request` also fail to receive HTTP responses. Only `fetch` (Undici) works for regular HTTP.
- **Fix:** Used `curl` via `execSync` for WebSocket upgrade verification -- confirms 101 Switching Protocols response
- **Files modified:** packages/e2e/src/dashboard-pty-absent.test.ts
- **Commit:** 24d6b98

**3. [Rule 1 - Bug] node-pty not present in E2E install directory**
- **Found during:** Task 2
- **Issue:** node-pty is not installed in the tarball-based E2E temp directory, so rename strategy fails
- **Fix:** `findNodePtyDir` returns empty string when not found; rename is skipped (node-pty already absent)
- **Files modified:** packages/e2e/src/dashboard-pty-absent.test.ts
- **Commit:** 24d6b98

## Verification

- All 29 E2E tests pass (4 test files)
- New test covers: server boot, health check, 5 API endpoints, WebSocket upgrade
- node-pty restore handled in afterAll (no state pollution)
- Existing tests unaffected
