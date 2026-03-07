---
name: maxsim:check-drift
description: Compare .planning/ spec against codebase to detect drift and produce DRIFT-REPORT.md
argument-hint: "[optional: phase number to check, e.g., '4']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Compare the `.planning/` specification against the actual codebase using a drift-checker agent to produce a structured DRIFT-REPORT.md with severity-tiered findings.

The drift checker performs a fresh codebase scan every run, comparing all requirements, no-gos, conventions, and phase summaries against actual implementation. It reports both directions: spec ahead of code (missing implementations) and code ahead of spec (undocumented features).

Output: `.planning/DRIFT-REPORT.md` with YAML frontmatter, full inventory of findings, evidence per mismatch, and fix recommendations.
</objective>

<execution_context>
@./workflows/check-drift.md
</execution_context>

<context>
Phase filter: $ARGUMENTS (optional)
- If provided: Focus analysis on specific phase (e.g., "4")
- If not provided: Full .planning/ sweep across all phases and milestones

**Requirements:**
- `.planning/` directory must exist
- At least REQUIREMENTS.md or ROADMAP.md must be present
- If partial spec (some files missing), analysis runs on what exists with a warning
</context>

<process>
Execute the check-drift workflow from @./workflows/check-drift.md end-to-end.

After the workflow completes and DRIFT-REPORT.md is generated:

**If drift detected:** Offer realignment options:
- `/maxsim:realign to-code` -- Update `.planning/` to match codebase
- `/maxsim:realign to-spec` -- Create new phases to close implementation gaps
- Done -- No action needed, drift acknowledged

**If aligned:** Confirm alignment and offer next steps.
</process>

<success_criteria>
- [ ] .planning/DRIFT-REPORT.md created with YAML frontmatter
- [ ] Report includes severity-tiered findings (critical/warning/info)
- [ ] Report includes evidence per mismatch (spec line + code location)
- [ ] Report covers both directions (spec ahead of code + code ahead of spec)
- [ ] User presented with realignment options if drift detected
</success_criteria>
