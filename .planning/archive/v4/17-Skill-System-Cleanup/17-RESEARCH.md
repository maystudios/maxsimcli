# Phase 17: Skill System Cleanup - Research

**Researched:** 2026-03-03
**Domain:** MAXSIM Skill System (templates, metadata, registration, activation)
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

MAXSIM ships 11 skills in `templates/skills/`, but only 9 are registered in the `builtInSkills` array (`packages/cli/src/install/shared.ts`). The two missing skills (`sdd` and `batch-worktree`) are installed to user machines but are never cleaned up during install/uninstall cycles because they are not in the cleanup list. Several skills have overlapping purposes (code-review vs simplify, sdd vs the standard executor), and some activation descriptions are vague or misleading. The AGENTS.md registry only lists 9 of 11 skills. The `using-maxsim` skill duplicates the skill table from AGENTS.md, creating two places to maintain the same information.

**Primary recommendation:** Reconcile the `builtInSkills` array with actual template contents, clarify overlapping skill purposes in descriptions, and ensure AGENTS.md and `using-maxsim` skill tables stay in sync (or eliminate duplication).

## Standard Stack

Skills are pure markdown files with YAML frontmatter. There is no framework or library involved -- the "runtime" is Claude Code itself reading SKILL.md files.

| Component | Location | Purpose |
|-----------|----------|---------|
| Skill templates | `templates/skills/<name>/SKILL.md` | Source-of-truth skill definitions |
| Installed skills | `~/.claude/skills/<name>/SKILL.md` | User-facing installed copies |
| Built-in list | `packages/cli/src/install/shared.ts` | `builtInSkills` array for install/uninstall cleanup |
| Skills module | `packages/cli/src/core/skills.ts` | CLI commands: `skill-list`, `skill-install`, `skill-update` |
| Agent registry | `templates/agents/AGENTS.md` | Maps agents to skills they auto-load |
| CLI router | `packages/cli/src/cli.ts` | Routes `skill-*` subcommands |

## Current Skill Inventory

### Complete List (11 skills in templates/skills/)

| # | Directory Name | Frontmatter Name | alwaysApply | In builtInSkills? | In AGENTS.md? |
|---|---------------|-------------------|-------------|-------------------|---------------|
| 1 | `batch-worktree` | `batch-worktree` | No | **NO** | **NO** |
| 2 | `brainstorming` | `brainstorming` | No | Yes | Yes |
| 3 | `code-review` | `code-review` | No | Yes | Yes |
| 4 | `memory-management` | `memory-management` | No | Yes | Yes |
| 5 | `roadmap-writing` | `roadmap-writing` | No | Yes | Yes |
| 6 | `sdd` | `sdd` | No | **NO** | **NO** |
| 7 | `simplify` | `simplify` | No | Yes | Yes |
| 8 | `systematic-debugging` | `systematic-debugging` | No | Yes | Yes |
| 9 | `tdd` | `tdd` | No | Yes | Yes |
| 10 | `using-maxsim` | `using-maxsim` | **Yes** | Yes | Yes |
| 11 | `verification-before-completion` | `verification-before-completion` | No | Yes | Yes |

### Activation Descriptions (from frontmatter `description` field)

| Skill | Activation Description | Accurate? | Issue |
|-------|----------------------|-----------|-------|
| `batch-worktree` | "Use when parallelizing work across 5-30 independent units or orchestrating worktree-based parallel execution." | Mostly | Says "5-30" but the body says "3-30". Inconsistent threshold. |
| `brainstorming` | "Use when starting a significant feature, making architectural decisions, or choosing between design alternatives." | Yes | Clear and accurate. |
| `code-review` | "Use when completing a phase, reviewing implementation, or before approving changes for merge." | Yes | Clear, but overlaps with `simplify`. |
| `memory-management` | "Use when encountering the same error twice, making significant decisions, or discovering non-obvious conventions." | Yes | Clear and accurate. |
| `roadmap-writing` | "Use when creating a new roadmap, restructuring project phases, or planning milestones." | Yes | Clear and accurate. |
| `sdd` | "Use when executing sequential tasks where context rot is a concern or running spec-driven dispatch." | Partially | This is more of an execution strategy than a behavioral skill. It overlaps with the standard executor. |
| `simplify` | "Use when reviewing code before committing, cleaning up implementations, or preparing changes for review." | Yes | Overlaps with `code-review`. |
| `systematic-debugging` | "Use when encountering any bug, test failure, unexpected behavior, or error message." | Yes | Clear and accurate. |
| `tdd` | "Use when implementing features, fixing bugs, or adding new behavior." | Yes | Clear and accurate. |
| `using-maxsim` | "Use when starting any work session, resuming work, or when unsure which MAXSIM command to run." | Yes | This is the only `alwaysApply` skill. |
| `verification-before-completion` | "Use when claiming work is done, tests pass, builds succeed, or bugs are fixed." | Yes | Clear and accurate. |

## Architecture Patterns

### Skill Metadata Format

Skills use YAML frontmatter in `SKILL.md`:

```yaml
---
name: skill-name
alwaysApply: true  # optional, only used by using-maxsim
description: >-
  Multi-line description of when this skill activates and what it does.
---
```

Only three frontmatter fields are used: `name`, `description`, and optionally `alwaysApply`. The `name` field matches the directory name in all cases.

### Skill Loading Mechanics

Skills are NOT dynamically loaded by code. The loading mechanism is:

1. **Install time:** `packages/cli/src/install/index.ts` copies `templates/skills/` to `~/.claude/skills/`
2. **Agent prompts:** Each agent's `<available_skills>` section lists which skills it should read (e.g., `.skills/tdd/SKILL.md`)
3. **Claude Code native:** Claude Code's own skill system reads files with `alwaysApply: true` automatically at conversation start
4. **Manual reading:** Agents read skill files via the Read tool when triggered

There is NO runtime skill registry or dynamic activation system. Skills are entirely a convention enforced through markdown prompts.

### Skill Registration Points (Three places to keep in sync)

1. **`builtInSkills` array** in `packages/cli/src/install/shared.ts` -- controls cleanup during install/uninstall
2. **`AGENTS.md`** in `templates/agents/` -- maps agents to skills, provides a reference table
3. **`using-maxsim` skill** -- contains its own skill reference table

All three must list the same skills. Currently they do not.

## Issues Found

### Issue 1: builtInSkills Array Missing 2 Skills (SEVERITY: HIGH)

**Problem:** `builtInSkills` in `shared.ts` lists 9 skills but templates contain 11. Missing: `sdd`, `batch-worktree`.

**Impact:** During install, old versions of `sdd` and `batch-worktree` are never cleaned up before new ones are copied. During uninstall, these two skills are left behind as orphans in `~/.claude/skills/`.

**Fix:** Add `'sdd'` and `'batch-worktree'` to the `builtInSkills` array.

### Issue 2: AGENTS.md Missing 2 Skills (SEVERITY: MEDIUM)

**Problem:** AGENTS.md Skill Reference table lists 9 skills. Missing: `sdd`, `batch-worktree`.

**Impact:** These skills are not discoverable through the agent registry. No agent is mapped to them.

**Fix:** Add entries for `sdd` and `batch-worktree` to AGENTS.md. Note: these are execution-strategy skills used by workflows (`sdd.md`, `batch.md`), not by individual agents. They may need a different categorization.

### Issue 3: using-maxsim Skill Table Missing 2 Skills (SEVERITY: MEDIUM)

**Problem:** The `using-maxsim` skill's "Available Skills" table lists 9 skills. Missing: `sdd`, `batch-worktree`.

**Impact:** The routing/reference skill does not mention all available skills, so Claude cannot recommend them.

**Fix:** Add `sdd` and `batch-worktree` to the table in `using-maxsim/SKILL.md`.

### Issue 4: Overlapping Skill Purposes (SEVERITY: MEDIUM)

**Problem:** `code-review` and `simplify` have overlapping scopes:

- `code-review`: "Reviews all changed code for security vulnerabilities, interface correctness, error handling, test coverage, and quality"
- `simplify`: "Reviews changed code for reuse opportunities, unnecessary complexity, and dead weight"

Both review changed code. Both have quality assessment steps. Both run at phase boundaries.

**Distinction (implicit but not stated clearly):**
- `code-review` is a gate (PASS/FAIL before sign-off)
- `simplify` is an optimization pass (CLEAN/FIXED/BLOCKED)
- `code-review` focuses on correctness (security, interfaces, errors)
- `simplify` focuses on maintainability (duplication, dead code, complexity)

**Fix:** Clarify in descriptions that `code-review` is a correctness gate and `simplify` is a maintainability optimization. Make the distinction explicit in both skill files.

### Issue 5: sdd and batch-worktree Are Execution Strategies, Not Behavioral Skills (SEVERITY: LOW)

**Problem:** `sdd` and `batch-worktree` are fundamentally different from other skills. Other skills (tdd, debugging, verification) are behavioral rules that modify HOW an agent works. `sdd` and `batch-worktree` are execution STRATEGIES that describe HOW TO ORCHESTRATE multiple agents. They are more like workflows than skills.

**Impact:** Categorizing them as skills alongside behavioral rules creates confusion. They are already implemented as workflows (`workflows/sdd.md`, `workflows/batch.md`) and commands (`commands/maxsim/sdd.md`, `commands/maxsim/batch.md`). The skill files are redundant reference material.

**Options:**
1. Keep them as skills but add a category distinction in metadata (e.g., `type: strategy` vs `type: behavioral`)
2. Remove them from skills and keep them only as workflows
3. Keep them but clarify in descriptions that they are orchestration patterns, not agent behavior modifiers

**Recommendation:** Option 1 or 3. The skill files serve as a useful reference even if workflows implement them. Just clarify the distinction.

### Issue 6: batch-worktree Description Says "5-30" but Body Says "3-30" (SEVERITY: LOW)

**Problem:** The frontmatter description says "5-30 independent units" but the skill body and constraints say "Not for... fewer than 3 units" and "3-30" in various places.

**Fix:** Change frontmatter to "3-30" for consistency.

### Issue 7: Duplicate Skill Reference Tables (SEVERITY: LOW)

**Problem:** The same skill table exists in both `AGENTS.md` and `using-maxsim/SKILL.md`. When a skill is added or changed, both must be updated.

**Fix:** Either consolidate into one location or accept the duplication and document both as needing updates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill frontmatter parsing | Custom YAML parser | `extractFrontmatter()` from `core/frontmatter.ts` | Already exists, handles edge cases |
| Skill file listing | Manual directory walk | `cmdSkillList()` from `core/skills.ts` | Already handles missing dirs, metadata extraction |
| Skill install/update | Custom copy logic | `cmdSkillInstall()` / `cmdSkillUpdate()` from `core/skills.ts` | Already handles templates resolution |

## Common Pitfalls

### Pitfall 1: Forgetting to update builtInSkills when adding/removing a skill
**What goes wrong:** New skills get installed but never cleaned up. Old skills persist as orphans.
**How to avoid:** Add a test or checklist that verifies `builtInSkills` matches the contents of `templates/skills/`.
**Warning signs:** `~/.claude/skills/` contains directories not in `builtInSkills`.

### Pitfall 2: Skill description not matching skill body
**What goes wrong:** Agents activate the skill in wrong contexts or fail to activate when they should.
**How to avoid:** After editing a skill body, re-read the description and update it if the scope changed.
**Warning signs:** Description mentions thresholds or conditions not found in the body.

### Pitfall 3: Editing one skill table but not the other
**What goes wrong:** `AGENTS.md` and `using-maxsim` skill tables diverge, giving different answers about available skills.
**How to avoid:** Search for all occurrences of the skill name across templates when adding/removing/renaming.
**Warning signs:** `grep -r "skill-name" templates/` returns hits in unexpected places.

## Code Examples

### Frontmatter format (verified from all 11 skills)

```yaml
---
name: skill-name
description: >-
  One or more sentences describing when this skill activates.
  Include positive triggers (use when...) and negative triggers (not for...).
---
```

### builtInSkills array (current, needs update)

```typescript
// packages/cli/src/install/shared.ts line 18
export const builtInSkills = [
  'tdd', 'systematic-debugging', 'verification-before-completion',
  'simplify', 'code-review', 'memory-management', 'using-maxsim',
  'brainstorming', 'roadmap-writing'
] as const;
```

### Agent skill reference pattern (from agent markdown files)

```markdown
<available_skills>
When any trigger condition below applies, read the full skill file via the Read tool and follow it.

| Skill | Read | Trigger |
|-------|------|---------|
| TDD Enforcement | `.skills/tdd/SKILL.md` | Before writing implementation code |
| Verification Before Completion | `.skills/verification-before-completion/SKILL.md` | Before claiming any task is done |

**Project skills override built-in skills.**
</available_skills>
```

## Coverage Analysis

### Skills Mapped to Agents (who uses what)

| Skill | Used By Agents |
|-------|---------------|
| `tdd` | maxsim-executor, maxsim-planner |
| `systematic-debugging` | maxsim-executor, maxsim-debugger |
| `verification-before-completion` | maxsim-executor, maxsim-debugger, maxsim-verifier, maxsim-plan-checker, maxsim-code-reviewer, maxsim-spec-reviewer, maxsim-integration-checker |
| `using-maxsim` | maxsim-executor, maxsim-planner, maxsim-roadmapper (also alwaysApply) |
| `memory-management` | maxsim-phase-researcher, maxsim-project-researcher, maxsim-research-synthesizer, maxsim-codebase-mapper |
| `brainstorming` | **No agent** (referenced in using-maxsim table but not assigned to any agent in AGENTS.md) |
| `roadmap-writing` | **No agent** (referenced in using-maxsim table but not assigned to any agent in AGENTS.md) |
| `simplify` | **No agent** (referenced in using-maxsim table but not assigned to any agent in AGENTS.md) |
| `code-review` | **No agent** (referenced in using-maxsim table but not assigned to any agent in AGENTS.md) |
| `sdd` | **No agent** (not in AGENTS.md at all) |
| `batch-worktree` | **No agent** (not in AGENTS.md at all) |

### Coverage Gaps

1. **brainstorming** is not assigned to any agent. It should arguably be assigned to the planner or roadmapper.
2. **roadmap-writing** is not assigned to any agent. The `maxsim-roadmapper` agent should reference it.
3. **simplify** is not assigned to any agent. The executor or code-reviewer could reference it.
4. **code-review** is not assigned to any agent despite having a dedicated `maxsim-code-reviewer` agent. The agent references `verification-before-completion` but not `code-review` itself, which is its primary skill.

### Coverage Overlaps (potential confusion)

| Pair | Overlap Area | Resolution |
|------|-------------|------------|
| `code-review` + `simplify` | Both review changed code | Different focus: correctness vs maintainability |
| `sdd` + standard execution | Both execute plan tasks | SDD uses fresh agents per task; standard uses single agent |
| `verification-before-completion` + `code-review` | Both verify before sign-off | VBC is about evidence for claims; code-review is comprehensive quality assessment |

## Open Questions

| Question | What We Know | What's Unclear | Recommendation |
|----------|-------------|----------------|----------------|
| Should sdd/batch-worktree remain as skills? | They have corresponding workflows and commands | Whether the skill files add value beyond the workflows | Keep as skills but add `type: strategy` to distinguish |
| Should brainstorming/roadmap-writing/simplify/code-review be assigned to agents? | They exist in AGENTS.md skill reference but aren't mapped to agents in the registry | Whether they're intended as user-invoked skills only | At minimum, map code-review to maxsim-code-reviewer |
| Should there be a skill for "refactoring"? | No dedicated refactoring skill exists | Whether simplify covers it sufficiently | Simplify likely covers this; no new skill needed |

## Sources

All findings are from direct codebase inspection (HIGH confidence):

- `templates/skills/*/SKILL.md` -- All 11 skill files read in full
- `packages/cli/src/install/shared.ts` line 18 -- `builtInSkills` array
- `packages/cli/src/core/skills.ts` -- Skill CLI commands
- `packages/cli/src/cli.ts` lines 393-395 -- CLI router for skill commands
- `templates/agents/AGENTS.md` -- Agent-skill registry
- `packages/cli/src/install/index.ts` -- Install logic for skills
- `packages/cli/src/install/uninstall.ts` -- Uninstall cleanup logic

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Skill inventory | HIGH | Read every skill file directly |
| Registration mechanics | HIGH | Read all install/CLI code |
| Name conflicts | HIGH | Compared all 11 names directly |
| Coverage gaps | HIGH | Cross-referenced AGENTS.md with skill files |
| Activation accuracy | HIGH | Compared frontmatter descriptions against skill body content |
| Overlap analysis | MEDIUM | Subjective judgment on scope boundaries |

**Research date:** 2026-03-03
**Valid until:** Next skill is added or removed
