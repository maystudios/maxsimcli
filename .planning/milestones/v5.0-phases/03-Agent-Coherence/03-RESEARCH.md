# Phase 3: Agent Coherence - Research

**Researched:** 2026-03-07
**Domain:** Multi-agent prompt engineering, context assembly, review automation, handoff protocols
**Confidence:** HIGH (internal codebase analysis, all sources are primary)

---

## User Constraints

Copied verbatim from 03-CONTEXT.md. Planner MUST honor these exactly.

### Decisions (LOCKED)

**Review Enforcement Boundaries (AGENT-03):**
- All profiles run both stages. Two-stage review (spec-compliance + code-quality) runs after every wave on every model profile (quality, balanced, budget). No profile-based gating.
- Quick tasks also get reviewed. `/maxsim:quick` runs the same two-stage review. Quick means fast planning, not skipped quality gates.
- Gap-closure plans get reviewed too. Same review cycle applies to gap-closure plans. Consistency -- every plan, no exceptions.
- On retry exhaustion, block and ask user. If a review stage FAILs after 2 retry attempts, execution pauses. User sees the failing issues and decides: fix manually, skip review, or abort.
- Continuation mode: full plan re-review. When executor resumes after a checkpoint, review covers ALL tasks in the plan (not just post-checkpoint tasks). Checkpoint decisions may affect earlier work.
- Review output format: frontmatter + markdown. Add YAML frontmatter (status, critical_count, warning_count) to existing markdown review output. Machine-parseable header, human-readable body. Orchestrator reads frontmatter for PASS/FAIL detection.

**Agent Awareness Depth (AGENT-01):**
- Full system map in every agent. Every agent prompt gets a compact `## Agent System Map` section listing all 13 agents with name + one-liner role description (~13 lines). Complete awareness, minimal context cost.
- Explicit input contracts AND orchestrator assembly. Agent prompts document expected input format via `<upstream_input>` AND orchestrators assemble context. Redundant but resilient -- agents can validate they received correct input.
- Standardize `<upstream_input>` and `<downstream_consumer>` on ALL agents. Every agent prompt gets both sections, even standalone agents (which declare "none" for upstream/downstream as appropriate).
- Hard validation with blocking. Agents check for required input sections. If critical input is missing, return structured error to orchestrator. Block on missing -- catches pipeline breaks early.
- No versioning needed. All agents ship in the same npm package. When one prompt changes, all change atomically. Version drift between agents cannot happen in practice.
- Reference to template for input examples. Agent `<upstream_input>` sections reference template files for expected format (e.g., "See templates/research.md for RESEARCH.md format") instead of inline examples. Zero prompt bloat.

**Context Filtering Per Role (AGENT-02):**
- Agent-level init commands for agents that need them. Add new CLI init commands for agents that load their own context: `init executor`, `init planner`, `init researcher`, `init verifier`, `init debugger`. Agents that receive all context inline (spec-reviewer, code-reviewer) don't need init commands.
- Exclude execution fields from non-execution agents. Researcher skips: executor_model, verifier_model, branching_strategy, branch templates, parallelization. Gets: phase info, roadmap, state, requirements, config. Minimal filtering -- remove what's irrelevant, keep everything else.
- All codebase docs to every agent. Don't subset `.planning/codebase/` docs by role. They're not huge, and agents focus on what's relevant. Simpler than maintaining role-based filtering rules.
- Frontmatter context declaration. Each agent prompt's YAML frontmatter lists what context fields/files it needs (e.g., `needs: [phase_dir, roadmap, state, requirements]`). CLI reads this for auto-assembly. Single source of truth -- agent defines its own needs.
- Formalized inline context as checklist. For agents spawned with inline context (spec-reviewer, code-reviewer), the executor prompt includes a checklist of what must be included when spawning each reviewer. Documented in both executor and reviewer prompts.

**Handoff Data Contracts (AGENT-04):**
- File for durable, inline for ephemeral. Long-lived artifacts (RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md) stay file-based. Short-lived handoffs (review verdicts, plan-checker feedback) stay inline in the prompt. Match persistence to lifecycle.
- Planner reads full RESEARCH.md. No filtering or extraction by orchestrator. The format was designed for this handoff -- planner reads the entire file and uses what it needs.
- Minimum handoff contract: decisions + artifacts + status + deferred items. Every agent handoff (structured return or file) must include: (1) key decisions made, (2) artifacts created/modified, (3) current status (complete/blocked/partial), (4) items explicitly deferred or out of scope.
- All agents log deferred items. Every agent that encounters out-of-scope work adds it to a standardized deferred items section in their output. Orchestrator aggregates into STATE.md.

### Claude's Discretion

- Exact implementation of agent-level init command signatures (parameter names, return shapes)
- How to structure the `needs` frontmatter field (array of strings, object with categories, etc.)
- Whether to add the system map as a shared partial file that gets included, or inline it in each agent prompt
- How to implement the review frontmatter parsing in the orchestrator (regex, YAML parser, CLI command)
- Ordering of new sections within agent prompts (where system map, upstream/downstream, and validation go)

### Deferred Ideas (OUT OF SCOPE)

- CLI command for centralized deferred item logging
- Schema validation CLI commands for agent outputs
- Pipeline diagram in agent prompts
- Per-agent codebase doc filtering based on role

---

## Phase Requirements

| Req ID | Description | Research Support |
|--------|-------------|------------------|
| AGENT-01 | Agent prompts reference and complement each other as a coordinated system | System map pattern, upstream/downstream contracts, input validation protocol |
| AGENT-02 | Context assembly is role-aware per agent type | New init commands, frontmatter `needs` field, context-loader.ts extension |
| AGENT-03 | Two-stage review is standard post-task workflow | Review enforcement in executor, quick workflow integration, frontmatter output format |
| AGENT-04 | Agent handoff protocol ensures no context loss | Minimum handoff contract, deferred items pattern, structured return templates |

---

## Summary

Phase 3 transforms MAXSIM's 13 agents from isolated prompts into a coordinated system. The changes span three layers: (1) agent prompt modifications -- adding system maps, `<upstream_input>`/`<downstream_consumer>` sections, input validation, and deferred item logging to every agent; (2) CLI/runtime changes -- new init commands (`init executor`, `init planner`, `init researcher`, `init verifier`, `init debugger`), `needs` frontmatter parsing for auto-assembly, and review frontmatter schema support; (3) orchestrator workflow changes -- enforcing two-stage review on ALL profiles (removing the quality-only gate), adding review to quick tasks, and implementing retry-exhaustion blocking.

The codebase is well-structured for these changes. The `init.ts` module already has 12 init commands following a consistent pattern (parse config, find phase, assemble context object, return CmdResult). Adding 5 new agent-level init commands follows the same pattern with role-specific field filtering. The `frontmatter.ts` module already parses and validates YAML frontmatter, making the review output format (frontmatter + markdown) straightforward. The agent templates are markdown files in `templates/agents/` with YAML frontmatter headers -- adding `needs` fields and new sections is additive, not breaking.

**Primary recommendation:** Structure work into three waves: (1) Agent prompt updates (system map, contracts, validation, deferred items) -- pure markdown, no code changes; (2) CLI init commands and frontmatter parsing -- TypeScript in `packages/cli/src/core/`; (3) Orchestrator workflow changes (review enforcement, retry exhaustion) -- markdown workflow files plus executor agent updates.

---

## Standard Stack

### Core (No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| `yaml` (npm) | Already in package.json | Parse agent frontmatter `needs` field | Already used by `frontmatter.ts` for all YAML parsing |
| TypeScript | Already in build chain | New init commands, type definitions | Existing pattern in `packages/cli/src/core/` |
| tsdown | Already in build chain | Bundle new/modified CLI modules | Existing build pipeline |
| Markdown templates | N/A | Agent prompt files | The "runtime" is the AI -- prompts are markdown |

### Supporting

| Tool | Purpose | Notes |
|------|---------|-------|
| `frontmatter.ts` | Parse `needs` field from agent YAML headers | Extend `extractFrontmatter()` -- already handles arbitrary YAML keys |
| `init.ts` | New agent-level init commands | Follow existing `cmdInit*` pattern exactly |
| `cli.ts` | Register new init subcommands | Add to `handleInit` dispatcher (line 311-331) |
| `types.ts` | New context type interfaces | Follow existing `*Context` interface pattern |
| `context-loader.ts` | May need extension for role-based loading | Currently does topic-based codebase doc selection |

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| JSON schema validation for agent outputs | Deferred per CONTEXT.md -- agents do hard validation themselves |
| Shared partial file for system map | Claude's discretion -- research recommends inlining (see Architecture Patterns) |
| Runtime YAML parsing of agent needs in orchestrators | YAML is already parsed -- `extractFrontmatter()` returns the data |

---

## Architecture Patterns

### Pattern 1: Agent Prompt Section Ordering

Every agent prompt must follow this standardized section order after Phase 3:

```markdown
---
name: maxsim-{role}
description: ...
tools: ...
color: ...
needs: [phase_dir, roadmap, state, requirements]
---

<agent_system_map>
## Agent System Map
| Agent | Role |
|-------|------|
| maxsim-executor | Implements plan tasks with atomic commits |
| maxsim-planner | Creates executable phase plans |
| ... (all 13 agents) |
</agent_system_map>

<role>
...existing role content...
</role>

<upstream_input>
**Receives from:** {agent or orchestrator name}
| Input | Format | Required |
|-------|--------|----------|
| ... | ... | ... |

See {template_path} for expected format.

**Validation:** If {critical_input} is missing, return:
## INPUT VALIDATION FAILED
**Missing:** {what}
**Expected from:** {who}
</upstream_input>

<downstream_consumer>
**Produces for:** {agent or orchestrator name}
| Output | Format | Contains |
|--------|--------|----------|
| ... | ... | ... |
</downstream_consumer>

...existing agent-specific sections...

<deferred_items>
## Deferred Items Protocol
When encountering work outside current scope:
1. DO NOT implement it
2. Add to output under `### Deferred Items`
3. Format: `- [{category}] {description} — {why deferred}`
Categories: feature, bug, refactor, investigation
</deferred_items>

<structured_returns>
...must include: decisions, artifacts, status, deferred items...
</structured_returns>
```

**Source:** Derived from CONTEXT.md locked decisions. Confidence: HIGH.

### Pattern 2: Agent Init Command Structure

New init commands follow the established pattern in `init.ts`. Each returns a role-filtered context object.

```typescript
// In init.ts
export interface ExecutorInitContext {
  executor_model: ModelResolution;
  verifier_model: ModelResolution;
  commit_docs: boolean;
  parallelization: boolean;
  branching_strategy: BranchingStrategy;
  phase_branch_template: string;
  milestone_branch_template: string;
  verifier_enabled: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  // ... execution-specific fields
}

export interface ResearcherInitContext {
  researcher_model: ModelResolution;
  commit_docs: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  // ... research-specific fields
  // NOTE: No executor_model, verifier_model, branching_strategy, etc.
}
```

**Key pattern:** Each init command INCLUDES all fields the agent needs (from config, phase info, file existence checks) and EXCLUDES fields irrelevant to that role. The existing `cmdInitExecutePhase` and `cmdInitPlanPhase` already demonstrate this -- they include different model resolutions and different context paths.

**Source:** Direct analysis of `packages/cli/src/core/init.ts`. Confidence: HIGH.

### Pattern 3: Frontmatter `needs` Declaration

Each agent's YAML frontmatter declares its context needs:

```yaml
---
name: maxsim-researcher
description: ...
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch
color: cyan
needs: [phase_dir, roadmap, state, requirements, config]
---
```

The `needs` field is an array of strings. Each string maps to a context category that the init command or orchestrator must provide. The CLI reads this field when assembling context.

Recommended `needs` vocabulary (standardized across all agents):

| Need Key | Maps To | Which Agents |
|----------|---------|-------------|
| `phase_dir` | Phase directory path + artifacts | executor, planner, researcher, verifier, plan-checker |
| `roadmap` | `.planning/ROADMAP.md` | planner, researcher, verifier, roadmapper |
| `state` | `.planning/STATE.md` | executor, planner, researcher, verifier |
| `requirements` | `.planning/REQUIREMENTS.md` | planner, researcher, verifier |
| `config` | `.planning/config.json` | executor, planner, researcher |
| `conventions` | `.planning/CONVENTIONS.md` | executor, code-reviewer |
| `codebase_docs` | `.planning/codebase/*.md` | All (per locked decision) |
| `project` | `.planning/PROJECT.md` | roadmapper, researcher |
| `inline` | All context passed in prompt | spec-reviewer, code-reviewer |

**Source:** Derived from CONTEXT.md decisions + current init.ts field analysis. Confidence: HIGH.

### Pattern 4: Review Frontmatter Output Format

Review agents (spec-reviewer, code-reviewer) output markdown with YAML frontmatter:

```markdown
---
status: PASS
critical_count: 0
warning_count: 2
note_count: 5
---

## SPEC REVIEW: PASS

### Findings
...
```

The orchestrator (executor) parses the frontmatter using existing `extractFrontmatter()`:

```typescript
import { extractFrontmatter } from './frontmatter.js';

const reviewContent = agentOutput;
const fm = extractFrontmatter(reviewContent);
const passed = fm.status === 'PASS';
const criticals = fm.critical_count as number;
```

**Source:** `extractFrontmatter()` in `packages/cli/src/core/frontmatter.ts` already handles this. Confidence: HIGH.

### Pattern 5: Minimum Handoff Contract

Every structured return from any agent must include these four sections:

```markdown
## {RESULT_TYPE}

### Key Decisions
- [Decision 1]
- [Decision 2]

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

**Source:** CONTEXT.md locked decision on handoff contracts. Confidence: HIGH.

### Anti-Patterns to Avoid

1. **Do NOT add `needs` parsing to orchestrator workflows.** The CLI init commands read agent frontmatter and return the appropriate context. Orchestrators call `init {role}` and get the right fields back. The `needs` field is read by the CLI, not by orchestrators.

2. **Do NOT create a separate system-map file that gets @-referenced.** The CONTEXT.md leaves this as Claude's discretion. Recommendation: **inline the system map in each agent prompt.** Rationale: @-references require file reads, adding latency. The system map is ~15 lines -- trivial context cost. Inlining guarantees the map is always present without file-read failures.

3. **Do NOT add review stages to the verifier agent.** Two-stage review is a post-wave executor concern. The verifier checks phase-level goal achievement after all plans complete. These are different quality gates at different granularities.

4. **Do NOT filter codebase docs per role.** CONTEXT.md explicitly defers this. All codebase docs go to every agent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex parser | `extractFrontmatter()` in `frontmatter.ts` | Uses `yaml` npm package, handles edge cases, already tested |
| Agent frontmatter reading | New parsing utility | `extractFrontmatter()` on agent .md files | Same function works on any markdown with YAML frontmatter |
| Review verdict detection | Custom string matching | Frontmatter `status` field + `extractFrontmatter()` | Machine-parseable, no regex fragility |
| Context assembly | New context engine | Extend existing `cmdInit*` pattern in `init.ts` | 12 existing init commands prove the pattern works |
| Agent type registry | New agent registry system | `AgentType` union in `types.ts` + `MODEL_PROFILES` in `core.ts` | Already tracks all agent types, used for model resolution |
| Deferred item aggregation | Custom aggregation tool | STATE.md `add-decision` or `add-blocker` commands | Existing STATE.md CRUD handles structured additions |
| Frontmatter schema validation | Custom validation | `FRONTMATTER_SCHEMAS` in `frontmatter.ts` | Add `review` schema alongside existing `plan`, `summary`, `verification` schemas |

---

## Common Pitfalls

### Pitfall 1: Review Enforcement Creates Infinite Context Burn

**What goes wrong:** Two-stage review on every profile means budget-tier agents (Haiku) spawn review subagents after every wave. If review fails and retries, the executor burns 3x context per wave.

**Why:** Budget profiles exist to save cost. Mandatory review on budget profiles contradicts that goal if not sized correctly.

**How to avoid:** The retry limit (2 attempts per stage, per locked decision) caps context burn. After 2 retries, execution pauses for user. Keep review agent prompts lean -- they already are (spec-reviewer: ~109 lines, code-reviewer: ~106 lines). The 2-retry cap ensures maximum 3 review attempts per stage per wave.

**Warning signs:** Users on budget profile complaining about slow execution or high token usage on simple plans.

### Pitfall 2: Init Command Explosion

**What goes wrong:** Adding 5 new init commands (executor, planner, researcher, verifier, debugger) when `cmdInitExecutePhase` and `cmdInitPlanPhase` already cover executor and planner contexts.

**Why:** The CONTEXT.md says "add new CLI init commands for agents that need them" but does not say "replace existing ones." The existing `init execute-phase` and `init plan-phase` are WORKFLOW-level inits, not AGENT-level inits. Agent-level inits serve the agent directly.

**How to avoid:** The new agent init commands are role-filtered subsets. `init executor` returns ExecutorInitContext (execution-focused). `init execute-phase` remains the WORKFLOW init (used by the orchestrator). Keep both -- orchestrators use workflow inits, agents can optionally use agent inits for self-assembly. The agent-level inits are new additions, not replacements.

**Warning signs:** Duplicate fields between workflow inits and agent inits causing confusion about which to call.

### Pitfall 3: System Map Staleness

**What goes wrong:** The system map in each agent prompt lists 13 agents. If a 14th agent is added later, all 13 existing prompts need updating.

**Why:** Inlined content has no single source of truth.

**How to avoid:** Accept this tradeoff -- the CONTEXT.md explicitly says "no versioning needed" because all prompts ship atomically in the npm package. When adding an agent, a checklist item in the agent-adding workflow must include "update system map in all agent prompts." The system map is ~15 lines, making find-and-replace trivial. Document this in CONVENTIONS or the AGENTS.md registry.

**Warning signs:** A new agent is added without updating existing agents' system maps.

### Pitfall 4: Executor Review Section Conflicts With Existing Logic

**What goes wrong:** The executor currently has a `<wave_review_protocol>` section that gates review on `model_profile === "quality"`. Changing this to "all profiles" could conflict with the existing conditional logic.

**Why:** The current code checks `MODEL_PROFILE` and skips review for non-quality profiles. Simply removing the condition works, but the section also references specific spawning patterns.

**How to avoid:** Replace the entire `<wave_review_protocol>` section with the new universal review protocol. Do not try to patch the condition -- rewrite the section to be unconditional. Keep the same spawning pattern (spec-reviewer then code-reviewer), add frontmatter output parsing, add retry-exhaustion blocking. The quick workflow also needs its own review step added post-execution.

**Warning signs:** Two different review-gating conditions in the same prompt, or review running on quality but silently skipping on balanced due to stale conditional.

### Pitfall 5: Frontmatter `needs` Field Not Read By Anything

**What goes wrong:** The `needs` field is added to agent YAML frontmatter but no code reads it. It becomes documentation-only.

**Why:** The CONTEXT.md says "CLI reads this for auto-assembly" but the current `init.ts` commands hardcode their field lists. If `needs` is not actually parsed, it is aspirational, not functional.

**How to avoid:** The agent-level init commands should read the agent's .md file, extract the `needs` array from frontmatter, and use it to determine which context files to include. The `extractFrontmatter()` function already returns arbitrary YAML fields. The init command reads the agent file at a known path (`templates/agents/maxsim-{role}.md` or `~/.claude/agents/maxsim-{role}.md`), extracts `needs`, and assembles context accordingly. This makes `needs` the single source of truth.

**Warning signs:** Agent frontmatter says `needs: [roadmap]` but the init command hardcodes roadmap inclusion regardless of the `needs` field.

### Pitfall 6: Quick Task Review Adds Unexpected Overhead

**What goes wrong:** Quick tasks are meant to be fast. Adding two-stage review after every quick execution doubles the time for simple tasks.

**Why:** Locked decision: "Quick tasks also get reviewed." Fast planning does not mean skipped quality gates.

**How to avoid:** This is intentional per user decision. However, size the review for quick tasks -- quick plans typically have 1-3 tasks modifying 1-5 files. The review will be fast. The spec-reviewer and code-reviewer are lightweight agents. If users find this too slow, it is a future optimization discussion (not this phase's scope).

**Warning signs:** Users avoiding `/maxsim:quick` because it takes longer than manually making changes.

---

## Code Examples

### Example 1: Agent System Map Section (inline in each agent)

```markdown
<agent_system_map>
## Agent System Map

| Agent | Role |
|-------|------|
| maxsim-executor | Implements plan tasks with atomic commits and deviation handling |
| maxsim-planner | Creates executable phase plans with goal-backward verification |
| maxsim-plan-checker | Verifies plans achieve phase goal before execution |
| maxsim-phase-researcher | Researches phase domain for planning context |
| maxsim-project-researcher | Researches project ecosystem during init |
| maxsim-research-synthesizer | Synthesizes parallel research into unified findings |
| maxsim-roadmapper | Creates roadmaps with phase breakdown and requirement mapping |
| maxsim-verifier | Verifies phase goal achievement with fresh evidence |
| maxsim-spec-reviewer | Reviews implementation for spec compliance |
| maxsim-code-reviewer | Reviews implementation for code quality |
| maxsim-debugger | Investigates bugs via systematic hypothesis testing |
| maxsim-codebase-mapper | Maps codebase structure and conventions |
| maxsim-integration-checker | Validates cross-component integration |
</agent_system_map>
```

**Source:** `templates/agents/AGENTS.md` registry -- 13 agents confirmed. Confidence: HIGH.

### Example 2: New Init Command (agent-level)

```typescript
// In init.ts -- new agent-level init for researcher
export interface ResearcherAgentContext {
  researcher_model: ModelResolution;
  commit_docs: boolean;
  brave_search: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  padded_phase: string | null;
  phase_req_ids: string | null;
  has_research: boolean;
  has_context: boolean;
  roadmap_exists: boolean;
  planning_exists: boolean;
  state_path: string;
  roadmap_path: string;
  requirements_path: string;
  conventions_path?: string;
  context_path?: string;
  // NO executor_model, verifier_model, branching_strategy,
  // phase_branch_template, milestone_branch_template, parallelization
}

export function cmdInitResearcher(cwd: string, phase: string | undefined): CmdResult {
  if (!phase) return cmdErr('phase required for init researcher');
  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);
  const phase_req_ids = extractReqIds(cwd, phase);
  const result: ResearcherAgentContext = {
    researcher_model: resolveModelInternal(cwd, 'maxsim-phase-researcher'),
    commit_docs: config.commit_docs,
    brave_search: config.brave_search,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory ?? null,
    phase_number: phaseInfo?.phase_number ?? null,
    phase_name: phaseInfo?.phase_name ?? null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') ?? null,
    phase_req_ids,
    has_research: phaseInfo?.has_research ?? false,
    has_context: phaseInfo?.has_context ?? false,
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    requirements_path: '.planning/REQUIREMENTS.md',
  };
  // Add optional paths
  if (pathExistsInternal(cwd, '.planning/CONVENTIONS.md')) {
    result.conventions_path = '.planning/CONVENTIONS.md';
  }
  if (phaseInfo?.directory) {
    const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
    if (artifacts.context_path) result.context_path = artifacts.context_path;
  }
  return cmdOk(result);
}
```

**Source:** Pattern derived from existing `cmdInitPlanPhase` in `init.ts` (line 430-469). Confidence: HIGH.

### Example 3: CLI Router Registration

```typescript
// In cli.ts, inside handleInit (line 311-331)
const handlers: Record<string, () => CmdResult> = {
  // ... existing workflow-level inits ...
  'execute-phase': () => cmdInitExecutePhase(cwd, args[2]),
  'plan-phase': () => cmdInitPlanPhase(cwd, args[2]),
  // ... new agent-level inits ...
  'executor': () => cmdInitExecutor(cwd, args[2]),
  'planner': () => cmdInitPlanner(cwd, args[2]),
  'researcher': () => cmdInitResearcher(cwd, args[2]),
  'verifier': () => cmdInitVerifier(cwd, args[2]),
  'debugger': () => cmdInitDebugger(cwd, args[2]),
};
```

**Source:** `cli.ts` handleInit handler at line 311. Confidence: HIGH.

### Example 4: Review Frontmatter Schema

```typescript
// In frontmatter.ts, add to FRONTMATTER_SCHEMAS
export const FRONTMATTER_SCHEMAS: Record<string, FrontmatterSchema> = {
  plan: {
    required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'],
  },
  summary: {
    required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'],
  },
  verification: {
    required: ['phase', 'verified', 'status', 'score'],
  },
  // NEW: Review output schema
  review: {
    required: ['status', 'critical_count', 'warning_count'],
  },
};
```

**Source:** `packages/cli/src/core/frontmatter.ts` line 89-99. Confidence: HIGH.

### Example 5: Universal Review Protocol (replaces quality-only gate in executor)

```markdown
<wave_review_protocol>
After all wave tasks complete, run two-stage review unconditionally.

1. **Spec-Compliance Review:**
   Spawn `maxsim-spec-reviewer` with:
   - Task specs (action, done criteria, files) for ALL tasks in this wave
   - Modified files list (from git diff)
   - Plan frontmatter requirements

   Parse review output frontmatter:
   ```
   fm = extractFrontmatter(review_output)
   if fm.status == "FAIL": retry (max 2 attempts)
   ```

   On retry: fix issues, re-stage, re-run review.
   On exhaustion (2 retries failed):
   ```markdown
   ## REVIEW BLOCKED

   **Stage:** Spec Compliance
   **Attempts:** 3 (initial + 2 retries)
   **Failing Issues:**
   - {issue 1}
   - {issue 2}

   **Options:**
   1. Fix manually and continue
   2. Skip review for this wave
   3. Abort execution
   ```
   STOP and wait for user decision.

2. **Code-Quality Review:**
   Same pattern as spec-compliance. Spawn `maxsim-code-reviewer`.
   Same retry logic (max 2).
   Same exhaustion behavior (block + ask user).

3. **Append to SUMMARY.md:**
   ```markdown
   ## Wave {N} Review
   - Spec: {PASS/FAIL} ({retry_count} retries)
   - Code: {PASS/FAIL} ({retry_count} retries)
   - Issues: {critical_count} critical, {warning_count} warnings
   ```

**Continuation mode:** When resuming from checkpoint, review covers ALL tasks
(not just post-checkpoint). Re-spawn reviewers with full task list.
</wave_review_protocol>
```

**Source:** CONTEXT.md locked decisions on review enforcement. Confidence: HIGH.

### Example 6: Input Validation Block (added to each agent)

```markdown
<input_validation>
**Required inputs for this agent:**
- Phase directory path (from init or prompt)
- STATE.md (readable at .planning/STATE.md)
- ROADMAP.md (readable at .planning/ROADMAP.md)

**Validation check (run at agent startup):**
If any required input is missing, return immediately:

## INPUT VALIDATION FAILED

**Agent:** maxsim-{role}
**Missing:** {list of missing inputs}
**Expected from:** {orchestrator or previous agent}

Do NOT proceed with partial context. This error indicates a pipeline break.
</input_validation>
```

**Source:** CONTEXT.md locked decision on hard validation with blocking. Confidence: HIGH.

---

## State of the Art

| Old Approach (Current) | Current Approach (Phase 3) | When Changed | Impact |
|------------------------|---------------------------|-------------|--------|
| Review gated on quality profile only | Review runs on all profiles unconditionally | Phase 3 | Every execution gets quality gates; budget users may see slower execution |
| Agents as isolated prompts | Agents as coordinated system with handoff contracts | Phase 3 | Context loss between transitions eliminated |
| Orchestrator assembles all context | Agent declares needs, CLI provides role-filtered context | Phase 3 | Leaner context per agent, faster initialization |
| Review output as plain markdown | Review output as frontmatter + markdown | Phase 3 | Machine-parseable verdicts, reliable automation |
| Quick tasks skip review | Quick tasks get full two-stage review | Phase 3 | Consistent quality regardless of workflow entry point |
| No input validation on agents | Hard validation with structured error returns | Phase 3 | Pipeline breaks caught early, not after wasted context |

---

## Open Questions

### What We Know
- All 13 agent prompts need modification (system map, upstream/downstream, validation, deferred items)
- 5 new init commands needed in `init.ts` with corresponding types and CLI routing
- The executor's `<wave_review_protocol>` must become unconditional
- The quick workflow needs a post-execution review step
- `frontmatter.ts` needs a `review` schema
- Agent YAML frontmatter needs a `needs` field

### What's Unclear

1. **Agent file path resolution at runtime.** The `needs`-based auto-assembly requires reading the agent's .md file. At runtime, agent prompts live at `~/.claude/agents/maxsim-{role}.md`. During development, they are at `templates/agents/maxsim-{role}.md`. The init command needs to know which path to read. **Recommendation:** Use the installed path (`~/.claude/agents/`) as primary, fall back to `templates/agents/` for development. The `install.ts` copies templates to the installed location.

2. **Continuation mode review scope.** The decision says "review covers ALL tasks in the plan (not just post-checkpoint tasks)." When resuming after a checkpoint, the executor needs the full task list from the plan to pass to reviewers. This is already available (executor reads the full PLAN.md), but the continuation prompt's `<completed_tasks>` section must be included in the review context. **Recommendation:** The continuation executor re-reads the full plan and passes all tasks to reviewers regardless of checkpoint state.

3. **Deferred item aggregation timing.** "Orchestrator aggregates into STATE.md" -- when? After each agent returns? After all agents in a wave? After phase completion? **Recommendation:** After each agent returns to the orchestrator, extract the `### Deferred Items` section from the agent's output and call `state add-decision --phase {phase} --summary "Deferred: {item}"` for each. This uses existing STATE.md infrastructure.

---

## Sources

### Primary (HIGH Confidence)
- `packages/cli/src/core/init.ts` -- 12 existing init commands, pattern analysis
- `packages/cli/src/core/frontmatter.ts` -- YAML frontmatter parsing, schema validation
- `packages/cli/src/core/types.ts` -- TypeScript interfaces, AgentType union, AppConfig
- `packages/cli/src/core/core.ts` -- MODEL_PROFILES (line 30-42), resolveModelInternal (line 490)
- `packages/cli/src/core/context-loader.ts` -- Context assembly patterns
- `packages/cli/src/cli.ts` -- Command routing, handleInit dispatcher (line 311-331)
- `templates/agents/*.md` -- All 13 agent prompts analyzed
- `templates/workflows/execute-phase.md` -- Orchestrator wave execution, review checking
- `templates/workflows/quick.md` -- Quick task workflow, no review step currently
- `.planning/phases/03-Agent-Coherence/03-CONTEXT.md` -- Locked user decisions

### Secondary (MEDIUM Confidence)
- `templates/agents/AGENTS.md` -- Agent-skill registry (13 agents confirmed)
- `templates/workflows/execute-plan.md` -- Plan execution patterns
- `.planning/ROADMAP.md` -- Phase dependencies and success criteria
- `.planning/REQUIREMENTS.md` -- AGENT-01 through AGENT-04 definitions

---

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Standard Stack | HIGH | No new dependencies; all existing tools analyzed from source |
| Architecture Patterns | HIGH | Patterns derived from direct codebase analysis of 13 agents + init.ts |
| Don't Hand-Roll | HIGH | Every "Use Instead" verified to exist in codebase |
| Common Pitfalls | HIGH | Based on specific code paths (review gating, init patterns, frontmatter parsing) |
| Code Examples | HIGH | All examples reference actual file paths and line numbers |
| Agent Prompt Structure | HIGH | All 13 agents read; section ordering analyzed |
| Init Command Pattern | HIGH | 12 existing commands analyzed for consistent pattern |
| Review Enforcement | HIGH | Current quality-only gate identified at executor line 205-216 |

**Research date:** 2026-03-07
**Valid until:** Phase 3 completion (no external dependencies that could change)
