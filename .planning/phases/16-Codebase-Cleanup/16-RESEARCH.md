# Phase 16: Codebase Cleanup - Research

| Field | Value |
|-------|-------|
| Researched | 2026-03-03 |
| Domain | Dead code removal, adapter simplification, documentation accuracy |
| Confidence | HIGH |

## Summary

The MAXSIM codebase was originally designed to support multiple AI runtimes (Claude Code, OpenCode, Gemini CLI, Codex). Since v2.0, MAXSIM is Claude Code only. The multi-runtime adapter abstraction layer still exists but is vestigial -- it only has one implementation (Claude) and adds unnecessary indirection. The actual cleanup work is straightforward: the adapter layer has already been stripped down to Claude-only, but the abstraction itself remains, along with scattered references in documentation and one deprecated-flag guard in the installer.

The primary cleanup targets are: (1) the `adapters/` directory's unnecessary abstraction layer, (2) the `RuntimeName` and `AdapterConfig` types that suggest multi-runtime support, (3) the `installClaude()` stub that throws an error and is never called, (4) documentation strings in CLAUDE.md that still reference OpenCode/Gemini/Codex, and (5) the deprecated multi-runtime flag guard in the installer.

**Primary recommendation:** Inline the adapter functions directly into the install modules that use them, eliminate the adapter abstraction types, and update all documentation to reflect Claude Code-only reality.

## Standard Stack

No new libraries needed. This phase is purely about removing code and updating docs.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| N/A | N/A | This is a deletion/simplification phase | No new dependencies |

## Architecture Patterns

### Current Architecture (Before Cleanup)

```
packages/cli/src/
  adapters/
    base.ts        <- Shared utilities (expandTilde, processAttribution, etc.)
    claude.ts      <- Claude adapter config object + unused installClaude() stub
    index.ts       <- Re-exports from claude.ts and base.ts
    types.ts       <- Re-exports RuntimeName and AdapterConfig from core/types.ts
  core/
    types.ts       <- Defines RuntimeName = 'claude' and AdapterConfig interface
    index.ts       <- Re-exports RuntimeName and AdapterConfig
  install/
    shared.ts      <- Wraps claudeAdapter methods (getGlobalDir, getConfigDirFromHome, getDirName)
    hooks.ts       <- Imports readSettings, writeSettings, buildHookCommand from adapters/
    copy.ts        <- Imports processAttribution from adapters/
    adapters.ts    <- Imports readSettings from adapters/, getGlobalDir from shared
    uninstall.ts   <- Imports readSettings, writeSettings from adapters/
    index.ts       <- Imports from shared.ts, has deprecated multi-runtime flag guard
```

### Target Architecture (After Cleanup)

```
packages/cli/src/
  install/
    shared.ts      <- Contains inlined getGlobalDir, getConfigDirFromHome, getDirName directly
    utils.ts       <- Contains expandTilde, processAttribution, buildHookCommand, readSettings,
                      writeSettings, extractFrontmatterAndBody (moved from adapters/base.ts)
    hooks.ts       <- Imports from utils.ts instead of adapters/
    copy.ts        <- Imports from utils.ts instead of adapters/
    adapters.ts    <- Renamed or merged (just getCommitAttribution)
    uninstall.ts   <- Imports from utils.ts instead of adapters/
    index.ts       <- No deprecated flag guard, no adapter imports
  core/
    types.ts       <- No RuntimeName, no AdapterConfig
    index.ts       <- No RuntimeName, no AdapterConfig exports
  (adapters/ directory deleted entirely)
```

### Anti-Patterns to Avoid

- **Partial cleanup:** Do not leave `AdapterConfig` interface if there is only one implementation. This suggests extensibility that does not exist.
- **Moving code without simplifying:** When inlining adapter functions, simplify them. For example, `getConfigDirFromHome()` always returns `"'.claude'"` -- it can become a constant.
- **Breaking the build:** The `adapters/` re-exports are imported by install modules. All imports must be redirected before deleting files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| N/A | N/A | N/A | This phase is deletion-only |

## Common Pitfalls

### 1. Missing Import Redirections

**What goes wrong:** Deleting `adapters/index.ts` breaks all files that import from `../adapters/index.js`.

**Why:** Six files import from the adapters module. Every import must be redirected before deletion.

**How to avoid:** Update all imports BEFORE deleting any files. The import graph is:
- `install/index.ts` imports `processAttribution` from `../adapters/index.js`
- `install/copy.ts` imports `processAttribution` from `../adapters/index.js`
- `install/adapters.ts` imports `readSettings` from `../adapters/index.js`
- `install/hooks.ts` imports `readSettings, writeSettings, buildHookCommand` from `../adapters/index.js`
- `install/uninstall.ts` imports `readSettings, writeSettings` from `../adapters/index.js`
- `install/shared.ts` imports `claudeAdapter` from `../adapters/index.js`

**Warning signs:** TypeScript compilation errors after file deletion.

### 2. Breaking the Dashboard Build

**What goes wrong:** The dashboard resolves `@maxsim/core` via path alias to `../cli/src/core/`. If `core/types.ts` exports change, the dashboard build may fail.

**Why:** `RuntimeName` and `AdapterConfig` are exported from `core/index.ts`. The dashboard might indirectly depend on these types.

**How to avoid:** Check whether `packages/dashboard/src/` imports `RuntimeName` or `AdapterConfig`. Research shows it does NOT -- the only "adapter" reference in the dashboard is about a network adapter in a comment. Safe to remove.

### 3. Published Package Compatibility

**What goes wrong:** The `dist/adapters/` directory in the published npm package contains compiled adapter code. Users who have pinned to a specific version might import from it.

**Why:** The adapters are exported from the package.

**How to avoid:** The adapters directory is an internal module, not a public API. The npm package only exposes `install.cjs` and `cli.cjs` as entry points. No external consumers depend on the adapter types. Safe to remove.

### 4. Forgetting the dist/ Directory

**What goes wrong:** After deleting source files, stale compiled output remains in `dist/adapters/`.

**How to avoid:** Run a clean build (`npm run build`) after source changes. The build pipeline will not emit deleted source files, but stale files from previous builds must be cleaned. Consider a `rm -rf dist/adapters` before the final build verification.

## Detailed Findings

### Category 1: Adapter Directory (DELETE ENTIRELY)

All four files in `packages/cli/src/adapters/` can be deleted after inlining their useful code.

#### `adapters/base.ts` (96 lines)
Contains 6 utility functions. None are Claude-specific. All are used by install modules.

| Function | Lines | Used By | Action |
|----------|-------|---------|--------|
| `expandTilde()` | 12-17 | `adapters/claude.ts` only | Move to `install/shared.ts` |
| `extractFrontmatterAndBody()` | 23-39 | NOT USED by any install module (only re-exported) | Delete or move to `core/` if needed elsewhere |
| `processAttribution()` | 46-61 | `install/index.ts`, `install/copy.ts` | Move to `install/` (utils or shared) |
| `buildHookCommand()` | 66-69 | `install/hooks.ts` | Move to `install/hooks.ts` (inline) |
| `readSettings()` | 74-85 | `install/hooks.ts`, `install/adapters.ts`, `install/uninstall.ts` | Move to `install/` (utils or shared) |
| `writeSettings()` | 90-95 | `install/hooks.ts`, `install/uninstall.ts` | Move to `install/` (utils or shared) |

#### `adapters/claude.ts` (73 lines)
Contains the `claudeAdapter` config object and the unused `installClaude()` stub.

| Export | Lines | Used By | Action |
|--------|-------|---------|--------|
| `claudeAdapter` object | 56-63 | `install/shared.ts` (wraps its methods) | Inline the 3 simple functions into `install/shared.ts` |
| `getGlobalDir()` | 20-28 | Via `claudeAdapter` -> `install/shared.ts` | Inline directly |
| `getConfigDirFromHome()` | 34-37 | Via `claudeAdapter` -> `install/shared.ts` | Replace with constant `"'.claude'"` |
| `transformContent()` | 44-50 | Via `claudeAdapter` but NEVER actually called | Delete (path replacement is done directly in `install/copy.ts`) |
| `installClaude()` | 69-73 | Exported but NEVER called anywhere | Delete |

#### `adapters/index.ts` (22 lines)
Pure re-export file. Delete after redirecting imports.

#### `adapters/types.ts` (11 lines)
Re-exports `RuntimeName` and `AdapterConfig` from core, plus defines `InstallOptions`.

| Export | Action |
|--------|--------|
| `RuntimeName` re-export | Delete |
| `AdapterConfig` re-export | Delete |
| `InstallOptions` interface | Move to `install/shared.ts` if needed, or delete if unused |

**InstallOptions usage check:** Grep shows `InstallOptions` is only defined in `adapters/types.ts` and re-exported from `adapters/index.ts`. It is NOT imported anywhere else. **Delete it.**

### Category 2: Core Types to Remove

**File:** `packages/cli/src/core/types.ts`

| Item | Lines | Action |
|------|-------|--------|
| `RuntimeName` type (line 503) | `type RuntimeName = 'claude'` | Delete |
| `AdapterConfig` interface (lines 505-512) | 8-line interface | Delete |
| Export from `core/index.ts` (lines 67-68) | Re-exports | Remove |

**Consumers of these types:**
- `adapters/types.ts` -- being deleted
- `adapters/index.ts` -- being deleted
- `adapters/claude.ts` -- being deleted
- `install/shared.ts` (line 8) -- imports `RuntimeName`, used only in `verifyInstallComplete` parameter type

**For `install/shared.ts`:** The `_runtime` parameter of `verifyInstallComplete()` (line 124) is prefixed with `_` indicating it is unused. Change its type to `string` or remove the parameter entirely.

### Category 3: Install Flow References

**File:** `packages/cli/src/install/index.ts`

| Item | Lines | Action |
|------|-------|--------|
| Deprecated multi-runtime flag guard | 77-84 | **KEEP** -- This is a useful UX safeguard for users upgrading from v1.x who try `--opencode` etc. It provides a clear error message. |
| `const runtime = 'claude' as const` | 105 | Remove the variable, it is only used once at line 132 and in the return at line 441 |
| `InstallResult.runtime` field | shared.ts:111 | Remove the `runtime` field from `InstallResult` -- it is always `'claude'` and never read by consumers |

**File:** `packages/cli/src/install/shared.ts`

| Item | Lines | Action |
|------|-------|--------|
| `claudeAdapter` import | 7 | Replace with inlined functions |
| `RuntimeName` import | 8 | Remove |
| `getGlobalDir()` wrapper | 24-26 | Inline the logic: `expandTilde(explicitDir) || process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')` |
| `getConfigDirFromHome()` wrapper | 31-33 | Replace with constant `"'.claude'"` |
| `getDirName()` wrapper | 38-40 | Replace with constant `'.claude'` |
| `verifyInstallComplete()` `_runtime` param | 124 | Remove the parameter or change type to `string` |
| `InstallResult.runtime` field | 111 | Remove |

### Category 4: Documentation Updates

**File:** `CLAUDE.md` (project root)

| Line | Current Text | Action |
|------|-------------|--------|
| 7 | "...system for Claude Code, OpenCode, Gemini CLI, and Codex" | Change to "...system for Claude Code" |
| 57 | "OpenCode/Gemini/Codex: equivalent paths" | Delete this line |
| 80 | "adapters/ <- Runtime adapters (Claude, OpenCode, Gemini, Codex)" | Delete this line (adapters dir will be gone) |

**File:** `CLAUDE.md` in `templates/` (installed to user's `.claude/CLAUDE.md`)
Grep shows no multi-runtime references in templates. No changes needed.

**File:** `README.md` (project root)
Grep shows no multi-runtime references. No changes needed.

### Category 5: Hooks

No multi-runtime references found in `packages/cli/src/hooks/`. No changes needed.

### Category 6: Templates

No multi-runtime references found in `templates/`. The only "adapter" mention is in `templates/skills/simplify/SKILL.md` referring to general code adapters, not runtime adapters. No changes needed.

### Category 7: Dashboard

No multi-runtime references in `packages/dashboard/src/`. The dashboard does import from `@maxsim/core` but does not use `RuntimeName` or `AdapterConfig`. No changes needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|-----------------|-------------|--------|
| Multi-runtime adapter pattern with `RuntimeName` union type | Claude-only with `RuntimeName = 'claude'` literal | v2.0 | Adapter abstraction is now dead weight |
| `installClaude()` as adapter entry point | Direct install logic in `install/index.ts` | Already happened | `installClaude()` stub is dead code |

## Open Questions

| What We Know | What's Unclear | Recommendation |
|-------------|---------------|----------------|
| All adapter code paths lead to Claude-only implementations | Whether the deprecated flag guard (lines 77-84 in install/index.ts) should be kept long-term | Keep it for v2.x to help users migrating from v1.x; remove in v3.0 |
| `extractFrontmatterAndBody()` in `adapters/base.ts` is not used by install modules | Whether it is used elsewhere in the codebase via the compiled `dist/` output | Checked: also exists in `core/frontmatter.ts`. The adapters version is dead code. Delete it. |
| `transformContent()` in `adapters/claude.ts` is defined but never called | Whether it was intended for future use | The same logic exists inline in `install/copy.ts`. Delete the adapter version. |

## Sources

| Source | Confidence | Type |
|--------|-----------|------|
| Direct codebase inspection (all files read in full) | HIGH | Primary |
| Grep analysis across entire `packages/cli/src/` | HIGH | Primary |
| Grep analysis across entire `templates/` | HIGH | Primary |
| Grep analysis of `README.md` and `CLAUDE.md` | HIGH | Primary |

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Adapter dead code identification | HIGH | Every file read in full, every import traced |
| Install flow analysis | HIGH | All 9 install module files read completely |
| Documentation accuracy | HIGH | All doc files grepped for multi-runtime references |
| Core types cleanup | HIGH | Type usage traced through all consumers |
| Template cleanup | HIGH | Full grep of templates directory |
| Dashboard impact | HIGH | Verified no runtime adapter usage in dashboard |
| Build impact | HIGH | Understood tsdown bundling; only source files matter |

| Field | Value |
|-------|-------|
| Research date | 2026-03-03 |
| Valid until | No expiration (internal codebase analysis) |
