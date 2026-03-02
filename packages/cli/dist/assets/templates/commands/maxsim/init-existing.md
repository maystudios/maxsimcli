---
name: maxsim:init-existing
description: Initialize MAXSIM in an existing project with codebase scanning and smart defaults
argument-hint: "[--auto]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Flags:**
- `--auto` — Automatic mode. Runs full codebase scan, infers everything from code, creates all docs without interaction. Review recommended after auto mode.
</context>

<objective>
Initialize MAXSIM in an existing codebase through scan-first flow: codebase analysis, conflict resolution, scan-informed questioning, stage-aware document generation.

**Creates:**
- `.planning/codebase/` — full codebase analysis (4 mapper agents)
- `.planning/PROJECT.md` — project context with current state summary
- `.planning/config.json` — workflow preferences
- `.planning/REQUIREMENTS.md` — stage-aware requirements
- `.planning/ROADMAP.md` — milestone + suggested phases
- `.planning/STATE.md` — pre-populated project memory
- `.planning/DECISIONS.md` — key decisions with rationale (artefakte)
- `.planning/ACCEPTANCE-CRITERIA.md` — measurable success criteria (artefakte)
- `.planning/NO-GOS.md` — explicit exclusions and anti-patterns (artefakte)

**After this command:** Run `/maxsim:plan-phase 1` to start execution.
</objective>

<execution_context>
@./workflows/init-existing.md
@./references/questioning.md
@./references/thinking-partner.md
@./references/ui-brand.md
@./templates/project.md
@./templates/requirements.md
</execution_context>

<process>
Execute the init-existing workflow from @./workflows/init-existing.md end-to-end.
Preserve all workflow gates (conflict resolution, scan completion, validation, approvals, commits).
</process>
