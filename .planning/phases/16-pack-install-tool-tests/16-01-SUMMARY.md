---
phase: 16-pack-install-tool-tests
plan: 01
status: complete
completed: 2026-02-25
duration: 5min
tasks_completed: 2
files_modified: 3
requirements_completed: [E2E-02, E2E-04]
---

# Plan 16-01 Summary: --version flag + vitest wiring

## What Was Built

Added `--version` flag to `packages/cli/src/install.ts` (exits 0 before the banner, printing only the semver string). Updated `packages/e2e/vitest.config.ts` to include `globalSetup: ['./src/globalSetup.ts']` with `hookTimeout: 120_000`. Created `packages/e2e/src/vitest.d.ts` augmenting Vitest's `ProvidedContext` interface with `installDir`, `toolsPath`, and `tarballPath`.

## Key Files Created/Modified

- `packages/cli/src/install.ts` — added hasVersion check before banner, exits 0 with pkg.version
- `packages/cli/dist/install.cjs` — rebuilt from source
- `packages/e2e/vitest.config.ts` — added globalSetup and hookTimeout
- `packages/e2e/src/vitest.d.ts` — ProvidedContext type augmentation (new file)

## Verification

- `node packages/cli/dist/install.cjs --version` → `1.2.3` (clean, no banner)
- `cd packages/e2e && npx vitest run --passWithNoTests` → exits 0
- vitest.config.ts contains `globalSetup: ['./src/globalSetup.ts']`

## Deviations

- Moved `hasVersion` check BEFORE `console.log(banner)` (not after as the plan suggested) so the smoke test output is a clean semver string. The plan's inline code placed it after the banner, but the test's regex `^\d+\.\d+\.\d+` requires the string to start with digits.

## Self-Check: PASSED
