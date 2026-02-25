<purpose>
Render the project roadmap in a readable format with phase status icons and plan progress counts. Read-only — does not modify any files.
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

**Per-phase lines (in numeric order):**

For each phase in `phases[]`:
- `disk_status === 'complete'` → icon `✓`, label `DONE`
- `disk_status === 'partial'` → icon `►`, label `IN PROGRESS`
- `disk_status === 'planned' || 'empty' || 'discussed' || 'researched' || 'no_directory'` → icon `□`, label `PLANNED`

Format per line:
```
{icon}  Phase {number}: {name}    {label}  ({summary_count}/{plan_count} plans)
```

Pad phase names with spaces so status labels align in a column.

Only show `({summary_count}/{plan_count} plans)` when `plan_count > 0`.

Example output:
```
NX Monorepo Migration — 5 done / 1 active / 6 planned

✓  Phase 01: NX Workspace Scaffold                    DONE       (4/4 plans)
✓  Phase 02: packages/core TypeScript Port            DONE       (6/6 plans)
►  Phase 09: End-to-end install and publish test loop IN PROGRESS (2/3 plans)
□  Phase 11: Remove Discord command                   PLANNED
□  Phase 12: UX Polish + Core Hardening               PLANNED
```
</step>

</process>

<success_criteria>
- [ ] Milestone summary header rendered with done/active/planned counts
- [ ] All phases listed in numeric order with correct icon and label
- [ ] Plan progress shown inline for phases that have plans
- [ ] Hard stop if .planning/ is missing
</success_criteria>
