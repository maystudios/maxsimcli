<purpose>
Orchestrate a drift-checker agent to compare .planning/ spec against the codebase and produce DRIFT-REPORT.md.

The drift-checker agent writes the report directly. The orchestrator only receives a summary (status + counts) to prevent context bloat. After the report is generated, the orchestrator reads only the YAML frontmatter for key metrics and presents results to the user.

Output: .planning/DRIFT-REPORT.md with severity-tiered findings and YAML frontmatter.
</purpose>

<philosophy>
**Agent writes output directly:**
The drift-checker agent writes DRIFT-REPORT.md directly to `.planning/`. The orchestrator does NOT receive the full report content -- it only gets confirmation and counts. This follows the same pattern as maxsim-codebase-mapper (which writes documents directly to `.planning/codebase/`).

**Why:** The drift report can be large (50+ items with evidence). Passing the full report back to the orchestrator would waste context. Only metadata flows back.

**Fresh scan every run:**
Every drift check performs a fresh codebase analysis. Previous reports are only used for diff tracking (NEW/RESOLVED/UNCHANGED labels), never as a substitute for current analysis.
</philosophy>

<process>

<step name="init_context" priority="first">
Load drift check context:

```bash
INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init check-drift)
```

Extract from init JSON:
- `drift_model` -- model resolution for the drift-checker agent
- `commit_docs` -- whether to commit the report
- `has_planning` -- whether .planning/ exists
- `has_requirements` -- whether REQUIREMENTS.md exists
- `has_roadmap` -- whether ROADMAP.md exists
- `has_nogos` -- whether NO-GOS.md exists
- `has_conventions` -- whether CONVENTIONS.md exists
- `has_previous_report` -- whether a previous DRIFT-REPORT.md exists
- `spec_files` -- list of all spec file paths found
- `phase_dirs` -- list of active phase directories
- `archived_milestone_dirs` -- list of archived milestone directories
- Paths: `requirements_path`, `roadmap_path`, `nogos_path`, `conventions_path`, `state_path`
</step>

<step name="validate">
**Gate: Verify project is initialized.**

If `has_planning` is false:

```
No .planning/ directory found.

Run `/maxsim:new-project` to initialize your project first.
```

Stop workflow.

If `has_requirements` is false AND `has_roadmap` is false:

```
No REQUIREMENTS.md or ROADMAP.md found in .planning/.

At least one spec file is needed for drift detection.
Run `/maxsim:new-project` to create project specification.
```

Stop workflow.

If `has_planning` is true and at least one spec file exists, continue.

If some spec files are missing (e.g., no NO-GOS.md or CONVENTIONS.md), note this for the agent -- it will include a warning in the report header.
</step>

<step name="announce">
Display progress to user:

```
Scanning codebase for spec drift...

Spec files: {list of found spec files}
Phase directories: {count} active{, {count} archived if any}
{If previous report exists: "Previous report found -- will track NEW/RESOLVED/UNCHANGED"}
{If no previous report: "First drift check -- all findings will be marked NEW"}

Spawning drift-checker agent...
```
</step>

<step name="spawn_drift_checker">
Spawn the maxsim-drift-checker agent using the Task tool.

```
Task(
  subagent_type="maxsim-drift-checker",
  model="{drift_model}",
  description="Check spec-vs-code drift",
  prompt="Perform a complete drift analysis of this project.

<check_drift_context>
{Full CheckDriftContext JSON from init step}
</check_drift_context>

{If $ARGUMENTS contains a phase number:}
<phase_filter>
Focus analysis on phase {phase_number}. Still check no-gos and conventions globally.
</phase_filter>

Analyze all spec files against the codebase. Write DRIFT-REPORT.md to .planning/.
Return only your summary (status and counts) -- do NOT return the full report content."
)
```

Wait for agent to complete.
</step>

<step name="read_results">
After the agent returns, read ONLY the frontmatter of the drift report (not the full content):

```bash
head -20 .planning/DRIFT-REPORT.md
```

Parse the YAML frontmatter for:
- `status` (aligned | drift)
- `critical_count`
- `warning_count`
- `info_count`
- `undocumented_count`
- `total_items`
- `aligned_count`

If the file was not created, report agent failure and suggest re-running.
</step>

<step name="commit_report">
If `commit_docs` is true, commit the drift report:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: drift report - {status}" --files .planning/DRIFT-REPORT.md
```
</step>

<step name="present_results">
Present the drift check results to the user.

**If status is "aligned":**

```
## Drift Check Complete

**Status:** ALIGNED
**Total items checked:** {total_items}
**All {aligned_count} items aligned** -- spec and code are in sync.

Report: .planning/DRIFT-REPORT.md

---

No realignment needed. Ready to continue development.

- `/maxsim:execute-phase` -- Continue executing current phase
- `/maxsim:plan-phase` -- Plan next phase
```

**If status is "drift":**

```
## Drift Check Complete

**Status:** DRIFT DETECTED

| Category | Count |
|----------|-------|
| Aligned | {aligned_count} |
| Critical | {critical_count} |
| Warning | {warning_count} |
| Info | {info_count} |
| Undocumented | {undocumented_count} |

{If critical_count > 0:}
**Critical findings require attention** -- requirements marked complete but implementation is missing.

Report: .planning/DRIFT-REPORT.md

Review the full report, then choose:
```

Continue to offer_realignment.
</step>

<step name="offer_realignment">
Present realignment options:

```
---

## Realignment Options

1. **Realign to code** -- Update `.planning/` to match what's actually built
   Accepts current implementation as source of truth. Updates requirements and roadmap.
   `/maxsim:realign to-code`

2. **Realign to spec** -- Create new phases to close implementation gaps
   Keeps spec as source of truth. Generates fix phases for missing implementations.
   `/maxsim:realign to-spec`

3. **Done** -- Acknowledge drift, no action needed now
   The DRIFT-REPORT.md is saved for future reference.

---
```

Wait for user response.

- If user chooses option 1: Direct them to run `/maxsim:realign to-code`
- If user chooses option 2: Direct them to run `/maxsim:realign to-spec`
- If user chooses option 3 or "done": End workflow
</step>

</process>

<error_handling>

**Agent failure:** If the drift-checker agent fails or returns without creating DRIFT-REPORT.md:
```
Drift check failed. The drift-checker agent did not produce a report.

Possible causes:
- Insufficient spec files for analysis
- Agent context overload (too many requirements)

Try: `/maxsim:check-drift {specific_phase}` to narrow the scope.
```

**Partial spec:** The agent handles partial specs internally (runs analysis on what exists, warns about missing files). The workflow does not need to handle this specially.

**Previous report comparison failure:** If `drift previous-hash` fails, the agent runs without diff tracking. All items will be marked `[NEW]`.

</error_handling>

<success_criteria>
- [ ] Init context loaded with all spec file existence flags
- [ ] Validation gate prevents running on un-initialized projects
- [ ] Drift-checker agent spawned with full context
- [ ] Report frontmatter read (not full content) for result display
- [ ] Report committed if commit_docs is true
- [ ] Results presented with counts and status
- [ ] Realignment options offered when drift detected
- [ ] Only frontmatter read from report (no context bloat)
</success_criteria>
