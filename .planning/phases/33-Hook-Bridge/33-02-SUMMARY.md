---
phase: 33-Hook-Bridge
plan: 02
subsystem: frontend
tags: [mcp, websocket, discussion, status-bar, auto-registration]

# Dependency graph
requires:
  - phase: 33-Hook-Bridge
    plan: 01
    provides: MCP server with ask_question, submit_lifecycle_event, get_phase_status tools
provides:
  - WebSocket routing of MCP events to browser UI
  - Real question flow replacing mock questions
  - Answer submission via POST /api/mcp-answer
  - StatusBar component showing lifecycle state
  - Pending question count badge
  - MCP server auto-registration in ~/.claude.json
affects: [simple-mode, discussion-view, dashboard-server]

# Tech tracking
tech-stack:
  added: []
  patterns: ["WebSocket message routing with typed handlers", "MCP server registration in ~/.claude.json with atomic writes"]

key-files:
  created:
    - packages/dashboard/src/HOOK-BRIDGE.md
  modified:
    - packages/dashboard/src/components/providers/websocket-provider.tsx
    - packages/dashboard/src/components/providers/discussion-provider.tsx
    - packages/dashboard/src/components/simple-mode/discussion/discussion-view.tsx
    - packages/dashboard/src/components/simple-mode/simple-mode-view.tsx
    - packages/dashboard/src/server.ts

key-decisions:
  - "onQuestionReceivedRef callback pattern bridges WebSocket provider to discussion provider without prop drilling"
  - "MCP server registered with project filesystem path as-is (no normalization on Windows)"
  - "StatusBar renders at top of SimpleModeView in both discussion and action views"

patterns-established:
  - "WebSocket message type switch for MCP events (question-received, questions-queued, answer-given, lifecycle)"
  - "Atomic ~/.claude.json write via .tmp file + rename"

requirements-completed: [HOOK-01, HOOK-02]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 33 Plan 02: Browser UI Integration and MCP Registration Summary

**End-to-end MCP-to-browser question/answer flow with lifecycle status bar and auto-registration in ~/.claude.json**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T03:32:45Z
- **Completed:** 2026-02-28T03:35:55Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Extended WebSocket provider with handlers for question-received, questions-queued, answer-given, and lifecycle message types
- Removed all mock questions (MOCK_QUESTIONS, MOCK_QUESTIONS_BATCH_2, useMockQuestions) and replaced with real WebSocket-driven flow
- Discussion answers now submitted via POST /api/mcp-answer which resolves the MCP tool's pending Promise
- Added StatusBar component showing lifecycle event state with step progress counter
- Added pending question count badge in discussion mode
- MCP server auto-registered in ~/.claude.json on dashboard startup and unregistered on shutdown
- Created HOOK-BRIDGE.md developer documentation (150 lines) covering all three MCP tools, schemas, extension pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire MCP events to browser UI and replace mock questions** - `952ca18` (feat)
2. **Task 2: Add StatusBar, pending badge, and MCP server auto-registration** - `2620af7` (feat)
3. **Task 3: Create Hook Bridge developer documentation** - `70ac263` (docs)

## Files Created/Modified
- `packages/dashboard/src/components/providers/websocket-provider.tsx` - Extended with lifecycleEvent, pendingQuestionCount, onQuestionReceivedRef, and message type routing
- `packages/dashboard/src/components/providers/discussion-provider.tsx` - submitAnswer now POSTs to /api/mcp-answer
- `packages/dashboard/src/components/simple-mode/discussion/discussion-view.tsx` - Removed mock questions, wired to WebSocket provider
- `packages/dashboard/src/components/simple-mode/simple-mode-view.tsx` - Added StatusBar component and pending badge
- `packages/dashboard/src/server.ts` - Added registerMcpServerInClaudeJson/unregisterMcpServerFromClaudeJson
- `packages/dashboard/src/HOOK-BRIDGE.md` - Developer documentation for MCP Hook Bridge

## Decisions Made
- onQuestionReceivedRef callback pattern bridges WebSocket provider to discussion provider without prop drilling
- MCP server registered with project filesystem path as-is (no Windows path normalization needed)
- StatusBar renders at top of SimpleModeView in both discussion and action views
- Auto-clear (CONTEXT.md Decision 3) deferred to Phase 34 as noted in plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - MCP server auto-registers on dashboard startup.

## Next Phase Readiness
- Complete end-to-end MCP bridge: Claude Code -> MCP -> WebSocket -> Browser -> Answer -> MCP response
- Phase 34 can build on lifecycle events for execution progress visualization
- Auto-clear (Decision 3) ready to implement in Phase 34 with xterm input injection

---
*Phase: 33-Hook-Bridge*
*Completed: 2026-02-28*
