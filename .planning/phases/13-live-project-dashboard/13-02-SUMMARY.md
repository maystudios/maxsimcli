---
phase: 13-live-project-dashboard
plan: 02
subsystem: infra
tags: [websocket, chokidar, file-watcher, next-custom-server, react-context, real-time]

# Dependency graph
requires:
  - phase: 13-live-project-dashboard
    provides: Next.js 15 dashboard package with dependencies (ws, chokidar, detect-port, open)
provides:
  - Custom HTTP server hosting Next.js + WebSocket on single auto-detected port
  - chokidar file watcher with debounced broadcast and write-suppression
  - WebSocket React context provider with auto-reconnect and lastChange signal
affects: [13-03, 13-04, 13-05, 13-06, 13-07, 13-08]

# Tech tracking
tech-stack:
  added: []
  patterns: [custom-next-server-with-ws-upgrade, chokidar-debounced-broadcast, write-suppression-mechanism, exponential-backoff-reconnect, react-context-ws-provider]

key-files:
  created:
    - packages/dashboard/server.ts
    - packages/dashboard/lib/websocket.ts
    - packages/dashboard/lib/watcher.ts
    - packages/dashboard/app/components/providers/websocket-provider.tsx
  modified:
    - packages/dashboard/app/layout.tsx

key-decisions:
  - "server.ts imports use .js extensions (ESM for tsx runner) while lib files use extensionless imports (webpack compatibility)"
  - "WebSocket upgrade handler delegates non-/api/ws paths to Next.js upgradeHandler for HMR coexistence"
  - "Write-suppression uses Map with TTL instead of Set for automatic expiry tracking"

patterns-established:
  - "Custom server pattern: server.ts runs via node --import tsx, handles HTTP+WS on single port"
  - "Write-suppression: suppressPath() before dashboard writes, watcher skips suppressed paths for 500ms"
  - "WebSocket provider lastChange timestamp as reactivity signal for downstream data refetch hooks"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 13 Plan 02: Server and WebSocket Infrastructure Summary

**Custom Node.js server with WebSocket upgrade handling, chokidar file watcher with debounced broadcast and write-suppression, and React context provider with exponential backoff reconnect**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24T18:19:09Z
- **Completed:** 2026-02-24T18:24:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Custom HTTP server (server.ts) that delegates HTTP to Next.js and handles WebSocket upgrades on /api/ws while preserving HMR on /_next/webpack-hmr
- chokidar file watcher on .planning/ with 200ms debounce, write-suppression to prevent infinite loops, and Windows path normalization
- WebSocket React context provider with exponential backoff reconnect (2s-30s) and lastChange timestamp for downstream reactivity
- Auto-detect free port from 3333 and auto-open browser on server start

## Task Commits

Each task was committed atomically:

1. **Task 1: Create custom server with WebSocket and file watcher modules** - `ec1ba59` (feat)
2. **Task 2: Create WebSocket React provider with auto-reconnect** - `df72519` (feat)

## Files Created/Modified
- `packages/dashboard/server.ts` - Custom HTTP server: Next.js + WebSocket upgrade, port detection, browser open, graceful shutdown
- `packages/dashboard/lib/websocket.ts` - WebSocket server factory (noServer mode) and broadcast utility
- `packages/dashboard/lib/watcher.ts` - chokidar watcher with debounced broadcast, write-suppression, path normalization
- `packages/dashboard/app/components/providers/websocket-provider.tsx` - React context provider with auto-reconnect and lastChange signal
- `packages/dashboard/app/layout.tsx` - Added WebSocketProvider wrapper around children

## Decisions Made
- **ESM vs extensionless imports:** server.ts uses `.js` extensions (runs via `node --import tsx`, not webpack). Lib files used by API routes use extensionless imports for webpack compatibility.
- **HMR coexistence:** WebSocket upgrade handler checks pathname: `/api/ws` goes to dashboard WSS, everything else (including `/_next/webpack-hmr`) delegates to Next.js `upgradeHandler()`.
- **Write-suppression with Map+TTL:** Uses `Map<string, number>` instead of plain `Set` so each entry has a creation timestamp and auto-expires after 500ms. This prevents stale entries from accumulating.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cleared stale .next cache causing phantom webpack errors**
- **Found during:** Task 2 (next build verification)
- **Issue:** `next build` reported `Can't resolve './websocket.js'` even though the import was extensionless, due to stale .next build cache
- **Fix:** Deleted `.next/` directory and re-ran build
- **Verification:** Clean build succeeds with all routes compiled
- **Committed in:** df72519 (no file change needed, cache-only issue)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor cache issue, no code changes required. No scope creep.

## Issues Encountered
- watcher.ts was already committed by a prior 13-03 session (commit 603f2b9). The Write tool overwrote with equivalent content, so `git add` correctly detected no changes. Task 1 commit includes server.ts and websocket.ts only; watcher.ts was already tracked.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Real-time data pipeline is complete: chokidar -> WebSocket -> React state
- The `lastChange` timestamp in WebSocketProvider enables downstream hooks (Plans 04/05) to refetch data on file changes
- `suppressPath()` is exported for API routes that write to .planning/ (already used by prior 13-03 routes)
- Custom server ready for development via `pnpm --filter @maxsim/dashboard dev`

## Self-Check: PASSED

All 5 created/modified files verified present on disk. Both task commits (ec1ba59, df72519) verified in git log.

---
*Phase: 13-live-project-dashboard*
*Completed: 2026-02-24*
