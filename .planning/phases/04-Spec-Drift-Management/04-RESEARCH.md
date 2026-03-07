# Phase 4: Spec Drift Management - Research

**Researched:** 2026-03-07
**Domain:** AI-agent-driven specification compliance analysis, drift detection, codebase-spec comparison
**Confidence:** HIGH (internal codebase patterns fully verified, ecosystem patterns cross-referenced)

---

## User Constraints

Copied verbatim from 04-CONTEXT.md. Planner MUST honor all decisions. Claude's Discretion items have research recommendations below.

### Decisions (Locked)

**Drift Report Content & Format (DRIFT-01, DRIFT-02):**
- Full inventory, not just mismatches. Report shows both aligned items and drifted items.
- Both phase-level and per-requirement granularity. Phase-level summary at top, per-requirement detail below.
- Three severity tiers: critical / warning / info.
- Evidence included per mismatch (spec line + code location).
- Per-item fix recommendations.
- Output to `.planning/DRIFT-REPORT.md`.
- Two directional sections: "Spec ahead of code" and "Code ahead of spec".
- Dedicated "Undocumented Features" section.
- Per-criterion breakdown for partial implementations.
- Timestamped with diff tracking.
- YAML frontmatter for machine consumption.
- Partial check on incomplete spec.

**Realignment Interaction Style (DRIFT-03, DRIFT-04):**
- Realign-to-code: item-by-item approval (Accept/Skip/Edit).
- Realign-to-spec: generate new MAXSIM phases inserted after current phase.
- All-or-nothing per direction.
- Both inline and standalone commands.
- Fix phases inserted after current phase.
- Auto-mark phases complete if all criteria met.
- Group related gaps into fewer phases (avoid phase explosion).

**Comparison Scope & Boundaries (DRIFT-01, DRIFT-02):**
- Full `.planning/` sweep (REQUIREMENTS.md, STATE.md decisions, CONVENTIONS.md, NO-GOS.md, phase summaries).
- All milestones, including archived.
- Descoped/deferred items excluded.
- No-go violation checking.
- Implementation = source code + tests.
- Convention compliance: best-effort pattern check (info-level with confidence).
- Fresh codebase scan every run.
- Verify phase summaries against actual code.

### Claude's Discretion (Research Recommendations)

- **How to implement codebase scanning:** Use a dedicated drift-checker agent (new `maxsim-drift-checker`) that reads spec files and analyzes code directly. Do NOT reuse the codebase-mapper agent -- it has a different purpose (general codebase documentation vs targeted spec comparison). The drift checker needs spec context that the mapper never receives.
- **Heuristics for detecting "implemented":** Two-layer approach. Layer 1: file existence + export presence (deterministic). Layer 2: AI semantic analysis of whether the code actually does what the requirement describes (probabilistic, with confidence indicator). Include test file existence as separate check.
- **Format of diff-tracking section:** Inline annotations on each item showing `[NEW]`, `[RESOLVED]`, `[UNCHANGED]` compared to previous report. Add a summary diff section at the bottom showing counts of new/resolved drifts. Store previous report hash in frontmatter.
- **No-go violation detection:** AI analysis with grep-based evidence. The agent reads NO-GOS.md, extracts each no-go rule, then searches the codebase for violations using grep/glob patterns. Report findings as critical drift with code evidence.
- **Gap grouping algorithm:** Group by requirement prefix (e.g., all DRIFT-* gaps become one phase). If no prefix grouping possible, cluster by affected subsystem (file paths). Cap at 5 phases maximum -- merge remaining gaps into "Remaining Gaps" phase.
- **CLI interface for realign command:** Single command `/maxsim:realign` that reads the latest DRIFT-REPORT.md. Uses `$ARGUMENTS` to determine direction: `to-code` or `to-spec`. If no argument, prompt user interactively.
- **check-drift as command + workflow:** `/maxsim:check-drift` is a command (markdown in `commands/maxsim/`) that references a workflow (`workflows/check-drift.md`) which spawns the drift-checker agent. This follows the standard MAXSIM three-layer pattern (command -> workflow -> agent).

### Deferred Ideas (Out of Scope)

- Scheduled/automated drift checks
- Drift severity thresholds in config
- Visual drift dashboard
- Per-developer drift attribution

---

## Summary

Phase 4 implements spec-vs-code drift detection for MAXSIM, enabling users to run `/maxsim:check-drift` to compare their `.planning/` specification against the actual codebase and generate a structured DRIFT-REPORT.md. The system also provides `/maxsim:realign` for corrective action in either direction.

This is fundamentally an AI-agent-based analysis system, not a traditional deterministic tool. The drift detection is performed by an AI agent (the drift-checker) that reads spec files and systematically analyzes the codebase. The CLI tools router provides supporting commands for reading spec files, querying roadmap structure, and managing the drift report. The key architectural challenge is designing the agent prompt and workflow to be systematic and reproducible rather than ad-hoc.

The implementation requires four deliverables: (1) a new drift-checker agent prompt, (2) CLI tool commands for drift report CRUD and spec extraction, (3) `/maxsim:check-drift` command + workflow, and (4) `/maxsim:realign` command + workflow. All four follow established MAXSIM patterns already proven in phases 1-3.

**Primary recommendation:** Follow the exact same three-layer architecture (command -> workflow -> agent) used by map-codebase and verify-work. The drift-checker agent writes DRIFT-REPORT.md directly. The realign workflows orchestrate user interaction.

---

## Standard Stack

### Core (Already in MAXSIM -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| `yaml` | ^2.8.2 | YAML frontmatter parsing/serialization for DRIFT-REPORT.md | Already used by `frontmatter.ts` for all MAXSIM frontmatter operations |
| `escape-string-regexp` | (existing) | Safe regex construction for pattern matching in spec files | Already used by `state.ts` |
| Node.js `fs/path` | Built-in | File system operations for reading spec files and codebase | Standard MAXSIM pattern |

### Supporting (CLI Tools Router Extensions)

| Module | Location | Purpose |
|--------|----------|---------|
| `drift.ts` | `packages/cli/src/core/drift.ts` | New core module: drift report reading, writing, comparison, diff tracking |
| `frontmatter.ts` | `packages/cli/src/core/frontmatter.ts` | Existing: add `drift` schema to `FRONTMATTER_SCHEMAS` |
| `roadmap.ts` | `packages/cli/src/core/roadmap.ts` | Existing: reuse `cmdRoadmapAnalyze` and `cmdRoadmapGetPhase` for spec extraction |
| `phase.ts` | `packages/cli/src/core/phase.ts` | Existing: reuse `cmdPhaseInsert` for realign-to-spec phase creation |
| `milestone.ts` | `packages/cli/src/core/milestone.ts` | Existing: reuse `cmdRequirementsMarkComplete` for realign-to-code updates |

### New Files to Create

| File | Type | Purpose |
|------|------|---------|
| `templates/agents/maxsim-drift-checker.md` | Agent prompt | Drift analysis agent that reads spec + scans code |
| `templates/commands/maxsim/check-drift.md` | Command | User-facing `/maxsim:check-drift` command |
| `templates/commands/maxsim/realign.md` | Command | User-facing `/maxsim:realign` command |
| `templates/workflows/check-drift.md` | Workflow | Orchestration for drift detection |
| `templates/workflows/realign.md` | Workflow | Orchestration for realignment |
| `packages/cli/src/core/drift.ts` | Core module | CLI tool commands for drift operations |

### Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Reuse codebase-mapper agent for drift detection | Mapper produces general docs, not spec comparison. Different input context (no spec files). Wrong tool for the job. |
| External AST analysis tools (ts-morph, babel) | Over-engineering. The AI agent can read source code directly. Adding AST deps increases bundle size for marginal gain. MAXSIM is AI-native. |
| Deterministic requirement-matching engine | Requirements are natural language. Deterministic matching would miss semantic equivalence. AI analysis with evidence is the right approach. |
| Single monolithic agent for check + realign | Separation of concerns. Drift-checker produces report; realign workflows consume report. Clean handoff. |

---

## Architecture Patterns

### Pattern 1: Three-Layer Command Architecture (VERIFIED -- used by all 35+ MAXSIM commands)

```
Command (templates/commands/maxsim/check-drift.md)
  └── references Workflow (templates/workflows/check-drift.md)
       └── spawns Agent (templates/agents/maxsim-drift-checker.md)
            └── calls CLI tools (node maxsim-tools.cjs drift ...)
                 └── backed by Core module (packages/cli/src/core/drift.ts)
```

**Source:** Verified from existing `map-codebase.md` -> `map-codebase workflow` -> `maxsim-codebase-mapper` -> `cli.ts` dispatch chain.

### Pattern 2: Agent Writes Output Directly (VERIFIED -- used by codebase-mapper, verifier)

The drift-checker agent writes DRIFT-REPORT.md directly to `.planning/`. The orchestrator (workflow) does NOT receive the full report content -- it only gets confirmation that the report was written. This follows the established pattern from `maxsim-codebase-mapper` which writes documents directly to `.planning/codebase/`.

**Why:** Prevents context bloat in the orchestrator. The report can be large (50+ items). Only metadata (status, counts) flows back.

### Pattern 3: YAML Frontmatter for Machine-Parseable Output (VERIFIED -- used by reviewer agents, PLAN.md, VERIFICATION.md)

```yaml
---
status: drift | aligned
phase: "04"
checked: "2026-03-07T14:30:00Z"
previous_hash: "abc123"
total_items: 42
aligned_count: 35
critical_count: 3
warning_count: 2
info_count: 2
undocumented_count: 4
spec_files_checked:
  - REQUIREMENTS.md
  - NO-GOS.md
  - ROADMAP.md
  - STATE.md
  - CONVENTIONS.md
---
```

**Source:** Verified from `FRONTMATTER_SCHEMAS` in `frontmatter.ts` which already defines schemas for `plan`, `summary`, `verification`, and `review`.

### Pattern 4: Init Context Assembly (VERIFIED -- used by all workflows)

Every workflow starts by calling `init` to get context:

```bash
INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init check-drift)
```

The init function returns a JSON context object with all paths, model resolution, and configuration. For drift detection, this needs a new `CheckDriftContext` type and `cmdInitCheckDrift` function in `init.ts`.

**Source:** Verified from `init.ts` which exports `cmdInitExecutePhase`, `cmdInitPlanPhase`, etc.

### Pattern 5: CLI Tools Router Dispatch (VERIFIED -- used for all 150+ commands)

New drift commands register in the `COMMANDS` record in `cli.ts`:

```typescript
// In cli.ts COMMANDS record:
'drift': handleDrift,

// Handler:
const handleDrift: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => CmdResult | Promise<CmdResult>> = {
    'check': () => cmdDriftCheck(cwd),
    'read-report': () => cmdDriftReadReport(cwd),
    'compare-reports': () => cmdDriftCompareReports(cwd, args[2], args[3]),
    'extract-requirements': () => cmdDriftExtractRequirements(cwd),
    'extract-nogos': () => cmdDriftExtractNoGos(cwd),
  };
  // ...
};
```

**Source:** Verified from `cli.ts` lines 344-442 showing the exact `COMMANDS` record and handler pattern.

### Pattern 6: Phase Insert for Realign-to-Spec (VERIFIED -- existing `cmdPhaseInsert`)

When realign-to-spec creates new phases, use the existing `cmdPhaseInsert(cwd, afterPhase, name)` function which:
1. Creates a decimal-suffixed phase directory after the specified phase
2. Updates ROADMAP.md with the new phase entry
3. Returns the phase number and directory path

**Source:** Verified from `phase.ts` exports and `cli.ts` dispatch at line 273.

### Recommended Project Structure

```
New/Modified Files:
packages/cli/src/core/
  ├── drift.ts                    # NEW: Drift report CRUD, requirement extraction, diff tracking
  └── init.ts                     # MODIFIED: Add cmdInitCheckDrift, cmdInitRealign

packages/cli/src/
  └── cli.ts                      # MODIFIED: Add 'drift' and 'init check-drift'/'init realign' dispatch

packages/cli/src/core/
  └── index.ts                    # MODIFIED: Export new drift functions
  └── types.ts                    # MODIFIED: Add DriftReport, DriftItem, CheckDriftContext types
  └── frontmatter.ts              # MODIFIED: Add 'drift' to FRONTMATTER_SCHEMAS

templates/agents/
  ├── maxsim-drift-checker.md     # NEW: Drift analysis agent
  └── AGENTS.md                   # MODIFIED: Add drift-checker to system map

templates/commands/maxsim/
  ├── check-drift.md              # NEW: /maxsim:check-drift command
  └── realign.md                  # NEW: /maxsim:realign command

templates/workflows/
  ├── check-drift.md              # NEW: Drift check orchestration
  └── realign.md                  # NEW: Realignment orchestration
```

### Anti-Patterns to Avoid

1. **DO NOT** make the drift-checker agent interactive. It should produce a complete report without user input. Interaction happens in the realign workflow, not during detection.
2. **DO NOT** store drift state in STATE.md. The DRIFT-REPORT.md is the single source of truth for drift status. STATE.md only records the decision that a drift check was run.
3. **DO NOT** make the realign command auto-apply changes without user confirmation. The CONTEXT.md explicitly requires item-by-item approval for realign-to-code.
4. **DO NOT** create separate report files per phase. One DRIFT-REPORT.md covers all phases. Phase-level detail is sections within the report.
5. **DO NOT** skip archived phases. The CONTEXT.md explicitly requires all milestones including archived.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | `extractFrontmatter()` / `spliceFrontmatter()` from `frontmatter.ts` | Already handles all edge cases, uses `yaml` npm package |
| Phase insertion | Custom roadmap manipulation | `cmdPhaseInsert()` from `phase.ts` | Handles decimal numbering, directory creation, ROADMAP.md update |
| Requirement checkbox toggling | Custom regex for `[x]` / `[ ]` | `cmdRequirementsMarkComplete()` from `milestone.ts` | Handles both checkbox and table formats |
| Roadmap phase extraction | Custom ROADMAP.md parser | `cmdRoadmapGetPhase()` / `cmdRoadmapAnalyze()` from `roadmap.ts` | Handles all phase numbering formats, success criteria extraction |
| Phase directory discovery | Custom directory walker | `findPhaseInternalAsync()` / `listSubDirsAsync()` from `core.ts` | Handles normalized phase names, archived phases |
| Context assembly for workflows | Manual file path construction | `cmdInitCheckDrift()` (new, but following `init.ts` pattern) | Consistent with all other workflows |
| Report file output | Direct `fs.writeFileSync` | CLI tool command `cmdDriftWriteReport()` that uses `writeOutput` pattern | Handles large file output via tmpfile pattern |
| Requirements extraction | Ad-hoc regex per run | CLI tool command `cmdDriftExtractRequirements()` | Parse once, cache as structured data for agent consumption |
| Agent system map in new agent | Copy-paste system map | Follow exact format from `maxsim-verifier.md` agent | Phase 3 standardized all agent system maps |
| Frontmatter schema validation | Custom validation logic | Add `drift` to `FRONTMATTER_SCHEMAS` in `frontmatter.ts` | Consistent with existing plan/summary/verification/review schemas |

---

## Common Pitfalls

### Pitfall 1: Agent Context Overload

**What goes wrong:** The drift-checker agent receives too much context (all spec files + all source files) and produces low-quality, incomplete analysis.

**Why:** MAXSIM projects can have 50+ phases, each with multiple plans and summaries. Loading everything at once exceeds useful context.

**How to avoid:** Structure the agent to work in passes. Pass 1: Read all spec files (REQUIREMENTS.md, ROADMAP.md, NO-GOS.md, STATE.md, CONVENTIONS.md). Pass 2: For each requirement, search the codebase for evidence of implementation using targeted grep/glob. Pass 3: Synthesize findings into the report.

**Warning signs:** Report has many "UNCERTAIN" items, or the agent truncates its output mid-report.

### Pitfall 2: False Positives on Convention Compliance

**What goes wrong:** Pattern-based convention checks flag legitimate code as violations.

**Why:** Conventions are often context-dependent. "Use async file I/O" applies in hot paths but not in startup code. A grep for `fs.readFileSync` would flag both.

**How to avoid:** Report convention compliance findings as info-level (never critical) with explicit confidence indicators. Include the actual code snippet so the user can judge.

**Warning signs:** High info_count relative to total items. User ignores convention findings.

### Pitfall 3: Stale Previous Report Comparison

**What goes wrong:** Diff tracking shows wrong `[NEW]`/`[RESOLVED]` labels because the previous report was from a different milestone or before major refactoring.

**Why:** The previous report hash comparison is purely textual -- it does not account for structural changes to the spec itself.

**How to avoid:** Store the previous report's `spec_files_checked` list and their modification timestamps in frontmatter. When spec files have changed, warn that diff tracking may be inaccurate. Include a `previous_report_date` field.

**Warning signs:** Many items showing as `[NEW]` when they are actually unchanged.

### Pitfall 4: Phase Explosion in Realign-to-Spec

**What goes wrong:** Realign-to-spec creates 15+ new phases for individual requirement gaps, making the roadmap unwieldy.

**Why:** Naive 1-gap-per-phase mapping without grouping.

**How to avoid:** Group gaps by requirement prefix (all DRIFT-* together) or by affected subsystem (shared file paths). Cap at 5 phases. If more than 5 groups exist, merge the smallest groups into a "Remaining Gaps" phase.

**Warning signs:** More than 5 phases being generated. Phases with only 1 item each.

### Pitfall 5: Realign-to-Code Skipping Important Files

**What goes wrong:** When updating `.planning/` to match code, the realign workflow only updates REQUIREMENTS.md but forgets to update ROADMAP.md success criteria, STATE.md decisions, or phase summaries.

**Why:** Multiple spec files can reference the same requirement. Updating one without the others creates internal spec inconsistency.

**How to avoid:** For each accepted realignment item, the workflow must identify ALL spec files that reference it and update all of them. The DRIFT-REPORT.md already includes spec file + section references -- use those as the update checklist.

**Warning signs:** Health check shows inconsistency warnings after realignment.

### Pitfall 6: Missing Tests Treated as Missing Implementation

**What goes wrong:** A fully implemented feature is flagged as "warning" because tests don't exist, making the report noisy.

**Why:** The CONTEXT.md says "implementation = source code + tests". This is correct but the severity should reflect reality -- missing tests is less severe than missing code.

**How to avoid:** Separate the assessment: feature code present + tests missing = warning (not critical). Feature code missing = critical. Both missing = critical. Tests present but feature code missing = warning (orphaned tests).

**Warning signs:** High warning count that is mostly "missing tests" rather than real implementation gaps.

### Pitfall 7: Archived Phase Regression Detection Too Noisy

**What goes wrong:** Checking archived phases generates many false alarms because archived features may have been intentionally superseded.

**Why:** Archived milestones may have been replaced by newer requirements in the current milestone.

**How to avoid:** When checking archived phases, cross-reference with current milestone requirements. If a current requirement explicitly supersedes an archived one, do not flag the archived one as regressed. Report archived regressions in a separate section with lower default severity (info unless no-go violation).

**Warning signs:** Large number of archived phase items in the report drowning out current-milestone drift.

---

## Code Examples

### Example 1: Drift Report Frontmatter Schema

```typescript
// In frontmatter.ts - add to FRONTMATTER_SCHEMAS
export const FRONTMATTER_SCHEMAS: Record<string, FrontmatterSchema> = {
  // ... existing schemas ...
  drift: {
    required: ['status', 'checked', 'total_items', 'critical_count', 'warning_count', 'info_count'],
  },
};
```

**Source:** Verified pattern from existing `FRONTMATTER_SCHEMAS` in `packages/cli/src/core/frontmatter.ts`.

### Example 2: Drift Report Types

```typescript
// In types.ts
export type DriftStatus = 'drift' | 'aligned';
export type DriftSeverity = 'critical' | 'warning' | 'info';
export type DriftDirection = 'spec_ahead' | 'code_ahead' | 'undocumented';
export type DriftItemStatus = 'NEW' | 'RESOLVED' | 'UNCHANGED';

export interface DriftReportFrontmatter {
  status: DriftStatus;
  checked: string;       // ISO timestamp
  previous_hash: string | null;
  previous_report_date: string | null;
  total_items: number;
  aligned_count: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  undocumented_count: number;
  spec_files_checked: string[];
}

export interface CheckDriftContext {
  drift_model: ModelResolution;
  commit_docs: boolean;
  has_planning: boolean;
  has_requirements: boolean;
  has_roadmap: boolean;
  has_nogos: boolean;
  has_conventions: boolean;
  has_previous_report: boolean;
  previous_report_path: string | null;
  spec_files: string[];
  phase_dirs: string[];
  archived_milestone_dirs: string[];
  state_path: string;
  requirements_path: string;
  roadmap_path: string;
  nogos_path: string | null;
  conventions_path: string | null;
  decisions_path: string | null;
  acceptance_criteria_path: string | null;
}
```

**Source:** Pattern derived from existing `ExecutePhaseContext`, `PlannerAgentContext` in `packages/cli/src/core/types.ts`.

### Example 3: CLI Dispatch Pattern for Drift Commands

```typescript
// In cli.ts - add to COMMANDS record
'drift': handleDrift,

// Handler following existing pattern from handleVerify, handleRoadmap
const handleDrift: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => CmdResult | Promise<CmdResult>> = {
    'read-report': () => cmdDriftReadReport(cwd),
    'extract-requirements': () => cmdDriftExtractRequirements(cwd),
    'extract-nogos': () => cmdDriftExtractNoGos(cwd),
    'extract-conventions': () => cmdDriftExtractConventions(cwd),
    'write-report': () => cmdDriftWriteReport(cwd, getFlag(args, '--content'), getFlag(args, '--content-file')),
    'previous-hash': () => cmdDriftPreviousHash(cwd),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handleResult(await handler(), raw);
  error('Unknown drift subcommand. Available: read-report, extract-requirements, extract-nogos, extract-conventions, write-report, previous-hash');
};
```

**Source:** Verified pattern from `handleVerify` handler in `cli.ts` lines 224-237.

### Example 4: Init Context for Check-Drift

```typescript
// In init.ts
export function cmdInitCheckDrift(cwd: string): CmdResult {
  const config = loadConfig(cwd);
  const driftModel = resolveModelInternal(config, 'maxsim-verifier'); // Reuse verifier model tier

  const reqPath = planningPath(cwd, 'REQUIREMENTS.md');
  const rmPath = planningPath(cwd, 'ROADMAP.md');
  const nogosPath = planningPath(cwd, 'NO-GOS.md');
  const convPath = planningPath(cwd, 'CONVENTIONS.md');
  const decisionsPath = planningPath(cwd, 'DECISIONS.md');
  const acPath = planningPath(cwd, 'ACCEPTANCE-CRITERIA.md');
  const driftReportPath = planningPath(cwd, 'DRIFT-REPORT.md');
  const statePath = statePathUtil(cwd);

  // Collect all phase directories (active + archived)
  const phaseDirs = listSubDirs(phasesPath(cwd));
  // ... collect archived dirs ...

  const ctx: CheckDriftContext = {
    drift_model: driftModel,
    commit_docs: config.commit_docs,
    has_planning: pathExistsInternal(planningPath(cwd)),
    has_requirements: pathExistsInternal(reqPath),
    has_roadmap: pathExistsInternal(rmPath),
    has_nogos: pathExistsInternal(nogosPath),
    has_conventions: pathExistsInternal(convPath),
    has_previous_report: pathExistsInternal(driftReportPath),
    // ... etc
  };
  return cmdOk(ctx);
}
```

**Source:** Pattern from `cmdInitVerifyWork` and `cmdInitPlanPhase` in `init.ts`.

### Example 5: Drift Report Markdown Structure

```markdown
---
status: drift
checked: "2026-03-07T14:30:00Z"
previous_hash: null
previous_report_date: null
total_items: 18
aligned_count: 12
critical_count: 2
warning_count: 3
info_count: 1
undocumented_count: 2
spec_files_checked:
  - REQUIREMENTS.md
  - NO-GOS.md
  - ROADMAP.md
  - STATE.md
---

# Drift Report

**Checked:** 2026-03-07 14:30 UTC
**Status:** DRIFT DETECTED
**Summary:** 12 aligned | 2 critical | 3 warning | 1 info | 2 undocumented

## Phase Overview

| Phase | Status | Aligned | Critical | Warning | Info |
|-------|--------|---------|----------|---------|------|
| 1. Context Rot Prevention | Aligned | 4/4 | 0 | 0 | 0 |
| 2. Deep Init Questioning | Drift | 3/4 | 1 | 0 | 0 |
| 3. Agent Coherence | Drift | 3/4 | 0 | 1 | 0 |
| 4. Spec Drift Management | N/A | 0/4 | 0 | 0 | 0 |

---

## Spec Ahead of Code

Items where spec says complete/required but code is missing or incomplete.

### CRITICAL

#### INIT-03: Agentic research step investigates tech stack choices [CRITICAL] [NEW]

**Spec:** REQUIREMENTS.md line 23 - marked `[x]` (complete)
**Code:** No research agent invocation found in init workflow
**Evidence:**
- Searched: `templates/workflows/new-project.md`, `templates/workflows/init-existing.md`
- Pattern: `maxsim-project-researcher` agent spawn
- Result: Not found in workflow steps
**Recommendation:** Either implement research step in init workflows or mark INIT-03 as incomplete in REQUIREMENTS.md

### WARNING

#### AGENT-03: Two-stage review runs automatically [WARNING] [NEW]

**Spec:** REQUIREMENTS.md line 29 - marked `[x]` (complete)
**Code:** Review enforcement exists in execute-phase workflow but may not cover quick tasks
**Evidence:**
- Found: `templates/workflows/execute-phase.md` contains spec-reviewer + code-reviewer spawning
- Missing: `templates/workflows/quick.md` does not spawn review agents
- Tests: No test file validates review enforcement
**Recommendation:** Verify quick workflow includes two-stage review or mark as partial

---

## Code Ahead of Spec

Features implemented in code but not captured in `.planning/`.

### UNDOCUMENTED

#### Dashboard MCP Server Integration [INFO] [NEW]

**Code:** `packages/cli/src/core/start.ts` implements MCP server startup
**Spec:** No requirement in REQUIREMENTS.md mentions MCP server
**Recommendation:** Add MCP server requirement to a future milestone or document as existing capability in PROJECT.md

---

## No-Go Violations

### CRITICAL

#### Sync file I/O in hot paths [CRITICAL]

**No-Go:** NO-GOS.md: "Sync file I/O in hot paths -- use async for all file operations in frequently-called code"
**Evidence:**
- `packages/cli/src/core/verify.ts` line 187: `fs.readFileSync(fullPath, 'utf-8')`
- `packages/cli/src/core/frontmatter.ts` line 144: `fs.readFileSync(fullPath, 'utf-8')`
**Recommendation:** Migrate to async versions in next refactoring phase

---

## Convention Compliance

### INFO

#### Error handling inconsistency [INFO] [confidence: LOW]

**Convention:** Mixed error handling patterns (exceptions vs CmdResult)
**Evidence:** 98 `any` type usages across 26 files (noted in PROJECT.md tech debt)
**Note:** This is documented tech debt, not new drift

---

## Diff Summary

First run -- no previous report to compare against.

| Category | New | Resolved | Unchanged |
|----------|-----|----------|-----------|
| Critical | 2 | - | - |
| Warning | 3 | - | - |
| Info | 1 | - | - |
| Undocumented | 2 | - | - |
```

**Source:** Format follows VERIFICATION.md pattern from `maxsim-verifier` agent output, extended with drift-specific sections per CONTEXT.md decisions.

### Example 6: Agent System Map Entry for Drift Checker

```markdown
---
name: maxsim-drift-checker
description: Compares .planning/ spec against codebase state, producing DRIFT-REPORT.md with severity-tiered findings and fix recommendations.
tools: Read, Write, Bash, Grep, Glob
color: yellow
needs: [requirements, roadmap, state, nogos, conventions, codebase_docs]
---

<agent_system_map>
## Agent System Map

| Agent | Role |
|-------|------|
| maxsim-executor | Implements plan tasks with atomic commits and deviation handling |
| ... (full 14-agent map) ... |
| maxsim-drift-checker | Compares spec against codebase, produces drift report |
</agent_system_map>
```

**Source:** Pattern from `maxsim-verifier.md` and `maxsim-codebase-mapper.md` agent frontmatter.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Manual spec review | AI-agent spec compliance checking | 2024-2025 | Specs are continuously verified, not just initial compliance |
| Deterministic regex matching for requirements | AI semantic analysis with evidence | 2025 | Can detect semantic equivalence ("user auth" = "login system"), not just keyword matches |
| Spec as documentation (write-once) | Spec as living contract (spec-driven development) | 2024-2025 (GitHub Spec Kit, Kiro) | Specs evolve with code, drift is actively detected |
| Single-direction drift (spec->code only) | Bidirectional drift (spec->code + code->spec) | 2025 (MAXSIM innovation) | Captures undocumented features, not just missing implementations |
| Monolithic analysis pass | Multi-pass agent analysis (spec read -> targeted search -> synthesis) | 2025 | Better accuracy, less context overload |

---

## Open Questions

### What We Know
- MAXSIM's existing CLI tools router pattern supports all needed operations
- The three-layer architecture (command -> workflow -> agent) handles this workflow naturally
- Existing functions for roadmap analysis, phase management, and frontmatter CRUD provide the foundation
- Phase 3's agent coherence work provides the agent prompt template (system map, upstream/downstream, input validation)

### What's Unclear
- **Exact model tier for drift-checker:** Should it use the verifier model tier or get its own entry in MODEL_PROFILES? Recommendation: Start with `maxsim-verifier` tier (same analysis-heavy profile), add dedicated tier later if needed.
- **Report size limit:** For projects with 100+ requirements, the DRIFT-REPORT.md could be very large. Should there be pagination or a summary-only mode? Recommendation: No pagination for v1. The report is a reference document, not interactive output.
- **Archived phase access:** The `getArchivedPhaseDirs` function exists in core but the `cmdGetArchivedPhase` CLI command may not be fully wired. Need to verify during implementation. Recommendation: Verify and wire if needed as part of drift tool commands.

---

## Phase Requirements Mapping

| Requirement | Research Support |
|------------|-----------------|
| DRIFT-01 | Architecture patterns 1-5, Code examples 1-5: Full command/workflow/agent chain for `/maxsim:check-drift` |
| DRIFT-02 | Code example 5 (report format), Pitfalls 1/2/6: Report structure with severity tiers and evidence |
| DRIFT-03 | Architecture pattern 6, Pitfall 5: Realign-to-code with item-by-item approval and multi-file update |
| DRIFT-04 | Architecture pattern 6, Pitfall 4: Realign-to-spec with phase insertion and gap grouping |

---

## Sources

### Primary (HIGH Confidence)
- MAXSIM codebase: `packages/cli/src/core/frontmatter.ts` -- YAML frontmatter parsing patterns
- MAXSIM codebase: `packages/cli/src/core/init.ts` -- Init context assembly pattern
- MAXSIM codebase: `packages/cli/src/core/verify.ts` -- Verification result interfaces
- MAXSIM codebase: `packages/cli/src/core/roadmap.ts` -- Roadmap analysis and phase extraction
- MAXSIM codebase: `packages/cli/src/core/phase.ts` -- Phase insert/complete lifecycle
- MAXSIM codebase: `packages/cli/src/cli.ts` -- CLI dispatch pattern (COMMANDS record)
- MAXSIM codebase: `templates/agents/maxsim-verifier.md` -- Agent prompt structure
- MAXSIM codebase: `templates/agents/maxsim-codebase-mapper.md` -- Agent direct-write pattern
- MAXSIM codebase: `templates/commands/maxsim/map-codebase.md` -- Command structure
- MAXSIM codebase: `templates/workflows/map-codebase.md` -- Workflow orchestration pattern

### Secondary (MEDIUM Confidence)
- [GitHub Spec Kit](https://github.com/github/spec-kit) -- SDD toolkit patterns for spec-code compliance
- [Kiro spec-driven development](https://kiro.dev/docs/specs/) -- Specification lifecycle management
- [Martin Fowler: SDD Tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) -- Comparison of SDD approaches
- [MADR: YAML front matter for metadata](https://adr.github.io/madr/decisions/0013-use-yaml-front-matter-for-meta-data.html) -- Architecture decision record format

### Tertiary (LOW Confidence)
- [DEV Community: Preventing AI agent drift](https://dev.to/singhdevhub/how-we-prevent-ai-agents-drift-code-slop-generation-2eb7) -- Community patterns for drift prevention
- [IBM: Agentic drift](https://www.ibm.com/think/insights/agentic-drift-hidden-risk-degrades-ai-agent-performance) -- Agent behavior drift (related but different from spec drift)

---

## Metadata

| Area | Confidence | Reason |
|------|------------|--------|
| Standard Stack | HIGH | All dependencies already exist in MAXSIM. No new npm packages needed. |
| Architecture Patterns | HIGH | Every pattern verified against existing MAXSIM codebase. Same patterns used by 35+ commands. |
| Report Format | HIGH | YAML frontmatter + markdown is MAXSIM's standard output format. Drift schema follows existing schemas. |
| Agent Design | HIGH | Agent prompt structure standardized in Phase 3. Drift-checker follows same template. |
| Pitfalls | MEDIUM | Based on analysis of codebase patterns and SDD ecosystem. Some pitfalls (e.g., archived phase noise) are predictive, not experienced. |
| Realignment Workflow | MEDIUM | Phase insertion and requirement marking are verified. Interactive approval UX is designed but untested. |
| CLI Tool Commands | HIGH | Dispatch pattern is well-established. New drift module follows same structure as verify, roadmap modules. |

**Research date:** 2026-03-07
**Valid until:** Until MAXSIM architecture fundamentally changes (likely valid for entire v5.0 milestone)
