---
phase: 26-superpowers-inspired-workflow-enhancements
plan: 01
subsystem: agents
tags: [skills, anti-rationalization, tdd, debugging, verification, prompt-engineering, markdown]

# Dependency graph
requires: []
provides:
  - "3 foundational skill SKILL.md files in templates/skills/ for on-demand agent loading"
  - "TDD enforcement skill (tdd/SKILL.md) with RED-GREEN-REFACTOR gate function"
  - "Systematic debugging skill (systematic-debugging/SKILL.md) with root-cause-before-fix process"
  - "Verification-before-completion skill (verification-before-completion/SKILL.md) with evidence gate"
affects: [26-02, 26-03, 26-04, 26-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [SKILL.md format with YAML frontmatter, HARD-GATE tags for Iron Laws, Gate Function step-by-step process, Common Rationalizations table, Red Flags checklist]

key-files:
  created:
    - templates/skills/tdd/SKILL.md
    - templates/skills/systematic-debugging/SKILL.md
    - templates/skills/verification-before-completion/SKILL.md
  modified: []

key-decisions:
  - "Skills follow Superpowers SKILL.md pattern but fully adapted to MAXSIM context (no Superpowers-specific language)"
  - "Each skill file kept under 130 lines for lightweight on-demand loading"
  - "Skills include MAXSIM-specific integration sections (commit conventions, deviation rules, plan execution)"

patterns-established:
  - "SKILL.md format: YAML frontmatter (name, description) + Iron Law in HARD-GATE tags + Gate Function + Common Rationalizations table + Red Flags checklist + Verification Checklist"
  - "Skill files reference MAXSIM concepts (PLAN.md, SUMMARY.md, deviation rules, task commits) not Superpowers concepts"

requirements-completed: [DOCS-01]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 26 Plan 01: Foundational Skills Summary

**3 on-demand skill files (TDD, Systematic Debugging, Verification-Before-Completion) with HARD-GATE Iron Laws, Gate Functions, and anti-rationalization tables adapted from Superpowers pattern to MAXSIM context**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T13:59:51Z
- **Completed:** 2026-02-26T14:02:27Z
- **Tasks:** 1
- **Files created:** 3

## Accomplishments
- Created 3 foundational skill files in `templates/skills/` following the Superpowers SKILL.md pattern
- Each skill has: YAML frontmatter, Iron Law in `<HARD-GATE>` tags, Gate Function, Common Rationalizations table (7+ entries), Red Flags checklist (7+ items), Verification Checklist
- All content adapted to MAXSIM context (references MAXSIM tools, plan execution, deviation rules)
- All files under 130 lines for lightweight on-demand loading

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 3 foundational skill SKILL.md files** - `5a83c9a` (feat)

## Files Created
- `templates/skills/tdd/SKILL.md` - TDD enforcement skill with RED-GREEN-REFACTOR gate function (118 lines)
- `templates/skills/systematic-debugging/SKILL.md` - Root-cause-before-fix debugging skill with 6-step gate function (118 lines)
- `templates/skills/verification-before-completion/SKILL.md` - Evidence gate skill with CLAIM/EVIDENCE/OUTPUT/VERDICT block format (102 lines)

## Decisions Made
- Skills follow Superpowers SKILL.md structure (frontmatter, Iron Law, Gate Function, Rationalizations, Red Flags, Verification Checklist) but with all language adapted to MAXSIM context
- Each skill includes a "In MAXSIM Context" or "Integration with MAXSIM" section connecting the skill to MAXSIM-specific concepts (plan execution, task commits, deviation rules)
- Evidence block format (CLAIM/EVIDENCE/OUTPUT/VERDICT) included in verification-before-completion skill per CONTEXT.md locked decision

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Skill files are ready for reference by agent prompts (Plan 02 will add Available Skills sections to agents)
- Skill file paths follow the pattern `.agents/skills/{name}/SKILL.md` that agents will use after install
- Install.ts extension (Plan 05) will copy these to user projects

## Self-Check: PASSED

All created files verified present. All commits verified in git log.

---
*Phase: 26-superpowers-inspired-workflow-enhancements*
*Completed: 2026-02-26*
