---
name: maxsim:realign
description: Correct spec-code divergence by updating spec to match code, or generating fix phases to match spec
argument-hint: "[to-code | to-spec]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---
<objective>
Correct spec-code divergence detected by `/maxsim:check-drift`. Updates `.planning/` to match code (realign-to-code), or generates fix phases to make code match spec (realign-to-spec).

Purpose: After a drift report is generated, this command acts on the findings -- either accepting code reality into the spec or creating phases to close implementation gaps.

Pre-requisite: A DRIFT-REPORT.md must exist in `.planning/`. Run `/maxsim:check-drift` first if none exists.
</objective>

<execution_context>
@./workflows/realign.md
</execution_context>

<context>
Direction: $ARGUMENTS
- `to-code` -- Update `.planning/` to match current codebase (spec follows code)
- `to-spec` -- Generate fix phases to make code match spec (code follows spec)
- If not provided: workflow will ask which direction

Reads the latest `.planning/DRIFT-REPORT.md` produced by `/maxsim:check-drift`.
</context>

<process>
Execute the realign workflow from @./workflows/realign.md end-to-end.
Pass $ARGUMENTS as the direction parameter.
</process>
