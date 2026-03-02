---
name: maxsim:artefakte
description: View and manage project artefakte (decisions, acceptance criteria, no-gos)
argument-hint: "[decisions|acceptance-criteria|no-gos] [--phase <N>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
View and manage the three artefakte documents that capture project-level and phase-level decisions:

- **DECISIONS.md** — Architectural and design decisions with rationale
- **ACCEPTANCE-CRITERIA.md** — Measurable criteria that define "done"
- **NO-GOS.md** — Explicitly excluded scope items

Supports listing all artefakte, reading a specific type, and appending new entries. When `--phase N` is provided, operations are scoped to that phase's artefakte directory.

**CRITICAL — AskUserQuestion tool mandate:**
Every single question to the user MUST use the `AskUserQuestion` tool. NEVER ask questions as plain text in your response. This includes menu selection, entry input, continuation prompts, and any other user interaction. If you need the user's input, use `AskUserQuestion`. No exceptions.
</objective>

<context>
Arguments: $ARGUMENTS

Parse from arguments:
- **type**: first positional argument — one of `decisions`, `acceptance-criteria`, `no-gos` (optional)
- **--phase N**: scope to phase N artefakte (optional)
</context>

<process>
<step name="parse-arguments">
Parse `$ARGUMENTS` to extract:
- `type` — the first positional word if it matches `decisions`, `acceptance-criteria`, or `no-gos`
- `phase` — the value after `--phase` if present

Build the base command: `node ~/.claude/maxsim/bin/maxsim-tools.cjs`
If `--phase` is set, append `--phase <N>` to all CLI calls below.
</step>

<step name="route-by-arguments">
**If no type argument is provided**, go to Step 3 (overview).
**If a type argument is provided**, go to Step 4 (read specific).
</step>

<step name="overview">
Run via Bash:
```
node ~/.claude/maxsim/bin/maxsim-tools.cjs artefakte-list [--phase <N>]
```

Display the result as a formatted summary showing each artefakte file's existence status and entry count.

Then use `AskUserQuestion` to offer the user a choice:
- "View decisions"
- "View acceptance criteria"
- "View no-gos"
- "Add new entry"
- "Done"

Route based on selection:
- View → go to Step 4 with the selected type
- Add → go to Step 5
- Done → end
</step>

<step name="read-specific">
Run via Bash:
```
node ~/.claude/maxsim/bin/maxsim-tools.cjs artefakte-read <type> [--phase <N>]
```

Display the content in a clean, readable format. If the file doesn't exist yet, say so and offer to create the first entry.

Then use `AskUserQuestion` to offer:
- "Add entry to this artefakte"
- "View another artefakte"
- "Done"

Route based on selection:
- Add → go to Step 5 with the current type
- View another → use `AskUserQuestion` to pick which type, then repeat Step 4
- Done → end
</step>

<step name="add-entry">
If the artefakte type isn't known yet, use `AskUserQuestion` to ask:
- "Which artefakte? (decisions / acceptance-criteria / no-gos)"

Then use `AskUserQuestion` to get the entry text from the user:
- For **decisions**: "What decision should be recorded? (include rationale)"
- For **acceptance-criteria**: "What acceptance criterion should be added?"
- For **no-gos**: "What should be explicitly excluded from scope? (include reason)"

Run via Bash:
```
node ~/.claude/maxsim/bin/maxsim-tools.cjs artefakte-append <type> --entry "<text>" [--phase <N>]
```

Confirm the entry was added. Then commit the change:
```
node ~/.claude/maxsim/bin/maxsim-tools.cjs commit "docs: add <type> artefakte entry" --files .planning/
```

Use `AskUserQuestion` to offer:
- "Add another entry"
- "View artefakte"
- "Done"

Route accordingly — Add another loops back to the top of Step 5, View goes to Step 3, Done ends.
</step>
</process>

<success_criteria>
- Artefakte overview accurately shows file existence and entry counts
- Individual artefakte content is displayed clearly
- New entries are appended and committed
- Phase scoping works when --phase flag is provided
- User can navigate between view/add/done without confusion
</success_criteria>
