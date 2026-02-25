# Roadmap: MAXSIM v2.0.0 Stabilization

## Overview

MAXSIM shipped v1.0 with 42 requirements fully satisfied — NX monorepo, TypeScript, CLI UX, 30 commands, live dashboard, CI publish pipeline. v2.0.0 is a stabilization milestone: fix bugs, establish real E2E test coverage that proves the npm delivery mechanism works end-to-end, and clean up planning docs.

The core test is: `npm pack` from `packages/cli` → install to temp directory → binary executes → dashboard boots → all assertions pass. This pipeline never hit the npm registry in v1.0. v2.0.0 closes that gap.

All 14 v1.0 phases are archived. v2.0.0 continues from Phase 15.

---

## Phases

- [x] **Phase 15: E2E Package Scaffold** - Create `packages/e2e` NX package with correct wiring and clean ROADMAP docs
- [x] **Phase 16: Pack + Install + Tool Tests** - Full globalSetup pipeline plus file validation, binary smoke tests, and tool behavioral tests against a mock project fixture (completed 2026-02-24)
- [x] **Phase 17: Dashboard Read Tests** - Spawn dashboard server from installed path, validate all read API endpoints against mock fixture (completed 2026-02-24)
- [x] **Phase 18: Dashboard Write Tests** - Validate task checkbox toggle and STATE.md write APIs update files on disk (completed 2026-02-25)
- [x] **Phase 19: CI Integration** - Wire E2E suite into GitHub Actions, gate publish on green E2E (completed 2026-02-25)
- [x] **Phase 20: Dashboard Migrate to Vite + Express** - Replace Next.js standalone with Vite (client build) + tsdown-bundled Express server for reliable npm packaging (completed 2026-02-25)
- [x] **Phase 21: Interactive Claude Code Terminal** - Browser-based terminal in the dashboard that spawns and controls Claude Code via PTY + WebSocket with xterm.js rendering and session persistence (completed 2026-02-25)
- [x] **Phase 22: Fix node-pty Delivery (Lazy-Load)** - Lazy-load node-pty so dashboard server starts without native addon; terminal degrades gracefully (completed 2026-02-25)
- [x] **Phase 23: E2E Wiring & Next.js Cleanup** - Add dashboard:build to e2e dependsOn, remove orphaned Next.js files, fix ROADMAP/REQUIREMENTS staleness (completed 2026-02-25)
- [ ] **Phase 24: Fix Terminal Status Parsing & Quick Actions** - Fix status parse bug in use-terminal.ts that disables quick-action buttons and breaks status bar
- [ ] **Phase 25: Planning Doc Hygiene** - Fix stale traceability, backfill SUMMARY.md frontmatter, add missing VERIFICATIONs, portable pre-push hook

---

## Phase Details

### Phase 15: E2E Package Scaffold
**Goal**: A runnable `nx run e2e:e2e` NX target exists with correct dependency wiring, and ROADMAP.md phase statuses accurately reflect the shipped codebase
**Depends on**: Nothing (first v2.0.0 phase; builds on completed v1.0)
**Requirements**: E2E-01, DOCS-01
**Success Criteria** (what must be TRUE):
  1. `nx run e2e:e2e` executes without error from the repo root (zero assertions is acceptable at this phase — the scaffold runs)
  2. `nx graph` shows `packages/e2e` with `implicitDependencies` on `cli` and `dashboard`, and `dependsOn: cli:build` in the `e2e` target
  3. `nx affected` correctly marks `packages/e2e` as affected when `packages/cli` changes
  4. ROADMAP.md phase checkboxes match actual codebase state — all phases that shipped in v1.0 are marked `[x]` with no stale "In Progress" entries
**Plans**: 1 plan

Plans:
- [x] 15-01-PLAN.md — Create packages/e2e scaffold and verify ROADMAP.md cleanup

### Phase 16: Pack + Install + Tool Tests
**Goal**: The full E2E pipeline runs — `npm pack` produces a local tarball, install writes files to a temp directory, and passing assertions prove exactly 31 commands, exactly 11 agents, binary execution, and correct tool behavior against a mock project fixture
**Depends on**: Phase 15
**Requirements**: E2E-02, E2E-03, E2E-04, TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06
**Success Criteria** (what must be TRUE):
  1. `globalSetup.ts` runs `npm pack` from `packages/cli/` and installs via local tarball to a `mkdtempSync` temp directory — registry is never contacted
  2. `install.test.ts` asserts exactly 31 command `.md` files, exactly 11 agent `.md` files, and a known workflow directory structure in the installed temp path
  3. `node install.cjs --version` exits 0 from the installed temp path (binary smoke test)
  4. `tools.test.ts` runs phase, state, roadmap, and todo commands against a mock project fixture and all exit 0 with expected output
  5. The mock project fixture is a reusable shared helper covering all command groups — any test file can import and use it without re-creating it
**Plans**: 3 plans

Plans:
- [x] 16-01-PLAN.md — Add --version flag to install.ts, wire globalSetup in vitest.config.ts, add ProvidedContext types
- [x] 16-02-PLAN.md — Create globalSetup.ts pack+install pipeline and mock project fixture factory
- [x] 16-03-PLAN.md — Create install.test.ts and tools.test.ts with all behavioral assertions

### Phase 17: Dashboard Read Tests
**Goal**: The dashboard server boots from the installed path with `MAXSIM_PROJECT_CWD` pointing to the mock fixture, and all read-only API endpoints return data matching the mock files
**Depends on**: Phase 16
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. `dashboard.test.ts` spawns `node server.js` from the installed path, polls `/api/health` and receives `{ status: 'ok' }` within 30 seconds — no fixed-delay waits
  2. `/api/project` returns data that includes the mock project name and core value from the mock `PROJECT.md`
  3. `/api/phases` returns a JSON array with the correct phase count, names, and statuses from the mock `ROADMAP.md`
  4. `/api/state` returns data that includes decisions and blockers from the mock `STATE.md`
  5. `/api/todos` returns a JSON array that includes the pending todos from the mock `todos/` directory
**Plans**: 1 plan

Plans:
- [x] 17-01-PLAN.md — Fix mock fixture for dashboard compatibility and write dashboard.test.ts read API tests

### Phase 18: Dashboard Write Tests
**Goal**: The dashboard write APIs mutate files on disk correctly — task checkbox toggles persist as `[x]` in plan files, and STATE.md edits persist the full updated content
**Depends on**: Phase 17
**Requirements**: DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. A PATCH request to the task toggle endpoint updates the corresponding plan `.md` file on disk — re-reading the file shows `[x]` marking on the targeted task
  2. A PUT request to `/api/state` writes the updated content to the mock `STATE.md` file — re-reading the file returns the new content
**Plans**: 1 plan

Plans:
- [x] 18-01-PLAN.md — Add DASH-06 task toggle and DASH-07 STATE.md write API tests

### Phase 19: CI Integration
**Goal**: GitHub Actions runs `nx run e2e:e2e` on every push to main, after `cli:build` with `STANDALONE_BUILD=true`, and a failing E2E suite blocks the publish job
**Depends on**: Phase 18
**Requirements**: CI-01
**Success Criteria** (what must be TRUE):
  1. A push to main triggers the E2E job in GitHub Actions with `STANDALONE_BUILD=true` set on the build step
  2. The E2E job runs after `cli:build` completes (correct `needs:` dependency)
  3. A deliberate test failure in the E2E suite causes the publish job to be skipped — the gating is verified
  4. The E2E NX target has `"cache": false` so CI never serves stale results from a previous run
**Plans**: 1 plan

Plans:
- [x] 19-01-PLAN.md — Split publish.yml into e2e + release jobs with E2E gating

### Phase 20: Dashboard Migrate to Vite + Express
**Goal**: The dashboard ships as a Vite-built static `client/` folder served by a single tsdown-bundled `server.js` that includes Express, sirv, ws, chokidar and all API route logic — no `node_modules/` at the install destination, no pnpm symlinks, no path-resolution fragility
**Depends on**: Phase 19
**Success Criteria** (what must be TRUE):
  1. `vite build` produces `packages/dashboard/dist/client/` with `index.html` and hashed asset files
  2. `tsdown` bundles `packages/dashboard/src/server.ts` + all its dependencies into a single `packages/dashboard/dist/server.js`
  3. `node dist/server.js` starts the dashboard and serves the React app from `dist/client/` with WebSocket and all API routes functional
  4. The built `dist/` output (client + server.js only, no `node_modules/`) is copied into `packages/cli/dist/assets/dashboard/` by `copy-assets.cjs`
  5. `npx maxsimcli` installs and `npx maxsimcli dashboard` starts successfully on Linux (CI), Windows, and macOS — no EPERM, no missing module errors
**Plans**: 2 plans

Plans:
- [x] 20-01-PLAN.md — Build infrastructure: Vite config, tsdown config, package.json, copy-assets, install.ts cleanup
- [x] 20-02-PLAN.md — React + Express code migration: src/server.ts, src/main.tsx, App.tsx, move components/hooks, delete app/

### Phase 21: Interactive Claude Code Terminal
**Goal**: The MAXSIM Dashboard includes a browser-based terminal view that spawns Claude Code as a server-side background process (optionally in skip-permissions mode), streams its full ANSI output in real-time via WebSocket to an xterm.js terminal emulator in the frontend, accepts keyboard input forwarded back to the process, provides quick-action buttons for common MAXSIM commands (/maxsim:progress, /maxsim:execute-phase, /maxsim:roadmap), and preserves the session across brief browser disconnects so a running process is never interrupted
**Depends on**: Phase 20
**Requirements**: DASH-TERM-01, DASH-TERM-02, DASH-TERM-03, DASH-TERM-04, DASH-TERM-05
**Success Criteria** (what must be TRUE):
  1. A "Terminal" tab in the dashboard spawns `claude` (Claude Code CLI) as a PTY child process on the server with configurable `--dangerously-skip-permissions` flag
  2. All stdout/stderr output including ANSI escape codes is streamed via WebSocket to the browser and rendered correctly in an xterm.js terminal (colors, cursor positioning, line wrapping)
  3. Keyboard input typed in the browser terminal is forwarded to the server process stdin in real-time — interactive Claude Code sessions work end-to-end
  4. Quick-action buttons send predefined MAXSIM slash commands to the running Claude Code process
  5. The WebSocket connection supports automatic reconnection — if the browser tab is closed and reopened within 60 seconds, the terminal reattaches to the still-running process with scrollback history preserved
**Plans**: 4 plans

Plans:
- [x] 21-01-PLAN.md — Server-side PTY manager, session store, and terminal WebSocket endpoint
- [x] 21-02-PLAN.md — xterm.js Terminal React component, WebSocket hook, and status bar
- [x] 21-03-PLAN.md — Terminal tab integration into sidebar and App.tsx with split-panel mode
- [x] 21-04-PLAN.md — Quick-action button bar with confirmation, settings, and reconnection polish

### Phase 22: Fix node-pty Delivery (Lazy-Load)
**Goal**: Dashboard server starts without node-pty native addon present; terminal features degrade gracefully with a clear message instead of crashing the entire server
**Depends on**: Phase 21
**Requirements**: DASH-TERM-01, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, CI-01
**Gap Closure**: Closes critical blocker from v2.0 audit — all dashboard functionality broken for end users
**Success Criteria** (what must be TRUE):
  1. `node server.js` starts successfully even when `node-pty` is not installed — no crash, no unhandled exception
  2. All non-terminal API routes (`/api/health`, `/api/project`, `/api/phases`, `/api/state`, `/api/todos`) respond normally
  3. Terminal WebSocket endpoint returns a graceful error message when node-pty is unavailable instead of crashing
  4. When node-pty IS available, terminal features work exactly as before
**Plans**: 2 plans

Plans:
- [x] 22-01-PLAN.md — Server graceful degradation + frontend error card
- [x] 22-02-PLAN.md — E2E test for absent node-pty

### Phase 23: E2E Wiring & Next.js Cleanup
**Goal**: Fix e2e package dependency wiring, remove orphaned Next.js artifacts from Phase 20 migration, and update all stale planning doc statuses
**Depends on**: Phase 22
**Requirements**: E2E-01, DOCS-01
**Gap Closure**: Closes integration and tech debt gaps from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. `packages/e2e/project.json` has `dependsOn` including both `cli:build` and `dashboard:build`
  2. No orphaned Next.js files remain in `packages/dashboard/` (`app/`, `next.config.mjs`, `next-env.d.ts`, `postcss.config.mjs`)
  3. ROADMAP.md progress table shows correct status for all phases (19, 20 marked Complete)
  4. REQUIREMENTS.md traceability table includes DASH-TERM-01 through DASH-TERM-05 and has updated phase assignments
**Plans**: 2 plans

Plans:
- [x] 23-01-PLAN.md — E2E wiring fix and Next.js orphaned file cleanup
- [x] 23-02-PLAN.md — Planning doc audit and pre-push consistency hook

### Phase 24: Fix Terminal Status Parsing & Quick Actions
**Goal**: Fix the status message parsing bug in `use-terminal.ts` that cascades into permanently disabled quick-action buttons and broken status bar, plus fix the uptime unit mismatch
**Depends on**: Phase 23
**Requirements**: DASH-TERM-04
**Gap Closure**: Closes unsatisfied requirement, integration gap (Terminal → E2E), and broken flow from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. `use-terminal.ts` correctly destructures spread fields (`pid`, `uptime`, `cwd`, `memoryMB`, `isActive`, `skipPermissions`, `alive`) from WebSocket status messages instead of reading `msg.status`
  2. QuickActionBar buttons are enabled when the terminal process is active and alive
  3. TerminalStatusBar displays correct connection status, PID, uptime, and memory usage
  4. `TerminalStatusBar.formatUptime` receives milliseconds (or server sends milliseconds) — uptime displays correctly, not "0m 0s"

### Phase 25: Planning Doc Hygiene
**Goal**: Fix all stale traceability entries, backfill empty SUMMARY.md frontmatter, add missing VERIFICATION.md files for phases 15/18/19/20, and make pre-push hook portable via husky
**Depends on**: Phase 24
**Gap Closure**: Closes all remaining tech debt items from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. REQUIREMENTS.md traceability table shows "Satisfied" for E2E-01 and DOCS-01 (not "In Progress")
  2. DASH-TERM-04 checkbox reset to `[ ]` until Phase 24 satisfies it, then re-checked
  3. All 9 phase SUMMARY.md files have populated `requirements_completed` arrays
  4. VERIFICATION.md exists for phases 15, 18, 19, and 20
  5. Pre-push hook is auto-installed on fresh clones (husky prepare script or equivalent)

---

## Progress

**Execution Order:** 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 (strict sequential — each phase depends on the previous)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 15. E2E Package Scaffold | 1/1 | Complete | 2026-02-24 |
| 16. Pack + Install + Tool Tests | 3/3 | Complete | 2026-02-25 |
| 17. Dashboard Read Tests | 1/1 | Complete    | 2026-02-24 |
| 18. Dashboard Write Tests | 1/1 | Complete | 2026-02-25 |
| 19. CI Integration | 1/1 | Complete | 2026-02-25 |
| 20. Dashboard Migrate to Vite + Express | 2/2 | Complete | 2026-02-25 |
| 21. Interactive Claude Code Terminal | 4/4 | Complete | 2026-02-25 |
| 22. Fix node-pty Delivery (Lazy-Load) | 2/2 | Complete    | 2026-02-25 |
| 23. E2E Wiring & Next.js Cleanup | 2/2 | Complete    | 2026-02-25 |
| 24. Fix Terminal Status Parsing & Quick Actions | 0/0 | Pending | — |
| 25. Planning Doc Hygiene | 0/0 | Pending | — |
