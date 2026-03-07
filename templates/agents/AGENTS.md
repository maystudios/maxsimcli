# AGENTS.md — Agent-Skill Registry

Maps MAXSIM agents to the skills they auto-load and enforce during execution. Skills are behavioral rules loaded once at agent startup from `SKILL.md` in each skill directory.

### Auto-Trigger Skills

Skills with `alwaysApply: true` load automatically at conversation start:

| Skill | Purpose |
|-------|---------|
| `using-maxsim` | Routes all work through MAXSIM commands |

## Registry

| Agent | Skills | Role |
|-------|--------|------|
| `maxsim-executor` | `tdd`, `verification-before-completion`, `using-maxsim`, `maxsim-simplify` | Implements plan tasks with TDD, verified completion, and simplification |
| `maxsim-debugger` | `systematic-debugging`, `verification-before-completion` | Investigates bugs via reproduce-hypothesize-isolate-verify-fix cycle |
| `maxsim-verifier` | `verification-before-completion` | Checks phase goal achievement with fresh evidence |
| `maxsim-planner` | `using-maxsim`, `brainstorming` | Creates executable PLAN.md files for phases |
| `maxsim-plan-checker` | `verification-before-completion` | Verifies plans achieve phase goal before execution |
| `maxsim-code-reviewer` | `verification-before-completion`, `code-review` | Reviews implementation for code quality with evidence |
| `maxsim-spec-reviewer` | `verification-before-completion` | Reviews implementation for spec compliance |
| `maxsim-roadmapper` | `using-maxsim`, `brainstorming`, `roadmap-writing` | Creates project roadmaps with phase breakdown and requirement mapping |
| `maxsim-phase-researcher` | `memory-management` | Researches phase implementation domain for planning context |
| `maxsim-project-researcher` | `memory-management` | Researches project domain ecosystem during init |
| `maxsim-research-synthesizer` | `memory-management` | Synthesizes parallel research outputs into unified findings |
| `maxsim-codebase-mapper` | `memory-management` | Maps codebase structure, patterns, and conventions |
| `maxsim-integration-checker` | `verification-before-completion` | Validates cross-component integration with tested evidence |
| `maxsim-drift-checker` | `verification-before-completion`, `memory-management` | Compares .planning/ spec against codebase, produces DRIFT-REPORT.md |

## Skill Reference

| Skill | Directory | Purpose |
|-------|-----------|---------|
| `systematic-debugging` | `skills/systematic-debugging/` | Root cause investigation before fixes |
| `tdd` | `skills/tdd/` | Failing test before implementation |
| `verification-before-completion` | `skills/verification-before-completion/` | Evidence before completion claims |
| `using-maxsim` | `skills/using-maxsim/` | Workflow routing and structure (alwaysApply) |
| `memory-management` | `skills/memory-management/` | Pattern and error persistence |
| `brainstorming` | `skills/brainstorming/` | Multi-approach exploration before design |
| `roadmap-writing` | `skills/roadmap-writing/` | Phased planning with success criteria |
| `maxsim-simplify` | `skills/maxsim-simplify/` | Maintainability optimization pass (duplication, dead code, complexity) |
| `code-review` | `skills/code-review/` | Correctness gate (security, interfaces, errors, test coverage) |
| `sdd` | `skills/sdd/` | Orchestration strategy: spec-driven dispatch with fresh agent per task |
| `maxsim-batch` | `skills/maxsim-batch/` | Orchestration strategy: parallel worktree execution with one PR per unit |

## Agent Coherence Conventions

### System Map Maintenance

When adding a new agent, update the `<agent_system_map>` table in ALL existing agent prompts. The map is ~15 lines and inlined in each agent for zero-latency access. This is a manual step -- there is no shared partial file.

**Checklist for adding a new agent:**
1. Create agent prompt in `templates/agents/maxsim-{name}.md`
2. Add entry to `<agent_system_map>` table in every existing agent prompt
3. Add entry to this registry (AGENTS.md)
4. Add `AgentType` entry in `packages/cli/src/core/types.ts`
5. Add model mapping in `MODEL_PROFILES` in `packages/cli/src/core/core.ts`

### Required Sections

Every agent prompt MUST have these sections in order:

1. **Frontmatter** (with `needs` field declaring context requirements)
2. **`<agent_system_map>`** (13-agent table, identical in every agent)
3. **`<role>`** (agent-specific role description)
4. **`<upstream_input>`** (what this agent receives and from whom)
5. **`<downstream_consumer>`** (what this agent produces and for whom)
6. **`<input_validation>`** (hard blocking on missing critical inputs)
7. *...agent-specific sections...*
8. **`<deferred_items>`** (protocol for logging out-of-scope work)
9. **`<structured_returns>`** or equivalent output section (with minimum handoff contract)

### Needs Vocabulary

The `needs` field in agent YAML frontmatter declares what context the agent requires. The CLI reads this for auto-assembly.

| Need Key | Maps To | Description |
|----------|---------|-------------|
| `phase_dir` | Phase directory path + artifacts | Current phase directory with plans, summaries, context |
| `roadmap` | `.planning/ROADMAP.md` | Project roadmap with phase structure and success criteria |
| `state` | `.planning/STATE.md` | Accumulated decisions, blockers, metrics, session continuity |
| `requirements` | `.planning/REQUIREMENTS.md` | Versioned requirements with phase assignments |
| `config` | `.planning/config.json` | Model profile, workflow flags, branching strategy |
| `conventions` | `.planning/CONVENTIONS.md` | Project coding conventions and patterns |
| `codebase_docs` | `.planning/codebase/*.md` | All codebase analysis documents (STACK, ARCH, etc.) |
| `project` | `.planning/PROJECT.md` | Project vision and tech stack decisions |
| `inline` | All context passed in prompt | Agent receives all context inline from spawning agent (no file reads needed) |

### Handoff Contract

Every agent structured return MUST include these four sections (the minimum handoff contract):

```markdown
### Key Decisions
- {Decisions made during execution}

### Artifacts
- Created: {file_path}
- Modified: {file_path}

### Status
{complete | blocked | partial}
{If blocked: what blocks it}
{If partial: what remains}

### Deferred Items
- [{category}] {description}
{Or: "None"}
```

This contract ensures no context is lost between agent transitions. The orchestrator reads these sections to update STATE.md and determine next steps.
