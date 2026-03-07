---
phase: 03-Agent-Coherence
plan: 01
subsystem: agents
tags: [agent-coherence, handoff-contracts, system-map, input-validation]
duration: ~7min
completed: 2026-03-07
---

# Plan 03-01 Summary: Agent coherence sections for 7 core agents

Added system map, upstream/downstream contracts, input validation, deferred items protocol, and minimum handoff contract to all 7 core agent prompts (executor, planner, plan-checker, phase-researcher, project-researcher, research-synthesizer, roadmapper).

## What Was Built

Each of the 7 core agents received 6 new coherence elements:

1. **`needs` frontmatter field** -- Array of context categories each agent requires (e.g., `[phase_dir, state, config, conventions, codebase_docs]` for executor). Enables future CLI auto-assembly of role-filtered context.

2. **`<agent_system_map>`** -- Identical 13-agent table inlined in every agent. Placed after frontmatter, before `<role>`. Gives each agent complete awareness of the system it operates in.

3. **`<upstream_input>`** -- Agent-specific documentation of what inputs it receives, from whom, in what format, and which are required. Includes file format references (zero-bloat pointers to templates/schemas).

4. **`<downstream_consumer>`** -- Agent-specific documentation of what outputs it produces, for whom, and what those outputs contain. Distinguishes durable (file) from ephemeral (inline) handoffs.

5. **`<input_validation>`** -- Hard-blocking validation section. If critical inputs are missing, agent returns structured `INPUT VALIDATION FAILED` error with agent name, missing items, and expected source. Catches pipeline breaks early.

6. **`<deferred_items>` protocol** -- Identical section in all agents. When encountering out-of-scope work: log it as `[{category}] {description} -- {why deferred}` under `### Deferred Items`.

7. **Minimum handoff contract in `<structured_returns>`** -- Every structured return now includes: Key Decisions, Artifacts, Status, Deferred Items.

## Key Decisions

- System map inlined in every agent (not a shared partial file) per CONTEXT.md locked decision
- Existing `<upstream_input>` and `<downstream_consumer>` sections in phase-researcher, plan-checker, research-synthesizer, and roadmapper were enhanced with contract tables rather than replaced
- All existing content preserved -- additions only, no removals or reordering

## Commits

| Task | Commit | Description | Files |
|------|--------|-------------|-------|
| 1 | 9bfc292 | Coherence sections for executor, planner, plan-checker, phase-researcher | 4 agent files |
| 2 | 90bea8a | Coherence sections for project-researcher, research-synthesizer, roadmapper | 3 agent files |

## Artifacts

| File | Lines | What Changed |
|------|-------|-------------|
| templates/agents/maxsim-executor.md | 386 | needs, system map, upstream/downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-planner.md | 610 | needs, system map, upstream/downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-plan-checker.md | 343 | needs, system map, enhanced upstream, downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-phase-researcher.md | 305 | needs, system map, enhanced upstream/downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-project-researcher.md | 359 | needs, system map, upstream, downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-research-synthesizer.md | 263 | needs, system map, upstream, enhanced downstream, validation, deferred items, handoff contract |
| templates/agents/maxsim-roadmapper.md | 324 | needs, system map, upstream, enhanced downstream, validation, deferred items, handoff contract |

## Deviations

None. All work matched plan specifications.

## Deferred Items

None.

## Self-Check: PASSED
