# Phase 1: Context Rot Prevention - Research

**Researched:** 2026-03-06
**Domain:** CLI tooling, file I/O, markdown parsing, phase lifecycle
**Confidence:** HIGH (all findings from direct codebase investigation)

---

## User Constraints

Copied verbatim from 01-CONTEXT.md:

**Locked Decisions:**
- Auto-archive on phase complete (built into complete-phase flow, not a separate command)
- Full sweep: dir + ROADMAP + STATE in one atomic operation, one commit
- User confirmation before archival (summary + confirm) — the tool returns what WILL happen, the workflow agent asks confirmation, then a second tool call executes
- Mid-milestone: phase-specific decisions/blockers pruned from STATE.md immediately on phase complete
- Milestone close: full STATE.md reset (decisions, blockers, metrics archived, STATE starts fresh)
- Archive structure: `.planning/archive/v5/` with STATE + ROADMAP snapshots
- Archive is git-tracked
- Completed phases in ROADMAP.md: `- [x] Phase N: Name -- outcome summary` (detail section stripped)
- Agent access to archive via `get-archived-phase` tool command

**Deferred Ideas:** None.

---

## Summary

Phase 1 modifies two existing lifecycle functions (`phaseCompleteCore` in `phase.ts` and `cmdMilestoneComplete` in `milestone.ts`) and adds one new CLI command (`get-archived-phase`). The codebase already has partial archive support in milestones (archiving to `.planning/milestones/v*-phases/`) but the CONTEXT.md specifies a different archive path (`.planning/archive/v5/`). The existing `phaseCompleteCore` only marks checkboxes and updates fields — it does NOT move directories, prune STATE sections, or collapse ROADMAP entries. All of this is new work.

The codebase uses `node:fs` promises (`fsp`) for async operations in `phase.ts` and `state.ts`, but sync `fs` in `milestone.ts`. New code should use async (`fsp`) consistently. Markdown section parsing uses regex patterns matching `#{2,3}\s*SectionName` — the `appendToStateSection` and section-extraction patterns in `state.ts` are the established approach. The `execGit` helper in `core.ts` wraps `simple-git` for commits.

**Primary recommendation:** Extend `phaseCompleteCore` with an optional `archive` parameter that performs the three-part sweep (move dir, prune STATE, collapse ROADMAP), then commit all changes via `execGit`. Split into preview (dry-run) and execute modes so the workflow can show a summary before confirming.

---

## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| `node:fs/promises` | Node built-in | All file I/O | Already used in phase.ts, state.ts |
| `simple-git` | Already in deps | Git add + commit | Already used via `execGit` in core.ts |
| `escape-string-regexp` | Already in deps | Safe regex from user input | Already used in state.ts |
| `slugify` | Already in deps | Slug generation | Already used in core.ts |

**No new dependencies needed.** Everything required is already in the project.

---

## Architecture Patterns

### File I/O Pattern
All async file operations use `import { promises as fsp } from 'node:fs'`. Read with `fsp.readFile(path, 'utf-8')`, write with `fsp.writeFile(path, content, 'utf-8')`. Directory creation with `fsp.mkdir(path, { recursive: true })`. Directory move with `fsp.rename(src, dest)`. Existence checks with `pathExistsAsync(path)`.

### CLI Command Pattern
1. Export an async function `cmdXxx(cwd, ...args): Promise<CmdResult>` from the relevant core module
2. Import it in `cli.ts`
3. Add to the dispatch handler (e.g., `handlePhase` or a new `handleArchive`)
4. Return `cmdOk(result)` or `cmdErr(message)`

### STATE.md Section Parsing Pattern
Sections are matched with regex: `/(#{2,3}\s*SectionName\s*\n)([\s\S]*?)(?=\n#{2,3}\s|$)/i`
- Decisions section: `/(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i`
- Blockers section: `/(#{2,3}\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n\s*\n?)([\s\S]*?)(?=\n#{2,3}\s|$)/i`
- Metrics section: `/(#{2,3}\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n)([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i`
- Individual entries are bullet lines: `- [Phase X]: summary text`

### ROADMAP.md Phase Section Pattern
Phase detail sections are matched with: `getPhasePattern(escapedPhaseNum, 'i')` which produces `#{2,4}\s*Phase\s+NUM:\s*([^\n]+)`. The section extends until the next `\n#{2,4}\s+Phase\s+\d` match.

Checkbox lines: `- [ ] **Phase N: Name** - description` or `- [x] **Phase N: Name** - description`

### Atomic Operation Strategy
1. Read all files first (ROADMAP.md, STATE.md, verify phase dir exists)
2. Perform all in-memory transformations
3. Write all files
4. Move directory with `fsp.rename`
5. Stage all changes with `execGit(cwd, ['add', ...paths])`
6. Commit with `execGit(cwd, ['commit', '-m', message])`

If any step fails mid-way, the git working tree shows partial changes that the user can inspect and fix. This is acceptable — true filesystem transactions are not possible and the git history provides recovery.

### Preview/Execute Split
Return a preview object from one function call:
```typescript
interface ArchivePreview {
  phase_dir: string;        // directory that will move
  archive_dir: string;      // destination
  decisions_to_prune: string[];  // decision lines to remove
  blockers_to_prune: string[];   // blocker lines to remove
  roadmap_section_to_collapse: string; // what will be replaced
  collapsed_line: string;   // what it becomes
}
```
Then a second call with `--confirm` executes the actual operation.

### Archive Directory Structure
```
.planning/archive/
  v5/                        # milestone name from ROADMAP.md
    01-Context-Rot-Prevention/  # phase dir moved as-is
    02-Deep-Init/
    STATE.md                 # snapshot at milestone close
    ROADMAP.md               # snapshot at milestone close
```

### Existing Archive Location (MUST CHANGE)
Currently `milestone.ts` archives to `.planning/milestones/v*-phases/` and `.planning/milestones/v*-ROADMAP.md`. The CONTEXT.md specifies `.planning/archive/v5/` instead. The `findPhaseInternalAsync` and `getArchivedPhaseDirsAsync` functions search `.planning/milestones/` — these must be updated to also search `.planning/archive/`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Regex escaping | Manual string replacement | `escape-string-regexp` (already imported in state.ts) | Edge cases with dots, parens |
| Phase number normalization | Custom padding logic | `normalizePhaseName()` from core.ts | Handles letters, decimals |
| Phase comparison/sorting | Custom sort | `comparePhaseNum()` from core.ts | Handles all phase number formats |
| Git operations | `child_process.exec('git ...')` | `execGit()` from core.ts (wraps simple-git) | Error handling, cross-platform |
| STATE.md section append | Custom regex | `appendToStateSection()` from state.ts | Handles placeholders, formatting |
| Phase directory lookup | Manual glob | `findPhaseInternalAsync()` from core.ts | Handles archived + active phases |
| Milestone version detection | Parse ROADMAP manually | `getMilestoneInfoAsync()` from core.ts | Already handles edge cases |

---

## Common Pitfalls

### 1. Cross-platform path handling with `fsp.rename`
**What goes wrong:** `fsp.rename` fails across filesystem boundaries (different drives on Windows).
**Why:** `.planning/phases/` and `.planning/archive/` are on the same drive, so this is unlikely but theoretically possible with symlinks.
**How to avoid:** Use `fsp.rename` for same-filesystem moves. If it throws EXDEV, fall back to recursive copy + delete.
**Warning signs:** EXDEV error code.

### 2. Phase-specific decision pruning is ambiguous
**What goes wrong:** Decisions in STATE.md may not be clearly tagged with phase numbers. Current format is `- [Phase X]: summary` but also `- **Clean slate**: ...` (no phase tag).
**Why:** The current STATE.md has decisions WITHOUT phase tags (see actual STATE.md content).
**How to avoid:** Only prune decisions that match `- [Phase N]:` pattern where N matches the completed phase. Leave untagged decisions alone. Going forward, ensure `cmdStateAddDecision` always tags with phase.
**Warning signs:** Untagged decisions getting orphaned or incorrectly pruned.

### 3. ROADMAP.md section collapse regex must handle both formats
**What goes wrong:** The roadmap has BOTH a checklist line (`- [ ] **Phase 1: ...`) AND a detail section (`### Phase 1: ...`). Collapsing must remove the detail section AND update the checklist line.
**Why:** Current ROADMAP.md format uses both representations.
**How to avoid:** Two-step: (1) remove the `### Phase N:` detail section entirely, (2) replace the `- [ ]` checklist line with `- [x] Phase N: Name -- outcome summary`.
**Warning signs:** Duplicate entries or orphaned sections.

### 4. Empty sections after pruning
**What goes wrong:** After removing all decisions or blockers, the section is empty.
**Why:** Need placeholder text like "None." to maintain valid markdown structure.
**How to avoid:** After pruning, check if section body is empty and insert "None.\n" placeholder. This matches existing pattern in `cmdStateResolveBlocker`.

### 5. Milestone archive path change breaks existing projects
**What goes wrong:** Projects that already used `cmdMilestoneComplete` have archives in `.planning/milestones/`. New code archives to `.planning/archive/`.
**Why:** GUARD-03 requires backward compatibility.
**How to avoid:** `findPhaseInternalAsync` and `getArchivedPhaseDirsAsync` must search BOTH `.planning/milestones/` (legacy) AND `.planning/archive/` (new). The new archive path is only for new archives.

### 6. Race condition between preview and execute
**What goes wrong:** Files change between preview (dry-run) and execute (confirm).
**Why:** Another process or manual edit could modify STATE.md or ROADMAP.md.
**How to avoid:** Re-read files during execute, don't cache from preview. The preview is informational only.

---

## Code Examples

### Pruning phase-specific decisions from STATE.md
```typescript
// Pattern from state.ts cmdStateResolveBlocker — filter lines by content
function prunePhaseDecisions(content: string, phaseNum: string): string {
  const sectionPattern = /(#{2,3}\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n#{2,3}\s|\n##[^#]|$)/i;
  const match = content.match(sectionPattern);
  if (!match) return content;

  const lines = match[2].split('\n');
  const escaped = escapePhaseNum(phaseNum);
  const filtered = lines.filter(line => {
    // Keep lines that are NOT phase-specific decisions for this phase
    const phaseTagPattern = new RegExp(`^\\s*-\\s*\\[Phase\\s+${escaped}\\]`, 'i');
    return !phaseTagPattern.test(line);
  });

  let newBody = filtered.join('\n');
  if (!newBody.trim() || !/^\s*[-*]\s+/m.test(newBody)) {
    newBody = '\nNone.\n';
  }

  return content.replace(sectionPattern, (_m, header) => `${header}${newBody}`);
}
```

### Collapsing a ROADMAP.md phase detail section
```typescript
// Remove ### Phase N detail section, keep/update checklist line
function collapseRoadmapPhase(content: string, phaseNum: string, outcomeSummary: string): string {
  const escaped = escapePhaseNum(phaseNum);

  // 1. Remove the detail section (### Phase N: ... until next ### Phase)
  const sectionPattern = new RegExp(
    `\\n?#{2,4}\\s*Phase\\s+${escaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+Phase\\s+\\d|\\n## |$)`,
    'i'
  );
  let result = content.replace(sectionPattern, '');

  // 2. Update checklist line to collapsed format
  const checklistPattern = new RegExp(
    `-\\s*\\[[ x]\\]\\s*\\*\\*Phase\\s+${escaped}:[^*]+\\*\\*[^\\n]*`,
    'i'
  );
  result = result.replace(checklistPattern,
    `- [x] Phase ${phaseNum}: ${outcomeSummary}`
  );

  return result;
}
```

### Adding a new CLI command (dispatch pattern)
```typescript
// In cli.ts, add to imports:
import { cmdGetArchivedPhase } from './core/index.js';

// In the handler map or switch:
'get-archived-phase': () => handleResult(cmdGetArchivedPhase(cwd, args[2]), raw),
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|-----------------|-------------|--------|
| Archives in `.planning/milestones/v*-phases/` | Moving to `.planning/archive/v*/` | Phase 1 (this phase) | Must keep backward compat search |
| Phase complete only marks checkbox | Phase complete archives + prunes + collapses | Phase 1 (this phase) | Core lifecycle change |
| STATE.md accumulates forever | STATE.md pruned on phase complete, reset on milestone | Phase 1 (this phase) | Prevents context rot |
| `milestone.ts` uses sync `fs` | Should use async `fsp` | Phase 1 (this phase) | Consistency with phase.ts pattern |

---

## Open Questions

| What We Know | What's Unclear | Recommendation |
|-------------|---------------|----------------|
| Decisions tagged `[Phase N]:` can be pruned | Current STATE.md has untagged decisions (e.g., "Clean slate") | Only prune tagged decisions; leave untagged ones. Document this behavior. |
| `phaseCompleteCore` returns `PhaseCompleteResult` | Should archive fields be added to existing result type or new type? | Extend `PhaseCompleteResult` with `archived: boolean`, `archive_path: string \| null` |
| Milestone complete exists in `milestone.ts` | Should milestone archive logic move to the new archive path or stay? | New milestone complete should use `.planning/archive/v*/` for new archives. Keep legacy search in both locations. |
| The workflow agent handles user confirmation | How does the preview/confirm two-step work in the CLI tool? | Two commands: `phase-complete --preview` returns summary, `phase-complete --archive` executes. Or: single command returns preview, workflow confirms, then calls `phase-archive`. |

---

## Phase Requirements Map

| Req ID | Behavior | Implementation Location | Research Support |
|--------|----------|------------------------|-----------------|
| ROT-01 | Auto-prune completed phases from ROADMAP.md and STATE.md | `phaseCompleteCore` in phase.ts | Section parsing patterns documented above |
| ROT-02 | Reprocess/lifecycle hook detects stale context | New function in phase.ts or state.ts | Can scan STATE.md for decisions tagged with completed phases |
| ROT-03 | Phase archival moves dirs to `.planning/archive/` | New archive function in phase.ts | `fsp.rename` + `fsp.mkdir` pattern documented |
| ROT-04 | STATE.md retains only current milestone context | `cmdMilestoneComplete` in milestone.ts | Full STATE.md reset pattern documented |
| GUARD-01 | Must not break install flow | No install changes needed | N/A |
| GUARD-02 | Must not remove existing command interfaces | Extending, not removing | Backward compat maintained |
| GUARD-03 | Must not break existing `.planning/` format | Search both old and new archive paths | Pitfall #5 documented |
| GUARD-04 | Must ship in npm package | All changes in `packages/cli/src/core/` | Built and bundled normally |

---

## Sources

**Primary (HIGH confidence):**
- `packages/cli/src/core/phase.ts` — phaseCompleteCore, all phase lifecycle functions
- `packages/cli/src/core/milestone.ts` — cmdMilestoneComplete, existing archive logic
- `packages/cli/src/core/state.ts` — all STATE.md CRUD, section parsing patterns
- `packages/cli/src/core/roadmap.ts` — ROADMAP.md parsing, phase section extraction
- `packages/cli/src/core/core.ts` — shared utilities, git helpers, path helpers
- `packages/cli/src/core/types.ts` — all type definitions
- `packages/cli/src/cli.ts` — command dispatch pattern

**Secondary (MEDIUM confidence):**
- `.planning/STATE.md` — actual current STATE.md format (observed)
- `.planning/ROADMAP.md` — actual current ROADMAP.md format (observed)

---

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Standard Stack | HIGH | Direct codebase inspection, no external deps needed |
| Architecture Patterns | HIGH | All patterns extracted from actual source code |
| STATE.md Parsing | HIGH | Regex patterns copied from state.ts source |
| ROADMAP.md Parsing | HIGH | Patterns from roadmap.ts and phase.ts source |
| Archive Structure | HIGH | CONTEXT.md specifies exact structure |
| Backward Compatibility | HIGH | Existing archive paths identified in core.ts |
| Pitfalls | HIGH | Derived from actual code patterns and current data |

**Research date:** 2026-03-06
**Valid until:** This phase's implementation (codebase-specific, no external deps to version)
