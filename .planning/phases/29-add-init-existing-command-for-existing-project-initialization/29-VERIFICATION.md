---
phase: 29-add-init-existing-command-for-existing-project-initialization
verified: 2026-02-27T15:30:00Z
status: passed
score: 9/9 must-haves verified
resolved_by: "Phase 30 (tech debt closure — traceability table updated to Satisfied)"
---

# Phase 29: Add init-existing Command Verification Report

**Phase Goal:** A working `/maxsim:init-existing` command that initializes MAXSIM in an existing codebase through scan-first-then-ask flow — runs all 4 codebase mapper agents, handles `.planning/` conflict detection with overwrite/merge/cancel dialog, asks scan-informed questions with smart defaults, generates stage-aware planning documents, and supports `--auto` mode for fully autonomous initialization.

**Verified:** 2026-02-27T15:30:00Z
**Status:** passed (gap resolved)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `node maxsim-tools.cjs init init-existing` returns valid JSON with all 19 conflict detection fields | VERIFIED | CLI output confirmed: all fields present including `conflict_detected`, `planning_files`, `has_readme`, `existing_file_count`, etc. |
| 2  | E2E install test asserts 32 command files (updated from 31) | VERIFIED | `install.test.ts` line 13 has `toHaveLength(32)`, test description updated to "installs exactly 32 command .md files" |
| 3  | TypeScript compiles (build succeeds) | VERIFIED | `npm run build` passes cleanly with all new files included |
| 4  | `/maxsim:init-existing` command exists and loads init-existing workflow | VERIFIED | `templates/commands/maxsim/init-existing.md` exists with correct frontmatter and `@./workflows/init-existing.md` in execution_context |
| 5  | `--auto` mode is documented and supported | VERIFIED | `<auto_mode>` section in workflow covers all required behaviors; command frontmatter documents `[--auto]` hint |
| 6  | Workflow runs 4 codebase mapper agents before asking questions | VERIFIED | Step 3 spawns tech, architecture, quality, and concerns mapper agents via Task tool; Step 2 (conflict) comes before Step 3 (scan) but questions start at Step 5 |
| 7  | Conflict detection offers merge/overwrite/cancel with merge as default | VERIFIED | Step 2 uses AskUserQuestion with "Merge (Recommended)", "Overwrite", and "Cancel" options; merge is first/default |
| 8  | Stage-aware document generation (prototype/MVP/production/maintenance) | VERIFIED | Step 9 has explicit stage-aware format branches with templates for Prototype (bullet points), MVP (user stories), Production (formal acceptance criteria with MUST NOT guards), Maintenance |
| 9  | REQUIREMENTS.md traceability table updated to Satisfied for all INIT-EX-* IDs | ✓ VERIFIED | All 6 INIT-EX-* rows in REQUIREMENTS.md traceability table now show 'Satisfied' |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/cli/src/core/init.ts` | InitExistingContext interface and cmdInitExisting function | VERIFIED | Interface at line 259 with 19 fields; function at line 833; added to InitContext union at line 326 |
| `packages/cli/src/cli.ts` | CLI router dispatch for init-existing | VERIFIED | Import at line 83; dispatch at line 294 `'init-existing': () => cmdInitExisting(cwd, raw)`; error message includes `init-existing` at line 299 |
| `packages/cli/src/core/index.ts` | Export of InitExistingContext and cmdInitExisting | VERIFIED | Line 236 exports `InitExistingContext`, line 252 exports `cmdInitExisting` |
| `templates/commands/maxsim/init-existing.md` | User-facing slash command entry point | VERIFIED | Exists with `name: maxsim:init-existing`, `argument-hint: "[--auto]"`, all required allowed-tools |
| `templates/workflows/init-existing.md` | Full orchestration workflow — 600+ lines | VERIFIED | 1099 lines; all 10 required steps present |
| `packages/cli/tests/e2e/install.test.ts` | Updated command count assertion to 32 | VERIFIED | `toHaveLength(32)` at line 13; test description updated |
| `.planning/REQUIREMENTS.md` | Traceability table updated to Satisfied | ✓ VERIFIED | All 6 INIT-EX-* rows now show 'Satisfied' |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/cli/src/cli.ts` | `packages/cli/src/core/init.ts` | `import cmdInitExisting` | WIRED | Import confirmed at line 83; dispatch at line 294 |
| `packages/cli/src/core/init.ts` | InitContext union | `InitExistingContext added to union` | WIRED | Added to union at line 326 |
| `templates/commands/maxsim/init-existing.md` | `templates/workflows/init-existing.md` | `@./workflows/init-existing.md` in execution_context | WIRED | Line 32 of command file: `@./workflows/init-existing.md` |
| `templates/workflows/init-existing.md` | `packages/cli/src/core/init.ts` | `node maxsim-tools.cjs init init-existing` | WIRED | Line 36 of workflow: `INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init init-existing)` |
| `templates/workflows/init-existing.md` | `templates/agents/maxsim-codebase-mapper.md` | Task tool spawning 4 mapper agents | WIRED | Step 3 spawns 4 Task calls with `subagent_type="maxsim-codebase-mapper"` |
| `templates/workflows/init-existing.md` | `templates/agents/maxsim-roadmapper.md` | Task tool spawning roadmapper agent | WIRED | Step 9c spawns Task with `subagent_type="maxsim-roadmapper"` at line 926 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INIT-EX-01 | 29-01, 29-02 | `/maxsim:init-existing` command with CLI wiring — `node maxsim-tools.cjs init init-existing` returns valid JSON with conflict detection fields | SATISFIED | CLI verified returning 19 fields; command file exists; router wired |
| INIT-EX-02 | 29-03 | 4 mapper agents run before user questions, saving to `.planning/codebase/` | SATISFIED | Workflow Step 3 spawns all 4 agents (tech/arch/quality/concerns); Step 3 runs before Step 5 (questions) |
| INIT-EX-03 | 29-03 | Conflict detection with overwrite/merge/cancel dialog — merge fills gaps, overwrite offers backup, cancel suggests health | SATISFIED | Step 2 implements all three paths with backup offer on overwrite, health suggestion on cancel, header-presence merge |
| INIT-EX-04 | 29-03 | Stage-aware documents: PROJECT.md with current state, REQUIREMENTS.md stage-format, ROADMAP.md with 3-5 phases, STATE.md pre-populated | SATISFIED | Step 9 has full stage-aware templates for all 4 stages with all required documents |
| INIT-EX-05 | 29-03 | `--auto` mode runs fully autonomously, flags output as auto-generated | SATISFIED | `<auto_mode>` section covers all steps; auto-generated comment appended to each doc |
| INIT-EX-06 | 29-01 | E2E install test asserts correct command count (32) | SATISFIED | `install.test.ts` updated to `toHaveLength(32)` with updated description |

All 6 requirements satisfied in code. However, REQUIREMENTS.md traceability table still shows "In Progress" for all 6 — this is a documentation consistency gap.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 113-118 | Traceability status "In Progress" for completed requirements | Warning | Misleading documentation state; does not block functionality |

No anti-patterns found in implementation files (`init.ts`, `cli.ts`, `index.ts`, `init-existing.md` command, `init-existing.md` workflow).

---

### Human Verification Required

#### 1. Full init-existing Flow on Real Project

**Test:** Run `/maxsim:init-existing` in a real existing project (not this repo) that has no `.planning/` directory.
**Expected:** Workflow executes all 10 steps in sequence — init context, no conflict, codebase scan (4 agents), README validation, config questions, scan-informed state confirmation, future direction questions, milestone suggestion, document generation, git stage + summary.
**Why human:** End-to-end interactive flow cannot be verified programmatically.

#### 2. Conflict Resolution: Merge Mode

**Test:** Run `/maxsim:init-existing` in a project with an existing `.planning/` directory. Choose "Merge (Recommended)".
**Expected:** Existing files preserved, missing files created, incomplete files gap-filled, codebase always rescanned.
**Why human:** Requires interactive session with real `.planning/` state.

#### 3. Auto Mode Behavior

**Test:** Run `/maxsim:init-existing --auto` in a project with code but no `.planning/`.
**Expected:** Runs without any questions, generates all 5 documents, adds auto-generated comment to each, prints summary.
**Why human:** Interactive mode cannot be tested programmatically.

#### 4. Production Sub-Questions

**Test:** Run `/maxsim:init-existing`, answer "Production" for project stage.
**Expected:** Workflow asks additional sub-questions: constraints/MUST NOT, deployment (zero-downtime/OK/none), staging environment, rollback plan.
**Why human:** Conditional question flow requires live session.

---

### Gaps Summary

> **Resolved (Phase 30):** REQUIREMENTS.md traceability table shows Satisfied for all 6 INIT-EX-* requirements.

One gap found (now resolved). All implementation artifacts are present, substantive, and wired. The gap was a **documentation inconsistency**: the REQUIREMENTS.md traceability table showed "In Progress" for all 6 INIT-EX-* requirements, even though Phase 29 was marked complete in ROADMAP.md and the requirements list checkboxes were all checked `[x]`.

This is a minor documentation maintenance issue — it does not block any functionality or future phase work. The traceability table simply needs 6 status values changed from "In Progress" to "Satisfied".

---

## Build Verification

- `npm run build`: PASSES (verified 2026-02-27)
- `node packages/cli/dist/cli.cjs init init-existing`: Returns valid 19-field JSON
- Command count: 32 files in `templates/commands/maxsim/` (verified)
- Workflow file: 1099 lines (exceeds 600-line minimum)

---

_Verified: 2026-02-27T15:30:00Z_
_Verifier: Claude (maxsim-verifier)_
