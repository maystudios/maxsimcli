<sanity_check>
Before executing any step in this workflow, verify:
1. The current directory contains a `.planning/` folder -- if not, stop and tell the user to run `/maxsim:new-project` first.
2. `.planning/DRIFT-REPORT.md` exists -- if not, stop and tell the user to run `/maxsim:check-drift` first.
</sanity_check>

<purpose>
Correct spec-code divergence in either direction. Realign-to-code updates `.planning/` to match the actual codebase. Realign-to-spec generates new fix phases to make code match the spec. Reads the DRIFT-REPORT.md produced by `/maxsim:check-drift`.
</purpose>

<core_principle>
This is an interactive orchestrator workflow, not an agent spawn. Realign-to-code requires per-item user decisions (Accept/Skip/Edit). Realign-to-spec requires user approval of proposed phase groupings. The workflow drives the interaction directly.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<process>

<step name="initialize" priority="first">
Load context and validate prerequisites:

```bash
INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init realign "$DIRECTION")
```

Parse JSON for: `has_report`, `has_planning`, `report_path`, `state_path`, `requirements_path`, `roadmap_path`, `phase_dirs`, `current_phase`, `commit_docs`.

**Validation gates:**
- If `has_planning` is false: "No `.planning/` directory found. Run `/maxsim:new-project` first." STOP.
- If `has_report` is false: "No DRIFT-REPORT.md found. Run `/maxsim:check-drift` first to generate a drift report." STOP.
</step>

<step name="read_report">
Read the drift report metadata and content:

```bash
REPORT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs drift read-report)
```

Parse the result to extract:
- **Frontmatter:** `status`, `critical_count`, `warning_count`, `info_count`, `undocumented_count`, `total_items`, `aligned_count`
- **Body sections:** "Spec Ahead of Code", "Code Ahead of Spec", "No-Go Violations", "Undocumented Features"

**If `status` is `aligned`:**
```
No drift detected -- nothing to realign. All spec items match the codebase.
```
STOP.
</step>

<step name="select_direction">
Determine the realignment direction.

**If `$DIRECTION` was provided via `$ARGUMENTS`:** Use it directly. Validate it is either `to-code` or `to-spec`.

**If no direction was provided:** Present the user with a choice:

```markdown
## Drift Report Summary

**Status:** {critical_count} critical | {warning_count} warning | {info_count} info | {undocumented_count} undocumented

Choose a realignment direction:

1. **to-code** -- Update `.planning/` to match current codebase (spec follows code)
   Best when: Code is correct and spec is outdated. Accepts code reality.

2. **to-spec** -- Generate fix phases to make code match spec (code follows spec)
   Best when: Spec is correct and code has gaps. Creates implementation phases.
```

Wait for user selection.
</step>

<step name="realign_to_code">
**Execute only if direction is `to-code`.**

Parse the drift report body to extract all drifted items from:
- "Spec Ahead of Code" section (requirements marked complete but code missing/incomplete)
- "Code Ahead of Spec" section (features in code but not captured in spec)
- "No-Go Violations" section (code violating declared constraints)
- "Undocumented Features" section (features with no spec coverage)

Build a list of actionable items. For each item, extract:
- Requirement ID (if applicable)
- Section heading/description
- Current spec text and location
- What was found (or not found) in code
- The report's fix recommendation
- All spec file references from the evidence section

**Process each item interactively:**

For each drifted item, present it to the user:

```markdown
### Item {N}/{total}: {Requirement ID or Feature Name}

**Severity:** {CRITICAL | WARNING | INFO}
**Direction:** {Spec ahead of code | Code ahead of spec | No-go violation | Undocumented}

**Current spec:** {spec text from report}
**Code reality:** {what was found or not found}
**Recommendation:** {fix recommendation from report}

**Affected spec files:** {list of files that reference this item}

Choose:
- **Accept** -- Apply the recommended spec change
- **Skip** -- Leave as-is (no changes for this item)
- **Edit** -- Provide a custom change description
```

Wait for user response.

**Apply accepted changes based on item direction:**

**For "Spec ahead of code" items** (requirement marked done but code missing):
- Update REQUIREMENTS.md: change `[x]` to `[ ]` for the requirement using `node ~/.claude/maxsim/bin/maxsim-tools.cjs requirements mark-incomplete {REQ_ID}`, or manually edit the checkbox if the tool does not support it.
- Check ROADMAP.md: if the requirement appears in success criteria for a phase, add a note that the criterion is unmet.
- Check STATE.md: if a decision references this requirement, add a note that the implementation is pending.
- Check phase SUMMARY.md files: if any summary claims this requirement was completed, add a caveat note.

**For "Code ahead of spec" items** (feature exists but spec does not mention it):
- If user accepts the default recommendation: add the feature as a new requirement in REQUIREMENTS.md under the appropriate version section.
- If user provides an edit: apply their custom text instead.
- Update PROJECT.md if the feature represents a significant capability not documented there.

**For "No-go violation" items** (code violating a declared constraint):
- Document as known tech debt in STATE.md under "Blockers/Concerns" or a "Known Tech Debt" section.
- Optionally mark for future fix phase.

**For "Undocumented feature" items** (code with no spec coverage):
- Add to REQUIREMENTS.md as a new entry documenting the existing capability.
- Or update PROJECT.md to document it as an existing capability, depending on user's edit.

**CRITICAL -- Multi-file consistency:** For each accepted item, identify ALL spec files that reference it (from the drift report evidence section) and update all of them. Do NOT update only REQUIREMENTS.md while leaving ROADMAP.md or STATE.md inconsistent. Use the spec file references in the drift report as the update checklist.

Track changes: maintain a running count of accepted, skipped, and edited items, and a list of all modified files.

**After processing all items:**

Check if any phase now has all success criteria met in code. For each phase referenced in the drift report:

```bash
# Check if phase criteria are now all satisfied
PHASE_STATUS=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs roadmap get-phase "{phase_number}")
```

If all criteria for a phase are met after the realignment updates, auto-mark that phase complete:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs phase complete "{phase_number}"
```

**If ALL items were skipped:** "No changes applied. Drift report remains unchanged." STOP (do not commit).

**Commit changes:**

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: realign spec to match codebase" --files {space-separated list of all modified files}
```
</step>

<step name="realign_to_spec">
**Execute only if direction is `to-spec`.**

Parse the drift report to extract all "Spec Ahead of Code" items -- requirements and success criteria that are specified but not yet implemented in code. Also include any "No-Go Violations" that require code changes.

Build a list of implementation gaps. For each gap, extract:
- Requirement ID
- Description of what needs to be implemented
- Current spec location (file and section)
- Evidence of what is missing from the report

**Group gaps into phases using this algorithm:**

1. **Group by requirement prefix:** Collect all gaps sharing a requirement prefix (e.g., all `DRIFT-*` gaps into one phase, all `INIT-*` into another, all `ROT-*` into another). The prefix is the text before the hyphen and number in the requirement ID.

2. **If no prefix grouping possible** (gaps have no requirement IDs or all have unique prefixes): group by affected subsystem. Cluster gaps whose evidence references common file paths or directories.

3. **Apply the 5-phase cap:**
   - If 5 or fewer groups: use them as-is.
   - If more than 5 groups: sort groups by gap count (ascending). Merge the smallest groups into a "Remaining Gaps" phase until only 5 groups remain.

4. **Minimum group size:** Each phase should have at minimum 2 gaps, unless it is the only group or merging is not possible.

5. **Name each phase** descriptively: "{Prefix} Implementation Gaps" or "{Subsystem} Fixes" or similar concise name.

**Present proposed phases to user:**

```markdown
## Proposed Realignment Phases

Based on the drift report, {gap_count} implementation gaps will be organized into {phase_count} new phases inserted after the current active phase ({current_phase}).

| # | Phase Name | Requirements | Gap Count | Description |
|---|-----------|-------------|-----------|-------------|
| 1 | {name} | {REQ-01, REQ-02} | {N} | {brief description} |
| 2 | {name} | {REQ-03} | {N} | {brief description} |

Approve this breakdown? (yes / suggest changes)
```

Wait for user approval. If user suggests changes, adjust the grouping accordingly.

**For each approved phase, insert after the current active phase:**

```bash
RESULT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs phase insert "{current_phase}" "{phase_name}")
```

The insert command creates the phase directory with decimal numbering (e.g., `04.1`, `04.2`) and updates ROADMAP.md.

**For each inserted phase, update the ROADMAP.md phase section** to include:
- The requirement IDs covered by this phase
- Success criteria extracted from the drift report (what needs to be implemented)
- A brief goal statement

Use the Edit tool to add requirement details and success criteria to each newly created phase entry in ROADMAP.md.

**Commit changes:**

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "feat: add realignment phases from drift report" --files .planning/ROADMAP.md .planning/STATE.md
```

Note: Include any new phase directories created by the insert commands in the commit files list.
</step>

<step name="summary">
Display a summary of what was changed.

**For realign-to-code:**

```markdown
## Realignment Complete (to-code)

**Items processed:** {total}
- Accepted: {accepted_count}
- Skipped: {skipped_count}
- Edited: {edited_count}

**Files modified:** {list of modified files}
**Phases auto-completed:** {list of phases marked complete, or "None"}
**Commit:** {commit hash}

The spec now reflects the current codebase state for the accepted items.
Skipped items remain as drift -- run `/maxsim:check-drift` again to see remaining drift.
```

**For realign-to-spec:**

```markdown
## Realignment Complete (to-spec)

**Implementation gaps:** {gap_count}
**New phases created:** {phase_count}

| Phase | Name | Requirements |
|-------|------|-------------|
| {num} | {name} | {REQ IDs} |

**Next step:** Run `/maxsim:execute-phase {first_new_phase}` to begin implementing the gaps.
```
</step>

</process>

<error_handling>
- **DRIFT-REPORT.md missing:** Direct user to run `/maxsim:check-drift` first. Do not attempt to generate a report.
- **Report status is "aligned":** Nothing to do. Inform user and stop.
- **All items skipped (to-code):** No changes made. Inform user that drift remains.
- **Zero "Spec Ahead of Code" gaps (to-spec):** Inform user "All specified items appear implemented. No fix phases needed. Consider realign-to-code instead to capture undocumented features."
- **Phase insert fails:** Report the error. Continue with remaining phases if possible. Document any failures in the summary.
- **Invalid direction argument:** Show usage: `/maxsim:realign [to-code | to-spec]`
</error_handling>

<critical_rules>
- **Item-by-item approval for to-code:** Never batch-apply changes. Present each item individually and wait for Accept/Skip/Edit.
- **Multi-file consistency:** When updating spec for an accepted item, update ALL referencing spec files, not just REQUIREMENTS.md. Use the evidence section from the drift report to identify all affected files.
- **Phase cap for to-spec:** Never create more than 5 new phases. Group and merge as described in the algorithm.
- **Insert after current phase:** New phases go after the current active phase, not at the end of the roadmap.
- **No auto-generation of reports:** This workflow reads an existing DRIFT-REPORT.md. It does not run drift detection itself.
- **Auto-complete phases:** After realign-to-code, check if any phase has all criteria met and auto-mark it complete.
</critical_rules>
