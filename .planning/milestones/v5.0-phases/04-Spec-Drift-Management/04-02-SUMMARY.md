---
phase: "04"
plan: "02"
subsystem: drift-detection-agent-stack
tags: [drift, agent, command, workflow, check-drift]
duration: "~6min"
completed: "2026-03-07"
---

# Plan 04-02 Summary: Drift-Checker Agent, Command, and Workflow

## What Was Built

Three-layer stack for `/maxsim:check-drift`: a drift-checker agent prompt (522 lines) with systematic multi-pass analysis protocol, a user-facing command, and an orchestration workflow. Together they enable users to run a single command to compare their `.planning/` spec against the actual codebase and produce a structured DRIFT-REPORT.md with severity-tiered findings, evidence per mismatch, and fix recommendations.

## Key Decisions

- **14-agent system map:** The drift-checker is the 14th agent in the MAXSIM system. Updated system map in the agent prompt accordingly.
- **Multi-pass protocol over monolithic analysis:** Agent uses 5 sequential passes (spec extraction, codebase analysis, no-go/convention check, archived regression check, synthesis) to prevent context overload on large projects.
- **Frontmatter-only result flow:** Workflow reads only YAML frontmatter (head -20) from the generated report, never the full content. This prevents context bloat since reports can have 50+ items.
- **Agent-writes-output-directly pattern:** Follows the established codebase-mapper pattern where the agent writes DRIFT-REPORT.md directly and returns only summary counts to the workflow.
- **Non-interactive agent:** The drift-checker produces a complete report without user input. User interaction happens in the realign workflow, not during detection.

## Accomplishments

- Created `maxsim-drift-checker.md` agent with: YAML frontmatter (name, description, tools, color, needs), 14-agent system map, role section, upstream/downstream contracts, input validation, 5-pass execution protocol, report format specification, severity classification rules, exclusion rules, scope rules, deferred items protocol, critical rules
- Created `check-drift.md` command referencing the workflow via @path, with post-completion realignment offer
- Created `check-drift.md` workflow with: init context loading, validation gate, agent spawn, frontmatter-only result reading, commit step, result presentation, realignment options
- Registered drift-checker in AGENTS.md agent registry with skills and role description

## Key Files

| File | Purpose |
|------|---------|
| `templates/agents/maxsim-drift-checker.md` | Agent prompt with multi-pass drift analysis protocol (522 lines) |
| `templates/commands/maxsim/check-drift.md` | User-facing /maxsim:check-drift command (56 lines) |
| `templates/workflows/check-drift.md` | Orchestration workflow for drift detection (248 lines) |
| `templates/agents/AGENTS.md` | Updated agent registry with drift-checker entry |

## Deviations

None. Plan executed as specified.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 01 | `2e2814f` | Drift-checker agent and AGENTS.md registry update |
| 02 | `824d215` | Check-drift command and workflow |
