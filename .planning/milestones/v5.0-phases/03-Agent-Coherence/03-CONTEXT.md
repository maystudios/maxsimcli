# Phase 3: Agent Coherence — Context

**Discussed:** 2026-03-07
**Phase goal:** Agents operate as a coordinated system -- prompts complement each other, context is role-targeted, and two-stage review is the default post-task workflow
**Requirements:** AGENT-01, AGENT-02, AGENT-03, AGENT-04

---

## Decisions

### Review Enforcement Boundaries (AGENT-03)

- **All profiles run both stages.** Two-stage review (spec-compliance + code-quality) runs after every wave on every model profile (quality, balanced, budget). No profile-based gating.
- **Quick tasks also get reviewed.** `/maxsim:quick` runs the same two-stage review. Quick means fast planning, not skipped quality gates.
- **Gap-closure plans get reviewed too.** Same review cycle applies to gap-closure plans. Consistency — every plan, no exceptions.
- **On retry exhaustion, block and ask user.** If a review stage FAILs after 2 retry attempts, execution pauses. User sees the failing issues and decides: fix manually, skip review, or abort.
- **Continuation mode: full plan re-review.** When executor resumes after a checkpoint, review covers ALL tasks in the plan (not just post-checkpoint tasks). Checkpoint decisions may affect earlier work.
- **Review output format: frontmatter + markdown.** Add YAML frontmatter (status, critical_count, warning_count) to existing markdown review output. Machine-parseable header, human-readable body. Orchestrator reads frontmatter for PASS/FAIL detection.

### Agent Awareness Depth (AGENT-01)

- **Full system map in every agent.** Every agent prompt gets a compact `## Agent System Map` section listing all 13 agents with name + one-liner role description (~13 lines). Complete awareness, minimal context cost.
- **Explicit input contracts AND orchestrator assembly.** Agent prompts document expected input format via `<upstream_input>` AND orchestrators assemble context. Redundant but resilient — agents can validate they received correct input.
- **Standardize `<upstream_input>` and `<downstream_consumer>` on ALL agents.** Every agent prompt gets both sections, even standalone agents (which declare "none" for upstream/downstream as appropriate).
- **Hard validation with blocking.** Agents check for required input sections. If critical input is missing, return structured error to orchestrator. Block on missing — catches pipeline breaks early.
- **No versioning needed.** All agents ship in the same npm package. When one prompt changes, all change atomically. Version drift between agents cannot happen in practice.
- **Reference to template for input examples.** Agent `<upstream_input>` sections reference template files for expected format (e.g., "See templates/research.md for RESEARCH.md format") instead of inline examples. Zero prompt bloat.

### Context Filtering Per Role (AGENT-02)

- **Agent-level init commands for agents that need them.** Add new CLI init commands for agents that load their own context: `init executor`, `init planner`, `init researcher`, `init verifier`, `init debugger`. Agents that receive all context inline (spec-reviewer, code-reviewer) don't need init commands.
- **Exclude execution fields from non-execution agents.** Researcher skips: executor_model, verifier_model, branching_strategy, branch templates, parallelization. Gets: phase info, roadmap, state, requirements, config. Minimal filtering — remove what's irrelevant, keep everything else.
- **All codebase docs to every agent.** Don't subset `.planning/codebase/` docs by role. They're not huge, and agents focus on what's relevant. Simpler than maintaining role-based filtering rules.
- **Frontmatter context declaration.** Each agent prompt's YAML frontmatter lists what context fields/files it needs (e.g., `needs: [phase_dir, roadmap, state, requirements]`). CLI reads this for auto-assembly. Single source of truth — agent defines its own needs.
- **Formalized inline context as checklist.** For agents spawned with inline context (spec-reviewer, code-reviewer), the executor prompt includes a checklist of what must be included when spawning each reviewer. Documented in both executor and reviewer prompts.

### Handoff Data Contracts (AGENT-04)

- **File for durable, inline for ephemeral.** Long-lived artifacts (RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md) stay file-based. Short-lived handoffs (review verdicts, plan-checker feedback) stay inline in the prompt. Match persistence to lifecycle.
- **Planner reads full RESEARCH.md.** No filtering or extraction by orchestrator. The format was designed for this handoff — planner reads the entire file and uses what it needs.
- **Minimum handoff contract: decisions + artifacts + status + deferred items.** Every agent handoff (structured return or file) must include: (1) key decisions made, (2) artifacts created/modified, (3) current status (complete/blocked/partial), (4) items explicitly deferred or out of scope.
- **All agents log deferred items.** Every agent that encounters out-of-scope work adds it to a standardized deferred items section in their output. Orchestrator aggregates into STATE.md.

---

## Claude's Discretion

- Exact implementation of agent-level init command signatures (parameter names, return shapes)
- How to structure the `needs` frontmatter field (array of strings, object with categories, etc.)
- Whether to add the system map as a shared partial file that gets included, or inline it in each agent prompt
- How to implement the review frontmatter parsing in the orchestrator (regex, YAML parser, CLI command)
- Ordering of new sections within agent prompts (where system map, upstream/downstream, and validation go)

---

## Deferred Ideas

- CLI command for centralized deferred item logging (`maxsim-tools add-deferred`) — could simplify the "all agents log deferred items" pattern, but is a separate feature
- Schema validation CLI commands for agent outputs (`maxsim-tools validate-research`) — useful but not required for coherence; agents do hard validation themselves
- Pipeline diagram in agent prompts instead of/alongside minimal list — could replace the text list later if agents need more orientation
- Per-agent codebase doc filtering based on role — revisit if codebase docs grow large enough to matter
