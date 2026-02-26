---
phase: 10-wir-wollen-auf-eine-richtige-cli-ui-beim-install-und-etc-wechseln-mithilfe-von-chalk-ora-spinner-und-inquirer-prompts
plan: "01"
subsystem: cli
tags: [chalk, ansi, colors, cli-ui, install]
requires: []
provides: [chalk-based-color-output-in-install.ts]
affects: [packages/cli/src/install.ts, packages/cli/package.json]
tech-stack:
  added: [chalk@^5.6.2, ora@^9.3.0, "@inquirer/prompts@^8.3.0"]
  patterns: [chalk-api, esm-only-packages-bundled-via-tsdown]
key-files:
  created: []
  modified:
    - packages/cli/src/install.ts
    - packages/cli/package.json
    - pnpm-lock.yaml
decisions:
  - "Used chalk.color('text') inside template literals for clean interpolation"
  - "Used chalk.color(variable) for dynamic string values"
  - "Chalk and other ESM-only packages go in devDependencies since tsdown bundles them at build time"
metrics:
  duration: "~10 minutes"
  completed: "2026-02-24"
  tasks_completed: 3
  files_changed: 3
requirements-completed: []
---

# Phase 10 Plan 01: Chalk Migration Summary

**One-liner:** Replaced all raw ANSI escape code string constants with chalk API calls across 1859-line install.ts, keeping the build green.

**Status:** Complete
**Date:** 2026-02-24

## What Was Done

- Installed chalk ^5.6.2, ora ^9.3.0, and @inquirer/prompts ^8.3.0 into packages/cli devDependencies
- Removed the 5 raw ANSI escape code constant declarations (cyan, green, yellow, dim, reset)
- Added `import chalk from 'chalk'` as the first third-party import in install.ts
- Replaced all 72 template literal interpolations of `${cyan}`, `${green}`, `${yellow}`, `${dim}`, `${reset}` with chalk API calls
- Replaced non-template-literal string concatenations (e.g., `yellow + 'text' + reset`) with chalk calls
- Rewrote the ASCII art banner to use `chalk.cyan(...)` and `chalk.dim(...)`
- Build passes: `pnpm nx build cli --skip-nx-cache` exits 0
- tsdown bundles chalk (ESM-only) correctly into the CJS output

## Verification Results

- 0 raw `\x1b` ANSI escape sequences remain in install.ts
- 0 `${cyan}`, `${green}`, `${yellow}`, `${dim}`, `${reset}` interpolations remain
- `import chalk from 'chalk'` is present at line 7
- `pnpm nx build cli --skip-nx-cache` exits 0
- `packages/cli/dist/install.cjs` exists and is 100KB (chalk bundled in)

## Key Changes

- `packages/cli/package.json`: Added chalk ^5.6.2, ora ^9.3.0, @inquirer/prompts ^8.3.0 to devDependencies
- `packages/cli/src/install.ts`: Full chalk migration — 72 color interpolations converted, 5 constant declarations removed, 1 import added

## Commits

- `1374d30`: chore(10-01): add chalk, ora, @inquirer/prompts to packages/cli devDependencies
- `2fcffa3`: feat(cli): migrate ANSI color constants to chalk (Plan 10-01)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- packages/cli/src/install.ts: exists and modified
- packages/cli/package.json: exists with chalk, ora, @inquirer/prompts in devDependencies
- packages/cli/dist/install.cjs: exists (100KB, chalk bundled)
- commits 1374d30 and 2fcffa3 exist in git log
