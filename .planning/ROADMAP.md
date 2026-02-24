# Roadmap: MAXSIM v2.0.0 Stabilization

## Overview

MAXSIM shipped v1.0 with 42 requirements fully satisfied — NX monorepo, TypeScript, CLI UX, 30 commands, live dashboard, CI publish pipeline. v2.0.0 is a stabilization milestone: fix bugs, establish real E2E test coverage that proves the npm delivery mechanism works end-to-end, and clean up planning docs.

The core test is: `npm pack` from `packages/cli` → install to temp directory → binary executes → dashboard boots → all assertions pass. This pipeline never hit the npm registry in v1.0. v2.0.0 closes that gap.

All 14 v1.0 phases are archived. v2.0.0 continues from Phase 15.

---

## Phases

- [x] **Phase 15: E2E Package Scaffold** - Create `packages/e2e` NX package with correct wiring and clean ROADMAP docs
- [x] **Phase 16: Pack + Install + Tool Tests** - Full globalSetup pipeline plus file validation, binary smoke tests, and tool behavioral tests against a mock project fixture (completed 2026-02-24)
- [ ] **Phase 17: Dashboard Read Tests** - Spawn dashboard server from installed path, validate all read API endpoints against mock fixture
- [ ] **Phase 18: Dashboard Write Tests** - Validate task checkbox toggle and STATE.md write APIs update files on disk
- [ ] **Phase 19: CI Integration** - Wire E2E suite into GitHub Actions, gate publish on green E2E

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
- [ ] 16-01-PLAN.md — Add --version flag to install.ts, wire globalSetup in vitest.config.ts, add ProvidedContext types
- [ ] 16-02-PLAN.md — Create globalSetup.ts pack+install pipeline and mock project fixture factory
- [ ] 16-03-PLAN.md — Create install.test.ts and tools.test.ts with all behavioral assertions

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
**Plans**: TBD

### Phase 18: Dashboard Write Tests
**Goal**: The dashboard write APIs mutate files on disk correctly — task checkbox toggles persist as `[x]` in plan files, and STATE.md edits persist the full updated content
**Depends on**: Phase 17
**Requirements**: DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. A PATCH request to the task toggle endpoint updates the corresponding plan `.md` file on disk — re-reading the file shows `[x]` marking on the targeted task
  2. A PUT request to `/api/state` writes the updated content to the mock `STATE.md` file — re-reading the file returns the new content
**Plans**: TBD

### Phase 19: CI Integration
**Goal**: GitHub Actions runs `nx run e2e:e2e` on every push to main, after `cli:build` with `STANDALONE_BUILD=true`, and a failing E2E suite blocks the publish job
**Depends on**: Phase 18
**Requirements**: CI-01
**Success Criteria** (what must be TRUE):
  1. A push to main triggers the E2E job in GitHub Actions with `STANDALONE_BUILD=true` set on the build step
  2. The E2E job runs after `cli:build` completes (correct `needs:` dependency)
  3. A deliberate test failure in the E2E suite causes the publish job to be skipped — the gating is verified
  4. The E2E NX target has `"cache": false` so CI never serves stale results from a previous run
**Plans**: TBD

---

## Progress

**Execution Order:** 15 → 16 → 17 → 18 → 19 (strict sequential — each phase depends on the previous)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 15. E2E Package Scaffold | 1/1 | Complete | 2026-02-24 |
| 16. Pack + Install + Tool Tests | 3/3 | Complete | 2026-02-25 |
| 17. Dashboard Read Tests | 0/TBD | Not started | - |
| 18. Dashboard Write Tests | 0/TBD | Not started | - |
| 19. CI Integration | 0/TBD | Not started | - |
