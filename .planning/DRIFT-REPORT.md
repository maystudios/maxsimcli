---
status: drift
checked: "2026-03-07T16:45:00Z"
previous_hash: null
previous_report_date: null
total_items: 30
aligned_count: 21
critical_count: 0
warning_count: 5
info_count: 4
undocumented_count: 0
spec_files_checked:
  - REQUIREMENTS.md
  - NO-GOS.md
  - ROADMAP.md
  - STATE.md
  - DECISIONS.md
  - ACCEPTANCE-CRITERIA.md
  - PROJECT.md
  - codebase/CONVENTIONS.md
---

# Drift Report

**Checked:** 2026-03-07 16:45 UTC
**Status:** DRIFT DETECTED
**Summary:** 21 aligned | 0 critical | 5 warning | 4 info | 0 undocumented

## Phase Overview

| Phase | Status | Aligned | Critical | Warning | Info |
|-------|--------|---------|----------|---------|------|
| 1. Context Rot Prevention | Aligned | 4/4 | 0 | 0 | 0 |
| 2. Deep Init Questioning | Aligned | 4/4 | 0 | 0 | 0 |
| 3. Agent Coherence | Aligned | 4/4 | 0 | 0 | 0 |
| 4. Spec Drift Management | Aligned | 4/4 | 0 | 0 | 0 |
| 5. Workflow Coverage | Aligned | 2/2 | 0 | 0 | 0 |
| Cross-cutting (spec accuracy) | Drift | 3/8 | 0 | 5 | 4 |

---

## Spec Ahead of Code

Items where spec says complete/required but code is missing or incomplete.

### CRITICAL

None.

### WARNING

#### ROADMAP-01: Phases 3, 4, 5 plan checkboxes not updated [WARNING] [NEW]

**Spec:** ROADMAP.md lines 15-17 -- Phase 3 (`[ ]`), Phase 4 (`[ ]`), Phase 5 (`[ ]`) are marked incomplete in the Phases list
**Code:** All 5 phases have VERIFICATION.md files showing `status: passed` with full scores (4/4, 12/12, 7/7). All plan summaries exist. All requirements marked `[x]` complete.
**Evidence:**
- ROADMAP.md line 15: `- [ ] **Phase 3: Agent Coherence**`
- ROADMAP.md line 16: `- [ ] **Phase 4: Spec Drift Management**`
- ROADMAP.md line 17: `- [ ] **Phase 5: Workflow Coverage**`
- `.planning/phases/03-Agent-Coherence/03-VERIFICATION.md` frontmatter: `status: passed`, `score: 4/4`
- `.planning/phases/04-Spec-Drift-Management/04-VERIFICATION.md` frontmatter: `status: passed`, `score: 12/12`
- `.planning/phases/05-Workflow-Coverage/05-VERIFICATION.md` frontmatter: `status: passed`, `score: 7/7`
- ROADMAP.md lines 60-61: Phase 3 plans 03-03 and 03-04 shown as `[ ]` despite SUMMARY.md files existing for both
- ROADMAP.md lines 73-75: Phase 4 plans 04-01, 04-02, 04-03 shown as `[ ]` despite SUMMARY.md files existing for all three
- ROADMAP.md lines 85-86: Phase 5 plans 05-01 and 05-02 shown as `[ ]` despite SUMMARY.md files existing for both
**Recommendation:** Update ROADMAP.md to mark Phases 3, 4, 5 and all their plan checkboxes as `[x]`. Update the Progress table to show "Complete" for all 5 phases with completion dates.

#### ROADMAP-02: Progress table outdated [WARNING] [NEW]

**Spec:** ROADMAP.md lines 97-99 -- Phase 3 shows "2/4 In Progress", Phase 4 shows "0/3 Not started", Phase 5 shows "0/2 Not started"
**Code:** All plans are complete with SUMMARY.md files. Phase 3 has 4/4 plans complete, Phase 4 has 3/3, Phase 5 has 2/2.
**Evidence:**
- ROADMAP.md line 97: `| 3. Agent Coherence | 2/4 | In Progress | - |`
- ROADMAP.md line 98: `| 4. Spec Drift Management | 0/3 | Not started | - |`
- ROADMAP.md line 99: `| 5. Workflow Coverage | 0/2 | Not started | - |`
- Actual summaries: 03-01, 03-02, 03-03, 03-04, 04-01, 04-02, 04-03, 05-01, 05-02 all exist
**Recommendation:** Update Progress table to show all phases as Complete with correct plan counts and completion dates.

#### ROADMAP-03: Milestone checkbox not updated [WARNING] [NEW]

**Spec:** ROADMAP.md line 9 -- `- [ ] **v5.0 Context-Aware SDD**` shown as incomplete
**Code:** All 5 phases have passed verification. All 18 requirements marked complete.
**Evidence:**
- ROADMAP.md line 9: `- [ ] **v5.0 Context-Aware SDD** -- Phases 1-5 (active)`
- All 5 verification reports show `status: passed`
**Recommendation:** Update milestone checkbox to `[x]` if the milestone is considered complete, or leave as `[ ]` if milestone completion requires additional ceremony (e.g., running `/maxsim:complete-milestone`).

#### STATE-01: STATE.md current position outdated [WARNING] [NEW]

**Spec:** STATE.md lines 8-16 -- Says "Phase 5 in progress", "Plan 1 of 2 complete", "Status: executing", "Next action: Execute Wave 2 plans (03-03, 03-04) for Phase 3"
**Code:** All 5 phases completed. Phase 5 Plan 02 has a SUMMARY.md. Verification for Phase 5 passed. Plans 03-03 and 03-04 also have summaries.
**Evidence:**
- STATE.md line 8: `Phase 5 (Workflow Coverage) in progress -- Plan 01 complete`
- STATE.md line 14: `Plan: 1 of 2 complete (Plan 01 - Discuss command and workflow)`
- STATE.md line 15: `Status: executing`
- STATE.md line 90: `Next action: Execute Wave 2 plans (03-03, 03-04) for Phase 3`
- `.planning/phases/05-Workflow-Coverage/05-02-SUMMARY.md` exists and shows completed
- `.planning/phases/05-Workflow-Coverage/05-VERIFICATION.md` shows `status: passed`
**Recommendation:** Update STATE.md current position to reflect all phases complete. Update status to "complete" or "awaiting milestone completion". Remove stale next action referencing already-completed plans.

#### REQS-01: REQUIREMENTS.md coverage count incorrect [WARNING] [NEW]

**Spec:** REQUIREMENTS.md line 96 -- `Active requirements: 18 total (8 complete, 10 pending)`
**Code:** All 18 active requirements are marked `[x]` complete in REQUIREMENTS.md lines 13-43. The traceability table also shows all 18 as "Complete".
**Evidence:**
- REQUIREMENTS.md line 96: `Active requirements: 18 total (8 complete, 10 pending)`
- REQUIREMENTS.md lines 13-43: All 18 requirements have `[x]` checkboxes
- REQUIREMENTS.md lines 72-89: All 18 entries in traceability table show "Complete"
**Recommendation:** Update coverage summary to `Active requirements: 18 total (18 complete, 0 pending)`.

### INFO

None.

---

## Code Ahead of Spec

Features implemented in code but not captured in `.planning/`.

### UNDOCUMENTED

None.

---

## No-Go Violations

### CRITICAL

None.

Analysis of each no-go rule:

| No-Go Rule | Status | Evidence |
|------------|--------|----------|
| npx maxsimcli@latest install flow | No violation | Install module at `packages/cli/src/install/` intact. Not modified by v5.0 work. |
| Existing /maxsim:* command interfaces | No violation | All 38 commands in `templates/commands/maxsim/` present. New commands added (discuss, check-drift, realign) but none removed. |
| Existing .planning/ file format | No violation | ROADMAP.md, STATE.md, REQUIREMENTS.md all follow existing format. New files (DRIFT-REPORT.md) are additions. |
| npm publish pipeline | No violation | semantic-release config and publish.yml unchanged. |
| Adding multi-runtime adapter code back | No violation | `packages/cli/src/adapters/` was deleted in v4 cleanup and not recreated. Grep for `adapter|multi.*runtime` in `src/` returns only install utility files. |
| Over-engineering context assembly | No violation | Role-based init functions return simple JSON objects filtered by role. No ML or complex logic. |
| Agents that operate in isolation | No violation | All 14 agent files have `<agent_system_map>`, `<upstream_input>`, `<downstream_consumer>` tags (89 total occurrences across 15 files). |
| Skills with overlapping activation triggers | No violation | 11 skills in `templates/skills/` with distinct triggers per SKILL.md frontmatter. |
| Sync file I/O in frequently-called code | See INFO finding below | sync I/O exists in multiple modules but these are CLI tool invocations, not hot paths in a server context. |
| Monorepo-only features | No violation | All new features (drift, discuss, pagination) ship in templates/ or src/core/ which are included in npm tarball via copy-assets.cjs. |
| Accumulating completed phase data | No violation | Milestone archival implemented in `milestone.ts`. Stale detection in `state.ts`. Archive directory exists at `.planning/archive/v4/`. |

---

## Convention Compliance

### INFO

#### CONV-01: Sync file I/O in core modules [INFO] [confidence: HIGH] [NEW]

**Convention:** NO-GOS.md: "Sync file I/O in hot paths -- use async for all file operations in frequently-called code"
**Evidence:** 40+ `readFileSync`/`writeFileSync` calls found across `verify.ts`, `frontmatter.ts`, `config.ts`, `template.ts`, `drift.ts`, `commands.ts`, `milestone.ts`, `core.ts`, `init.ts`, `artefakte.ts`, `dashboard-launcher.ts`. These are CLI tool functions invoked via subprocess, not server hot paths.
**Note:** The no-go specifies "hot paths" and "frequently-called code." CLI tool functions are invoked once per subprocess call and terminate. This is pre-existing tech debt acknowledged in PROJECT.md, not a v5.0 regression. The no-go is not violated in the strict sense (these are not hot paths), but the pattern is worth noting.

#### CONV-02: drift.ts conventions path mismatch [INFO] [confidence: HIGH] [NEW]

**Convention:** drift.ts line 214 looks for `.planning/CONVENTIONS.md`; init.ts also checks `.planning/CONVENTIONS.md` in all init functions.
**Evidence:** This MAXSIM project has conventions at `.planning/codebase/CONVENTIONS.md` (not `.planning/CONVENTIONS.md`). The init workflow `new-project.md` generates `CONVENTIONS.md` at `.planning/CONVENTIONS.md`. The codebase-mapper workflow generates a separate `CONVENTIONS.md` at `.planning/codebase/CONVENTIONS.md`. Both can exist in a project.
**Note:** The drift extraction and init context functions only look at `.planning/CONVENTIONS.md`. If a project only has `.planning/codebase/CONVENTIONS.md` (like this one), the drift checker will not find conventions to analyze, and init functions will not include conventions in agent context. This is a functional gap but does not violate a stated convention. The codebase-mapper-generated conventions file follows a different template than the init-generated one.

#### PROJECT-01: PROJECT.md "Known Tech Debt" section outdated [INFO] [confidence: HIGH] [NEW]

**Convention:** PROJECT.md should accurately describe the current state of the project.
**Evidence:**
- PROJECT.md line 96: "No pagination for large phase listings" -- pagination is now implemented (FLOW-02, MCP phase-tools.ts, roadmap.md workflow)
- PROJECT.md line 97: "Missing todo/bug discussion flow" -- discuss command now exists (FLOW-01, discuss.md command + workflow)
- PROJECT.md line 92: "server.ts (1159 lines)" -- actual count is 1371 lines
- PROJECT.md line 92: "phase.ts (940 lines)" -- actual count is 1193 lines
- PROJECT.md line 93: "98 `any` type usages across 26 files" -- actual count is approximately 40 across 14 files
**Note:** Two tech debt items have been resolved but are still listed. Three tech debt metrics are stale.
**Recommendation:** Remove the two resolved items (pagination, discuss flow). Update line counts and `any` usage metrics to current values.

#### AC-01: ACCEPTANCE-CRITERIA.md checkboxes not updated [INFO] [confidence: HIGH] [NEW]

**Convention:** ACCEPTANCE-CRITERIA.md milestone-level criteria should reflect actual completion state.
**Evidence:**
- All 6 milestone-level criteria remain unchecked (`[ ]`):
  1. "Planning documents for a 50-phase project contain only the active milestone's phases" -- implemented via milestone archival (ROT-01 through ROT-04 complete)
  2. "Agent prompts work as a coordinated system" -- implemented (AGENT-01 through AGENT-04 complete, all 14 agents have system maps)
  3. "Spec drift between .planning/ and codebase is detectable via a single command" -- implemented (DRIFT-01 through DRIFT-04 complete, check-drift command exists)
  4. "Init flows produce context thorough enough" -- implemented (INIT-01 through INIT-04 complete)
  5. "Every workflow step has a corresponding skill" -- 11 skills exist covering all major workflows
  6. "npm run build and npm test pass after every phase" -- build verified during each phase execution
**Recommendation:** Update ACCEPTANCE-CRITERIA.md to mark criteria as `[x]` where satisfied.

---

## Archived Phase Regressions

### Archived Milestone: v4

Archived phases checked: 01-MCP-Core-Server, 16-Codebase-Cleanup, 17-Skill-System-Cleanup.

| Archived Feature | Status | Evidence |
|-----------------|--------|----------|
| MCP Core Server (Phase 01) | No regression | `packages/cli/src/mcp/` directory intact with phase-tools.ts, context-tools.ts. MCP server test exists at `tests/e2e/mcp-server.test.ts`. |
| Adapter Removal (Phase 16) | No regression | `packages/cli/src/adapters/` remains deleted. Install utilities in `packages/cli/src/install/utils.ts` intact. |
| Skill System Cleanup (Phase 17) | No regression | 11 skills in `templates/skills/` with correct names (maxsim-simplify, maxsim-batch). Skills sync guard test in `tests/unit/skills.test.ts`. |

None -- all archived features verified intact.

---

## Diff Summary

First run -- no previous report to compare against.

| Category | New | Resolved | Unchanged |
|----------|-----|----------|-----------|
| Critical | 0 | 0 | 0 |
| Warning | 5 | 0 | 0 |
| Info | 4 | 0 | 0 |
| Undocumented | 0 | 0 | 0 |
