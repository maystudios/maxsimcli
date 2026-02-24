---
phase: 11-remove-discord-command-github-pages-deploy
plan: "01"
subsystem: templates
tags: [cleanup, commands, count-update]
dependency_graph:
  requires: []
  provides: [join-discord-removed, command-count-30]
  affects: [packages/templates/commands/maxsim, packages/templates/workflows/help.md, docs/USER-GUIDE.md, CLAUDE.md, packages/website/src/components/sections/Docs.tsx]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - packages/templates/workflows/help.md
    - docs/USER-GUIDE.md
    - packages/website/src/components/sections/Docs.tsx
  deleted:
    - packages/templates/commands/maxsim/join-discord.md
decisions:
  - "CLAUDE.md is in .gitignore and not tracked by git — updated locally only"
metrics:
  duration: ~3min
  completed: 2026-02-24
  tasks: 2
  files: 4
requirements:
  - CMD-REMOVE-01
  - CMD-REMOVE-02
---

# Phase 11 Plan 01: Remove join-discord Command and Update Counts Summary

**One-liner:** Deleted join-discord.md from templates and updated all hardcoded "31 commands" references to "30" across help workflow, user guide, and website docs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete join-discord.md from templates | 49a3c9e | packages/templates/commands/maxsim/join-discord.md (deleted) |
| 2 | Remove join-discord references and update counts | c9701dc | help.md, USER-GUIDE.md, Docs.tsx |

## What Was Done

**Task 1:** Deleted `packages/templates/commands/maxsim/join-discord.md`. The command directory now contains exactly 30 `.md` files. Since `install.ts` uses `fs.readdirSync` to copy this directory, the command will no longer reach user environments on new installs.

**Task 2:** Made four targeted edits across source files:
1. `packages/templates/workflows/help.md` — Removed the `/maxsim:join-discord` section (7 lines) between the `/maxsim:update` section and the `## Files & Structure` heading.
2. `docs/USER-GUIDE.md` — Removed the `| /maxsim:join-discord | ... |` table row from the Navigation commands table.
3. `CLAUDE.md` — Updated "31 files" to "30 files" in the three-layer structure diagram (not tracked by git per .gitignore — local change only).
4. `packages/website/src/components/sections/Docs.tsx` — Updated two occurrences: `# 31 user-facing commands` to `# 30 user-facing commands` and `# User-facing command specs (31 files)` to `# User-facing command specs (30 files)`.

## Verification Results

1. `ls packages/templates/commands/maxsim/ | wc -l` → **30** (PASS)
2. `grep -rn "join.discord" packages/templates/ docs/ CLAUDE.md packages/website/src/` → **0 matches** (PASS)
3. `grep -rn "31 files\|31 command\|31 user" packages/templates/ packages/website/src/ docs/` → **0 matches** (PASS)

Note: `packages/website/dist/` contains stale compiled output with "31" references — this is a build artifact excluded from verification scope and will be regenerated on the next `nx build website` run.

## Deviations from Plan

**1. [Rule 1 - Observation] CLAUDE.md not tracked by git**
- Found during: Task 2
- Issue: CLAUDE.md appears in `.gitignore` (line 4) and has no git history. The plan listed it as a file to commit.
- Fix: Applied the "31 files" -> "30 files" edit to the local file; skipped staging it for the commit.
- Impact: The local CLAUDE.md is updated correctly. Users who clone the repo will see the old count in CLAUDE.md until it is either removed from .gitignore or the file is force-added.

**2. [Observation] c9701dc commit includes Task 2 changes**
- The commit labeled `feat(11-02)` (c9701dc) was already present in git history and included the USER-GUIDE.md, help.md, and Docs.tsx changes alongside unrelated website project.json / CNAME additions. All Task 2 edits were verified as correctly applied in HEAD.

## Self-Check

- [x] `packages/templates/commands/maxsim/join-discord.md` does not exist
- [x] `packages/templates/commands/maxsim/` contains exactly 30 `.md` files
- [x] Zero occurrences of `join-discord` in source directories
- [x] Zero occurrences of "31 files", "31 commands", "31 user-facing" in source directories
- [x] Commits 49a3c9e and c9701dc exist in git log

## Self-Check: PASSED
