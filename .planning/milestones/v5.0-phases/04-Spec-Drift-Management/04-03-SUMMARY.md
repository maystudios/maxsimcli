---
phase: "04"
plan: "03"
subsystem: realignment-workflow
tags: [drift, realign, to-code, to-spec, workflow, command]
duration: "~3min"
completed: "2026-03-07"
---

# Plan 04-03 Summary: Realign Command and Workflow

## What Was Built

The `/maxsim:realign` command and workflow that enables users to correct spec-code divergence in either direction. Realign-to-code presents each drift item for item-by-item approval (Accept/Skip/Edit) and updates all referencing spec files. Realign-to-spec groups implementation gaps into at most 5 phases using prefix-then-subsystem clustering and inserts them after the current active phase.

## Key Decisions

- **Interactive orchestrator, not agent spawn:** The realign workflow runs as a direct orchestrator (not via Task/agent) because it requires per-item user decisions for to-code and user approval of phase groupings for to-spec.
- **Multi-file consistency enforcement:** For each accepted realign-to-code item, the workflow identifies ALL spec files that reference it (using drift report evidence) and updates all of them, preventing internal spec inconsistency (Pitfall 5 from research).
- **5-phase cap with merge algorithm:** Realign-to-spec groups gaps by requirement prefix first, falls back to subsystem clustering, and merges smallest groups when more than 5 exist.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 01 | `792021e` | Realign command template with to-code/to-spec arguments |
| 02 | `1607db4` | Realign workflow with both directions, item approval, gap grouping |

## Files Modified

| File | Change |
|------|--------|
| `templates/commands/maxsim/realign.md` | NEW -- User-facing /maxsim:realign command with direction arguments and workflow reference |
| `templates/workflows/realign.md` | NEW -- 288-line orchestration workflow covering init, report reading, direction selection, realign-to-code (item-by-item), realign-to-spec (gap grouping), summary, and error handling |

## Deviations

None.

## Verification Results

- Command file exists with description, $ARGUMENTS handling, and @path workflow reference
- Workflow file has 288 lines (minimum 100 required)
- Workflow references all required CLI tools: init realign, drift read-report, phase insert, phase complete, requirements mark, commit
- Realign-to-code has item-by-item approval pattern (Accept/Skip/Edit)
- Realign-to-spec has gap grouping algorithm (by prefix, by subsystem, cap at 5)
- Both directions handle edge cases (missing report, aligned status, all skipped, zero gaps)
