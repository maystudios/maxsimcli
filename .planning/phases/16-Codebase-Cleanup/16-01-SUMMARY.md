# Phase 16 Plan 01 Summary: Adapter Removal and Claude-Only Cleanup

| Field | Value |
|-------|-------|
| Phase | 16-Codebase-Cleanup |
| Plan | 01 |
| Started | 2026-03-03T16:15:33Z |
| Duration | 6m 52s |
| Tasks | 2/2 |
| Files changed | 14 (10 in task 1, 6 in task 2, with overlap) |

## What Was Done

Eliminated the entire `packages/cli/src/adapters/` directory (4 files) by inlining useful functions into install modules, removed vestigial multi-runtime types from core, cleaned up install flow, and updated CLAUDE.md to reflect Claude Code-only reality.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `0f7ee3d` | refactor(install): inline adapter functions into install/utils.ts and delete adapters/ |
| 2 | `0605fce` | refactor(core): remove multi-runtime types, clean install flow, update CLAUDE.md |

## Key Changes

### Task 1: Inline adapters and delete directory
- Created `packages/cli/src/install/utils.ts` with 5 utility functions (expandTilde, processAttribution, buildHookCommand, readSettings, writeSettings)
- Inlined `claudeAdapter` methods directly into `install/shared.ts` (getGlobalDir, getConfigDirFromHome, getDirName)
- Redirected all 5 install module imports from `../adapters/index.js` to `./utils.js`
- Deleted `packages/cli/src/adapters/` entirely (base.ts, claude.ts, index.ts, types.ts)

### Task 2: Remove types, clean install, update docs
- Removed `RuntimeName` type and `AdapterConfig` interface from `core/types.ts`
- Removed re-exports from `core/index.ts`
- Removed `runtime` field from `InstallResult`, `_runtime` param from `verifyInstallComplete()`
- Removed `const runtime = 'claude' as const` from `install/index.ts`
- Updated CLAUDE.md: removed all OpenCode/Gemini/Codex references, removed adapters/ from architecture

## Deviations

| Rule | Task | Issue | Fix | Files |
|------|------|-------|-----|-------|
| Rule 3 - Blocking test fix | 2 | `tests/unit/adapters.test.ts` imported from deleted `adapters/base.js` and `adapters/claude.js`, causing test failure | Updated imports to `install/utils.js` and `install/shared.js`, removed `claudeAdapter`-specific tests (transformContent, registry), added tests for inlined shared functions (getGlobalDir, getConfigDirFromHome, getDirName) | `packages/cli/tests/unit/adapters.test.ts` |

## Verification

- `npm run build` passes (both dashboard and CLI)
- `npm test` passes (8 test files, 187 tests)
- No `adapters/` directory exists in `packages/cli/src/`
- No `RuntimeName` or `AdapterConfig` in source
- No multi-runtime references in CLAUDE.md
- Deprecated flag guard in `install/index.ts` (lines 77-84) preserved as intended

## Key Decisions

- Dead code (`extractFrontmatterAndBody`, `transformContent`, `installClaude`) was deleted rather than relocated, since equivalent implementations already exist elsewhere or are unused
- The `install/adapters.ts` file (commit attribution logic) was kept -- it imports from `./utils.js` now, not the deleted adapters directory
