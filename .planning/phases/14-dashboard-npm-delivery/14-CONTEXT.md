# Phase 14 Context: Dashboard npm Delivery

## Phase Goal

Ship the dashboard inside the maxsimcli npm package via Next.js standalone build so `npx maxsimcli dashboard` works for end users after install.

## Decisions

### 1. Install Behavior

- **Always install**: Dashboard files are copied automatically during every install (global and local). No opt-in flag, no interactive prompt.
- **Both global and local**: Global installs put dashboard in `~/.claude/dashboard/`. Local installs put dashboard in `.claude/dashboard/` (project-scoped). Global install requires user to specify project path at launch time.
- **Always overwrite on upgrade**: Every install overwrites existing dashboard files with the latest version. No version-check logic.
- **Silent install**: No special callout about dashboard size. Treated the same as templates and hooks in the install output.

### 2. Launch Error States

- **No install detected**: If `.claude/dashboard/` doesn't exist when user runs `npx maxsimcli dashboard`, auto-install the dashboard files first, then launch. Zero-friction — user never needs to run a separate install step.
- **No .planning/ directory**: Dashboard launches with empty/placeholder state. Shows "No project initialized" message. File watcher activates if `.planning/` appears later (reactive).
- **Already running**: Detect existing dashboard instance on port range 3333-3343. If found, print its URL and open it in the browser. Don't start a second server.
- **Auto-open browser**: Always auto-open browser on launch. Silent fail in headless environments (current Phase 13 behavior preserved).

### 3. dashboard.json Config

- **Minimal scope**: Config contains only `{ "projectCwd": "/path/to/project" }`. No port preference, no auto-open toggle, no theme config.
- **Location**: `.claude/dashboard.json` (next to the `dashboard/` directory, not inside it — survives overwrites on upgrade).

## Deferred Ideas

None captured.

## Technical Constraints (from Phase 13)

- Standalone output was commented out due to Windows EPERM symlink errors — must be re-enabled with env-var guard for dev vs production.
- Custom server.ts uses `next()` API directly — standalone mode changes this to `require('.next/standalone/server.js')` pattern. Server must be reworked for standalone.
- chokidar v4 (not v5), detect-port, open, ws must all be traced by standalone or bundled separately.
- `.next/static/` must be manually copied into `.next/standalone/.next/static/` (Next.js requirement).
