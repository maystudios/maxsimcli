---
name: memory-management
description: Use when encountering recurring patterns, errors, or decisions that should persist across sessions — defines when and how to save to project memory
---

# Memory Management

Context dies with each session. Patterns discovered but not saved are patterns lost.

**If you encountered it twice, save it. You will encounter it again.**

## The Iron Law

<HARD-GATE>
RECURRING PATTERNS MUST BE PERSISTED.
If you have seen the same error, pattern, or decision twice in this session or across sessions, you MUST save it.
"I'll remember" is a lie — your context resets. Write it down.
Violating this rule guarantees repeated mistakes across sessions.
</HARD-GATE>

## When to Save

### Auto-Save Triggers (MUST save)

These situations require immediate memory persistence:

| Trigger | Threshold | What to Save |
|---------|-----------|-------------|
| Same error encountered | 2+ occurrences | Error pattern, root cause, fix |
| Same debugging path followed | 2+ times | The shortcut or solution |
| Architectural decision made | Once (if significant) | Decision, rationale, alternatives rejected |
| Non-obvious convention discovered | Once | The convention and where it applies |
| Workaround for tooling/framework quirk | Once | The quirk and the workaround |
| Project-specific pattern confirmed | 2+ uses | The pattern and when to apply it |

### Do NOT Save

- Session-specific context (current task details, in-progress work)
- Information already in CLAUDE.md or project documentation
- Speculative conclusions from reading a single file
- Temporary workarounds that will be removed
- Obvious patterns that any developer would know

## Where to Save

Memory files live in `.claude/memory/` (for Claude Code) or the equivalent runtime memory directory.

### File Organization

```
.claude/memory/
  MEMORY.md          # Index file — always loaded into context
  patterns.md        # Code patterns and conventions
  errors.md          # Error patterns and solutions
  architecture.md    # Architectural decisions and rationale
  tooling.md         # Tool quirks and workarounds
```

- **MEMORY.md** is the index: keep it under 200 lines, link to topic files for details
- Topic files hold detailed notes organized by subject
- Use headers and bullet points for scannability

### Memory Entry Format

Each entry should follow this structure:

```markdown
## [Short descriptive title]

**Context:** When this applies
**Pattern/Error:** What was observed
**Solution/Decision:** What to do about it
**Evidence:** How this was confirmed (dates, occurrences, test results)
```

## The Gate Function

When you encounter something worth remembering:

### 1. DETECT — Recognize the Pattern

- Is this the same error/pattern you saw before?
- Is this a decision that will affect future work?
- Is this a non-obvious convention or quirk?

### 2. CHECK — Avoid Duplicates

- Read the existing memory files first
- If the pattern is already documented, update it (don't duplicate)
- If it contradicts existing memory, investigate which is correct

### 3. WRITE — Persist the Memory

- Add to the appropriate topic file
- Update MEMORY.md index if adding a new topic
- Keep entries concise — future you needs the answer, not the journey

### 4. VERIFY — Confirm the Save

- Re-read the file to confirm the entry was written correctly
- Ensure the entry is actionable (someone reading it can act on it)

## Error Pattern Detection

When debugging, track errors in a mental tally:

```
Error seen once → Note it, move on
Error seen twice → Save to errors.md with pattern and fix
Error seen 3+ times → Save AND add to MEMORY.md index for immediate visibility
```

### What Makes a Good Error Memory

Good:
```markdown
## Vitest "cannot find module" for path aliases

**Context:** When running tests that import from `@maxsim/core`
**Error:** `Cannot find module '@maxsim/core/types'`
**Fix:** Add `resolve.alias` to `vitest.config.ts` matching tsconfig paths
**Evidence:** Hit 3 times across phases 01-03 (Feb 2026)
```

Bad:
```markdown
## Test error
There was an error with tests. Fixed it by changing config.
```

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "I'll remember this" | No you won't. Context resets. Write it down. |
| "It's too specific to save" | Specific is good. Generic memories are useless. |
| "Memory files are messy" | Organize them. Messy files > lost knowledge. |
| "This only applies to this project" | Project memory IS project-scoped. Save it. |
| "Someone else documented this" | If it's not in your memory files, you won't find it next session. |
| "I'll save it later" | You'll forget to. Save it now. |

## Red Flags — STOP If You Catch Yourself:

- Encountering the same error for the second time without saving it
- Making the same architectural decision you made in a previous session
- Debugging a problem you already solved before
- Saying "I think we fixed this before" without finding the memory entry
- Leaving a session without updating memory for patterns discovered

**If any red flag triggers: STOP. Write the memory entry NOW, before continuing.**

## Verification Checklist

Before ending a work session:

- [ ] All errors encountered 2+ times are saved to `errors.md`
- [ ] All significant decisions are saved to `architecture.md`
- [ ] All discovered patterns are saved to `patterns.md`
- [ ] MEMORY.md index is up to date
- [ ] No duplicate entries were created
- [ ] All entries follow the format (Context, Pattern, Solution, Evidence)

## Integration with MAXSIM

During plan execution, the executor and researcher agents load memory files at startup:
- **Executor:** Reads MEMORY.md to avoid known pitfalls before implementing
- **Researcher:** Saves findings to memory for future phases
- **Debugger:** Checks error memories before starting investigation — the fix may already be known

Memory persistence happens at natural breakpoints:
- After resolving a bug (save to errors.md)
- After completing a phase (save patterns discovered)
- After making an architectural decision (save to architecture.md)
- At checkpoints (save current understanding before context resets)
