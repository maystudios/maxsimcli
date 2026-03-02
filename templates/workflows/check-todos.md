<purpose>
List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@./references/dashboard-bridge.md
</required_reading>

<process>

<step name="init_context">
Load todo context:

```bash
INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init todos)
```

Extract from init JSON: `todo_count`, `todos`, `pending_dir`.

If `todo_count` is 0:
```
No pending todos.

Todos are captured during work sessions with /maxsim:add-todo.

---

Would you like to:

1. Continue with current phase (/maxsim:progress)
2. Add a todo now (/maxsim:add-todo)
```

Exit.
</step>

<step name="parse_filter">
Check for area filter in arguments:
- `/maxsim:check-todos` → show all
- `/maxsim:check-todos api` → filter to area:api only
</step>

<step name="list_todos">
Use the `todos` array from init context (already filtered by area if specified).

Parse and display as numbered list:

```
Pending Todos:

1. Add auth token refresh (api, 2d ago)
2. Fix modal z-index issue (ui, 1d ago)
3. Refactor database connection pool (database, 5h ago)

---

Reply with a number to view details, or:
- `/maxsim:check-todos [area]` to filter by area
- `q` to exit
```

Format age as relative time from created timestamp.
</step>

<step name="handle_selection">
Wait for user to reply with a number.

If valid: load selected todo, proceed.
If invalid: "Invalid selection. Reply with a number (1-[N]) or `q` to exit."
</step>

<step name="load_context">
Read the todo file completely. Display:

```
## [title]

**Area:** [area]
**Created:** [date] ([relative time] ago)
**Files:** [list or "None"]

### Problem
[problem section content]

### Solution
[solution section content]
```

If `files` field has entries, read and briefly summarize each.
</step>

<step name="check_roadmap">
Check for roadmap (can use init progress or directly check file existence):

If `.planning/ROADMAP.md` exists:
1. Check if todo's area matches an upcoming phase
2. Check if todo's files overlap with a phase's scope
3. Note any match for action options
</step>

<step name="offer_actions">
**If todo maps to a roadmap phase:**

Use AskUserQuestion:
- header: "Action"
- question: "This todo relates to Phase [N]: [name]. What would you like to do?"
- options:
  - "Work on it now" — move to done, start working
  - "Add to phase plan" — include when planning Phase [N]
  - "Brainstorm approach" — think through before deciding
  - "Put it back" — return to list

**If no roadmap match:**

Use AskUserQuestion:
- header: "Action"
- question: "What would you like to do with this todo?"
- options:
  - "Work on it now" — move to done, start working
  - "Create a phase" — /maxsim:add-phase with this scope
  - "Brainstorm approach" — think through before deciding
  - "Put it back" — return to list
</step>

<step name="execute_action">
**Work on it now:**
```bash
mv ".planning/todos/pending/[filename]" ".planning/todos/done/"
```
Update STATE.md todo count. Present problem/solution context. Begin work or ask how to proceed.

**Add to phase plan:**
Note todo reference in phase planning notes. Keep in pending. Return to list or exit.

**Create a phase:**
Display: `/maxsim:add-phase [description from todo]`
Keep in pending. User runs command in fresh context.

**Brainstorm approach:**
Keep in pending. Enter structured thinking-partner discussion to clarify and enrich the todo.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MAXSIM ► TODO BRAINSTORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Apply thinking-partner behaviors from `@./references/thinking-partner.md` to explore the todo before deciding next steps.

**Round 1 — Problem clarity (2-3 questions):**

Use AskUserQuestion to probe:
- What exactly is the problem? (Challenge vagueness — if the todo description is abstract, push for specifics)
- What does "done" look like? (Make abstract concrete — what observable change marks completion?)
- Is this one thing or multiple? (Surface hidden scope — does this todo contain sub-tasks?)

Build on the todo's existing Problem and Solution sections. Quote specifics from the todo to ground the discussion.

**Round 2 — Approach exploration (2-3 questions):**

Use AskUserQuestion to explore:
- What approaches have you considered? (Propose 2-3 alternatives with trade-offs if the user has no strong opinion)
- What constraints exist? (Surface unstated assumptions — time, dependencies, tech debt, team knowledge)
- What could go wrong? (Make consequences visible — breaking changes, performance, migration risk)

Follow the thread from Round 1. React to the user's energy — if they are excited about an approach, dig into it. If uncertain, help narrow options.

**Round 3 — Readiness check:**

Use AskUserQuestion:
- header: "Todo"
- question: "Ready to refine this todo with what we discussed?"
- options:
  - "Refine todo" — Update with discussion insights
  - "Keep discussing" — Explore more
  - "Split into multiple" — This is actually several todos

If "Keep discussing": ask 2-3 more probing questions focusing on the most important open question, then check readiness again.
If "Split into multiple": help the user define 2-3 separate todos. For each, create a new todo file in `.planning/todos/pending/` using the enriched format below. Commit all new files.
If "Refine todo": continue to enrichment below.

**After discussion — enrich the todo file:**

Rewrite the selected todo's markdown file with enriched content:

```markdown
---
created: [preserve original]
title: [preserve or refine from discussion]
area: [preserve or update]
mode: discussed
files:
  - [preserve and add any new files surfaced]
---

## Problem

[Problem description enriched with discussion insights from Round 1]

## Scope

[What is in scope and out of scope — from Round 1 clarity questions]

## Approach

[Chosen approach with trade-offs explored — from Round 2]
[Include alternatives considered and why this approach was chosen]

## Risks

[What could go wrong — from Round 2 consequences discussion]

## Solution

[Concrete next steps or "TBD"]
```

Commit the updated todo:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: enrich todo after brainstorm - [title]" --files [todo-file-path] .planning/STATE.md
```

**Time budget:** 20-30 minutes max. After 6 rounds of questions, offer to file what you have.

**Put it back:**
Return to list_todos step.
</step>

<step name="update_state">
After any action that changes todo count:

Re-run `init todos` to get updated count, then update STATE.md "### Pending Todos" section if exists.
</step>

<step name="git_commit">
If todo was moved to done/, commit the change:

```bash
git rm --cached .planning/todos/pending/[filename] 2>/dev/null || true
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: start work on todo - [title]" --files .planning/todos/done/[filename] .planning/STATE.md
```

Tool respects `commit_docs` config and gitignore automatically.

Confirm: "Committed: docs: start work on todo - [title]"
</step>

</process>

<success_criteria>
- [ ] All pending todos listed with title, area, age
- [ ] Area filter applied if specified
- [ ] Selected todo's full context loaded
- [ ] Roadmap context checked for phase match
- [ ] Appropriate actions offered
- [ ] Selected action executed
- [ ] STATE.md updated if todo count changed
- [ ] Changes committed to git (if todo moved to done/)
</success_criteria>
