# Phase 5: Workflow Coverage - Research

**Researched:** 2026-03-07
**Domain:** Discussion triage workflow + pagination for phase listing
**Confidence:** HIGH

---

## User Constraints

Copied verbatim from 05-CONTEXT.md:

### Locked Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discussion entry point | Single `/maxsim:discuss` command | Less commands, more intelligence under the hood |
| Triage confirmation | Always confirm routing | No surprise filings or roadmap changes |
| Discussion depth | Adaptive (2-3 questions, expand if complex) | Matches item complexity, no wasted time |
| Post-triage action | File and offer next action | User stays in control of what happens next |
| Phase creation from discuss | Recommend with preview, user confirms | Transparent roadmap changes |
| Existing todo handling | Both new and existing items | One command covers all discussion needs |
| Pagination scope | MCP tool + roadmap + metrics table | Consistent behavior everywhere |
| Page size | 20 phases | Balanced scanning without overwhelming |
| Roadmap pagination UX | Auto-collapse completed + paginate remaining | Natural compression plus explicit paging |

### Deferred Ideas

None surfaced during discussion.

---

## Summary

Phase 5 fills two verified workflow gaps: **FLOW-01** (a unified `/maxsim:discuss` command for triage) and **FLOW-02** (pagination for phase listing). Both features are pure additions -- they add new markdown templates and extend existing TypeScript modules without modifying any existing command interfaces.

**FLOW-01** is a new command + workflow pair (`discuss.md` command, `discuss.md` workflow) that triages user-described problems/ideas into the right size. It reuses existing patterns from `discuss-phase.md` (AskUserQuestion-based adaptive questioning, thinking-partner behaviors) and `add-todo.md` (todo creation, area inference, duplicate detection). The key architectural insight is that this command is a *superset router* -- it uses triage logic to dispatch to existing todo creation tools or phase creation tools, rather than reimplementing those capabilities. The workflow ends by offering next actions (`/maxsim:quick`, `/maxsim:plan-phase`, save for later).

**FLOW-02** is a set of targeted changes to existing code: adding `offset`/`limit` parameters to the `mcp_list_phases` MCP tool (which already exists but lacks pagination), enhancing the `roadmap.md` workflow to auto-collapse completed phases and paginate at 20/page, and paginating the metrics table display in STATE.md-related workflows. The `PhasesListOptions` type and `cmdPhasesList` function already support `offset` and `limit` parameters in the TypeScript core -- the MCP tool just needs to expose them. The roadmap workflow is pure markdown so pagination logic lives in the workflow instructions, not in TypeScript.

**Primary recommendation:** Implement as 2-3 plans: one plan for the discuss command/workflow (FLOW-01), one plan for MCP pagination + roadmap workflow enhancement (FLOW-02), optionally split if the roadmap workflow changes warrant their own plan.

---

## Standard Stack

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| `@modelcontextprotocol/sdk` | ^1.27.1 | MCP server + tool registration | Already used for all MCP tools |
| `zod` | ^3.25.0 | MCP tool parameter validation | Already used in all MCP tool files |
| `escape-string-regexp` | ^5.0.0 | Safe regex construction | Already used in state.ts |

### Templates (Markdown Only)

| Asset | Location | Purpose |
|-------|----------|---------|
| Command spec | `templates/commands/maxsim/discuss.md` | New command entry point |
| Workflow | `templates/workflows/discuss.md` | New discussion + triage workflow |
| Updated workflow | `templates/workflows/roadmap.md` | Pagination + auto-collapse |

### No New Dependencies Required

Both features use only existing libraries. FLOW-01 is a markdown-only command + workflow. FLOW-02 extends existing TypeScript functions and MCP tools with parameters that are already typed but not wired up.

---

## Architecture Patterns

### Pattern 1: Command-Workflow-Agent Triad

Every MAXSIM command follows this structure (verified from all 37 existing command files):

```
templates/commands/maxsim/{name}.md  -- Command spec with frontmatter
  references @./workflows/{name}.md  -- Workflow implementation
  may reference @./references/*.md   -- Shared behavior references
```

**For FLOW-01:** Create `discuss.md` command + `discuss.md` workflow following this pattern exactly. The command spec defines the user-facing interface (frontmatter with `name`, `description`, `argument-hint`, `allowed-tools`), the workflow contains the step-by-step process.

Source: All 37 command files in `templates/commands/maxsim/` follow this pattern.

### Pattern 2: AskUserQuestion-Driven Discussion Flow

Discussion workflows use `AskUserQuestion` for ALL user interaction. The flow follows a consistent loop pattern (verified from `discuss-phase.md` and `add-todo.md` workflows):

```
1. Initialize context (via maxsim-tools init command)
2. Present choices via AskUserQuestion
3. Process user selection
4. Loop with more questions or advance
5. Write output file
6. Offer next actions
7. Git commit
```

**For FLOW-01:** The triage step is a new variant of step 2 -- instead of gray area selection, it presents size classification (quick todo vs phase). Follow the same AskUserQuestion pattern with `header`, `question`, `options` structure.

Source: `templates/workflows/discuss-phase.md` lines 19-37 (tool_mandate), `templates/workflows/add-todo.md` lines 46-95 (discussion_mode).

### Pattern 3: CLI Tools Router Dispatch

The CLI router in `cli.ts` uses a hierarchical handler pattern:

```typescript
const handlePhases: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  if (sub === 'list') {
    const f = getFlags(args, 'type', 'phase', 'offset', 'limit');
    handleResult(await cmdPhasesList(cwd, { ... }), raw);
  }
};
```

**For FLOW-02:** The CLI handler for `phases list` already parses `--offset` and `--limit` flags and passes them to `cmdPhasesList`. The `PhasesListOptions` type already has `offset?: number` and `limit?: number`. The core function already applies pagination. Only the MCP tool needs updating.

Source: `packages/cli/src/cli.ts` lines 247-261 (handlePhases), `packages/cli/src/core/types.ts` lines 497-503 (PhasesListOptions), `packages/cli/src/core/phase.ts` lines 382-453 (cmdPhasesList).

### Pattern 4: MCP Tool Registration

MCP tools follow this exact pattern (verified from all 6 tool files):

```typescript
server.tool(
  'mcp_tool_name',
  'Description of what the tool does.',
  { param: z.string().describe('...') },
  async ({ param }) => {
    try {
      const cwd = detectProjectRoot();
      if (!cwd) return mcpError('No .planning/ directory found', 'Project not detected');
      // ... business logic ...
      return mcpSuccess({ data }, 'Summary');
    } catch (e) {
      return mcpError((e as Error).message, 'Operation failed');
    }
  },
);
```

**For FLOW-02:** Add `offset` and `limit` as optional Zod parameters to `mcp_list_phases`, apply them via `.slice(start, start + limit)` in the tool handler. Return `total_count` in the response.

Source: `packages/cli/src/mcp/phase-tools.ts` lines 78-122 (mcp_list_phases).

### Pattern 5: Roadmap Workflow Display

The roadmap workflow (`templates/workflows/roadmap.md`) is a 3-step read-only process:

```
1. check_planning -- sanity check
2. analyze -- call `roadmap analyze` tool, parse JSON
3. render -- format output with icons and alignment
```

**For FLOW-02:** Extend step 3 (render) to:
- Auto-collapse completed phases (one-liner with checkmark)
- Paginate remaining phases at 20/page
- Show footer: "Showing phases 1-20 of 53. Use --page 2 for next."

This is a markdown-only change to the workflow instructions. No TypeScript changes needed for the roadmap command.

Source: `templates/workflows/roadmap.md` lines 1-82.

### Anti-Patterns to Avoid

1. **Do NOT create a new agent for the discuss command.** Discussion is orchestrated by the workflow, not a subagent. It uses `AskUserQuestion` directly, same as `discuss-phase.md`.

2. **Do NOT duplicate todo creation logic.** The discuss workflow should call existing `maxsim-tools.cjs` commands (`init todos`, `generate-slug`, etc.) to create todos, not reimplement file writing.

3. **Do NOT duplicate phase creation logic.** Route to existing `phase add` command for phase creation. Show preview to user, get confirmation, then call the tool.

4. **Do NOT modify existing command interfaces.** GUARD-02 applies. `/maxsim:add-todo`, `/maxsim:add-phase`, `/maxsim:roadmap` keep their current behavior. New behavior goes in new commands or extends existing ones additively.

5. **Do NOT paginate by default when there are few phases.** Pagination should only engage when total > 20. Under 20 phases, show all (existing behavior).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Todo file creation | Custom file writer | `maxsim-tools.cjs` CLI commands (`init todos`, `generate-slug`, etc.) + write pattern from `add-todo.md` workflow | Consistency with existing todos, frontmatter format, area inference, duplicate detection |
| Phase creation | Custom ROADMAP.md editor | `maxsim-tools.cjs phase add` command | Already handles slug generation, directory creation, roadmap insertion |
| Phase listing pagination (core) | New pagination function | Existing `cmdPhasesList` with `offset`/`limit` params | Already implemented and tested in `phase.ts` |
| User interaction | Plain text questions | `AskUserQuestion` tool (or `mcp__maxsim-dashboard__ask_question` when dashboard active) | Mandatory pattern per `tool_mandate` in all discussion workflows |
| Existing todo search | Custom file scanner | `maxsim-tools.cjs init todos` (returns full todo list with metadata) | Already parses frontmatter, returns structured JSON |
| Slug generation | Custom slugify | `maxsim-tools.cjs generate-slug` | Already uses `slugify` library, tested |
| Git commits | Raw `git add`/`git commit` | `maxsim-tools.cjs commit` | Handles `commit_docs` config, gitignore, atomic commits |
| MCP response formatting | Custom JSON | `mcpSuccess()`/`mcpError()` from `mcp/utils.ts` | Consistent MCP response structure |

---

## Common Pitfalls

### Pitfall 1: Breaking Existing Command Interfaces (GUARD-02)

**What goes wrong:** Adding the new `/maxsim:discuss` command accidentally modifies the behavior of `/maxsim:add-todo` or `/maxsim:discuss-phase`.

**Why it happens:** The discuss command routes to todo creation and phase creation, and developers may be tempted to merge logic.

**How to avoid:** The discuss command is a NEW file (`discuss.md`), its workflow is a NEW file (`discuss.md`). It CALLS existing tools for creating todos and phases. It never modifies existing workflow files.

**Warning signs:** Any diff that touches `templates/commands/maxsim/add-todo.md`, `templates/workflows/add-todo.md`, `templates/commands/maxsim/discuss-phase.md`, or `templates/workflows/discuss-phase.md`.

### Pitfall 2: Discuss Workflow Scope Confusion with discuss-phase

**What goes wrong:** The new `/maxsim:discuss` command gets confused with the existing `/maxsim:discuss-phase` command. They serve different purposes.

**Why it happens:** Similar naming. `discuss-phase` gathers implementation decisions for a KNOWN phase. `discuss` triages an UNKNOWN problem into the right size.

**How to avoid:** Clear documentation in the command spec's `<objective>` section explaining the distinction. The discuss command's description should say "Triage a problem or idea into the right size" not "Discuss implementation details."

**Warning signs:** The discuss workflow asking about gray areas or implementation decisions (that's discuss-phase's job).

### Pitfall 3: Pagination Not Returned in MCP Response Total Count

**What goes wrong:** MCP tool returns paginated results but clients cannot determine if there are more pages because `total_count` is missing.

**Why it happens:** The existing `mcp_list_phases` returns `{ directories, count }` without total. When pagination is added, `count` becomes the page size, not the total.

**How to avoid:** Always return `{ directories, count, total_count, offset, limit, has_more }` from the paginated MCP tool. The core `cmdPhasesList` already returns `{ directories, count, total }` -- just pass `total` through as `total_count`.

**Warning signs:** MCP response has `count` equal to page size but no way to know total.

### Pitfall 4: Auto-Collapse Breaking Phase Number Alignment

**What goes wrong:** When completed phases are collapsed to one-liners, the visual alignment of phase numbers and status labels breaks.

**Why it happens:** Collapsed one-liners have different widths than expanded entries.

**How to avoid:** Use two distinct visual sections: "Completed" section with collapsed one-liners (no alignment needed), then "Active & Upcoming" section with full detail and aligned status labels.

**Warning signs:** Inconsistent column alignment in roadmap output, mixing collapsed and expanded formats in the same visual block.

### Pitfall 5: Not Confirming Triage Routing

**What goes wrong:** The discuss command routes to todo creation or phase creation without user confirmation, violating the locked "Always confirm routing" decision.

**Why it happens:** Developer shortcuts the flow for "obvious" cases.

**How to avoid:** Every routing decision MUST go through AskUserQuestion with explicit options: "This sounds like a quick bug fix -- add as todo?" with options "Yes, add todo" / "No, this is bigger" / "Let me explain more". NEVER auto-route.

**Warning signs:** Any code path from triage to filing that doesn't pass through AskUserQuestion.

### Pitfall 6: Roadmap Workflow Not Detecting Phase Count Before Pagination

**What goes wrong:** Pagination logic activates even when there are only 5 phases, adding unnecessary "Page 1 of 1" footers.

**Why it happens:** Pagination is always-on without a threshold check.

**How to avoid:** Only paginate when `phases.length > 20`. Under 20, show all phases (current behavior). The auto-collapse of completed phases happens regardless of count (it's always useful), but the page footer only appears when there would be multiple pages.

**Warning signs:** "Showing phases 1-5 of 5" footer appearing on small projects.

### Pitfall 7: Discuss Command Not Handling Existing Todo Reference

**What goes wrong:** User invokes `/maxsim:discuss some-todo-title` expecting it to load the existing todo, but the command treats it as a new problem description.

**Why it happens:** Missing existing-todo detection logic.

**How to avoid:** In the workflow, after getting user input, search pending todos for title matches. If found, load the todo context and ask: "Found existing todo: [title]. Want to discuss this one?" If no match, proceed as new item.

**Warning signs:** User references an existing todo and the system creates a duplicate.

---

## Code Examples

### Example 1: MCP Tool with Pagination Parameters

This is the pattern to follow for adding offset/limit to `mcp_list_phases`. Derived from the existing tool in `packages/cli/src/mcp/phase-tools.ts`:

```typescript
// In packages/cli/src/mcp/phase-tools.ts
server.tool(
  'mcp_list_phases',
  'List phase directories with pagination. Returns sorted phases with offset/limit support.',
  {
    include_archived: z.boolean().optional().default(false)
      .describe('Include archived phases from completed milestones'),
    offset: z.number().optional().default(0)
      .describe('Number of phases to skip (for pagination)'),
    limit: z.number().optional().default(20)
      .describe('Maximum number of phases to return'),
  },
  async ({ include_archived, offset, limit }) => {
    try {
      const cwd = detectProjectRoot();
      if (!cwd) return mcpError('No .planning/ directory found', 'Project not detected');

      const phasesDir = phasesPath(cwd);
      if (!fs.existsSync(phasesDir)) {
        return mcpSuccess(
          { directories: [], count: 0, total_count: 0, offset, limit, has_more: false },
          'No phases directory found',
        );
      }

      let dirs = listSubDirs(phasesDir);
      if (include_archived) {
        const archived = getArchivedPhaseDirs(cwd);
        for (const a of archived) dirs.push(`${a.name} [${a.milestone}]`);
      }
      dirs.sort((a, b) => comparePhaseNum(a, b));

      const total_count = dirs.length;
      const paginated = dirs.slice(offset, offset + limit);
      const has_more = offset + limit < total_count;

      return mcpSuccess(
        { directories: paginated, count: paginated.length, total_count, offset, limit, has_more },
        `Showing ${paginated.length} of ${total_count} phase(s)`,
      );
    } catch (e) {
      return mcpError((e as Error).message, 'Operation failed');
    }
  },
);
```

Source: Derived from existing `mcp_list_phases` in `packages/cli/src/mcp/phase-tools.ts` lines 78-122.

### Example 2: Discuss Command Frontmatter

Following the pattern from all existing command specs:

```markdown
---
name: maxsim:discuss
description: Triage a problem, idea, or bug into the right size -- todo, quick task, or phase
argument-hint: "[description or todo reference]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
```

Source: Pattern from `templates/commands/maxsim/add-todo.md`, `discuss-phase.md`, `quick.md`.

### Example 3: Triage via AskUserQuestion

Following the existing AskUserQuestion pattern from `discuss-phase.md`:

```
After gathering user's description and asking 2-3 clarifying questions:

AskUserQuestion(
  header: "Size",
  question: "Based on what you've described, this looks like [assessment]. Does this match?",
  options:
    - "Quick fix (todo)" -- File as todo, work on it with /maxsim:quick
    - "Needs a phase" -- Too big for a todo, add to roadmap
    - "Let me explain more" -- I need to give more context
)
```

Source: Pattern from `templates/workflows/discuss-phase.md` lines 239-287 (present_gray_areas step).

### Example 4: Roadmap Auto-Collapse for Completed Phases

Enhancement to the roadmap workflow render step:

```
For each phase in `phases[]`:
  If disk_status === 'complete':
    Render collapsed one-liner: "  ✓  Phase {number}: {name}"
  Else:
    Render full detail line: "  {icon}  Phase {number}: {name}    {label}  ({summary_count}/{plan_count} plans)"

After rendering all phases, if total_phases > 20:
  Show footer: "Showing phases {first}-{last} of {total}. Use --page N for next."
```

Source: Extension of existing render step in `templates/workflows/roadmap.md` lines 36-72.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|-----------------|-------------|--------|
| User picks between add-todo, add-phase, discuss-phase | Single /maxsim:discuss triages automatically | Phase 5 (this phase) | Fewer commands to remember, smarter routing |
| All phases listed regardless of count | Auto-collapse completed + paginate at 20 | Phase 5 (this phase) | Usable roadmap for 50+ phase projects |
| MCP list_phases returns all phases | MCP list_phases supports offset/limit with total_count | Phase 5 (this phase) | Scalable for large projects |
| No connection between todo discussion and phase creation | Discuss command can route to either | Phase 5 (this phase) | Seamless workflow from idea to action |

---

## Open Questions

### What We Know

- The `cmdPhasesList` core function already supports `offset`/`limit` parameters (verified in `phase.ts` lines 382-453)
- The CLI handler already parses `--offset`/`--limit` flags (verified in `cli.ts` lines 247-261)
- The MCP tool `mcp_list_phases` does NOT have offset/limit parameters yet (verified in `phase-tools.ts` lines 78-122)
- The roadmap workflow is pure markdown with no TypeScript dependencies (verified in `roadmap.md`)
- The discuss-phase workflow provides the most complete template for discussion-based workflows (687 lines of tested pattern)

### What's Unclear

- **Metrics table pagination location:** The CONTEXT.md says "performance metrics table in STATE.md" should be paginated at 20 items. However, the metrics table is rendered inline in STATE.md by `cmdStateRecordMetric` and displayed by `state-tools.ts`. Pagination here means the progress command should truncate display, not that STATE.md itself should store only 20 rows. **Recommendation:** Implement as display-time truncation in the `progress.md` workflow, showing last 20 metrics by default. STATE.md keeps all metrics (it's the source of truth).

### Recommendation

No blocking open questions. The metrics pagination is a display concern best handled in the workflow, consistent with how roadmap pagination is handled.

---

## Sources

### Primary (HIGH Confidence)

- `packages/cli/src/mcp/phase-tools.ts` -- Existing MCP tool implementation for `mcp_list_phases` (verified by reading source)
- `packages/cli/src/core/phase.ts` -- `cmdPhasesList` with existing offset/limit support (verified by reading source)
- `packages/cli/src/core/types.ts` -- `PhasesListOptions` type with offset/limit fields (verified at lines 497-503)
- `packages/cli/src/cli.ts` -- CLI handler with `--offset`/`--limit` flag parsing (verified at lines 247-261)
- `templates/workflows/discuss-phase.md` -- Discuss workflow pattern (verified by reading 687-line workflow)
- `templates/workflows/add-todo.md` -- Todo creation workflow pattern (verified by reading source)
- `templates/workflows/roadmap.md` -- Roadmap display workflow (verified by reading source)
- `templates/workflows/check-todos.md` -- Todo listing + brainstorm pattern (verified by reading source)
- `templates/references/thinking-partner.md` -- Thinking partner behaviors reference (verified by reading source)
- `packages/cli/src/mcp/utils.ts` -- MCP utility functions (verified by reading source)

### Secondary (MEDIUM Confidence)

- `@modelcontextprotocol/sdk` ^1.27.1 documentation -- McpServer.tool() API signature (verified via package.json dependency)
- `zod` ^3.25.0 -- Schema validation patterns (verified via usage in existing MCP tools)

---

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Standard Stack | HIGH | No new dependencies; all libraries already in project and verified |
| Architecture Patterns | HIGH | All patterns verified by reading source files directly |
| Don't Hand-Roll | HIGH | All "Use Instead" solutions verified to exist in codebase |
| Common Pitfalls | HIGH | Derived from codebase analysis + CONTEXT.md locked decisions |
| MCP Pagination | HIGH | Core function already supports it; MCP tool just needs param exposure |
| Discuss Workflow | HIGH | Pattern matches established discuss-phase + add-todo workflows |
| Metrics Pagination | MEDIUM | Implementation approach is clear but exact display location needs planner decision |

**Research date:** 2026-03-07
**Valid until:** Indefinite (no external dependency changes expected)
