---
phase: 26-superpowers-inspired-workflow-enhancements
plan: 03
subsystem: agents
tags: [anti-rationalization, evidence-gates, two-stage-review, skills, prompt-engineering]
dependency_graph:
  requires: ["26-01 (foundational skills)", "26-02 (reviewer agents)"]
  provides: ["Enhanced executor with anti-rationalization, evidence gate, two-stage review, skill discovery", "Enhanced verifier with anti-rationalization and evidence-based verification gate", "Enhanced debugger with anti-rationalization and skill discovery"]
  affects: ["All plan executions (executor)", "All phase verifications (verifier)", "All debug sessions (debugger)"]
tech_stack:
  added: []
  patterns: ["HARD-GATE anti-rationalization XML tags", "CLAIM/EVIDENCE/OUTPUT/VERDICT evidence blocks", "Skill trigger tables with on-demand file loading", "Quality-gated two-stage review protocol"]
key_files:
  modified:
    - templates/agents/maxsim-executor.md
    - templates/agents/maxsim-verifier.md
    - templates/agents/maxsim-debugger.md
decisions:
  - "Evidence blocks use CLAIM/EVIDENCE/OUTPUT/VERDICT format for structured verification proof"
  - "Two-stage review (spec + code) gated on quality model_profile only to avoid overhead on balanced/budget"
  - "Each agent gets role-specific Iron Law and rationalizations table tailored to its failure modes"
  - "Debugger gets 2 skills (systematic-debugging + verification); executor gets 3 (tdd + debugging + verification)"
metrics:
  duration: 3min
  completed: 2026-02-26T14:08:25Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements-completed: [DOCS-01]
---

# Phase 26 Plan 03: Agent Anti-Rationalization and Evidence Gates Summary

Anti-rationalization sections, evidence-based completion/verification gates, two-stage review protocol, and Available Skills references added to the three "doing" agents (executor, verifier, debugger) via surgical appends.

## Tasks Completed

### Task 1: Enhance maxsim-executor.md (4 additions)

**Commit:** `6a4da66`

1. **Evidence-Based Completion Gate** -- Added step 4 in `<self_check>` requiring CLAIM/EVIDENCE/OUTPUT/VERDICT blocks before every task commit
2. **Two-Stage Review Protocol** -- New `<wave_review_protocol>` section that spawns `maxsim-spec-reviewer` and `maxsim-code-reviewer` agents after wave completion, gated on `model_profile == "quality"`, with max 2 retry loops per stage
3. **Anti-Rationalization Section** -- New `<anti_rationalization>` section with HARD-GATE Iron Law, 7-entry Common Rationalizations table (executor-specific: "should work", "one line", "auto-fixed", etc.), and 7-item Red Flags list
4. **Available Skills Section** -- New `<available_skills>` section with 3 skill trigger references (TDD, Systematic Debugging, Verification Before Completion)

### Task 2: Enhance maxsim-verifier.md and maxsim-debugger.md (3 additions each)

**Commit:** `cdfe4b6`

**Verifier:**
1. **Evidence-Based Verification Gate** -- Added in `<core_principle>` requiring CLAIM/EVIDENCE/OUTPUT/VERDICT for every verification finding
2. **Anti-Rationalization Section** -- HARD-GATE ("Trust the code, not SUMMARY.md"), 6-entry rationalizations table (verifier-specific: "SUMMARY says done", "task completed = goal achieved", etc.), 5-item Red Flags list

**Debugger:**
1. **Anti-Rationalization Section** -- HARD-GATE ("No fix attempts without understanding root cause"), 6-entry rationalizations table (debugger-specific: "I think I know", "let me just try", "quick patch", etc.), 5-item Red Flags list
2. **Available Skills Section** -- 2 skill trigger references (Systematic Debugging as primary, Verification Before Completion)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- maxsim-executor.md: `<anti_rationalization>`, `<wave_review_protocol>`, `<available_skills>` sections, evidence block in `<self_check>` -- all present
- maxsim-verifier.md: `<anti_rationalization>` section, evidence gate in `<core_principle>` -- all present
- maxsim-debugger.md: `<anti_rationalization>`, `<available_skills>` sections -- all present
- All 3 agents have `<HARD-GATE>` tags with role-specific Iron Laws
- Two-stage review gated on `model_profile == "quality"` only
- Diff shows 203 insertions, 0 deletions (only additions, existing sections unchanged)

## Self-Check: PASSED

- FOUND: templates/agents/maxsim-executor.md
- FOUND: templates/agents/maxsim-verifier.md
- FOUND: templates/agents/maxsim-debugger.md
- FOUND: 26-03-SUMMARY.md
- FOUND: 6a4da66 (Task 1 commit)
- FOUND: cdfe4b6 (Task 2 commit)
