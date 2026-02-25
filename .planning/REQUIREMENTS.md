# Requirements: MAXSIM v2.0.0 Stabilization

**Defined:** 2026-02-24
**Core Value:** `npx maxsimcli@latest` installs a complete AI dev workflow system that works immediately — validated end-to-end from the npm consumer perspective, not the monorepo perspective.

---

## v1.0 Requirements (Archived — all satisfied)

All 42 v1.0 requirements (NX-01 through PUB-04) are satisfied. See `.planning/v1.0-MILESTONE-AUDIT.md` for the full audit report.

---

## v2.0.0 Requirements

### E2E Infrastructure

- [ ] **E2E-01**: `packages/e2e` NX package exists with `private: true`, `implicitDependencies: ["cli", "dashboard"]`, `dependsOn: cli:build`, `cache: false`, and an `e2e` NX target that runs Vitest with the E2E config
- [x] **E2E-02**: globalSetup runs `npm pack` from `packages/cli/dist/` and installs via local tarball to a `mkdtempSync` temp directory — never hits the npm registry
- [x] **E2E-03**: install.test.ts validates exact file counts post-install: exactly 31 command `.md` files, exactly 11 agent `.md` files, known workflow directory structure
- [x] **E2E-04**: Binary smoke test: `maxsimcli --version` exits 0 from the installed temp path

### Tool Behavioral Tests

All tests use a shared **mock project fixture** — a temp directory with realistic `.planning/` structure (PROJECT.md, ROADMAP.md, STATE.md, phases/, todos/pending/, todos/completed/). Tests simulate real user interactions against installed `maxsim-tools.cjs`.

- [x] **TOOL-01**: User runs `phases list` against mock project → returns list of phases matching mock ROADMAP.md; user runs `phase add "Test Phase"` → phase appears in ROADMAP.md; user runs `phase complete` → phase marked complete in ROADMAP.md
- [x] **TOOL-02**: User runs state commands against mock project: `state read` → returns STATE.md content; `log-decision "decision" "rationale"` → STATE.md updated; `add-blocker "blocker"` → STATE.md updated
- [x] **TOOL-03**: User runs roadmap commands against mock project: `roadmap parse` → returns structured data matching mock ROADMAP.md
- [x] **TOOL-04**: User runs todo commands against mock project: `todo add "task"` → creates file in `todos/pending/`; `todo list` → returns pending todos; `todo complete` → moves file to `todos/completed/`
- [x] **TOOL-05**: User runs `milestone` and `verify` commands against mock project — exit 0 with expected output
- [x] **TOOL-06**: Mock project fixture is a reusable test helper covering all command groups (produces valid PROJECT.md, ROADMAP.md with phases, STATE.md with decisions, phase dirs with PLAN.md files, todos)

### Dashboard Read Tests

Dashboard spawned with `MAXSIM_PROJECT_CWD` pointing to the mock project fixture. Tests assert API responses match the mock data files.

- [x] **DASH-01**: Dashboard server spawns from installed path, starts without errors, `/api/health` returns `{ status: 'ok' }` within 30s
- [x] **DASH-02**: `/api/project` returns data matching mock PROJECT.md (project name, core value present)
- [x] **DASH-03**: `/api/phases` returns phases array matching mock ROADMAP.md (correct phase count, names, statuses)
- [x] **DASH-04**: `/api/state` returns data matching mock STATE.md (decisions, blockers present)
- [x] **DASH-05**: `/api/todos` returns todos array matching mock `todos/` directory (pending todos present)

### Dashboard Write Tests

- [x] **DASH-06**: Task checkbox toggle via dashboard API (e.g. PATCH /api/phases/:id/tasks/:taskId) updates the corresponding plan `.md` file on disk with `[x]` marking
- [x] **DASH-07**: STATE.md edit via dashboard API (PUT /api/state) writes updated content to the mock STATE.md file on disk

### Dashboard Terminal

- [x] **DASH-TERM-01**: Terminal tab spawns Claude Code as PTY child process on the server with configurable `--dangerously-skip-permissions` flag
- [x] **DASH-TERM-02**: All stdout/stderr including ANSI escape codes streamed via WebSocket and rendered in xterm.js
- [x] **DASH-TERM-03**: Keyboard input forwarded from browser to server process stdin in real-time
- [x] **DASH-TERM-04**: Quick-action buttons send predefined MAXSIM slash commands to the running process
- [x] **DASH-TERM-05**: WebSocket reconnection within 60 seconds reattaches to still-running process with scrollback preserved

### Planning Cleanup

- [ ] **DOCS-01**: ROADMAP.md phase statuses match actual codebase state — all completed phases marked `[x]`, no stale "In Progress" entries that have shipped

### CI Integration

- [x] **CI-01**: GitHub Actions E2E job runs `nx run e2e:e2e` on push to main, after `cli:build` with `STANDALONE_BUILD=true`, and gates on green E2E before publish

---

## Future Requirements (v2.x+)

- Multi-runtime install validation (OpenCode, Gemini, Codex) — after Claude runtime is green
- Browser-level Playwright dashboard tests (visual correctness) — v3 scope
- Content-level frontmatter validation of installed command files — low priority
- Dashboard data write tests: plan file creation, state reset — v2.1

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| E2E-01 | Phase 15 → Phase 23 | In Progress |
| DOCS-01 | Phase 15 → Phase 23 | In Progress |
| E2E-02 | Phase 16 | Satisfied |
| E2E-03 | Phase 16 | Satisfied |
| E2E-04 | Phase 16 | Satisfied |
| TOOL-01 | Phase 16 | Satisfied |
| TOOL-02 | Phase 16 | Satisfied |
| TOOL-03 | Phase 16 | Satisfied |
| TOOL-04 | Phase 16 | Satisfied |
| TOOL-05 | Phase 16 | Satisfied |
| TOOL-06 | Phase 16 | Satisfied |
| DASH-01 | Phase 17 → Phase 22 | Complete |
| DASH-02 | Phase 17 → Phase 22 | Complete |
| DASH-03 | Phase 17 → Phase 22 | Complete |
| DASH-04 | Phase 17 → Phase 22 | Complete |
| DASH-05 | Phase 17 → Phase 22 | Complete |
| DASH-06 | Phase 18 → Phase 22 | Complete |
| DASH-07 | Phase 18 → Phase 22 | Complete |
| CI-01 | Phase 19 → Phase 22 | Complete |
| DASH-TERM-01 | Phase 21 → Phase 22 | Complete |
| DASH-TERM-02 | Phase 21 | Satisfied |
| DASH-TERM-03 | Phase 21 | Satisfied |
| DASH-TERM-04 | Phase 21 | Satisfied |
| DASH-TERM-05 | Phase 21 | Satisfied |
