---
name: memory-management
description: "Persists recurring patterns, error solutions, and architectural decisions to project memory files for cross-session continuity. Use when encountering the same error twice, making significant decisions, or discovering non-obvious conventions."
---

# Memory Management

Context dies with each session. Patterns discovered but not saved are patterns lost.

**HARD GATE** -- If you encountered it twice, save it. You will encounter it again. "I'll remember" is a lie -- your context resets. Write it down. Violating this rule guarantees repeated mistakes across sessions.

## Process

### 1. Detect -- Recognize Save Triggers

Save immediately when any of these occur:

| Trigger | Threshold | What to Save |
|---------|-----------|-------------|
| Same error encountered | 2+ occurrences | Error pattern, root cause, fix |
| Same debugging path followed | 2+ times | The shortcut or solution |
| Architectural decision made | Once (if significant) | Decision, rationale, alternatives rejected |
| Non-obvious convention discovered | Once | The convention and where it applies |
| Workaround for tooling/framework quirk | Once | The quirk and the workaround |
| Project-specific pattern confirmed | 2+ uses | The pattern and when to apply it |

Do NOT save: session-specific context, information already in CLAUDE.md, speculative conclusions, temporary workarounds, or obvious patterns.

### 2. Check -- Avoid Duplicates

- Read existing memory files before writing
- If the pattern is already documented, update it (do not duplicate)
- If it contradicts existing memory, investigate which is correct

### 3. Write -- Persist the Memory

Add to the appropriate topic file using this entry format:

```markdown
## [Short descriptive title]

**Context:** When this applies
**Pattern/Error:** What was observed
**Solution/Decision:** What to do about it
**Evidence:** How this was confirmed (dates, occurrences, test results)
```

### 4. Verify -- Confirm the Save

- Re-read the file to confirm the entry was written correctly
- Ensure the entry is actionable (someone reading it can act on it immediately)

## File Organization

Memory files live in `.claude/memory/` (or the equivalent runtime memory directory).

```
.claude/memory/
  MEMORY.md          # Index file -- always loaded into context
  patterns.md        # Code patterns and conventions
  errors.md          # Error patterns and solutions
  architecture.md    # Architectural decisions and rationale
  tooling.md         # Tool quirks and workarounds
```

- **MEMORY.md** is the index: keep it under 200 lines, link to topic files for details
- Topic files hold detailed notes organized by subject
- Use headers and bullet points for scannability

## Error Escalation

```
Error seen once     -- Note it, move on
Error seen twice    -- Save to errors.md with pattern and fix
Error seen 3+ times -- Save AND add to MEMORY.md index for immediate visibility
```

## Common Pitfalls

- Encountering the same error a second time without saving it
- Making the same architectural decision you made in a previous session
- Debugging a problem you already solved before
- Saying "I think we fixed this before" without finding the memory entry
- Leaving a session without updating memory for patterns discovered

If any of these occur: stop, write the memory entry now, then continue.

## Verification

Before ending a work session:

- [ ] All errors encountered 2+ times are saved to `errors.md`
- [ ] All significant decisions are saved to `architecture.md`
- [ ] All discovered patterns are saved to `patterns.md`
- [ ] MEMORY.md index is up to date
- [ ] No duplicate entries were created
- [ ] All entries follow the format (Context, Pattern, Solution, Evidence)

## MAXSIM Integration

During plan execution, agents load memory files at startup:
- **Executor:** Reads MEMORY.md to avoid known pitfalls before implementing
- **Researcher:** Saves findings to memory for future phases
- **Debugger:** Checks error memories before starting investigation -- the fix may already be known

Memory persistence happens at natural breakpoints:
- After resolving a bug (save to errors.md)
- After completing a phase (save patterns discovered)
- After making an architectural decision (save to architecture.md)
- At checkpoints (save current understanding before context resets)
