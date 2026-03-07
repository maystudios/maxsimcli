# 17-01 Summary: Skill System Cleanup

**Plan:** 17-01
**Phase:** 17-Skill-System-Cleanup
**Status:** Complete
**Duration:** ~8 minutes

## What Was Done

Renamed conflicting skills, reconciled all skill registration points across the codebase, clarified overlapping descriptions, mapped unassigned skills to agents, and added a guard test.

### Task 1: Rename conflicting skills and register all skills with fixed descriptions

- **Renamed** `templates/skills/simplify/` → `templates/skills/maxsim-simplify/` (git mv for history)
- **Renamed** `templates/skills/batch-worktree/` → `templates/skills/maxsim-batch/` (git mv for history)
- **Updated frontmatter**: `name: maxsim-simplify` with maintainability-focused description; `name: maxsim-batch` with threshold fixed from "5-30" to "3-30"
- **Updated `builtInSkills`**: Now 11 entries matching all `templates/skills/` directories (added `sdd`, `maxsim-batch`, renamed `simplify` → `maxsim-simplify`)
- **Updated `AGENTS.md`**: Registry maps `code-review` → `maxsim-code-reviewer`, `brainstorming`+`roadmap-writing` → `maxsim-roadmapper`, `maxsim-simplify` → `maxsim-executor`, `brainstorming` → `maxsim-planner`. Skill Reference table lists all 11 skills.
- **Updated `using-maxsim`**: Available Skills table lists all 11 skills with new names and clarified descriptions
- **Clarified descriptions**: `code-review` = correctness gate; `maxsim-simplify` = maintainability optimization
- **Updated agent prompts**: Added `<available_skills>` to `maxsim-code-reviewer` and `maxsim-roadmapper`; added `maxsim-simplify` to `maxsim-executor`; added `brainstorming` to `maxsim-planner`
- **Fixed stale reference** in `templates/workflows/batch.md`

### Task 2: Add builtInSkills sync guard test

- Added `builtInSkills sync guard` describe block to `packages/cli/tests/unit/skills.test.ts`
- Test parses `builtInSkills` from source (avoids module-level side effects) and compares against `templates/skills/` directories
- Asserts renamed skills present (`maxsim-simplify`, `maxsim-batch`) and old names absent
- All 8 tests pass

## Commits

| Hash | Message |
|------|---------|
| `7a09917` | refactor(17-01): rename conflicting skills and reconcile all registration points |
| `e954c0f` | test(17-01): add builtInSkills sync guard test |

## Deviations

- [Rule 3 - Blocking Issue] Fixed stale `skills/batch-worktree/` reference in `templates/workflows/batch.md` (not in original plan files list but discovered during stale-reference sweep)
- [Rule 3 - Blocking Issue] Used source-file parsing instead of module import for guard test due to `shared.ts` module-level side effect (`package.json` read via `__dirname`)

## Verification

```
CLAIM: All 11 skills renamed, registered, and referenced correctly
EVIDENCE: node verify-task1.cjs — ALL CHECKS PASSED
OUTPUT: OK: directories renamed, OK: builtInSkills has all 11 skills, OK: no stale references
VERDICT: PASS
```

```
CLAIM: Guard test passes
EVIDENCE: npx vitest run tests/unit/skills.test.ts
OUTPUT: 8 passed (8)
VERDICT: PASS
```

```
CLAIM: Build succeeds
EVIDENCE: npm run build
OUTPUT: Build complete, 150 template files copied
VERDICT: PASS
```
