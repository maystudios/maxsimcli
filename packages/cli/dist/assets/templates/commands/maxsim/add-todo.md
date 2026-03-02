---
name: maxsim:add-todo
description: Capture idea or task as todo from current conversation context
argument-hint: [optional description]
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Capture an idea, task, or issue that surfaces during a MAXSIM session as a structured todo for later work.

**Modes:**
- **Quick mode (default):** Fast capture — extract, file, commit. Use when the todo is clear.
- **Discussion mode (`--discuss`):** Collaborative thinking for complex todos — clarify scope, surface assumptions, explore approach before filing. 20-30 min max.

Routes to the add-todo workflow which handles:
- Directory structure creation
- Content extraction from arguments or conversation
- Area inference from file paths
- Duplicate detection and resolution
- Discussion mode for complex todos (optional)
- Todo file creation with frontmatter
- STATE.md updates
- Git commits
</objective>

<execution_context>
@./workflows/add-todo.md
@./references/thinking-partner.md
</execution_context>

<context>
Arguments: $ARGUMENTS (optional todo description)

**Flags:**
- `--discuss` — Enter discussion mode for complex todos. Clarify scope and approach before filing.

State is resolved in-workflow via `init todos` and targeted reads.
</context>

<process>
**Follow the add-todo workflow** from `@./workflows/add-todo.md`.

The workflow handles all logic including:
1. Directory ensuring
2. Existing area checking
3. Content extraction (arguments or conversation)
4. Discussion mode (if `--discuss` flag or complexity detected)
5. Area inference
6. Duplicate checking
7. File creation with slug generation
8. STATE.md updates
9. Git commits
</process>
