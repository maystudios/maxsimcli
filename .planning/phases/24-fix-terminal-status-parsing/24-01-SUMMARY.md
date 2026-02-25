---
phase: 24-fix-terminal-status-parsing
plan: 01
subsystem: ui
tags: [terminal, quick-actions, disabled-logic, websocket]

requires:
  - phase: 21-terminal
    provides: Terminal WebSocket infrastructure and QuickActionBar component
provides:
  - Fixed QuickActionBar disabled logic so buttons are enabled when process is alive
  - Verified status parsing and uptime unit alignment across client/server
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/dashboard/src/components/terminal/QuickActionBar.tsx

decisions:
  - isActive removed from disabled condition — it means "recent output activity" not "process running"
  - isActive prop retained in interface for future UI indicators (e.g., activity pulse)

metrics:
  duration: 1min
  completed: 2026-02-25
---

# Phase 24 Plan 01: Fix QuickActionBar Disabled Logic Summary

Fixed inverted disabled logic in QuickActionBar so quick-action buttons are enabled when the terminal process is alive, not permanently disabled due to isActive check.

## One-liner

Remove isActive from QuickActionBar disabled condition -- buttons now clickable when process is alive

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Fix QuickActionBar disabled logic | bbea98b | QuickActionBar.tsx |
| 2 | Verify status parsing and uptime alignment | (no changes) | use-terminal.ts, pty-manager.ts, TerminalStatusBar.tsx |

## Changes Made

### Task 1: Fix QuickActionBar disabled logic
Changed `const disabled = unavailable || isActive || !isAlive` to `const disabled = unavailable || !isAlive` on line 82 of QuickActionBar.tsx. The `isActive` field indicates recent output activity, not whether the process is running. Including it in the disabled condition prevented users from clicking buttons exactly when the terminal was actively running.

### Task 2: Verify status parsing and uptime alignment
Confirmed all three alignment points are correct (no changes needed):
1. `use-terminal.ts` correctly destructures all WebSocket status fields (pid, uptime, cwd, memoryMB, isActive, skipPermissions, alive)
2. `pty-manager.ts` sends uptime in seconds: `Math.floor((Date.now() - startTime) / 1000)`
3. `TerminalStatusBar.tsx` `formatUptime(secs)` correctly divides by 60 for minutes, modulo for seconds

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Dashboard build succeeds with no errors
- QuickActionBar disabled condition no longer includes isActive
- Status destructuring correctly reads all WebSocket message fields
- Uptime units consistent (seconds) between server and client
