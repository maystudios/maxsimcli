# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** `npx maxsimcli@latest` installs a complete AI dev workflow system that works immediately — validated end-to-end from the npm consumer perspective, not the monorepo perspective
**Current focus:** Phase 26 — Superpowers-Inspired Workflow Enhancements

## Current Position

Phase: 26 — Superpowers-Inspired Workflow Enhancements
Plan: 26-02 (complete)
Status: Plan 02 complete — Created spec-reviewer and code-reviewer agent prompts
Last activity: 2026-02-26 — Created two-stage reviewer agents

Progress: [████------] 40% (2/5 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~3min
- Total execution time: 0.24 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | ~11min | ~3min |

**Recent Trend:**
- Last 5 plans: none yet in v2.0.0
- Trend: -

*Updated after each plan completion*
| Phase 01 P03 | 5min | 2 tasks | 8 files |
| Phase 01 P04 | 2min | 2 tasks | 3 files |
| Phase 02 P01 | 4min | 2 tasks | 16 files |
| Phase 02 P02 | 4min | 2 tasks | 12 files |
| Phase 02 P05 | 4min | 2 tasks | 4 files |
| Phase 02 P03 | 6min | 2 tasks | 6 files |
| Phase 02 P04 | 6min | 2 tasks | 7 files |
| Phase 02 P06 | 4min | 2 tasks | 5 files |
| Phase 03 P01 | 2min | 2 tasks | 4 files |
| Phase 03 P03 | 5min | 2 tasks | 9 files |
| Phase 03 P02 | 3min | 2 tasks | 7 files |
| Phase 03 P04 | 4min | 1 tasks | 2 files |
| Phase 03 P05 | 3min | 2 tasks | 2 files |
| Phase 03 P06 | 1min | 1 tasks | 1 files |
| Phase 04 P01 | 1min | 2 tasks | 123 files |
| Phase 04 P02 | 1min | 2 tasks | 40 files |
| Phase 05 P01 | 2min | 2 tasks | 3 files |
| Phase 05 P02 | 5min | 2 tasks | 4 files |
| Phase 05 P03 | 9min | 2 tasks | 2 files |
| Phase 05 P04 | 3min | 2 tasks | 1 files |
| Phase 06 P01 | 2min | 2 tasks | 4 files |
| Phase 06 P02 | 2min | 2 tasks | 4 files |
| Phase 06 P03 | 6min | 2 tasks | 3 files |
| Phase 06 P04 | 1min | 1 tasks | 8 files |
| Phase 06 P05 | 2min | 1 tasks | 1 files |
| Phase 07 P01 | 1min | 2 tasks | 2 files |
| Phase 07 P02 | 2min | 2 tasks | 4 files |
| Phase 08 P01 | 1min | 2 tasks | 31 files |
| Phase 09 P01 | 3 | 2 tasks | 2 files |
| Phase 09 P02 | 24 | 1 tasks | 10 files |
| Phase 10 P01 | 10min | 3 tasks | 3 files |
| Phase 10 P02 | 20min | 7 tasks | 1 files |
| Phase 11 P02 | 1min | 2 tasks | 3 files |
| Phase 12 P02 | 3min | 4 tasks | 12 files |
| Phase 12 P03 | 4min | 3 tasks | 2 files |
| Phase 13 P01 | 4min | 2 tasks | 12 files |
| Phase 13 P03 | 4min | 3 tasks | 9 files |
| Phase 13 P02 | 5min | 2 tasks | 5 files |
| Phase 13 P04 | 3min | 2 tasks | 6 files |
| Phase 13 P05 | 3min | 2 tasks | 5 files |
| Phase 13 P07 | 6min | 4 tasks | 6 files |
| Phase 13 P06 | 4min | 2 tasks | 6 files |
| Phase 13 P08 | 2min | 1 tasks | 25 files |
| Phase 14 P01 | 2min | 2 tasks | 4 files |
| Phase 14 P02 | 3min | 2 tasks | 4 files |
| Phase 14 P03 | 3min | 3 tasks | 2 files |
| Phase 21 P01 | 4min | 2 tasks | 7 files |
| Phase 21 P04 | 2min | 2 tasks | 2 files |
| Phase 21 P03 | 2min | 1 tasks | 4 files |
| Phase 22 P01 | 2min | 2 tasks | 4 files |
| Phase 22 P02 | 19min | 2 tasks | 3 files |
| Phase 23 P01 | 1min | 2 tasks | 30 files |
| Phase 23 P02 | 3min | 2 tasks | 4 files |
| Phase 24 P01 | 1min | 2 tasks | 1 files |
| Phase 25 P02 | 2min | 2 tasks | 4 files |
| Phase 25 P03 | 2min | 2 tasks | 4 files |
| Phase 26 P01 | 2min | 1 tasks | 3 files |
| Phase 26 P02 | 2min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: tsdown (not tsup) — tsup is officially unmaintained as of late 2025; tsdown is the direct successor
- [Init]: pnpm workspaces + `workspace:*` protocol for internal package resolution (not tsconfig.paths)
- [Init]: Clean rewrite over in-place migration — avoids CJS/ESM mixed-mode complexity
- [Init]: Only `packages/cli` published to npm; all other packages are private internal packages
- [Init]: Node.js minimum raised to `>=22.0.0` (NX 22 requires >=20.19.0; Node 20 EOL April 2026)
- [01-01]: Added nx to pnpm.onlyBuiltDependencies to suppress pnpm 10 build script warnings
- [01-01]: tsdown 0.20.3 uses --out-dir (not --outDir) and --format accepts esm/cjs/iife/umd
- [01-03]: @nx/vitest/plugin removed from nx.json - v22.5.1 does not export ./plugin; re-add when vitest configured
- [01-03]: nx sync adds cross-package references to tsconfig.lib.json (not tsconfig.json) - correct NX 22 behavior
- [01-04]: NX-02 re-scoped — @nx/vitest/plugin deferred to Phase 6 (TEST-01); @nx/vitest v22.5.1 does not export ./plugin subpath
- [02-01]: tsdown dts requires { build: true } when tsconfig has project references
- [02-01]: Declaration files produced as .d.cts for CJS format — package.json types field updated
- [02-01]: @maxsim/core added as workspace:* dependency in root package.json for CJS tool resolution
- [Phase 02]: All CJS consumers updated atomically during module port to avoid broken intermediate state
- [Phase 02]: PlanningConfig uses index signature for forward compatibility
- [Phase 02]: Verify interfaces exported from verify.ts rather than types.ts for module cohesion
- [Phase 02]: State/Roadmap/Milestone interfaces added to central types.ts
- [02-06]: @types/node installed as devDependency for strict tsc --noEmit compliance
- [02-06]: 12 workflow context types as discriminated union (InitContext) for type-safe dispatch
- [03-01]: @types/node added as devDependency to adapters package for node: module type resolution
- [03-03]: tsdown config array (4 separate builds) for truly standalone CJS hook bundles without shared chunks
- [03-02]: Transforms extracted to transforms/ subdirectory for shared use across adapters
- [03-04]: Skipped opencode/gemini/codex adapter tests (03-02 not delivered) -- tests structured with it.skip() for activation when adapters land
- [Phase 03]: convertClaudeCommandToCodexSkill replaces separate convertClaudeToCodexMarkdown call since it calls it internally
- [Phase 04]: No changes needed to project.json - existing minimal config sufficient for asset-only NX project
- [Phase 05]: bundledDependencies for @maxsim/* packages in CLI package.json for npm tarball inclusion
- [05-02]: null vs undefined alignment — used null for string|null params, empty string for required string, undefined for optional
- [05-03]: Templates root resolved via require.resolve('@maxsim/templates/package.json') for cross-package asset path discovery
- [05-03]: adapterMap Record<RuntimeName, AdapterConfig> pattern for runtime-agnostic dispatch in install.ts
- [Phase 05]: nx release scoped to cli package only via release.projects config
- [06-01]: Added --passWithNoTests to NX test command — vitest exits 1 with no test files without this flag
- [06-01]: Used import.meta.url with fileURLToPath for ESM-compatible __dirname in helpers.ts
- [06-02]: Added norm() path normalizer in init tests for Windows backslash compatibility
- [Phase 06-03]: Import comparePhaseNum/normalizePhaseName from TypeScript source instead of CJS require
- [Phase 06-05]: Skip (not delete) failing dollar-sign tests to preserve documentation of shell interpolation bug
- [07-01]: require.resolve('@maxsim/hooks') for hook path discovery - consistent with templates pattern
- [07-01]: Copy only .cjs files and rename to .js at destination for Claude Code compatibility
- [07-02]: Validate hooks via require.resolve path existence (pnpm symlinks show bundled files: 0 in npm pack locally)
- [08-01]: Commands moved to commands/maxsim/ subdirectory to match install.ts path.join(src, 'commands', 'maxsim') resolution
- [Phase 09]: Use direct JSON patch bump (not nx release) to avoid git-state issues in the tight publish loop
- [Phase 09]: Script is stateless: exits 0/1 on each run; the loop is Claude-driven (run, analyze failure, apply fix, re-run --bump-and-publish)
- [Phase 09]: hooks check uses .js extension per Phase 07-01: install.ts renames .cjs -> .js at destination
- [Phase 09]: noExternal: [/^@maxsim\//] in tsdown config bundles adapters/core inline — eliminates require() failure for workspace packages absent in npm tarball
- [Phase 09]: import condition required in package.json exports even for CJS output — rolldown needs ESM entry to resolve packages during bundling
- [Phase 09]: copy-assets.cjs post-build step copies template markdown and hook .cjs files into dist/assets/ — file assets cannot be bundled as JS, must be in tarball as files
- [Phase 10]: chalk/ora/@inquirer/prompts go in devDependencies (not dependencies) because tsdown bundles them into the CJS output at build time
- [Phase 10]: chalk.color('text') inside template literals is the preferred pattern for static strings; chalk.color(variable) for dynamic values
- [10-02]: Used checkbox (multi-select) for runtime selection — allows selecting multiple runtimes in one step
- [10-02]: async IIFE pattern for top-level await in CommonJS CLI scripts
- [10-02]: @inquirer/prompts checkbox type does not include 'instructions' field — removed from config
- [10-02]: ora .start()/.succeed()/.fail() are synchronous — install() function stays synchronous
- [11-02]: CNAME placed in public/ — Vite copies public/ contents to dist/ root automatically during build
- [11-02]: Two-job workflow (build + deploy) required by actions/deploy-pages pattern; deploy job needs needs: build dependency
- [12-02]: chalk added to packages/core dependencies (not devDependencies) — used at runtime in cmdProgressRender output
- [12-02]: phase-bars branch inserted between bar and JSON else branches for clean fallthrough ordering
- [12-02]: sanity_check inserted before <purpose> tag as first content in each workflow file
- [12-03]: init.ts and milestone.ts comment-only catches missed by 12-01 scope; fixed during integration validation
- [Phase 13]: Standalone output commented out due to Windows EPERM symlink errors -- re-enable for production deployment
- [Phase 13]: chokidar v4 installed (not v5 as RESEARCH.md suggested) -- v5 not yet published to npm
- [Phase 13]: Added .next/, next-env.d.ts, *.tsbuildinfo to root .gitignore for Next.js build artifacts
- [Phase 13]: Parser wrapper pattern: re-implement core data assembly, return objects, never call output()/process.exit()
- [Phase 13]: All dashboard write API routes call suppressPath() before fs.writeFileSync to prevent watcher broadcast loops
- [Phase 13]: server.ts imports use .js extensions (ESM for tsx runner) while lib files use extensionless imports (webpack compatibility)
- [Phase 13]: watcher.ts imports use extensionless paths for Next.js webpack bundler compatibility (moduleResolution: bundler)
- [Phase 13]: Write-suppression uses Map with TTL for automatic expiry tracking; watcher skips paths written by dashboard for 500ms
- [Phase 13]: Dashboard command added to maxsim-tools CLI router, invoked as `node maxsim-tools.cjs dashboard` (not separate binary)
- [Phase 13]: Health check scans port range 3333-3343 with 1.5s timeout for already-running detection
- [Phase 13]: Server.ts compiled via tsdown to server.js using intermediate .server-build/ dir (tsdown --out-dir . incompatible with clean mode)
- [Phase 13]: Dashboard auto-launch in execute-phase workflow is best-effort (|| true), never gates execution
- [Phase 13-04]: useDashboardData uses useState+useEffect (not SWR/react-query) to keep dependencies minimal
- [Phase 13-04]: Roadmap API data mapped from snake_case to DashboardPhase camelCase in page.tsx, not in the hook
- [Phase 13-04]: @codemirror/view added as dependency to fix pre-existing build error in plan-editor.tsx
- [Phase 13-05]: Checkbox toggle modifies raw Markdown <done> tag content with [x] prefix rather than external state tracking
- [Phase 13-05]: PlanEditor uses fixed overlay (inset-0 z-50) for near-full-screen editing experience
- [Phase 13-05]: usePhaseDetail re-fetches on WebSocket lastChange signal for real-time reactivity without polling
- [Phase 13-06]: View routing via React state (activeView/activePhaseId) rather than Next.js router for SPA-like navigation
- [Phase 13-06]: Sidebar hidden below md breakpoint for responsive design without hamburger menu complexity
- [Phase 13-06]: StateEditor embedded within BlockersPanel as collapsible section rather than separate route
- [Phase 13-06]: TodosPanel fetches independently from useDashboardData to allow granular WebSocket-driven refresh
- [Phase 13-08]: No source code changes needed for integration -- all prior plan components integrate cleanly on first build
- [Phase 13-08]: Build artifacts committed as verification of clean integration state
- [Phase 14]: STANDALONE_BUILD env-var guard in next.config.mjs to avoid Windows EPERM symlink errors in dev
- [Phase 14]: tsdown config file (not inline CLI flags) for server bundling clarity and maintainability
- [Phase 14]: NX build target switched to build:standalone so nx build dashboard produces standalone output
- [Phase 14]: dashboard.json placed NEXT TO dashboard/ dir (not inside) so it survives overwrite on upgrade
- [Phase 14]: Auto-install dashboard from dist/assets/ if .claude/dashboard/ missing when user runs dashboard command
- [Phase 14]: Strategy 0 in resolveDashboardServer checks installed standalone before package resolution and monorepo
- [Phase 14]: Standalone server cwd set to dashboard dir so Next.js can find .next/ relative to server.js
- [Phase 14-03]: STANDALONE_BUILD env var added to CI Build step (not separate step) since NX implicit dependency handles build ordering
- [Phase 14-03]: Tarball validation uses pnpm pack --dry-run with grep checks for dashboard server.js and .next files
- [Phase 14-03]: README dashboard section updated to reflect npm-shipped dashboard (not monorepo-only)
- [v2.0.0 Roadmap]: E2E test uses local tarball (not registry) — npm pack from packages/cli/dist/ to mkdtempSync temp dir
- [v2.0.0 Roadmap]: Dashboard server started in beforeAll within dashboard.test.ts only — NOT in globalSetup — to prevent crash from failing all tests
- [v2.0.0 Roadmap]: get-port (single new dep) for free port discovery before spawning dashboard server
- [v2.0.0 Roadmap]: pollUntilReady helper (inline, no wait-on dep) for dashboard health check — never fixed-delay setTimeout
- [Phase 21]: node-pty marked as external in tsdown (native addon cannot be bundled)
- [Phase 21]: Terminal WebSocket at /ws/terminal separate from dashboard /api/ws
- [Phase 21-03]: CSS display:none/block for terminal persistence across view switches (not conditional render)
- [Phase 21-03]: AppShell main refactored to flex-col overflow-hidden; padding moved to content wrapper in App.tsx
- [Phase 21]: Confirmation popup always shown before sending quick-action commands
- [Phase 22]: curl for WebSocket upgrade verification in vitest fork workers (ws/native WebSocket hang)
- [Phase 22]: fileParallelism: false in e2e vitest config to prevent dashboard port conflicts
- [Phase 23]: Removed stale .next and app entries from tsconfig.json exclude during cleanup
- [Phase 24]: isActive removed from QuickActionBar disabled condition - means activity not running state
- [Phase 25]: Biome linter enabled with recommended:false; formatter disabled initially for existing codebase compatibility
- [Phase 26-01]: Skills follow Superpowers SKILL.md pattern (frontmatter + Iron Law + Gate Function + Rationalizations + Red Flags + Verification Checklist) fully adapted to MAXSIM context
- [Phase 26-01]: Each skill file kept under 130 lines for lightweight on-demand loading by agents
- [Phase 26-01]: Skills include MAXSIM integration sections referencing plan execution, task commits, and deviation rules
- [Phase 26-02]: Spec reviewer uses REQUIREMENT/STATUS/EVIDENCE format for structured evidence-based findings
- [Phase 26-02]: Code reviewer uses 5 dimensions (correctness, conventions, error handling, security, maintainability) with CRITICAL/WARNING/NOTE severity
- [Phase 26-02]: Both reviewer agents receive context inline from executor — neither reads PLAN.md directly
- [Phase 26-02]: HARD-GATE anti-rationalization pattern: XML tag with explicit rule preventing verdict without full check

### Roadmap Evolution

- Phase 9 added: End-to-end install and publish test loop
- Phase 10 added: CLI UX — chalk, ora spinners, @inquirer/prompts
- Phase 11 added: Remove Discord command and deploy website via GitHub Actions to GitHub Pages
- Phase 12 added: UX Polish + Core Hardening
- Phase 13 added: Live Project Dashboard — real-time web dashboard (Swiss Style Design + Aceternity UI)
- Phase 14 added: Dashboard npm Delivery — ship dashboard inside maxsimcli npm package via Next.js standalone build
- v2.0.0 Milestone: Phases 15-19 defined for E2E stabilization (E2E package scaffold, pack/install/tool tests, dashboard read tests, dashboard write tests, CI integration)
- Phase 26 added: Superpowers-Inspired Workflow Enhancements — anti-rationalization prompting, evidence-based verification, two-stage review, on-demand skills (ref: docs/superpowers-research.md)

### Pending Todos

None yet.

### Blockers/Concerns

- ~~[v2.0.0 Research]: Dashboard port discovery~~ — Resolved: Phase 17-22 implemented PORT env var handling
- ~~[v2.0.0 Research]: `pnpm pack` vs `npm pack`~~ — Resolved: Phase 16 implemented pack pipeline successfully
- ~~[v2.0.0 Research]: Dashboard build availability in E2E context~~ — Resolved: Phase 19 CI integration handles this

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed 26-02-PLAN.md (Reviewer agent prompts for two-stage review)
Resume file: N/A
