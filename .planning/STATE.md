# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** GSD + Superpowers -- MAXSIM Core Server (MCP + logic) always-on backend; Dashboard optional UI layer on top; auto-triggering skills with error memory
**Current focus:** v2.0 Complete — all 10 phases done

## Current Position

Phase: 10 of 10 (Performance) -- COMPLETE
Plan: 1 of 1 in current phase
Status: v2.0 Milestone Complete
Last activity: 2026-03-02 -- Phase 10: Async I/O for hot-path commands + phase-list pagination

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 13m 51s
- Total execution time: 0.92 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 55m 22s | 13m 51s |

**Recent Trend:**
- Last 5 plans: 01-01 (5m 29s), 01-02 (5m 14s), 01-03 (42m 31s), 01-04 (2m 8s)
- Trend: 01-04 fast gap-closure plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Architecture: THREE INDEPENDENT LAYERS, each optional:
  1. Claude Code standalone (existing /maxsim:* commands) — always works without server
  2. Core Server (MCP + logic) — started per CLI command, enhances Claude Code
  3. Dashboard — optional UI on top of Core Server
  Claude Code is NOT subordinate — server ENHANCES it. Users keep terminal-only workflow.
- Phase order: MCP Core Server (1) → Quality Foundation (2, before dashboard) → Skills System (3) → Dashboard Evolution (4)
- MCP-05 (Q&A routing) is Phase 4 since it requires dashboard UI to be built first
- Quality hardening (QUAL-01–04) moved to Phase 2 — user wants clean foundation before building skills + dashboard
- Core Server start: CLI command (can also be auto-started via hook). Not always-on daemon — started when needed.
- Dashboard connects to running Core Server; starting dashboard also ensures Core Server is running
- `@modelcontextprotocol/sdk` already installed in dashboard package — may need to add to cli package or make Core Server part of dashboard package
- install.ts refactor (QUAL-03) includes splitting into: install/adapters.ts, install/dashboard.ts, install/hooks.ts + unit tests
- Skills: using-maxsim registered in AGENTS.md (not hooks); memory via .claude/memory/ auto-memory system; new skills: memory-management, code-review, simplify
- Skills strategy: COPY skills 1:1 from Superpowers and GSD reference repos FIRST, THEN adapt to MAXSIM. Both repos are well-written. Reference: `docs/superpowers-reference/skills/` and `docs/get-shit-done-reference/`
- npx maxsimcli = starts Core Server (not dashboard). Dashboard is a separate command on top.
- .mcp.json auto-discovery replaces need for session-start hook -- Claude Code natively spawns stdio servers from .mcp.json
- MCP install is optional (graceful fallback to Bash tools router) -- MCP enhances but is not required
- [Phase 01]: Template stubs (CONTEXT.md, RESEARCH.md) scaffolded in mcp_create_phase and mcp_insert_phase with placeholder content

### Pending Todos

None yet.

### Blockers/Concerns

- MCP server stub exists at `packages/dashboard/src/mcp-server.ts` — dashboard uses separate server; cli now has its own MCP server at `packages/cli/src/mcp-server.ts`
- `@modelcontextprotocol/sdk ^1.27.1` now installed in both cli and dashboard packages
- `output()`/`error()` call `process.exit()` from core layer — QUAL-02 (Phase 2) must fix before adding more cmd* functions
- Windows `find` bug affects `cmdInitExisting` and `cmdInitNewProject` in `packages/cli/src/core/init.ts` lines 488, 844
- Dashboard launch duplicate: `packages/cli/src/cli.ts` lines 418-618 vs `packages/cli/src/install.ts` lines 1953-2100
- Reference repos cloned at `docs/get-shit-done-reference/` and `docs/superpowers-reference/` — study for implementation patterns

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed Phases 7-9 (Discussion, Planning Skills, Dashboard Overhaul) -- 9 of 10 phases complete, only Phase 10 (Performance) remains
Resume file: None
