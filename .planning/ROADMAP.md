# Roadmap: MAXSIM NX Monorepo Migration

## Overview

The existing CommonJS monolith (`maxsim/bin/maxsim-tools.cjs` + 11 `lib/*.cjs` modules) is rewritten as a clean NX 22.5.x monorepo with 5 packages, TypeScript source, tsdown compilation, and Vitest tests. The migration follows the dependency graph: scaffold first, then `packages/core` (everything depends on it), then adapters and hooks in parallel, then the static templates package, then the published `packages/cli` last (depends on all others), and finally test migration. The end-user install UX — `npx maxsim@latest` — is unchanged throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: NX Workspace Scaffold** - Initialize NX 22.5.x workspace with pnpm, tsdown, Vitest, and all 5 package stubs registered and wired
- [x] **Phase 2: packages/core TypeScript Port** - Port all 11 lib modules from CJS to TypeScript with strict mode, building to CJS via tsdown (completed 2026-02-23)
- [ ] **Phase 3: packages/adapters + packages/hooks** - Port adapter layer (4 runtimes, single package) and all 3 hooks to TypeScript
- [ ] **Phase 4: packages/templates** - Register markdown assets as NX project with implicit dependency tracking for cache propagation
- [ ] **Phase 5: packages/cli + End-to-End** - Port CLI entrypoint, wire all dependencies, validate published package with npm pack
- [x] **Phase 6: Test Migration** - Port all 8 test files from node:test to Vitest 4 with correct timeout and coverage config (completed 2026-02-23)
- [ ] **Phase 7: Wire Hooks into CLI Package** - Add @maxsim/hooks to CLI dependencies/bundledDependencies, fix hooksSrc resolution, validate tarball includes hooks
- [x] **Phase 8: Fix commands/maxsim/ Path Resolution** - Restructure packages/templates/commands/ to include maxsim/ subdirectory, fixing install.ts ENOENT crash for all runtimes (completed 2026-02-24)
- [x] **Phase 9: End-to-end install and publish test loop** - Self-contained e2e test script with auto-bump-publish-retry loop (completed 2026-02-24)
- [x] **Phase 10: CLI UX — chalk, ora spinners, @inquirer/prompts** - Replace raw ANSI codes with chalk, add ora spinners, replace readline prompts with @inquirer/prompts (completed 2026-02-24)
- [ ] **Phase 11: Remove Discord command and deploy website via GitHub Pages** - Remove `/maxsim:join-discord` from shipped command set, set up GitHub Actions deploy workflow for GitHub Pages
- [x] **Phase 12: UX Polish + Core Hardening** - ASCII progress bars in `/maxsim:progress`, new `/maxsim:roadmap` read command, sanity check guard at workflow start, centralized `getPhasePattern()` helper, atomic ROADMAP.md writes, and zero silent `catch {}` blocks in `packages/core/src/` (completed 2026-02-24)
- [x] **Phase 13: Live Project Dashboard** - Real-time web dashboard (Swiss Style Design + Aceternity UI) showing current phase, progress bars, open tasks, and inline plan editing — launchable alongside MAXSIM (completed 2026-02-24)
- [x] **Phase 14: Dashboard npm Delivery** - Ship dashboard inside maxsimcli npm package via Next.js standalone build, installable and launchable via `npx maxsimcli dashboard` (completed 2026-02-24)

## Phase Details

### Phase 1: NX Workspace Scaffold
**Goal**: A working NX monorepo exists with all 5 packages registered, task graph wired, and build tooling installed — ready to receive TypeScript code
**Depends on**: Nothing (first phase)
**Requirements**: NX-01, NX-02, NX-03, NX-04, NX-05, NX-06, NX-07, BUILD-01
**Success Criteria** (what must be TRUE):
  1. `nx graph` shows all 5 packages (core, cli, adapters, hooks, templates) as nodes with correct dependency edges
  2. `nx affected:build` and `nx affected:test` resolve the correct package execution order without errors
  3. `pnpm install` from workspace root succeeds and all `workspace:*` package references resolve in `node_modules`
  4. `nx sync` runs without error and `tsconfig.json` project references are auto-maintained by the `@nx/js/typescript` plugin
  5. tsdown is installed at workspace root and `tsdown --help` confirms `format`, `platform`, and `outExtension` option names
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Initialize NX workspace root: pnpm-workspace.yaml, nx.json, tsconfig.base.json, tsdown install + smoke test
- [ ] 01-02-PLAN.md — Create all 5 package stubs with correct package.json, project.json, tsconfig.json, and workspace:* dependency wiring
- [ ] 01-03-PLAN.md — Run nx sync, validate TypeScript project references, confirm nx graph and affected:build resolution
- [ ] 01-04-PLAN.md — Gap closure: re-scope NX-02 to defer @nx/vitest/plugin to Phase 6 (TEST-01)

### Phase 2: packages/core TypeScript Port
**Goal**: All 11 domain lib modules exist as typed TypeScript source in `packages/core`, build to CJS via tsdown, and are importable by other packages via `@maxsim/core`
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, BUILD-02, BUILD-03
**Success Criteria** (what must be TRUE):
  1. `nx build core` succeeds and produces CJS output with `.cjs` extensions in `packages/core/dist/`
  2. TypeScript strict mode passes with zero errors across all 11 ported modules
  3. All public functions and types are exported from `packages/core/src/index.ts` with no untyped `any` in the barrel export
  4. A test package that imports `@maxsim/core` via `workspace:*` resolves correctly without path alias configuration
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — tsdown build config + types.ts + core.ts foundation
- [ ] 02-02-PLAN.md — Port frontmatter.ts + config.ts (Level 1 modules)
- [ ] 02-03-PLAN.md — Port state.ts + roadmap.ts + milestone.ts (Level 1 modules)
- [ ] 02-04-PLAN.md — Port commands.ts + phase.ts (Level 2 modules)
- [ ] 02-05-PLAN.md — Port verify.ts + template.ts (Level 2 modules)
- [ ] 02-06-PLAN.md — Port init.ts + finalize barrel export + build validation

### Phase 3: packages/adapters + packages/hooks
**Goal**: The adapter layer (all 4 AI runtime install paths) and all 3 hook bundles exist as TypeScript, compiled to standalone CJS, and verified against the current runtime path conventions
**Depends on**: Phase 2
**Requirements**: ADPT-01, ADPT-02, ADPT-03, ADPT-04, ADPT-05, ADPT-06, HOOK-01, HOOK-02, HOOK-03
**Success Criteria** (what must be TRUE):
  1. `nx build adapters` succeeds and the package exposes sub-path exports (`./claude`, `./opencode`, `./gemini`, `./codex`) resolvable at runtime
  2. `nx build hooks` succeeds and produces 3 standalone CJS bundles equivalent to the current `hooks/dist/` output
  3. Each runtime adapter's install paths match the current `bin/install.js` behavior for Claude, OpenCode, Gemini CLI, and Codex
  4. `packages/adapters` imports `@maxsim/core` via `workspace:*` and TypeScript resolves the types without errors
**Plans**: 6 plans

Plans:
- [ ] 03-01-PLAN.md — Adapter build pipeline, core types, and Claude adapter port
- [ ] 03-02-PLAN.md — OpenCode, Gemini, and Codex adapters with content transforms
- [ ] 03-03-PLAN.md — Port all 3 hooks to TypeScript with standalone CJS bundles
- [ ] 03-04-PLAN.md — Snapshot parity tests: all 4 adapters vs bin/install.js regression guard
- [ ] 03-05-PLAN.md — Gap closure: wire Gemini TOML and Codex skill conversion in transformContent
- [ ] 03-06-PLAN.md — Gap closure: activate all 18 skipped snapshot parity tests

### Phase 4: packages/templates
**Goal**: All markdown assets live under `packages/templates/` as a registered NX project, and changes to any template file correctly invalidate the `packages/cli` NX cache
**Depends on**: Phase 1
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. `nx graph` shows `packages/templates` as a leaf node (no outgoing dependencies) with `packages/cli` depending on it
  2. Modifying any file under `packages/templates/` causes `nx affected` to flag `packages/cli` as affected
  3. All markdown assets (commands, workflows, agents, templates, references) are present under `packages/templates/` with no missing files versus the original root directories
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Copy all markdown assets into packages/templates and verify NX project config
- [ ] 04-02-PLAN.md — Rewrite @path references to package-relative paths and verify NX affected detection

### Phase 5: packages/cli + End-to-End
**Goal**: The CLI entrypoint and dispatch router are ported to TypeScript, the published package contains all markdown assets, and `npx maxsim@latest` installs correctly from a clean environment
**Depends on**: Phase 3, Phase 4
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, PUB-01, PUB-02, PUB-03, PUB-04, BUILD-04
**Success Criteria** (what must be TRUE):
  1. `nx build cli` runs the full dependency chain (core → adapters → templates → cli) and all packages produce CJS output
  2. `npm pack --dry-run` from `packages/cli` lists all markdown assets (commands, workflows, agents, templates) alongside the compiled JS files
  3. `npx maxsim@latest` installs the correct files into Claude Code's config directory from a clean environment
  4. `nx release --dry-run` scopes version bump and publish to `packages/cli` only, leaving internal packages untouched
  5. The `package.json` `bin` field points to the correct compiled entrypoint and the shebang `#!/usr/bin/env node` is preserved
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md — tsdown config, package.json publish fields, project.json build target
- [ ] 05-02-PLAN.md — Port maxsim-tools.cjs dispatch router to TypeScript (cli.ts)
- [ ] 05-03-PLAN.md — Port bin/install.js to TypeScript (install.ts)
- [ ] 05-04-PLAN.md — nx release config, npm pack validation, end-to-end verification

### Phase 6: Test Migration
**Goal**: All 8 existing test files are ported from `node:test` to Vitest 4, all tests pass green, and the Vitest configuration handles subprocess timeouts and coverage exclusions correctly
**Depends on**: Phase 2
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. `nx run-many --target=test` passes with zero failures across all packages
  2. No `node:test` imports remain anywhere in the test suite
  3. Subprocess-based integration tests complete without timeout errors (30-second limit applied)
  4. Coverage report runs without errors and documents that `execSync`-spawned code shows 0% as a known limitation (not a failure)
  5. `createTempProject` and `runMaxsimTools` test helpers are typed TypeScript with correct Windows path separator handling
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md — Vitest install, config, typed helpers, NX test target
- [ ] 06-02-PLAN.md — Port verify, milestone, init, roadmap tests to Vitest
- [ ] 06-03-PLAN.md — Port state, commands, phase tests to Vitest
- [ ] 06-04-PLAN.md — Delete old CJS test files and validate full green suite
- [ ] 06-05-PLAN.md — Gap closure: skip 2 dollar-sign shell interpolation failures

### Phase 7: Wire Hooks into CLI Package
**Goal**: `@maxsim/hooks` is wired into `packages/cli` so that `npx maxsim@latest` installs hooks correctly, closing the integration gap between Phase 3 and Phase 5
**Depends on**: Phase 3, Phase 5
**Requirements**: HOOK-01, HOOK-02, HOOK-03, CLI-05, PUB-01, PUB-02, BUILD-02
**Gap Closure:** Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. `@maxsim/hooks` appears in `packages/cli/package.json` `dependencies` and `bundledDependencies`
  2. `install.ts` hooksSrc resolution finds `@maxsim/hooks` dist files within the installed package
  3. `npm pack --dry-run` from `packages/cli` lists hooks JS files in the tarball
  4. BUILD-02 checkbox is `[x]` in REQUIREMENTS.md
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Wire @maxsim/hooks as bundled dependency and fix hooksSrc resolution in install.ts
- [ ] 07-02-PLAN.md — npm pack validation test for hooks presence and requirements traceability update

### Phase 8: Fix commands/maxsim/ Path Resolution
**Goal**: The `commands/maxsim/` subdirectory structure in `packages/templates` matches what `install.ts` expects, so `npx maxsim@latest` installs all 31 command files without ENOENT errors for any runtime
**Depends on**: Phase 5, Phase 7
**Requirements**: CLI-05, PUB-02
**Gap Closure:** Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. `packages/templates/commands/maxsim/` exists and contains all 31 command `.md` files
  2. `install.ts` `fs.readdirSync(commands/maxsim/)` resolves without ENOENT
  3. `npm pack --dry-run` from `packages/cli` lists `commands/maxsim/*.md` files in the tarball
  4. All 4 runtime adapters (Claude, OpenCode, Gemini, Codex) install commands without error

**Plans:** 1/1 plans complete

Plans:
- [ ] 08-01-PLAN.md — Restructure templates/commands/ to commands/maxsim/, update pack validation, E2E verify

### Phase 9: End-to-end install and publish test loop
**Goal**: A self-contained test script validates the live published maxsimcli npm package from a fresh-install perspective, and — if it fails — automatically bumps the patch version, rebuilds, publishes, polls the registry, and retries (max 3 cycles) until the install passes or escalates to human
**Depends on:** Phase 8
**Requirements**: PUB-02
**Plans:** 2/2 plans complete

Plans:
- [ ] 09-01-PLAN.md — Write scripts/e2e-test.cjs with isolated install check and bump-build-publish helper
- [ ] 09-02-PLAN.md — Run e2e test against live package, fix-publish-retry until green, human sign-off

## Progress

**Execution Order:**
Phases execute in dependency order: 1 → 2 → 3 → 4 → 5, with Phase 6 executable after Phase 2 completes. Phases 3 and 4 are independent of each other and can run in any order after Phase 2. Phases 7–12 execute sequentially in dependency order.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. NX Workspace Scaffold | 2/3 | In Progress|  |
| 2. packages/core TypeScript Port | 6/6 | Complete    | 2026-02-23 |
| 3. packages/adapters + packages/hooks | 0/4 | Not started | - |
| 4. packages/templates | 1/2 | In Progress|  |
| 5. packages/cli + End-to-End | 0/TBD | Not started | - |
| 6. Test Migration | 0/4 | Complete    | 2026-02-23 |
| 7. Wire Hooks into CLI Package | 2/2 | Complete | 2026-02-24 |
| 8. Fix commands/maxsim/ Path Resolution | 1/1 | Complete   | 2026-02-24 |
| 9. End-to-end install and publish test loop | 2/2 | Complete   | 2026-02-24 |
| 10. CLI UX — chalk, ora, @inquirer/prompts | 2/2 | Complete | 2026-02-24 |
| 11. Remove Discord command and deploy website via GitHub Pages | 2/2 | Complete | 2026-02-24 |
| 12. UX Polish + Core Hardening | 1/3 | In Progress | - |
| 13. Live Project Dashboard | 8/8 | Complete   | 2026-02-24 |
| 14. Dashboard npm Delivery | 3/3 | Complete | 2026-02-24 |

### Phase 10: CLI UX — chalk, ora spinners, @inquirer/prompts

**Goal:** Replace raw ANSI escape codes with chalk, add ora spinners during file install operations, and replace all readline-based prompts with @inquirer/prompts for a polished interactive install experience
**Depends on:** Phase 9
**Requirements:** UX-01, UX-02, UX-03
**Plans:** 2 plans

**Success Criteria:**
1. All raw ANSI color constants (`\x1b[36m` etc.) removed from install.ts; chalk used throughout
2. `promptRuntime()` uses @inquirer/prompts `checkbox` — arrow-key navigation, multi-select
3. `promptLocation()` uses @inquirer/prompts `select` — arrow-key navigation
4. `handleStatusline()` uses @inquirer/prompts `confirm`
5. ora spinner wraps file copy groups in install() with `.start()` / `.succeed()` / `.fail()`
6. `nx build cli` passes with 0 TypeScript errors after all changes
7. `node packages/cli/dist/install.cjs --help` shows clean chalk-colored output

Plans:
- [x] 10-01-PLAN.md — Add chalk/ora/@inquirer/prompts deps; replace ANSI constants with chalk; build green
- [x] 10-02-PLAN.md — Replace readline prompts with @inquirer/prompts; add ora spinners; async IIFE entry

### Phase 11: Remove Discord command and deploy website via GitHub Pages

**Goal:** Remove the `/maxsim:join-discord` command from the shipped command set and update all command count references; set up a GitHub Actions workflow to build `packages/website` and deploy it to GitHub Pages automatically on push to main
**Depends on:** Phase 10
**Requirements:** CMD-REMOVE-01, CMD-REMOVE-02, WEBSITE-DEPLOY-01, WEBSITE-DEPLOY-02, WEBSITE-DEPLOY-03
**Plans:** 2 plans

**Success Criteria:**
1. `join-discord.md` is removed from `packages/templates/commands/maxsim/` and no longer shipped to user environments
2. All hardcoded "31 commands" count references updated to "30" across CLAUDE.md, website, and docs
3. A GitHub Actions workflow (`deploy-website.yml`) exists with push-to-main trigger, upload-pages-artifact + deploy-pages, and correct permissions
4. `packages/website/public/CNAME` contains `maxsimcli.dev`; `nx build website` succeeds

Plans:
- [ ] 11-01-PLAN.md — Remove join-discord.md from templates; update "31" count references in CLAUDE.md, website Docs.tsx, and docs/USER-GUIDE.md; remove from help.md workflow
- [ ] 11-02-PLAN.md — Add packages/website/project.json NX build target; create CNAME file; create .github/workflows/deploy-website.yml

### Phase 12: UX Polish + Core Hardening

**Goal:** Improve developer-facing UX of the `/maxsim:progress` command (ASCII phase progress bars), add a dedicated `/maxsim:roadmap` read command, add a sanity check guard at workflow start, centralize all phase regex patterns into a single `getPhasePattern()` helper in `packages/core/src/core.ts`, make all ROADMAP.md write operations atomic (build in memory, single write), and eliminate all silent `catch {}` blocks across `packages/core/src/`.
**Depends on:** Phase 11
**Requirements:** None new — internal quality and UX improvements
**Success Criteria** (what must be TRUE):
  1. `/maxsim:progress` output shows ASCII progress bars per phase (e.g. `[██████░░░░] 60%`)
  2. `/maxsim:roadmap` command exists and renders ROADMAP.md with status icons in a readable format
  3. A sanity check runs at the start of execute/plan workflows and warns if `.planning/` is missing or corrupt
  4. A single `getPhasePattern(phaseNum?: string)` function in `packages/core/src/core.ts` replaces all inline phase regex literals across the codebase
  5. ROADMAP.md updates in `phase.ts` and `roadmap.ts` use a read-modify-write helper that writes once per operation
  6. Zero silent `catch {}` blocks remain in `packages/core/src/` — each has either a comment or a `logger.debug()` call
  7. `nx build core` passes with 0 TypeScript errors
**Plans:** 3 plans

Plans:
- [ ] 12-01-PLAN.md — Add `getPhasePattern()` to core.ts; replace all inline phase regex in phase.ts, roadmap.ts, verify.ts; atomic write helper; fix silent catch blocks; build green
- [ ] 12-02-PLAN.md — Update `/maxsim:progress` workflow to render ASCII progress bars; add `/maxsim:roadmap` command file; add sanity check guard to execute/plan workflows
- [ ] 12-03-PLAN.md — Integration validation — nx build clean, run tests, verify progress/roadmap commands render correctly

### Phase 13: Live Project Dashboard

**Goal:** A real-time web dashboard that can be launched alongside MAXSIM (e.g. via `maxsim dashboard` or auto-started during phase execution). It displays the current phase, per-phase progress bars, completion percentages, open tasks/blockers, and allows basic inline plan editing — all styled with Swiss Style Design principles using Aceternity UI animated components.
**Requirements**: TBD (internal quality — no formal requirement IDs)
**Depends on:** Phase 12
**Plans:** 8/8 plans complete

**Success Criteria** (what must be TRUE):
  1. `packages/dashboard` is a buildable Next.js 15 App Router application registered as an NX project
  2. Dashboard launches via `maxsim dashboard` CLI command and auto-detects free port from 3333
  3. Real-time file watching via chokidar + WebSocket pushes updates to browser within sub-second latency
  4. Phase overview shows all phases with animated progress bars, status icons, and current phase highlight
  5. Phase drill-down shows plan tasks with toggleable checkboxes and CodeMirror Markdown editor
  6. Sidebar navigation provides access to phase list, todos panel, and blockers panel
  7. Swiss Style Design: dark theme, mono+sans typography, data-dense, mission control aesthetic

Plans:
- [ ] 13-01-PLAN.md — Scaffold packages/dashboard NX package with Next.js 15, Tailwind v4, Aceternity UI, and all dependencies
- [ ] 13-02-PLAN.md — Custom server with WebSocket integration, chokidar file watcher, and React WebSocket provider
- [ ] 13-03-PLAN.md — Data layer: lib/parsers.ts wrappers around @maxsim/core + 7 API route handlers
- [ ] 13-04-PLAN.md — Dashboard main view: stats header with milestone progress and phase overview with animated progress bars
- [ ] 13-05-PLAN.md — Phase drill-down: plan cards with task checkboxes and CodeMirror Markdown editor
- [ ] 13-06-PLAN.md — Sidebar navigation, todos panel, blockers panel, and STATE.md editing
- [ ] 13-07-PLAN.md — CLI integration: maxsim dashboard command with subprocess launch and health check
- [ ] 13-08-PLAN.md — Integration validation and visual polish with human verification

### Phase 14: Dashboard npm Delivery

**Goal:** Ship the dashboard as part of the maxsimcli npm package so that `npx maxsimcli dashboard` works for end users after install — no separate packages, no additional setup. Next.js `output: "standalone"` produces a self-contained build bundled into `dist/assets/dashboard/`, copied to `.claude/dashboard/` during install, and launched via `node .claude/dashboard/server.js`.
**Requirements**: DASH-01 through DASH-09 (internal delivery, mapped to success criteria below)
**Depends on:** Phase 13
**Plans:** 3/3 plans complete

**Success Criteria** (what must be TRUE):
  1. [DASH-01] `next.config.mjs` uses `output: "standalone"` for production builds (env-var guard for dev)
  2. [DASH-02] Custom `server.ts` is bundled into the standalone output (tsdown bundle with ws, chokidar, detect-port, open)
  3. [DASH-03] `.next/static/` is copied into `.next/standalone/.next/static/` (Next.js requirement)
  4. [DASH-04] `copy-assets.cjs` copies standalone build to `dist/assets/dashboard/`
  5. [DASH-05] `install.ts` copies dashboard to `.claude/dashboard/` during local install and writes `dashboard.json` with `projectCwd`
  6. [DASH-06] `npx maxsimcli dashboard` runs `node .claude/dashboard/server.js` with correct `MAXSIM_PROJECT_CWD`
  7. [DASH-07] `project.json` (CLI) lists dashboard as implicit dependency so NX builds it first
  8. [DASH-08] CI `publish.yml` ensures dashboard build completes before CLI build
  9. [DASH-09] README documents the dashboard launch command

Plans:
- [ ] 14-01-PLAN.md — Configure Next.js standalone build with env-var guard, tsdown server bundling config, and build:standalone script
- [ ] 14-02-PLAN.md — Extend copy-assets.cjs for dashboard, add NX implicit dependency, wire install.ts dashboard copy, rework CLI launch
- [ ] 14-03-PLAN.md — Update CI publish.yml with STANDALONE_BUILD env var, validate tarball, add dashboard section to README
