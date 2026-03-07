<purpose>
Render the project roadmap in a readable format with phase status icons and plan progress counts. Auto-collapses completed phases to one-liners for visual clarity and paginates at 20 phases per page for large projects. Read-only — does not modify any files.
</purpose>

<process>

<step name="check_planning">
Verify the project is initialized:

```bash
INIT=$(node ./.claude/maxsim/bin/maxsim-tools.cjs state-load --raw)
```

Parse JSON. If `planning_exists` is false, hard stop:

> No roadmap found. Run /maxsim:new-project to initialize.

Exit immediately. Do not continue.

**Parse `--page` argument:** If the command was invoked with `--page N`, extract the page number (default: 1). This controls which page of phases to display when total phases exceed 20.
</step>

<step name="analyze">
Load roadmap analysis:

```bash
ROADMAP=$(node ./.claude/maxsim/bin/maxsim-tools.cjs roadmap analyze)
```

Parse JSON for: `phases[]` (each with `number`, `name`, `disk_status`, `plan_count`, `summary_count`), `milestone_name`, `milestone_version`.

Count phases by status:
- `done_count` = phases where `disk_status === 'complete'`
- `active_count` = phases where `disk_status === 'partial'`
- `planned_count` = phases where `disk_status === 'planned' || disk_status === 'empty' || disk_status === 'discussed' || disk_status === 'researched' || disk_status === 'no_directory'`
</step>

<step name="render">
Print the roadmap to the terminal.

**Milestone header line:**
```
{milestone_name} — {done_count} done / {active_count} active / {planned_count} planned
```

**Blank line.**

**Auto-collapse completed phases (always active, regardless of phase count):**

Render phases in two visual groups:

1. **Completed phases** — collapsed one-liners with no plan counts or status label:
   ```
   ✓  Phase {number}: {name}
   ```
   Just checkmark + phase number + name. One line per completed phase. This keeps the roadmap scannable when many phases are done.

2. **Active and upcoming phases** — full detail format with icon, label, and plan counts:
   ```
   {icon}  Phase {number}: {name}    {label}  ({summary_count}/{plan_count} plans)
   ```

For active/upcoming phases:
- `disk_status === 'partial'` -> icon `>`, label `IN PROGRESS`
- `disk_status === 'planned' || 'empty' || 'discussed' || 'researched' || 'no_directory'` -> icon `[ ]`, label `PLANNED`

Pad phase names with spaces so status labels align in a column (within the active/upcoming group only).

Only show `({summary_count}/{plan_count} plans)` when `plan_count > 0`.

**Pagination (only when total phases exceed 20):**

After assembling all phase lines (both collapsed completed and full-detail active/upcoming), check the total phase count:

- If total phases is **20 or fewer**: show all phases. No pagination footer. This is the default experience for small/medium projects.
- If total phases **exceeds 20**: apply pagination.
  - Page size: 20 phases per page.
  - Use the `--page N` argument (default page 1) to determine which slice to show.
  - Calculate: `first = (page - 1) * 20 + 1`, `last = min(page * 20, total)`.
  - Show only phases from index `first` to `last`.
  - Add a footer line after the phase list:
    ```
    Showing phases {first}-{last} of {total}. Use --page {next_page} for next.
    ```
  - If on the last page, omit the "Use --page" hint.

Example output (small project, no pagination):
```
Context-Aware SDD — 3 done / 1 active / 1 planned

✓  Phase 1: Context Rot Prevention
✓  Phase 2: Init Flow Overhaul
✓  Phase 3: Agent Coherence

>  Phase 4: Spec Drift Management        IN PROGRESS  (2/3 plans)
[ ]  Phase 5: Workflow Coverage             PLANNED
```

Example output (large project with pagination, page 1):
```
NX Monorepo Migration — 15 done / 1 active / 9 planned

✓  Phase 01: NX Workspace Scaffold
✓  Phase 02: packages/core TypeScript Port
✓  Phase 03: Shared Types
...
✓  Phase 15: CI Pipeline

>  Phase 16: Dashboard Rewrite              IN PROGRESS  (2/5 plans)
[ ]  Phase 17: Plugin System                  PLANNED
[ ]  Phase 18: Performance Optimization       PLANNED
[ ]  Phase 19: Documentation                  PLANNED
[ ]  Phase 20: Security Audit                 PLANNED

Showing phases 1-20 of 25. Use --page 2 for next.
```
</step>

</process>

<success_criteria>
- [ ] Milestone summary header rendered with done/active/planned counts
- [ ] Completed phases auto-collapsed to one-liners (checkmark + name only, no plan counts)
- [ ] Active/upcoming phases shown with full detail (icon, label, plan counts)
- [ ] Phases listed in numeric order within each group
- [ ] Pagination footer shown only when total phases exceed 20
- [ ] `--page N` argument controls which page to display
- [ ] Plan progress shown inline for active/upcoming phases that have plans
- [ ] Hard stop if .planning/ is missing
</success_criteria>
