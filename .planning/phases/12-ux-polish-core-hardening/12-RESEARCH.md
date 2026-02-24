# Phase 12: UX Polish + Core Hardening - Research

**Researched:** 2026-02-24
**Domain:** TypeScript core hardening, ASCII UX rendering, command scaffolding
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Progress bar format:** `Phase 03 [██████████] 100% — DONE`, compact one-liner per phase
- **Bar characters:** `█` (U+2588) for filled, `░` (U+2591) for empty, 10 chars wide
- **Phase ordering:** Numerically sorted, no status grouping
- **Milestone header:** `Milestone: NX Monorepo Migration — 4/10 phases complete (40%)`
- **Color coding:** DONE=green, IN PROGRESS=yellow, PLANNED=gray (chalk ANSI)
- **Roadmap command output:** `✓  Phase 01: NX Workspace Scaffold              DONE`, icons ✓/►/□
- **Roadmap milestone header:** Name + phase counts (done/active/planned)
- **Plan progress inline:** `(3/6 plans)` per phase line
- **Roadmap missing .planning/:** Hard stop with `No roadmap found. Run /maxsim:new-project to initialize.`
- **Sanity check:** Hard stop (not warning) when .planning/ missing
- **Sanity check targets:** .planning/ exists, ROADMAP.md present, current phase valid in roadmap, STATE.md parseable
- **Inconsistent state warning:** ROADMAP.md present but REQUIREMENTS.md missing → warning (not hard stop)
- **Sanity check scope:** All workflows — execute-phase, plan-phase, discuss-phase, quick, verify, etc.
- **Catch block fix:** `catch (e) { /* optional op, ignore */ if (process.env.MAXSIM_DEBUG) console.error(e); }`
- **Logger guard:** `process.env.MAXSIM_DEBUG` env var — stderr only, zero overhead by default
- **Catch scope:** Only fix completely empty `catch {}` or `catch (e) {}` with no body (not ones with comments or return values)

### Claude's Discretion

- Bar width (10 chars is default — adjust if it looks better)
- Exact chalk color shades
- Exact wording of error messages
- Whether to add MAXSIM_DEBUG docs or keep undocumented (internal)

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope

</user_constraints>

---

## Summary

Phase 12 touches two parallel tracks. Track 1 (core hardening) works entirely in `packages/core/src/`: centralize phase regex patterns into a `getPhasePattern()` helper, make all ROADMAP.md writes atomic (build content in memory, write once), and replace truly-empty `catch {}` blocks with a debug-guarded pattern. Track 2 (UX commands) extends `cmdProgressRender()` in `commands.ts` to produce chalk-colored per-phase ASCII progress bars, adds a new `/maxsim:roadmap` command file and workflow, and inserts a reusable sanity-check guard into all workflow markdown files.

The NX build passes clean (`nx build core` in 966ms). Chalk 5.6.2 is already a dependency of `packages/cli` but not `packages/core` — the progress bar coloring lives in `cmdProgressRender` in `commands.ts`, which is compiled into `packages/cli/dist`. No dependency change is needed for `packages/core` itself. The `/maxsim:roadmap` command needs to be added only to `packages/templates/` (the source), and the build + copy pipeline will propagate it to `packages/cli/dist/assets/templates/` and `.claude/`.

**Primary recommendation:** Work within the existing function boundaries. `getPhasePattern()` centralizes one regex, atomic writes reduce the surface of the `cmdPhaseRemove`/`cmdPhaseAdd`/`cmdPhaseInsert`/`cmdPhaseComplete` multi-write pattern to a single `writeFileSync` per operation, and the catch fix is a mechanical find-and-replace following a clear rule: only touch blocks where the body is truly empty (no comment, no return value used for control flow).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | All file I/O in `packages/core/src/` | Already used throughout |
| `chalk` | 5.6.2 | ANSI color for progress bar and roadmap output | Already in `packages/cli` devDependencies |
| TypeScript | via tsdown | Compile all `packages/core/src/*.ts` to CJS | Current build chain |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `process.env.MAXSIM_DEBUG` | N/A (env var) | Gate debug stderr output in catch blocks | Every fixed catch block |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `process.env.MAXSIM_DEBUG` guard | A logger singleton | Overkill for this scope; env var is zero-overhead when unset |
| chalk in `packages/core` | chalk in `packages/cli` only | Chalk is correctly scoped to CLI layer; core output is plain strings |

**Installation:**

No new packages needed. Chalk is already in `packages/cli/package.json` devDependencies. `packages/core` does not need chalk.

---

## Architecture Patterns

### Package Boundaries

```
packages/
├── core/src/         # Pure logic, plain string output, no chalk
│   ├── core.ts       # + getPhasePattern() helper (NEW)
│   ├── phase.ts      # Uses getPhasePattern(); atomic ROADMAP.md writes
│   ├── roadmap.ts    # Uses getPhasePattern(); atomic ROADMAP.md write
│   ├── verify.ts     # Uses getPhasePattern()
│   ├── state.ts      # Catch block cleanup only
│   └── commands.ts   # cmdProgressRender: chalk colors added (chalk imported here)
├── templates/
│   ├── commands/maxsim/roadmap.md    # NEW command file
│   └── workflows/
│       ├── progress.md               # Updated progress bar step
│       ├── execute-phase.md          # Add sanity check guard at top
│       ├── plan-phase.md             # Add sanity check guard at top
│       ├── discuss-phase.md          # Add sanity check guard at top
│       ├── quick.md                  # Add sanity check guard at top
│       └── verify-work.md            # Add sanity check guard at top
```

### Pattern 1: getPhasePattern() Centralization

**What:** A single exported function in `core.ts` returns the canonical regex for matching phase headings in ROADMAP.md.

**When to use:** Everywhere a phase heading regex is constructed inline with `new RegExp(...)`.

**Example — current inline pattern (repeated in 5+ places):**
```typescript
// phase.ts line 317 — cmdPhaseAdd
const phasePattern = /#{2,4}\s*Phase\s+(\d+)[A-Z]?(?:\.\d+)?:/gi;

// roadmap.ts line 109 — cmdRoadmapAnalyze
const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:\s*([^\n]+)/gi;

// verify.ts line 616 — cmdValidateConsistency
const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi;

// verify.ts line 851 — cmdValidateHealth
const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi;

// core.ts line 329 — getRoadmapPhaseInternal (escaped specific phase num)
const phasePattern = new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)`, 'i');
```

**Proposed helper:**
```typescript
// core.ts — add near normalizePhaseName/comparePhaseNum

/**
 * Returns the canonical regex for matching a Phase heading line in ROADMAP.md.
 * @param escapedPhaseNum - Optional pre-escaped phase number string to match a specific phase.
 *   If omitted, returns a general pattern capturing any phase number and name.
 * @param flags - regex flags; defaults to 'gi' (global+case-insensitive)
 */
export function getPhasePattern(escapedPhaseNum?: string, flags = 'gi'): RegExp {
  if (escapedPhaseNum) {
    return new RegExp(
      `#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`,
      flags
    );
  }
  return new RegExp(
    `#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`,
    flags
  );
}
```

**Call sites to update:**

| File | Line(s) | Current inline pattern | Use getPhasePattern() |
|------|---------|----------------------|----------------------|
| `phase.ts` | 317 | `/#{2,4}\s*Phase\s+(\d+)[A-Z]?(?:\.\d+)?:/gi` | `getPhasePattern()` — capture group 1 only |
| `phase.ts` | 369, 398 | `new RegExp(\`#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:\`, 'i')` | `getPhasePattern(afterPhaseEscaped, 'i')` |
| `phase.ts` | 573–574 | `new RegExp(\`\\n?#{2,4}\\s*Phase\\s+${targetEscaped}\\s*:...\`)` | Partial — section removal pattern differs; use `getPhasePattern(targetEscaped)` for match check |
| `phase.ts` | 673–676 | checkbox/table patterns (not phase heading) | Not applicable |
| `phase.ts` | 688–692 | `new RegExp(\`#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?...\`)` | Partial |
| `roadmap.ts` | 34–37 | `new RegExp(\`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)\`, 'i')` | `getPhasePattern(escapedPhase, 'i')` |
| `roadmap.ts` | 109 | `/#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:\s*([^\n]+)/gi` | `getPhasePattern()` |
| `verify.ts` | 616 | `/#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi` | `getPhasePattern()` (group 2 ignored) |
| `verify.ts` | 851 | `/#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi` | `getPhasePattern()` |
| `core.ts` | 329 | `new RegExp(\`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)\`, 'i')` | `getPhasePattern(escapedPhase, 'i')` |

**Note:** The `getPhasePattern()` default form captures `(phaseNum)(phaseName)` in groups 1 and 2. Call sites that currently only use group 1 (like `cmdPhaseAdd`, `cmdValidateConsistency`) must account for the extra capture group — they can ignore group 2 or the signature can be overloaded. Simpler: provide two variants or document group mapping clearly.

### Pattern 2: Atomic ROADMAP.md Writes

**What:** All ROADMAP.md mutations currently follow a read-modify-write pattern but some functions do multiple sequential writes. Atomic means: read once, apply all transformations in memory, write once.

**Current multi-write locations:**

`phase.ts — cmdPhaseRemove` (lines 570–636):
- Write 1: `fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8')` at line 618 (after section/checkbox/table removal)
- Write 2: `fs.writeFileSync(statePath, stateContent, 'utf-8')` at line 636 (STATE.md — separate file, OK)

`phase.ts — cmdPhaseComplete` (lines 670–722):
- Write 1: `fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8')` at line 698 (checkbox + table + plan count update)
- Write 2: `fs.writeFileSync(reqPath, reqContent, 'utf-8')` at line 722 (REQUIREMENTS.md — separate file, OK)
- Write 3: `fs.writeFileSync(statePath, stateContent, 'utf-8')` at line 785 (STATE.md — separate file, OK)

`phase.ts — cmdPhaseAdd` (line 342):
- Single ROADMAP.md write — already atomic. No change needed.

`phase.ts — cmdPhaseInsert` (line 416):
- Single ROADMAP.md write — already atomic. No change needed.

`roadmap.ts — cmdRoadmapUpdatePlanProgress` (line 276):
- Single ROADMAP.md write — already atomic. No change needed.

**Conclusion:** Only `cmdPhaseRemove` and `cmdPhaseComplete` need the atomic write fix. In both cases, the ROADMAP.md is already read once and all transforms are applied before the single `fs.writeFileSync`. The calls are already effectively atomic for ROADMAP.md. The additional writes (STATE.md, REQUIREMENTS.md) are to separate files and are inherently separate operations — no issue.

**Atomic write helper to add:**
```typescript
// core.ts — add as a utility
export function writeFileSafe(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}
```

Actually, inspecting the code: `cmdPhaseRemove` performs all ROADMAP.md transformations in a single variable (`roadmapContent`) and writes once at line 618. It is already atomic for ROADMAP.md. No additional pattern is required. The plan calls for "atomic write helper" — this means ensuring no function does two writes to ROADMAP.md without re-reading. Verification: all ROADMAP.md writes in `phase.ts` and `roadmap.ts` are single per-function.

### Pattern 3: Catch Block Hardening

**Rule from CONTEXT.md:** Only fix completely empty `catch {}` or `catch (e) {}` with no body — not ones that have comments, return values, or meaningful actions.

**Target pattern:**
```typescript
// BEFORE (truly silent — no body)
} catch {
  return null;
}
// This one is OK — returns null is a meaningful action

// BEFORE (truly silent — no comment, no meaningful body)
} catch { /* ignore */ }
// This has a comment — clarify intent but no debug needed per spec

// BEFORE — the ones to fix per CONTEXT.md:
// Only target: "completely empty catch {} or catch (e) {} with no body"
```

**Re-reading the CONTEXT.md rule precisely:** "Scope: only fix completely empty `catch {}` or `catch (e) {}` with no body."

A `catch {}` with `/* ignore */` has a comment body. A `catch {}` that returns `null` or `false` has a meaningful action body. Per the spec, only the **truly empty** ones (no comment, no code) need the debug pattern. Let me enumerate those:

**Truly empty `catch {}` blocks (no comment, no code after `{`):**

After reviewing all files, the catches break into three categories:
1. **Return-value catches** (e.g., `catch { return null; }`) — these have a body (return statement). NOT in scope.
2. **Comment-only catches** (e.g., `catch { /* ignore */ }`, `catch { /* empty */ }`) — have a comment. Borderline; CONTEXT.md says "no body", a comment is not code but it's not empty. These are optional per discretion.
3. **Truly empty** — no content between `{` and `}` beyond whitespace. Per the grep results, there are no completely empty `catch {}` blocks without at least a comment or return statement.

**Practical decision:** The CONTEXT.md target pattern `catch (e) { /* optional op, ignore */ if (process.env.MAXSIM_DEBUG) console.error(e); }` should replace:
- `catch { /* ignore */ }` — comment-only, no error visibility
- `catch { /* empty */ }` — comment-only, no error visibility
- Any catch that discards an error silently with only a comment

**Catalog of catch blocks to fix (categorized):**

`core.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 72 | `catch { return null; }` | Return-value | No |
| 131 | `catch { return defaults; }` | Return-value | No |
| 145 | `catch { return false; }` | Return-value | No |
| 241 | `catch { return null; }` | Return-value | No |
| 278 | `catch { /* ignore */ }` | Comment-only | Yes |
| 314 | `catch { /* ignore */ }` | Comment-only | Yes |
| 350 | `catch { return null; }` | Return-value | No |
| 377 | `catch { return false; }` | Return-value | No |
| 396 | `catch { return { version: 'v1.0', name: 'milestone' }; }` | Return-value | No |

`phase.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 194 | `catch { output(notFound, raw, ''); }` | Meaningful action | No |
| 219 | `catch { // phases dir doesn't exist }` | Comment-only | Yes |
| 386 | `catch { /* ignore */ }` | Comment-only | Yes |
| 453 | `catch { /* ignore */ }` | Comment-only | Yes |
| 512 | `catch { /* ignore */ }` | Comment-only | Yes |
| 566 | `catch { /* ignore */ }` | Comment-only | Yes |
| 747 | `catch { /* ignore */ }` | Comment-only | Yes |

`roadmap.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 155 | `catch { /* empty */ }` | Comment-only | Yes |
| 333 | `catch { return null; }` | Return-value | No |  *(wait, line 333 is in verify.ts)*|

`verify.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 48 (interface lines — no catch) | — | — | — |
| 630 | `catch { /* ignore */ }` | Comment-only | Yes |
| 685 | `catch { /* ignore */ }` | Comment-only | Yes |
| 704 | `catch { /* ignore */ }` | Comment-only | Yes |
| 786 | `catch { /* ignore */ }` | Comment-only | Yes |
| 825 | `catch { /* ignore */ }` | Comment-only | Yes |
| 844 | `catch { /* ignore */ }` | Comment-only | Yes |
| 865 | `catch { /* ignore */ }` | Comment-only | Yes |
| 574 | `catch { check.detail = ...; }` | Meaningful action | No |

`state.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 62 | `catch { /* empty */ }` | Comment-only | Yes |
| 128 | `catch { error('STATE.md not found'); }` | Meaningful action | No |
| 156 | `catch { error('STATE.md not found'); }` | Meaningful action | No |
| 178 | `catch { output({ updated: false, reason: '...' }); }` | Meaningful action | No |

`commands.ts`:
| Line | Current | Category | Fix? |
|------|---------|----------|------|
| 108 | `catch { /* skip unreadable files */ }` | Comment-only | Yes |
| 110 | `catch { /* no pending dir */ }` | Comment-only | Yes |
| 130 | `catch { ... output ... }` | Meaningful action | No |
| 165 | `catch { /* ignore */ }` | Comment-only | Yes |
| 226 | `catch { // Skip malformed summaries }` | Comment-only | Yes |
| 508 | `catch { /* ignore */ }` | Comment-only | Yes |

**Standard replacement pattern:**
```typescript
// Replace:
} catch { /* ignore */ }

// With:
} catch (e) {
  /* optional op, ignore */
  if (process.env.MAXSIM_DEBUG) console.error(e);
}
```

### Pattern 4: cmdProgressRender Phase-by-Phase ASCII Bars

**Current `cmdProgressRender` state** (`commands.ts` lines 470–540):

The function already exists with two format modes:
- `format === 'table'`: renders a markdown table, uses 10-char bar for total progress only
- `format === 'bar'`: renders a single 20-char bar for total progress
- default: returns JSON

**What needs to change** for the new `'phase-bars'` (or enhanced `'table'`) format:

Target output:
```
Milestone: NX Monorepo Migration — 4/10 phases complete (40%)

Phase 01 [██████████] 100% — DONE
Phase 02 [████░░░░░░]  40% — IN PROGRESS
Phase 03 [░░░░░░░░░░]   0% — PLANNED
```

**Data already available in `cmdProgressRender`:** `phases[]` array has `.status`, `.plans`, `.summaries`, `.number`, `.name`. The milestone info comes from `getMilestoneInfo(cwd)`.

**Chalk import:** Chalk 5.6.2 is an ESM-only package. `packages/core` compiles to CJS via tsdown. The current `commands.ts` imports are all Node.js built-ins — chalk has NOT been imported in `packages/core` previously. However, `packages/cli/src/cli.ts` imports from `@maxsim/core`, and `packages/cli` has chalk as a devDependency. The chalk coloring for `cmdProgressRender` must either:
1. Accept color functions as callbacks (decoupled, clean but verbose), OR
2. Import chalk directly in `commands.ts` and add chalk to `packages/core` devDependencies/dependencies

**Current project practice:** `packages/cli/src/install.ts` imports chalk directly. The `cmdProgressRender` function is in `packages/core/src/commands.ts`. For chalk ANSI to work in the output, chalk must be importable from `commands.ts`.

**Recommendation:** Add chalk as a `dependency` (not devDependency) in `packages/core/package.json` and import it in `commands.ts`. This keeps the color logic colocated with the rendering logic. Alternatively, output plain strings and let the caller colorize — but the CONTEXT.md specifies chalk, and the workflow calls `cmdProgressRender` directly.

**Decision point:** chalk 5.x is ESM-only. tsdown can handle dynamic interop. The existing `packages/cli/src/install.ts` successfully uses chalk in a tsdown-compiled file. The same pattern applies to `commands.ts`.

### Pattern 5: /maxsim:roadmap Command

**Does it exist?** No `/maxsim:roadmap` command file exists in `packages/templates/commands/maxsim/`. No `workflows/roadmap.md` exists.

**Template source location:** `packages/templates/commands/maxsim/roadmap.md` (new file)
**Workflow source location:** `packages/templates/workflows/roadmap.md` (new file, or inline in command)
**Mirror in .claude:** `packages/templates/` is the canonical source; `.claude/` is copied during install, not during build. For testing in the dev environment, the file must also be manually copied or the install script run.

**Format to implement** (from CONTEXT.md):
```
Milestone: NX Monorepo Migration — 5 done / 1 active / 6 planned

✓  Phase 01: NX Workspace Scaffold                    DONE
✓  Phase 02: packages/core TypeScript Port            DONE
►  Phase 09: End-to-end install and publish test loop  IN PROGRESS  (2/3 plans)
□  Phase 11: Remove Discord command                   PLANNED
□  Phase 12: UX Polish + Core Hardening               PLANNED
```

**Data source:** `node ./.claude/maxsim/bin/maxsim-tools.cjs roadmap analyze` returns `phases[]` with `disk_status`, `name`, `number`, `plan_count`, `summary_count`.

**Status mapping:**
- `disk_status === 'complete'` → `✓` icon, chalk green, label `DONE`
- `disk_status === 'partial'` → `►` icon, chalk yellow, label `IN PROGRESS`
- `disk_status === 'planned'` → `►` icon, chalk yellow, label `IN PROGRESS` (has plans but not yet running)
- `disk_status === 'empty' | 'discussed' | 'researched' | 'no_directory'` → `□` icon, chalk dim/gray, label `PLANNED`

### Pattern 6: Sanity Check Guard

**What:** A reusable guard block inserted at the top of each major workflow markdown file, before the main `<process>` steps execute.

**Checks to run (via maxsim-tools):**
```bash
# Check 1: .planning/ directory exists
node ./.claude/maxsim/bin/maxsim-tools.cjs verify path-exists .planning

# Check 2: ROADMAP.md present
node ./.claude/maxsim/bin/maxsim-tools.cjs verify path-exists .planning/ROADMAP.md

# Check 3: STATE.md parseable (use state-load which returns state_exists)
INIT=$(node ./.claude/maxsim/bin/maxsim-tools.cjs state-load)

# Check 4: Current phase valid — done via init command which validates phase_found
```

**Hard stop message (when .planning/ missing):**
```
No .planning/ directory found. This project has not been initialized.

Run /maxsim:new-project to set up the project structure.
```

**Warning message (ROADMAP.md present, REQUIREMENTS.md missing):**
```
Warning: ROADMAP.md found but REQUIREMENTS.md is missing.
This may indicate an incomplete project setup. Continuing...
```

**Workflow files to update** (in `packages/templates/workflows/`):
- `execute-phase.md` — currently has `init execute-phase` call but no explicit sanity check
- `plan-phase.md` — has planning_exists check inline, extend it
- `discuss-phase.md` — check
- `quick.md` — check
- `verify-work.md` / `verify-phase.md` — check

**Implementation approach:** A `<sanity_check>` XML block at the top of each workflow, executed before `<step name="initialize">`. The guard uses the existing `init` call which already checks `planning_exists` — extend it with REQUIREMENTS.md presence check.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phase status detection | Custom disk scan | `cmdRoadmapAnalyze()` via `roadmap analyze` | Already returns `disk_status` per phase |
| Milestone name/version | Manual ROADMAP.md parse | `getMilestoneInfo(cwd)` | Already exported from core.ts |
| Progress percentage | Manual math | Existing `percent` computation in `cmdProgressRender` | Already handles `totalSummaries/totalPlans` |
| ANSI terminal colors | Raw escape codes | chalk 5.6.2 | Already depended upon in packages/cli |
| Phase regex | New regex syntax | `getPhasePattern()` (the new helper) | Centralizes the one canonical pattern |

---

## Common Pitfalls

### Pitfall 1: chalk is ESM-only, tsdown compiles to CJS

**What goes wrong:** `import chalk from 'chalk'` fails at runtime if the bundle format is CommonJS and the interop is not handled.

**Why it happens:** Chalk 5.x dropped CJS support. tsdown must be configured with `noExternal: ['chalk']` or equivalent to bundle it inline, OR use dynamic `import()`.

**How to avoid:** Look at how `packages/cli/src/install.ts` handles chalk — it uses static `import chalk from 'chalk'` and tsdown bundles it successfully. Apply the same approach in `commands.ts`. Add chalk to `packages/core` dependencies (not devDependencies) since it becomes a runtime import.

**Warning signs:** `ERR_REQUIRE_ESM` at runtime when maxsim-tools.cjs runs.

### Pitfall 2: getPhasePattern() capture groups shift

**What goes wrong:** Code that uses `.exec(content)[1]` to get phase number breaks if the new function returns a regex with a different capture group layout.

**Why it happens:** The current inline patterns in `cmdPhaseAdd` use group 1 for the phase number, but the proposed `getPhasePattern()` general form uses group 1 for number and group 2 for name.

**How to avoid:** Audit every call site's group index before replacing. Consider providing a `getPhaseNumberPattern()` variant that only captures the number (no name group) for simple use cases.

**Warning signs:** `m[1]` starts returning unexpected values (the phase name instead of number).

### Pitfall 3: ROADMAP.md writes are not truly atomic at OS level

**What goes wrong:** Treating `fs.writeFileSync` as atomic when it isn't on all OSes.

**Why it happens:** `writeFileSync` is not atomic at the POSIX level — it truncates then writes. An OS crash mid-write can corrupt the file.

**How to avoid:** For the current scope, the CONTEXT.md decision is "build in memory, single write" — this reduces the number of writes to one per operation, which is the main goal. Full atomic writes (write-to-temp + rename) are out of scope for this phase.

**Warning signs:** Not applicable for this phase scope.

### Pitfall 4: Sanity check guard added to workflows but not to .claude/ copy

**What goes wrong:** Workflow files are updated in `packages/templates/workflows/` but the already-installed `.claude/maxsim/workflows/` files (used during development) are not updated.

**Why it happens:** The build pipeline copies templates to `packages/cli/dist/assets/`, but the `.claude/` directory is populated by the installer. During development, `.claude/` is the live copy.

**How to avoid:** After updating `packages/templates/workflows/`, also update `C:/Development/cli/maxsim/.claude/maxsim/workflows/` (the dev copy) manually, or note that changes won't take effect until next install.

**Warning signs:** Command behaves without the sanity check locally even after updating templates.

### Pitfall 5: Progress bar command alias mismatch

**What goes wrong:** The workflow calls `progress bar --raw` but the new format is `progress phase-bars --raw` — CLI dispatch doesn't recognize the new subcommand.

**Why it happens:** `cmdProgressRender` is dispatched via `case 'progress': args[1]` in `cli.ts`. Adding a new format string requires updating the dispatch.

**How to avoid:** Decide on the subcommand name early (e.g., `phase-bars`) and update both `cmdProgressRender` in `commands.ts` and the dispatch in `cli.ts`.

---

## Code Examples

### Current cmdProgressRender dispatch (cli.ts lines 457–461)

```typescript
// packages/cli/src/cli.ts
case 'progress': {
  const subcommand: string = args[1] || 'json';
  commands.cmdProgressRender(cwd, subcommand, raw);
  break;
}
```

Adding `'phase-bars'` means this stays the same — just extend `cmdProgressRender` to handle the new `format` string.

### Current cmdProgressRender structure (commands.ts lines 470–540)

```typescript
// packages/core/src/commands.ts — simplified
export function cmdProgressRender(cwd: string, format: string, raw: boolean): void {
  // ... collects phases[], totalPlans, totalSummaries, percent

  if (format === 'table') {
    // markdown table output
  } else if (format === 'bar') {
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
    output({ bar: text, percent, ... }, raw, text);
  } else {
    // JSON output
  }
}
```

New branch to add:
```typescript
} else if (format === 'phase-bars') {
  // chalk import at top of file — needed
  // Milestone header
  const doneCount = phases.filter(p => p.status === 'Complete').length;
  const header = chalk.bold(`Milestone: ${milestone.name} — ${doneCount}/${phases.length} phases complete (${percent}%)`);
  const lines: string[] = [header, ''];

  for (const p of phases) {
    const pPercent = p.plans > 0 ? Math.min(100, Math.round((p.summaries / p.plans) * 100)) : 0;
    const barWidth = 10;
    const filled = Math.round((pPercent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const phaseLabel = `Phase ${p.number.padStart(2, '0')}`;
    const statusLabel = p.status === 'Complete' ? 'DONE' : p.status === 'In Progress' ? 'IN PROGRESS' : 'PLANNED';

    let line = `${phaseLabel} [${bar}] ${String(pPercent).padStart(3, ' ')}% — ${statusLabel}`;
    if (p.status === 'Complete') line = chalk.green(line);
    else if (p.status === 'In Progress') line = chalk.yellow(line);
    else line = chalk.dim(line);

    lines.push(line);
  }

  const rendered = lines.join('\n');
  output({ rendered }, raw, rendered);
}
```

### Sanity check guard block for workflow files

```markdown
<sanity_check>
**Verify project is initialized before proceeding:**

```bash
SANITY=$(node ./.claude/maxsim/bin/maxsim-tools.cjs state-load --raw)
```

Check for `planning_exists=false` in output. If true, hard stop:

> No .planning/ directory found. This project has not been initialized.
> Run /maxsim:new-project to set up the project structure.

Also check `roadmap_exists=false`. If true, hard stop:

> No ROADMAP.md found. Run /maxsim:new-milestone to create a roadmap.

Check for REQUIREMENTS.md:
```bash
node ./.claude/maxsim/bin/maxsim-tools.cjs verify path-exists .planning/REQUIREMENTS.md
```
If `exists: false`, print warning (not hard stop):
> Warning: REQUIREMENTS.md is missing. Project setup may be incomplete.

</sanity_check>
```

### getPhasePattern() helper placement

```typescript
// packages/core/src/core.ts — add after comparePhaseNum()

// ─── Phase regex helper ──────────────────────────────────────────────────────

/**
 * Returns the canonical regex for matching Phase heading lines in ROADMAP.md.
 *
 * General form (no phaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase number string (e.g. "03", "3A", "2.1")
 *   Group 2: phase name string (e.g. "Name Here")
 *
 * Specific form (with escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase name string
 *
 * @param escapedPhaseNum - regex-escaped phase number to match specifically
 * @param flags - regex flags (default: 'gi')
 */
export function getPhasePattern(escapedPhaseNum?: string, flags = 'gi'): RegExp {
  if (escapedPhaseNum) {
    return new RegExp(
      `#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`,
      flags,
    );
  }
  return new RegExp(
    `#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`,
    flags,
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline regex per function | Centralized `getPhasePattern()` | Phase 12 | Single source of truth for ROADMAP.md heading pattern |
| Multiple silent `catch {}` | Debug-guarded `catch (e) { if (MAXSIM_DEBUG) ... }` | Phase 12 | Errors surfaced during development via env var |
| Plain `[████░░░░░░] 40%` total bar | Per-phase chalk-colored bars | Phase 12 | Better visual progress for multi-phase milestones |
| No `/maxsim:roadmap` command | Read-only roadmap command | Phase 12 | Dedicated view without progress routing |

**Deprecated/outdated:**

- `format === 'bar'` in `cmdProgressRender`: 20-char single bar — will remain for backward compat, new `'phase-bars'` is the UX improvement
- `format === 'table'`: markdown table — will remain; `'phase-bars'` replaces it for human display in the progress workflow

---

## Open Questions

1. **chalk in packages/core vs. packages/cli**
   - What we know: chalk 5.6.2 is in packages/cli devDependencies; packages/core has no chalk dependency
   - What's unclear: Whether tsdown handles ESM chalk correctly when compiling core to CJS — the `install.ts` precedent suggests yes
   - Recommendation: Add chalk to `packages/core` `dependencies` (not devDeps) and test with `nx build core` after adding

2. **getPhasePattern() group 2 for name-only callers**
   - What we know: Some callers only need group 1 (phase number); the new general form has two capture groups
   - What's unclear: Whether to break those callers or silently ignore group 2
   - Recommendation: Document clearly — existing callers using `m[1]` for phase number still work since group 1 is still the number; only `roadmap.ts line 109` currently uses two groups

3. **Sanity check in .claude/ vs. packages/templates/**
   - What we know: `.claude/maxsim/workflows/` is the live dev copy; `packages/templates/workflows/` is the source
   - What's unclear: Whether Plan 12-02 should update both or just templates
   - Recommendation: Update both in Plan 12-02 (source + dev copy); note this in plan task

---

## Validation Architecture

(Skipped — `workflow.nyquist_validation` not enabled for this project)

---

## File Map: Exact Lines to Touch

### Plan 12-01: Core hardening (packages/core/src/)

| File | Lines | Change |
|------|-------|--------|
| `packages/core/src/core.ts` | After line 199 | Add `getPhasePattern()` export |
| `packages/core/src/core.ts` | Lines 329 | Replace inline regex → `getPhasePattern(escapedPhase, 'i')` |
| `packages/core/src/phase.ts` | Lines 317–320 | Replace inline regex → `getPhasePattern()` |
| `packages/core/src/phase.ts` | Lines 369, 381, 398 | Replace `new RegExp(...)` → `getPhasePattern(...)` |
| `packages/core/src/roadmap.ts` | Lines 34–37, 109 | Replace → `getPhasePattern(...)` |
| `packages/core/src/verify.ts` | Lines 616, 851 | Replace → `getPhasePattern()` |
| `packages/core/src/index.ts` | After line 96 | Export `getPhasePattern` |
| `packages/core/src/core.ts` | Line 278, 314 | Fix `catch { /* ignore */ }` |
| `packages/core/src/phase.ts` | Lines 219, 386, 453, 512, 566, 747 | Fix catch blocks |
| `packages/core/src/roadmap.ts` | Line 155 | Fix `catch { /* empty */ }` |
| `packages/core/src/verify.ts` | Lines 630, 685, 704, 786, 825, 844, 865 | Fix catch blocks |
| `packages/core/src/state.ts` | Line 62 | Fix `catch { /* empty */ }` |
| `packages/core/src/commands.ts` | Lines 108, 110, 165, 226, 508 | Fix catch blocks |
| `packages/core/package.json` | (new) dependencies | Add `"chalk": "^5.6.2"` |

### Plan 12-02: UX commands (templates + .claude/)

| File | Change |
|------|--------|
| `packages/core/src/commands.ts` | Add `'phase-bars'` format branch in `cmdProgressRender` |
| `packages/templates/commands/maxsim/roadmap.md` | NEW file — `/maxsim:roadmap` command |
| `packages/templates/workflows/roadmap.md` | NEW file — roadmap render workflow |
| `packages/templates/workflows/progress.md` | Update `<step name="report">` to call `phase-bars` format |
| `packages/templates/workflows/execute-phase.md` | Add `<sanity_check>` block |
| `packages/templates/workflows/plan-phase.md` | Add `<sanity_check>` block |
| `packages/templates/workflows/discuss-phase.md` | Add `<sanity_check>` block |
| `packages/templates/workflows/quick.md` | Add `<sanity_check>` block |
| `packages/templates/workflows/verify-phase.md` | Add `<sanity_check>` block |
| `.claude/maxsim/workflows/progress.md` | Mirror of templates (dev copy) |
| `.claude/maxsim/workflows/execute-phase.md` | Mirror of templates (dev copy) |
| `.claude/commands/maxsim/roadmap.md` | NEW (dev copy) |
| `.claude/maxsim/workflows/roadmap.md` | NEW (dev copy) |

### Plan 12-03: Validation

| Check | Command |
|-------|---------|
| Build clean | `npx nx build core` |
| Build CLI | `npx nx build cli` |
| Progress bar renders | `node packages/cli/dist/cli.cjs progress phase-bars` |
| Roadmap renders | `/maxsim:roadmap` in dev |
| No silent catches | `grep -rn "catch {" packages/core/src/` — only return-value catches remain |
| getPhasePattern exported | `grep "getPhasePattern" packages/core/dist/index.cjs` |

---

## Sources

### Primary (HIGH confidence)

- Direct source code inspection: `packages/core/src/core.ts`, `phase.ts`, `roadmap.ts`, `verify.ts`, `state.ts`, `commands.ts` — all read and catalogued
- `packages/cli/src/cli.ts` — dispatch table, chalk usage confirmed
- `packages/cli/scripts/copy-assets.cjs` — build pipeline confirmed
- `packages/templates/` — canonical source for markdown templates confirmed
- `.claude/maxsim/workflows/progress.md` — current progress workflow inspected

### Secondary (MEDIUM confidence)

- chalk 5.6.2 ESM interop with tsdown: inferred from `packages/cli/src/install.ts` which uses the same pattern (static chalk import, tsdown build)

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — code directly inspected, no assumptions
- Architecture: HIGH — all files read, line numbers verified
- Pitfalls: MEDIUM — chalk ESM/CJS interop based on inference from existing pattern, not direct tsdown config verification

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable codebase, 30-day horizon)
