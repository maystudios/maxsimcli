<purpose>
Capture an idea, task, or issue that surfaces during a MAXSIM session as a structured todo for later work. Enables "thought → capture → continue" flow without losing context.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@./references/dashboard-bridge.md
@./references/thinking-partner.md
</required_reading>

<process>

<step name="init_context">
Load todo context:

```bash
INIT=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs init todos)
```

Extract from init JSON: `commit_docs`, `date`, `timestamp`, `todo_count`, `todos`, `pending_dir`, `todos_dir_exists`.

Ensure directories exist:
```bash
mkdir -p .planning/todos/pending .planning/todos/done
```

Note existing areas from the todos array for consistency in infer_area step.
</step>

<step name="extract_content">
**With arguments:** Use as the title/focus.
- `/maxsim:add-todo Add auth token refresh` → title = "Add auth token refresh"

**Without arguments:** Analyze recent conversation to extract:
- The specific problem, idea, or task discussed
- Relevant file paths mentioned
- Technical details (error messages, line numbers, constraints)

Formulate:
- `title`: 3-10 word descriptive title (action verb preferred)
- `problem`: What's wrong or why this is needed
- `solution`: Approach hints or "TBD" if just an idea
- `files`: Relevant paths with line numbers from conversation
</step>

<step name="discussion_mode">
**Discussion mode triggers:**

1. `--discuss` flag is present in $ARGUMENTS
2. Complexity detected: title contains "refactor", "redesign", "migrate", "architecture", or problem description exceeds 3 sentences

**If neither trigger:** Skip to infer_area (quick-add path).

**If discussion mode activated:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MAXSIM ► TODO DISCUSSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Apply thinking-partner behaviors to clarify the todo before filing:

**Round 1 — Scope clarification (2-3 questions):**

Use AskUserQuestion to probe:
- What exactly is the problem? (Challenge vagueness)
- What does "done" look like for this? (Make abstract concrete)
- Is this one thing or multiple things? (Surface hidden scope)

**Round 2 — Approach exploration (2-3 questions):**

Use AskUserQuestion to explore:
- What approaches have you considered? (Propose alternatives with trade-offs)
- What constraints exist? (Surface unstated assumptions)
- What could go wrong? (Make consequences visible)

**Round 3 — Readiness check:**

Use AskUserQuestion:
- header: "Todo"
- question: "Ready to file this todo?"
- options:
  - "File it" -- Capture what we discussed
  - "Keep discussing" -- I want to explore more
  - "Split into multiple" -- This is actually several todos

If "Keep discussing": ask 2-3 more probing questions, then check again.
If "Split into multiple": help user define 2-3 separate todos, file each one.
If "File it": continue to infer_area.

**Discussion mode enriches the todo file** — the Problem section includes discussion insights, and a new "## Approach" section captures approach decisions (replacing "## Solution" with richer content).

**Time budget:** 20-30 minutes max. After 6 rounds of questions, offer to file what you have.
</step>

<step name="infer_area">
Infer area from file paths:

| Path pattern | Area |
|--------------|------|
| `src/api/*`, `api/*` | `api` |
| `src/components/*`, `src/ui/*` | `ui` |
| `src/auth/*`, `auth/*` | `auth` |
| `src/db/*`, `database/*` | `database` |
| `tests/*`, `__tests__/*` | `testing` |
| `docs/*` | `docs` |
| `.planning/*` | `planning` |
| `scripts/*`, `bin/*` | `tooling` |
| No files or unclear | `general` |

Use existing area from step 2 if similar match exists.
</step>

<step name="check_duplicates">
```bash
# Search for key words from title in existing todos
grep -l -i "[key words from title]" .planning/todos/pending/*.md 2>/dev/null
```

If potential duplicate found:
1. Read the existing todo
2. Compare scope

If overlapping, use AskUserQuestion:
- header: "Duplicate?"
- question: "Similar todo exists: [title]. What would you like to do?"
- options:
  - "Skip" — keep existing todo
  - "Replace" — update existing with new context
  - "Add anyway" — create as separate todo
</step>

<step name="create_file">
Use values from init context: `timestamp` and `date` are already available.

Generate slug for the title:
```bash
slug=$(node ~/.claude/maxsim/bin/maxsim-tools.cjs generate-slug "$title" --raw)
```

Write to `.planning/todos/pending/${date}-${slug}.md`:

**Quick mode format:**

```markdown
---
created: [timestamp]
title: [title]
area: [area]
mode: quick
files:
  - [file:lines]
---

## Problem

[problem description - enough context for future Claude to understand weeks later]

## Solution

[approach hints or "TBD"]
```

**Discussion mode format (enriched):**

```markdown
---
created: [timestamp]
title: [title]
area: [area]
mode: discussed
files:
  - [file:lines]
---

## Problem

[problem description enriched with discussion insights]

## Scope

[What's in scope and what's not — from discussion round 1]

## Approach

[Approach decisions with trade-offs explored — from discussion round 2]
[Include alternatives considered and why this approach was chosen]

## Risks

[What could go wrong — from discussion]

## Solution

[Concrete next steps or "TBD"]
```
</step>

<step name="update_state">
If `.planning/STATE.md` exists:

1. Use `todo_count` from init context (or re-run `init todos` if count changed)
2. Update "### Pending Todos" under "## Accumulated Context"
</step>

<step name="git_commit">
Commit the todo and any updated state:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: capture todo - [title]" --files .planning/todos/pending/[filename] .planning/STATE.md
```

Tool respects `commit_docs` config and gitignore automatically.

Confirm: "Committed: docs: capture todo - [title]"
</step>

<step name="confirm">
```
Todo saved: .planning/todos/pending/[filename]

  [title]
  Area: [area]
  Files: [count] referenced

---

Would you like to:

1. Continue with current work
2. Add another todo
3. View all todos (/maxsim:check-todos)
```
</step>

</process>

<success_criteria>
- [ ] Directory structure exists
- [ ] Todo file created with valid frontmatter
- [ ] Problem section has enough context for future Claude
- [ ] No duplicates (checked and resolved)
- [ ] Area consistent with existing todos
- [ ] STATE.md updated if exists
- [ ] Todo and state committed to git
</success_criteria>
