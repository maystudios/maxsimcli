---
phase: 03-Agent-Coherence
plan: 02
subsystem: agent-prompts
tags: [coherence, system-map, contracts, validation, handoff, agents]
duration: ~7min
completed: 2026-03-07T02:27:00Z
---

# Plan 03-02 Summary: Support Agent Coherence + AGENTS.md Registry

Agent coherence sections added to 6 support agents (verifier, spec-reviewer, code-reviewer, debugger, codebase-mapper, integration-checker) plus Agent Coherence Conventions documented in AGENTS.md registry. Each agent now has system map, upstream/downstream contracts, input validation, deferred items protocol, and minimum handoff contract in structured returns.

## What Changed

### Task 1: Verifier, Spec-Reviewer, Code-Reviewer (a853a6c)

Added to all 3 agents: `needs` frontmatter, `<agent_system_map>` (13-agent table), `<upstream_input>`, `<downstream_consumer>`, `<input_validation>`, `<deferred_items>`, minimum handoff contract in structured returns.

**Key design decisions:**
- Verifier: `needs: [phase_dir, roadmap, state, requirements, codebase_docs]` -- full context for phase-level verification
- Spec-reviewer and code-reviewer: `needs: [inline]` -- all context passed inline by executor, no file reads
- Reviewers output YAML frontmatter (`status`, `critical_count`, `warning_count`) for machine-parseable PASS/FAIL detection via `extractFrontmatter()`
- Input validation for reviewers returns frontmatter-formatted error (so executor parsing logic handles errors uniformly)
- Existing `<review_process>` sections in both reviewers preserved unchanged

### Task 2: Debugger, Codebase-Mapper, Integration-Checker + AGENTS.md (4141ac5)

Added to all 3 agents: same coherence sections as Task 1.

**Key design decisions:**
- Debugger: `needs: [phase_dir, state, config, conventions, codebase_docs]` -- needs conventions for code-aware debugging
- Codebase-mapper: `needs: [codebase_docs]` -- only needs existing docs for reference, explores codebase directly
- Integration-checker: `needs: [phase_dir, state, requirements, codebase_docs]` -- needs requirements for REQ-ID mapping
- AGENTS.md: new "Agent Coherence Conventions" section documenting system map maintenance checklist, required section ordering, needs vocabulary (9 keys), and handoff contract format

## Key Files

| File | Lines | What |
|------|-------|------|
| `templates/agents/maxsim-verifier.md` | 393 | Verifier with system map, contracts, validation, deferred items, needs frontmatter |
| `templates/agents/maxsim-spec-reviewer.md` | 245 | Spec reviewer with inline contracts, frontmatter output format, validation |
| `templates/agents/maxsim-code-reviewer.md` | 239 | Code reviewer with inline contracts, frontmatter output format, validation |
| `templates/agents/maxsim-debugger.md` | 572 | Debugger with contracts, validation, handoff contract in all 3 return types |
| `templates/agents/maxsim-codebase-mapper.md` | 214 | Codebase mapper with contracts, validation, updated confirmation format |
| `templates/agents/maxsim-integration-checker.md` | 273 | Integration checker with contracts, validation, report handoff contract |
| `templates/agents/AGENTS.md` | 112 | Registry with new Agent Coherence Conventions section |

## Key Decisions

- Reviewer input validation returns frontmatter-formatted errors (maintains uniform parsing)
- Debugger handoff contract added to all 3 return types (ROOT CAUSE FOUND, DEBUG COMPLETE, INVESTIGATION INCONCLUSIVE)
- Codebase mapper confirmation format replaced with handoff contract (Key Decisions, Artifacts, Status, Deferred Items)
- AGENTS.md conventions include 5-step checklist for adding new agents (create prompt, update all system maps, update registry, add type, add model mapping)

## Deviations

None. All work followed the plan exactly.

## Commits

| Hash | Message |
|------|---------|
| a853a6c | feat(03-02): add coherence sections to verifier, spec-reviewer, code-reviewer |
| 4141ac5 | feat(03-02): add coherence sections to debugger, mapper, checker + AGENTS.md conventions |
