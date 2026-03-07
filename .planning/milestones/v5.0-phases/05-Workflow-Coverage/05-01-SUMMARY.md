# Summary: 05-01 Discuss Command and Workflow

**Plan:** 05-01
**Phase:** 05-Workflow-Coverage
**Status:** Complete
**Duration:** ~4 min
**Completed:** 2026-03-07

## What Was Built

Unified `/maxsim:discuss` command and triage workflow -- a single entry point that routes user-described problems, ideas, and bugs to the right size (todo or phase) through adaptive AskUserQuestion-based discussion.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 01 | Create discuss command spec | `16db195` | `templates/commands/maxsim/discuss.md` |
| 02 | Create discuss workflow | `bb73a49` | `templates/workflows/discuss.md` |

## Key Decisions

- Command spec clearly distinguishes from `/maxsim:discuss-phase` (triage unknown items vs gather decisions for known phase)
- Workflow uses 6 steps: init, detect-existing-todo, gather-context, triage, file (todo or phase), offer-next-action
- All user interactions use AskUserQuestion (tool mandate enforced), with dashboard-bridge fallback
- Todo filing reuses existing maxsim-tools.cjs commands (generate-slug, commit) -- no hand-rolled logic
- Phase filing reuses existing `phase add` command with preview confirmation via AskUserQuestion
- Existing todo detection searches pending todos before starting fresh discussion
- Adaptive depth: 2 questions for simple items, up to 4 for complex ones
- Post-filing next actions are contextual (todo: work now/save/check-todos; phase: discuss/plan/save)

## Artifacts Created

| Artifact | Path | Lines | Purpose |
|----------|------|-------|---------|
| Command spec | `templates/commands/maxsim/discuss.md` | 70 | User-facing command with frontmatter, objective, modes |
| Workflow | `templates/workflows/discuss.md` | 343 | Full triage workflow with adaptive questioning and routing |

## Verification Results

- Command spec: PASS (name, AskUserQuestion, workflow ref, argument-hint all present)
- Workflow: PASS (344 lines, all 6 steps present, all tool references verified)
- GUARD-02: PASS (no existing command or workflow files modified)

## Deviations

None. Plan executed as specified.

## Requirements Addressed

- **FLOW-01**: `/maxsim:discuss` command triages problems/ideas into todo or phase through collaborative discussion
