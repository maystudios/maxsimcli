---
phase: 13-live-project-dashboard
plan: 07
subsystem: cli-integration
tags: [cli, dashboard, subprocess, health-check, workflow-integration]

# Dependency graph
requires:
  - phase: 13-01
    provides: packages/dashboard scaffolded with Next.js 15, types, and @maxsim/core dependency
  - phase: 13-03
    provides: lib/parsers.ts and 7 API route handlers for dashboard data access
provides:
  - Dashboard launch command in CLI dispatch router (maxsim-tools dashboard)
  - Health check endpoint at /api/health for already-running detection
  - Updated build pipeline with server.ts compilation
  - Execute-phase workflow auto-launch step
affects: [13-08]

# Tech tracking
tech-stack:
  added: ["@codemirror/view@6"]
  patterns: [detached-subprocess-spawn, health-check-port-scanning, best-effort-auto-launch]

key-files:
  created:
    - packages/dashboard/app/api/health/route.ts
  modified:
    - packages/cli/src/cli.ts
    - packages/cli/package.json
    - packages/dashboard/package.json
    - packages/templates/workflows/execute-phase.md
    - .gitignore

key-decisions:
  - "Dashboard command added to maxsim-tools CLI router (not a separate binary) -- invoked via node maxsim-tools.cjs dashboard"
  - "Health check scans port range 3333-3343 to detect already-running instances"
  - "Server.ts compiled via tsdown to server.js (ESM) with intermediate .server-build/ directory to work around tsdown --out-dir . limitation"
  - "Dashboard auto-launch in execute-phase is best-effort: failure does not gate phase execution"
  - "@codemirror/view added as missing dependency (was blocking next build from earlier plan)"

patterns-established:
  - "Detached subprocess pattern: spawn with detached:true + child.unref() for dashboard process that survives CLI exit"
  - "Port-range health scanning: check /api/health across ports 3333-3343 before spawning"
  - "Best-effort auto-launch: workflow step wrapped in || true to prevent execution gating"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-02-24
---

# Phase 13 Plan 07: CLI Integration and Auto-Launch Summary

**Dashboard launch command in CLI dispatch router with health-check detection, build pipeline updates, and execute-phase workflow auto-launch step**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-24T18:28:12Z
- **Completed:** 2026-02-24T18:34:32Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- `dashboard` command added to maxsim-tools CLI router: spawns dashboard as detached subprocess with MAXSIM_PROJECT_CWD env var
- Already-running detection via /api/health health check across port range 3333-3343
- `--stop` flag support to kill running dashboard processes (platform-aware: taskkill on Windows, kill on Unix)
- Server entry point resolution: tries @maxsim/dashboard package resolution first, then monorepo walk-up fallback
- Dashboard build pipeline updated: `next build && build:server` chains Next.js app build with server.ts compilation
- Health endpoint at /api/health returns `{ status: "ok", port, cwd, uptime }` for CLI detection
- Execute-phase workflow includes `launch_dashboard` step that auto-starts dashboard at phase execution start (best-effort)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dashboard launch command to CLI dispatch router** - `a593fc4` (feat)
2. **Task 2a: Update dashboard package.json build pipeline** - `e4dadd2` (feat)
3. **Task 2b: Create health check API endpoint** - `99aff72` (feat)
4. **Task 3: Add dashboard auto-launch to execute-phase workflow** - `e639b0b` (feat)

## Files Created/Modified
- `packages/cli/src/cli.ts` - Added dashboard command case with subprocess spawn, health check, --stop support
- `packages/cli/package.json` - Added @maxsim/dashboard as workspace:* devDependency
- `packages/dashboard/package.json` - Added build:server script, chained in build, added @codemirror/view dependency
- `packages/dashboard/app/api/health/route.ts` - GET endpoint returning status, port, cwd, uptime
- `packages/templates/workflows/execute-phase.md` - Added launch_dashboard step between initialize and handle_branching
- `.gitignore` - Added packages/dashboard/server.js and .server-build/ exclusions

## Decisions Made
- **CLI router integration:** Dashboard command added to the maxsim-tools CLI router (packages/cli/src/cli.ts), invoked as `node maxsim-tools.cjs dashboard`. This keeps all MAXSIM tooling in one dispatch point rather than adding a separate binary.
- **Port range scanning:** Health check scans ports 3333-3343 to handle detect-port selecting the next available port. Short 1.5s timeout prevents slow CLI response.
- **Server compilation workaround:** tsdown 0.20.3 cannot use `--out-dir .` (conflicts with clean logic). Used intermediate `.server-build/` directory with post-build copy+cleanup.
- **Best-effort auto-launch:** The execute-phase workflow's launch_dashboard step uses `|| true` to ensure dashboard failure never blocks phase execution.
- **Missing @codemirror/view:** Added as dependency to fix pre-existing build failure in plan-editor.tsx from earlier plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @codemirror/view dependency**
- **Found during:** Task 2a (next build verification)
- **Issue:** `@codemirror/view` was imported in app/components/editor/plan-editor.tsx but not listed as a dependency, causing next build to fail with "Cannot find module"
- **Fix:** Added `@codemirror/view@6` to dashboard dependencies
- **Files modified:** packages/dashboard/package.json
- **Committed in:** e4dadd2 (Task 2a commit)

**2. [Rule 3 - Blocking] Stale .next build artifacts**
- **Found during:** Task 2a (next build verification)
- **Issue:** Corrupted .next/server/pages-manifest.json from previous partial build caused ENOENT error
- **Fix:** Cleaned .next directory before rebuild
- **Files modified:** None (runtime fix only)
- **Committed in:** N/A (no file changes needed)

**3. [Rule 3 - Blocking] tsdown --out-dir . incompatible with clean mode**
- **Found during:** Task 2a (build:server script design)
- **Issue:** `npx tsdown server.ts --format esm --out-dir .` fails because tsdown refuses to clean the current working directory
- **Fix:** Used intermediate `.server-build/` output dir with post-build copy to server.js and cleanup
- **Files modified:** packages/dashboard/package.json
- **Committed in:** e4dadd2 (Task 2a commit)

---

**Total deviations:** 3 auto-fixed (all blocking)
**Impact on plan:** All fixes necessary for successful builds. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard can now be launched via `node maxsim-tools.cjs dashboard` from any MAXSIM workflow
- Execute-phase workflow auto-launches dashboard as a real-time companion
- Health endpoint enables idempotent launch (no duplicate instances)
- Ready for Plan 08 (final integration/polish) if applicable

## Self-Check: PASSED

All 6 created/modified files verified present on disk. All 4 task commits (a593fc4, e4dadd2, 99aff72, e639b0b) verified in git log.

---
*Phase: 13-live-project-dashboard*
*Completed: 2026-02-24*
