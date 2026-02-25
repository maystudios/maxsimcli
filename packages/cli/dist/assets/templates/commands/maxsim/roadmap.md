---
name: maxsim:roadmap
description: Display the project roadmap with phase status icons, plan counts, and milestone summary
allowed-tools:
  - Read
  - Bash
  - Glob
---
<objective>
Render the project roadmap in a human-readable format with phase status icons (✓ DONE, ► IN PROGRESS, □ PLANNED), plan progress counts per phase, and a milestone summary header.
</objective>

<execution_context>
@./workflows/roadmap.md
</execution_context>

<process>
Execute the roadmap workflow from @./workflows/roadmap.md end-to-end.
</process>
