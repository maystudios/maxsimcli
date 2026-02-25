---
phase: "22"
plan: "01"
subsystem: dashboard-terminal
tags: [node-pty, graceful-degradation, error-handling, frontend]
dependency-graph:
  requires: [pty-manager-isAvailable]
  provides: [terminal-unavailable-ux]
  affects: [server.ts, use-terminal.ts, Terminal.tsx, QuickActionBar.tsx]
tech-stack:
  added: []
  patterns: [websocket-typed-messages, react-overlay-card]
key-files:
  created: []
  modified:
    - packages/dashboard/src/server.ts
    - packages/dashboard/src/hooks/use-terminal.ts
    - packages/dashboard/src/components/terminal/Terminal.tsx
    - packages/dashboard/src/components/terminal/QuickActionBar.tsx
decisions: []
metrics:
  duration: "2min"
  completed: "2026-02-25"
requirements_completed: [DASH-TERM-01]
---

# Phase 22 Plan 01: Server Graceful Degradation + Frontend Error Card Summary

Server logs warning and sends typed `{ type: 'unavailable' }` WebSocket message when node-pty absent; frontend shows centered error card overlay and disables quick-action buttons with tooltip.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Server-side startup log + WebSocket unavailable message | bfffc12 | server.ts |
| 2 | Frontend unavailable state + error card + disabled quick actions | 510ec61 | use-terminal.ts, Terminal.tsx, QuickActionBar.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] `pnpm nx run dashboard:build` succeeds without errors
- [x] Server sends typed `{ type: 'unavailable' }` message on WebSocket connect when pty absent
- [x] Frontend shows error card overlay when unavailable
- [x] Quick-action buttons disabled with tooltip when unavailable
