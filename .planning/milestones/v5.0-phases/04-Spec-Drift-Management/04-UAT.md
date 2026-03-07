---
phase: "04"
type: uat
status: pass-with-note
tested: "2026-03-07"
tests_passed: 5
tests_failed: 0
notes: 1
---

# Phase 4: Spec Drift Management — UAT Results

**Tested:** 2026-03-07
**Status:** PASS (with 1 note requiring action before publish)

## Test Results

### Test 1: CLI drift commands respond correctly
**Status:** PASS
**What:** Ran all 6 drift subcommands + 2 init commands via `node dist/cli.cjs`
**Results:**
- `drift read-report` — returns `{found: false}` when no report exists (correct)
- `drift extract-requirements` — parses 22 requirements from REQUIREMENTS.md with id, description, complete status
- `drift extract-nogos` — parses 15 no-gos from NO-GOS.md with rule, section, line number
- `drift extract-conventions` — returns `{found: false}` when CONVENTIONS.md absent (correct)
- `drift previous-hash` — returns `{found: false}` when no previous report (correct)
- `init check-drift` — returns full CheckDriftContext JSON with model, spec files, phase dirs, codebase docs
- `init realign to-code` — returns RealignContext with direction: "to-code"
- `init realign to-spec` — returns RealignContext with direction: "to-spec"

### Test 2: Drift report write/read roundtrip
**Status:** PASS
**What:** Wrote a test DRIFT-REPORT.md via `drift write-report --content-file`, then read it back via `drift read-report`
**Results:**
- Report written to `.planning/DRIFT-REPORT.md`
- Read-back returns correct frontmatter (status, checked, total_items, critical/warning/info counts)
- Body content preserved exactly

### Test 3: Init realign context assembly
**Status:** PASS
**What:** Tested both `init realign to-code` and `init realign to-spec` with a drift report present
**Results:**
- Both directions return correct context with report path, direction field, phase dirs, codebase docs
- Report existence correctly detected

### Test 4: Template files exist with correct structure
**Status:** PASS
**What:** Verified all 5 new template files exist with expected content
**Results:**
- `maxsim-drift-checker.md` — 522 lines (agent prompt with multi-pass protocol)
- `check-drift.md` (command) — 56 lines, references `@./workflows/check-drift.md`
- `check-drift.md` (workflow) — 248 lines
- `realign.md` (command) — 39 lines
- `realign.md` (workflow) — 288 lines
- Drift-checker registered in AGENTS.md as 14th agent with correct skills

### Test 5: Source code wiring
**Status:** PASS
**What:** Verified drift code is wired in all source modules
**Results:**
- `cli.ts:324` — `handleDrift` handler defined
- `cli.ts:407` — `'drift': handleDrift` in COMMANDS record
- `types.ts:612-647` — DriftReportFrontmatter, CheckDriftContext, RealignContext interfaces
- `core.ts:42` — `maxsim-drift-checker` in MODEL_PROFILES (verifier-tier)
- `index.ts:231` — barrel export from drift module
- Built `dist/cli.cjs` contains drift handler code

## Notes

### Note 1: Build required before publish
**Severity:** Action needed
**Detail:** The new template files (`check-drift.md`, `realign.md`, `maxsim-drift-checker.md`) exist in `templates/` but are NOT yet in `dist/assets/templates/`. Running `npm run build` will copy them via `copy-assets.cjs`. This must happen before any push to main, per project rules.
**Resolution:** Run `npm run build` before committing dist changes.

## Not Tested (requires live agent execution)

These tests require a running Claude Code session with agent spawning:

1. **End-to-end `/maxsim:check-drift` execution** — spawns drift-checker agent on a real project
2. **Interactive `/maxsim:realign to-code`** — requires user Accept/Skip/Edit decisions
3. **`/maxsim:realign to-spec` phase generation** — requires drift report with real gaps

These are integration tests that will be validated during first real usage.
