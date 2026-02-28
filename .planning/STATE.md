# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Consistent, high-quality AI-assisted development without context rot — accessible via CLI and a simple browser UI.
**Current focus:** Phase 33 — Hook-Bridge

## Current Position

Phase: 33 of 35 (Hook-Bridge)
Plan: 2 of 2 in current phase
Status: Phase 33 complete — MCP bridge fully wired to browser UI with auto-registration
Last activity: 2026-02-28 — Phase 33 Plan 02 executed: Browser UI integration, StatusBar, MCP auto-registration

Progress: [███████████████████████░░░░░░░] 69% (phases 1-33 complete, 34 next)

## Performance Metrics

**Velocity:**
- Total plans completed: 30 phases / ~70 plans (phases 1-30)
- Average duration: Unknown (prior phases pre-dated metrics tracking)
- Total execution time: Unknown

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-30 (v1.0) | ~70 | - | - |
| 32 (plan 01) | 2 tasks | 3min | 1.5min |
| 32 (plan 02) | 3 tasks | 14min | 4.7min |
| 33 (plan 01) | 2 tasks | 5min | 2.5min |
| 33 (plan 02) | 3 tasks | 3min | 1.0min |

**Recent Trend:**
- Trend: Stable (30 phases completed successfully)

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [Phase 30]: Tech debt cleanup complete — doc/test/metadata hygiene resolved
- [Milestone]: Simple Dashboard Mode chosen as highest-value next unlock
- [Architecture]: Simple mode is additive — advanced terminal mode must remain fully intact
- [Architecture]: Dashboard additions must work via `npx maxsimcli@latest` for external users
- [Phase 32]: Separate DiscussionProvider from SimpleModeProvider — isolated discussion lifecycle
- [Phase 32]: Callback refs (onQuestionReceived, onExecutionQueued) as extension points for Phase 33/34
- [Phase 32]: Intercept /maxsim:discuss-phase in SimpleModeView to open discussion UI instead of terminal
- [Phase 32]: Mock questions hook (useMockQuestions) temporary for Phase 32, replaced in Phase 33
- [Phase 33]: MCP routes registered inside main() after wss creation to avoid null WebSocketServer
- [Phase 33]: StreamableHTTPServerTransport with stateless per-request operation (no session persistence)
- [Phase 33]: Second wss connection listener for reconnect delivery (WSS supports multiple listeners)
- [Phase 33]: onQuestionReceivedRef callback bridges WebSocket provider to discussion provider
- [Phase 33]: MCP server auto-registered in ~/.claude.json on startup, unregistered on shutdown

### Pending Todos

None yet.

### Blockers/Concerns

- node-pty is a fragile native dependency — terminal may degrade on some platforms (pre-existing, not blocking v1.1)
- install.ts monolith (2157 lines) — not blocking but worth splitting in a future phase
- Hook bridge implemented via MCP tools (Phase 33 complete) — Claude Code calls ask_question tool instead of intercepting internals

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 33-02-PLAN.md
Resume file: None
