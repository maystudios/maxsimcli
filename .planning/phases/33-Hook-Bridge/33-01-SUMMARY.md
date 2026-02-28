---
phase: 33-Hook-Bridge
plan: 01
subsystem: api
tags: [mcp, websocket, express, streaming, question-bridge]

# Dependency graph
requires:
  - phase: 32-Question-Driven-Discussion-Flow
    provides: Discussion UI with mock question flow and callback refs
provides:
  - MCP server embedded in dashboard Express process at POST /mcp
  - ask_question tool that blocks until browser submits answer
  - submit_lifecycle_event tool that broadcasts events via WebSocket
  - get_phase_status tool for queue and lifecycle inspection
  - POST /api/mcp-answer endpoint to resolve pending questions
  - WebSocket reconnect delivery of queued questions and lifecycle state
affects: [33-02, dashboard-frontend, simple-mode]

# Tech tracking
tech-stack:
  added: ["@modelcontextprotocol/sdk", "zod (transitive, bundled)"]
  patterns: ["Streamable HTTP MCP transport per request", "Promise-based question blocking with Map<id, resolve>"]

key-files:
  created:
    - packages/dashboard/src/mcp-server.ts
  modified:
    - packages/dashboard/src/server.ts
    - packages/dashboard/package.json
    - packages/dashboard/tsdown.config.server.mts

key-decisions:
  - "MCP routes registered inside main() after wss creation to avoid null reference"
  - "StreamableHTTPServerTransport with sessionIdGenerator: undefined for stateless per-request transport"
  - "Second wss connection listener in main() for reconnect delivery (WSS supports multiple listeners)"

patterns-established:
  - "MCP tool registration via createMcpServer factory with injected deps (wss, queues, broadcast)"
  - "Blocking question pattern: Promise stored in Map, resolved by HTTP endpoint"

requirements-completed: [HOOK-01, HOOK-02]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 33 Plan 01: MCP Server with Question Bridge Summary

**MCP server embedded in dashboard Express process with blocking ask_question tool, lifecycle events, and WebSocket reconnect delivery**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T03:28:43Z
- **Completed:** 2026-02-28T03:34:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Embedded MCP server at POST/GET/DELETE /mcp with three tools: ask_question, submit_lifecycle_event, get_phase_status
- ask_question blocks via Promise until browser submits answer through POST /api/mcp-answer
- Queued questions and lifecycle state delivered to newly connected WebSocket clients for reconnect resilience
- Full build (npm run build) passes with MCP SDK bundled into server.js

## Task Commits

Each task was committed atomically:

1. **Task 1: Install MCP SDK and create mcp-server.ts** - `f933da4` (feat)
2. **Task 2: Wire MCP routes and answer endpoint into server.ts** - `56a973a` (feat)

## Files Created/Modified
- `packages/dashboard/src/mcp-server.ts` - MCP server factory with ask_question, submit_lifecycle_event, get_phase_status tools
- `packages/dashboard/src/server.ts` - POST/GET/DELETE /mcp routes, POST /api/mcp-answer, WebSocket reconnect delivery
- `packages/dashboard/package.json` - Added @modelcontextprotocol/sdk dependency
- `packages/dashboard/tsdown.config.server.mts` - Added MCP SDK and zod to noExternal for bundling

## Decisions Made
- MCP routes registered inside main() after wss creation to avoid null WebSocketServer reference
- Used StreamableHTTPServerTransport with sessionIdGenerator: undefined for stateless per-request operation
- Added second wss connection listener in main() for reconnect delivery (WebSocketServer supports multiple listeners)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MCP server is live and ready for Plan 02 (frontend integration to replace mock question hooks)
- Browser can receive questions via WebSocket and submit answers via POST /api/mcp-answer
- Lifecycle events broadcast to all connected clients

---
*Phase: 33-Hook-Bridge*
*Completed: 2026-02-28*
