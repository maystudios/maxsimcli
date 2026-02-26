---
phase: 26-superpowers-inspired-workflow-enhancements
plan: 05
subsystem: infra
tags: [install, skills, delivery-pipeline, copy-assets, npm-tarball]

# Dependency graph
requires:
  - phase: 26-01
    provides: "Skills directory structure (templates/skills/) with SKILL.md files"
provides:
  - "Skills delivered to end users via install pipeline (.agents/skills/)"
  - "Skills included in npm tarball via copy-assets.cjs recursive templates/ copy"
  - "Skills manifest tracking for modification detection"
affects: [install, agents, skills]

# Tech tracking
tech-stack:
  added: []
  patterns: ["skills install under agents/skills/ matching .agents/skills/ agent prompt references"]

key-files:
  created: []
  modified:
    - "packages/cli/src/install.ts"

key-decisions:
  - "Skills install under agents/skills/ (not separate top-level skills/) to match .agents/skills/ path in agent prompts"
  - "Built-in skill names hardcoded for safe removal during upgrades; user custom skills preserved"
  - "copy-assets.cjs unchanged — existing recursive templates/ copy already includes skills"
  - "Skills added to file manifest for modification detection (agents/skills/* entries)"

patterns-established:
  - "Skills delivery: templates/skills/ -> dist/assets/templates/skills/ -> .agents/skills/ at install"
  - "Upgrade safety: only remove known built-in skill names, preserve user custom skills"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 26 Plan 05: Skills Install Pipeline Summary

**Extended install.ts to deliver skills to .agents/skills/ with upgrade-safe removal and path prefix processing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T14:11:21Z
- **Completed:** 2026-02-26T14:13:22Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Verified copy-assets.cjs already includes skills via recursive templates/ copy (no changes needed)
- Extended install.ts with skills installation block that copies templates/skills/ to agents/skills/
- Added upgrade-safe removal of built-in skills (tdd, systematic-debugging, verification-before-completion) while preserving user custom skills
- Added path prefix replacement for SKILL.md files (same as agents)
- Added skills to the file manifest for modification detection
- All 53 existing tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify copy-assets.cjs handles skills and extend install.ts** - `b64ed44` (feat)
2. **Task 2: Run existing tests to verify no regressions** - no commit (tests passed, no code changes needed)

## Files Created/Modified
- `packages/cli/src/install.ts` - Added skills installation block after agents, added skills to manifest generation

## Decisions Made
- Skills install under `agents/skills/` to match `.agents/skills/` path referenced in agent prompts
- Only known built-in skill names removed during upgrades (tdd, systematic-debugging, verification-before-completion) -- user custom skills preserved
- No changes to copy-assets.cjs needed -- recursive templates/ copy already includes skills
- Skills added to file manifest via `generateManifest()` for `agents/skills/*` entries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 26 complete: all 5 plans delivered
- Skills delivery pipeline fully operational: build includes skills, install copies them, manifest tracks them
- Ready for end-to-end verification via `npx maxsimcli@latest`

## Self-Check: PASSED

- FOUND: packages/cli/src/install.ts
- FOUND: 26-05-SUMMARY.md
- FOUND: b64ed44 (Task 1 commit)

---
*Phase: 26-superpowers-inspired-workflow-enhancements*
*Completed: 2026-02-26*
