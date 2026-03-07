---
phase: 03-Agent-Coherence
plan: 04
subsystem: agents
tags: [review-protocol, two-stage-review, spec-compliance, code-quality, executor, quick-workflow]
duration: ~7min
completed: 2026-03-07
---

# Plan 03-04 Summary: Universal two-stage review replacing quality-only gating

Replaced the quality-profile-gated review in the executor with an unconditional two-stage review (spec-compliance + code-quality) that runs after every wave on all model profiles. Added the same review step to the quick workflow. Updated execute-phase orchestrator review checking to use Spec Review and Code Review columns instead of the old Simplify/Final Review columns.

## What Was Built

1. **Universal `<wave_review_protocol>` in executor** -- Replaced the conditional section that only ran reviews on "quality" profile with an unconditional two-stage protocol. Stage 1 spawns `maxsim-spec-reviewer` with task specs, modified files, and plan requirements. Stage 2 spawns `maxsim-code-reviewer` with modified files, CONVENTIONS.md, and test results. Both stages have retry logic (max 2 retries) with REVIEW BLOCKED output and user options on exhaustion.

2. **Inline context checklists** -- Documented exactly what must be passed when spawning each reviewer: spec-reviewer gets task specs + modified files + requirements + must_haves; code-reviewer gets modified files + conventions + test results.

3. **Continuation mode handling** -- Documented that checkpoint resumption triggers full-plan re-review (all tasks, not just post-checkpoint), because checkpoint decisions may affect earlier work.

4. **Gap-closure plan coverage** -- Explicitly documented that gap-closure plans receive the same review cycle with no exceptions.

5. **Quick workflow review step** -- Added Step 6.3 (Two-Stage Review) to the quick workflow, running after executor completion and before verification. Applies to ALL quick tasks regardless of model profile or --full flag.

6. **Execute-phase orchestrator updates** -- Updated the Review Cycle Summary table from `Simplify | Final Review` columns to `Spec Review | Code Review | Retries` columns. Updated spot-check logic to verify both Spec and Code stages show PASS or SKIPPED. Updated phase completion gate to reference correct review stages. Added clarifying note that orchestrator checks results but does not run reviews itself.

## Key Decisions

- Review is unconditional on all profiles (quality, balanced, budget) -- no model_profile check
- Quick tasks get the same review even without --full flag
- extractFrontmatter() from frontmatter.ts referenced for review verdict parsing
- Orchestrator role clarified: checks review results in SUMMARY.md, does not spawn reviewers

## Commits

| Task | Commit | Description | Files |
|------|--------|-------------|-------|
| 1 | 2ad296c | Universal wave review protocol in executor | templates/agents/maxsim-executor.md |
| 1 (fix) | 387801b | Add extractFrontmatter reference for key link | templates/agents/maxsim-executor.md |
| 2 | 5a43e36 | Review step in quick workflow + execute-phase updates | templates/workflows/quick.md, templates/workflows/execute-phase.md |

## Artifacts

| File | Lines | What Changed |
|------|-------|-------------|
| templates/agents/maxsim-executor.md | 504 | Replaced quality-gated wave_review_protocol with unconditional two-stage review, inline context checklists, continuation mode, gap-closure coverage |
| templates/workflows/quick.md | 570 | Added Step 6.3 Two-Stage Review with spec-reviewer + code-reviewer spawning, retry logic, REVIEW BLOCKED |
| templates/workflows/execute-phase.md | 521 | Updated review table columns, spot-check logic, phase completion gate, added orchestrator role clarification |

## Deviations

- [Rule 2 - Auto-add] Added extractFrontmatter() reference to executor review parsing section to satisfy key_links pattern requirement (commit 387801b)

## Deferred Items

None.

## Self-Check: PASSED
