# Phase 03 Research: State Management & File Watching

**Researched:** 2026-03-02
**Domain:** Backend state management, file system watching, concurrency control
**Confidence:** High (based on existing codebase analysis and current library ecosystem)

---

## 1. Current State Management Analysis

### How State Is Managed Today

MAXSIM currently uses direct synchronous file I/O against markdown files in `.planning/`. There is no caching layer, no locking, and no coordination between writers.

**Core modules and their I/O patterns:**

| Module | Files Touched | Read Pattern | Write Pattern |
|--------|--------------|--------------|---------------|
| `state.ts` | `STATE.md` | `fs.readFileSync` per call | `fs.writeFileSync` after regex replace |
| `phase.ts` | `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`, phase dirs | `fs.readFileSync` + `fs.readdirSync` | `fs.writeFileSync` + `fs.mkdirSync`/`fs.renameSync` |
| `roadmap.ts` | `ROADMAP.md`, phase dirs | `fs.readFileSync` or `safeReadFileAsync` | `fs.writeFileSync` |

**Key observations from the code:**

1. **Read-modify-write without locking.** Every mutation follows the pattern: read file, apply regex transformation, write file back. Example from `state.ts` `cmdStatePatch()` (lines 170-194): reads STATE.md, loops through field patches applying `stateReplaceField()`, writes back. If another process writes between read and write, those changes are lost.

2. **Parsing is regex-based.** `stateExtractField()` uses regex to find `**fieldName:** value` patterns. `stateReplaceField()` uses regex substitution. Section extraction uses heading-based regex (`#{2,3}\s*SectionName`). This is tolerant but fragile under concurrent modification.

3. **No caching.** Every CLI invocation reads files from disk. For the CLI tool router (`cli.ts`), this is acceptable since each invocation is a separate process. But a long-running backend server would re-read on every API call.

4. **Phase operations are multi-file.** `phaseCompleteCore()` (phase.ts, lines 215-368) writes to ROADMAP.md, STATE.md, and REQUIREMENTS.md in sequence. A crash between writes leaves inconsistent state.

5. **Dashboard duplicates parsing logic.** The dashboard server (`server.ts`) has its own `parseRoadmap()`, `parseState()`, `parsePhaseTodos()` functions that re-implement the same regex patterns from the CLI core modules.

### Parsing Patterns in Detail

The state module uses two parsing strategies:

- **Field extraction:** `stateExtractField(content, fieldName)` matches `**Field:** value` or plain `Field: value` patterns. Used for scalar fields like Current Phase, Status, Progress.
- **Section extraction:** Regex patterns like `/(#{2,3}\s*Decisions[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n)([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i` extract table bodies and list sections. Used for decisions, blockers, metrics.
- **Table parsing:** `parseTableRow()` splits on `|` while handling escaped pipes. Used for decisions table in `cmdStateSnapshot()`.

The roadmap module adds phase-level parsing:
- **Phase pattern:** `getPhasePattern()` matches `### Phase N: Name` headers.
- **Disk status resolution:** Combines roadmap content with filesystem directory inspection (plan/summary file counts, context/research file existence).

---

## 2. State Storage Options

### Option A: File-Based with Caching Layer (Recommended)

Keep markdown files as the canonical store. Add an in-memory cache that is invalidated by file watcher events.

```
                  +-----------+
  CLI agents ---> | .planning | <--- File watcher
  (direct write)  |  files    |         |
                  +-----------+    invalidate
                       ^               |
                       |          +----------+
                       +--------->|  Cache   |
                                  | (in-mem) |
                                  +----------+
                                       |
                                  Backend API
```

**Pros:**
- Full backward compatibility with existing `.planning/` format (GUARD-03)
- Human-readable files remain the source of truth
- No new dependencies (no native modules like better-sqlite3)
- Works for `npx maxsimcli@latest` without setup

**Cons:**
- Cache invalidation complexity
- Concurrent writes remain a risk (mitigated by strategies in Section 4)
- Parsing overhead on cache miss

**Implementation sketch:**
- `StateCache` class holds parsed representations of STATE.md, ROADMAP.md, phase index
- File watcher marks cache entries as stale on change
- API reads check staleness; re-parse on miss
- Writes go through cache, which writes to file and updates its own state

### Option B: SQLite with Markdown Rendering

Use better-sqlite3 or Node.js native `node:sqlite` as the backend store. Render markdown files on demand for human consumption.

**Pros:**
- Atomic transactions for multi-file operations (phase complete)
- Built-in concurrency handling (SQLite WAL mode)
- Structured queries instead of regex parsing
- Single file (`.planning/maxsim.db`) simplifies backup

**Cons:**
- **Breaks GUARD-03** — existing projects rely on `.planning/` markdown files
- Native dependency (better-sqlite3 requires compilation; `node:sqlite` is still experimental as of Node.js 22)
- Adds ~8MB to npm package size for native bindings
- Agents would need to be updated to read/write through the backend instead of directly editing files
- Human readability is lost unless we maintain dual-write (defeats the purpose)

### Option C: In-Memory with Periodic File Persistence

Hold all state in memory, flush to markdown files on a timer or on explicit save.

**Pros:**
- Fastest reads
- Simple code (no re-parsing)

**Cons:**
- Data loss on crash between flushes
- Conflicts with agent direct-write model (agents write files, backend holds stale memory)
- Not viable when CLI agents are the primary writers

### Verdict

**Option A (file-based with caching) is the clear winner.** It preserves GUARD-03, requires no native dependencies (GUARD-04), and can be incrementally adopted. The cache layer addresses performance while the file watcher handles invalidation.

---

## 3. File Watching

### Chokidar (Currently Used)

The dashboard already uses chokidar v4 for watching `.planning/`:

```typescript
// server.ts lines 289-294
const watcher = watch(planningDir, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  depth: 5,
});
```

Events are debounced at 500ms via `lodash.debounce` (line 298) and broadcast via WebSocket.

**Chokidar v4/v5 status (as of 2025-2026):**
- v4 is the current stable release; v5 is ESM-only with Node.js v20 minimum
- Used in ~30 million repositories (Webpack, Vite, etc.)
- Handles cross-platform differences: FSEvents on macOS, inotify on Linux, ReadDirectoryChangesW on Windows
- `awaitWriteFinish` option handles partial writes by waiting for file size stabilization
- Reliable on Windows (critical for MAXSIM's user base)

### Node.js Native fs.watch / fs.watchFile

`fs.watch` uses OS-level notifications but has well-documented issues:
- Reports events twice on many platforms
- Most changes reported as `rename` rather than `change`
- No recursive watching on Linux (added in Node.js 19.1 but still unreliable)
- Behavior varies wildly across operating systems

`fs.watchFile` uses polling (stat-based), which is reliable but CPU-intensive for many files.

**Vite considered switching from chokidar to native fs.watch** (vitejs/vite#12495) but the effort stalled due to cross-platform edge cases, particularly on Linux and network filesystems.

### Polling Fallback

Some environments (Docker volumes, network drives, WSL2 cross-filesystem) defeat OS-level watchers. A polling fallback with configurable interval (e.g., 2000ms) ensures reliability at the cost of latency.

### Recommendation

**Continue using chokidar.** It is already a dependency, proven in production, handles Windows/macOS/Linux correctly, and the `awaitWriteFinish` option is essential for MAXSIM's use case where agents write files via external processes. Add a polling fallback configuration for problematic environments.

---

## 4. The Concurrency Problem

### The Core Conflict

There are three potential writers to `.planning/` files:

1. **Claude Code agents** — write files directly via Bash tool (`echo > file`) or Write tool
2. **MAXSIM CLI** — writes via `cli.cjs` tool router (invoked by agents via Bash)
3. **MAXSIM Backend/Dashboard** — writes via API endpoints (e.g., todo management, Q&A responses)

Writers 1 and 2 are effectively the same process (agent calls CLI). But writer 3 (the backend) can conflict with writers 1-2 if the user interacts with the dashboard while an agent is executing.

### Scenarios That Cause Data Loss

| Scenario | Risk | Impact |
|----------|------|--------|
| Agent writes STATE.md while backend is reading it | Low | Backend gets partial write (mitigated by `awaitWriteFinish`) |
| Agent and backend both write STATE.md | Medium | Last writer wins; first writer's changes lost |
| `phaseComplete` crashes mid-write | Low | ROADMAP.md updated but STATE.md not (inconsistent) |
| Agent adds blocker while dashboard resolves one | Medium | One operation's changes overwritten |

### Why Traditional Locking Is Insufficient

Claude Code agents write files via OS-level tools (Bash `echo`, Write tool). They do not call MAXSIM APIs and cannot be made to acquire locks. Any locking strategy must work with uncoordinated external writers.

---

## 5. Cache Invalidation Strategy

### Proposed Architecture

```
File Change (agent write)
    |
    v
Chokidar detects change
    |
    v
Debounce (300ms stability + 500ms batch)
    |
    v
Classify change by file type:
  - STATE.md    -> invalidate state cache
  - ROADMAP.md  -> invalidate roadmap cache
  - phases/*    -> invalidate phase index cache for affected phase
  - config.json -> invalidate config cache
    |
    v
Broadcast 'file-changes' via WebSocket
    |
    v
Dashboard re-fetches affected data via API
```

### Debouncing Strategy

The current dashboard uses two levels of debouncing:
1. **Write stability** (`awaitWriteFinish`): waits 300ms after last byte written, polls every 100ms
2. **Batch debounce**: collects changes for 500ms before broadcasting

This is appropriate. For the backend cache, we add:
3. **Cache TTL**: even without watcher events, cache entries expire after 5 seconds as a safety net

### Conflict Detection

When the backend needs to write a file:
1. Read current file content and compute hash (SHA-256 or simple checksum)
2. Apply modifications in memory
3. Before writing, re-read and re-hash
4. If hash changed since step 1, merge or retry (optimistic concurrency)
5. Write file and suppress watcher event for this path (existing `suppressPath()` mechanism)

The dashboard already implements write suppression (server.ts lines 201-228):
```typescript
const suppressedPaths = new Map<string, number>();
const SUPPRESS_TTL_MS = 500;

function suppressPath(filePath: string): void {
  suppressedPaths.set(normalizeFsPath(filePath), Date.now());
}
```

This prevents the watcher from triggering cache invalidation for the backend's own writes — a correct and necessary optimization.

---

## 6. State Format Decision

### Keep Markdown (Recommended)

**Arguments for markdown:**
- **GUARD-03 compliance:** "MUST NOT break existing `.planning/` file format (existing projects must still work)"
- **Human readability:** Users inspect and manually edit STATE.md, ROADMAP.md
- **Agent compatibility:** Claude Code agents can read/write markdown natively without any API
- **Git-friendly:** Markdown diffs are meaningful in version control
- **No migration needed:** Existing MAXSIM projects continue working

**Arguments against markdown:**
- Regex parsing is brittle (already ~30 regex patterns across state.ts, roadmap.ts)
- No schema enforcement (malformed markdown silently breaks operations)
- Multi-field updates are not atomic

### Structured Data Alternative

If we were starting fresh, a hybrid approach would be ideal:
- Store data in JSON/SQLite
- Render markdown views on demand
- Agents interact through MCP tools, not file editing

But this is not feasible for v1 because:
- Agents already edit `.planning/` files directly
- Existing projects have established `.planning/` directories
- The migration path is complex and risks breaking GUARD-03

### Pragmatic Middle Ground

Keep markdown as canonical format. Internally, parse into typed structures on load and serialize back on write. The `StateSnapshot` type in `types.ts` already models this for state. Extend this pattern to roadmap and phase data.

---

## 7. "Single Source of Truth" Tension

### The BE-05 Problem

The requirement that "the backend is the source of truth" conflicts with the reality that Claude Code agents write `.planning/` files directly. The backend cannot be the authoritative source if external processes bypass it.

### Resolution: Backend as Coordinator, Files as Truth

Redefine "source of truth" pragmatically:

1. **Files are the persistent truth.** Whatever is on disk is canonical. Period.
2. **Backend is the authoritative reader.** All consumers (dashboard, API clients) get state through the backend, which provides a consistent, parsed view.
3. **Backend is a preferred writer.** When the backend writes (via API), it uses the cache + write suppression path for consistency.
4. **Agents are tolerated writers.** When agents write directly, the file watcher detects the change and the backend updates its view.

This is analogous to how Git works: the `.git` directory is the truth, but `git status` (the "backend") provides the authoritative parsed view. External tools can modify the working tree, and Git detects the changes.

### Practical Implementation

```
Agent writes STATE.md directly
    |
    v
Chokidar detects change -> Backend re-parses -> Cache updated
    |
    v
Dashboard queries backend API -> Gets fresh parsed state
```

For backend-initiated writes:
```
Dashboard user resolves blocker
    |
    v
Backend reads STATE.md, applies change, writes STATE.md
    |
    v
Suppress watcher for this path -> Cache updated immediately
    |
    v
WebSocket broadcast to other dashboard clients
```

---

## 8. Optimistic vs Pessimistic Locking

### Pessimistic Locking (File Locks)

Using `proper-lockfile` or similar:

```typescript
import { lock } from 'proper-lockfile';

const release = await lock('STATE.md', { retries: 3 });
try {
  const content = fs.readFileSync('STATE.md', 'utf-8');
  // modify
  fs.writeFileSync('STATE.md', modified, 'utf-8');
} finally {
  await release();
}
```

**Problems:**
- Agents do not acquire locks (they use Bash/Write tools directly)
- Lock files (`.lock`) would clutter `.planning/` directory
- Stale locks from crashed processes require timeout-based cleanup
- Cross-platform lock behavior varies (network drives, WSL2)

**Verdict:** Not viable as the primary strategy because one of the writers (Claude Code agents) cannot be made to participate.

### Optimistic Concurrency (Recommended)

Read-check-write pattern:

1. Read file, store content hash
2. Compute modifications in memory
3. Before writing, re-read file and check hash
4. If unchanged, write; if changed, merge or retry

```typescript
async function optimisticWrite(
  filePath: string,
  transform: (content: string) => string,
  maxRetries = 3,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const hash = computeHash(content);
    const modified = transform(content);

    // Re-read and verify
    const current = await fs.promises.readFile(filePath, 'utf-8');
    if (computeHash(current) === hash) {
      await fs.promises.writeFile(filePath, modified, 'utf-8');
      return true;
    }

    // Content changed between read and write — re-apply transform to new content
    // (retry loop handles this)
  }
  return false; // failed after retries
}
```

**Why this works for MAXSIM:**
- Backend writes are infrequent (user actions in dashboard)
- Agent writes are bursty but sequential within a single agent session
- The conflict window (time between read and write) is milliseconds
- Even if a conflict occurs, retry with fresh content usually succeeds

### Hybrid Approach for Multi-File Operations

For operations like `phaseComplete` that write multiple files:

1. Read all files into memory
2. Compute all modifications
3. Write files in rapid succession (minimize conflict window)
4. Verify consistency after write
5. If inconsistent, re-read and re-apply

This is not transactional, but for the expected workload (single developer, one agent at a time), it is sufficient.

---

## Recommendation

### Architecture Decision

1. **Keep markdown files as the canonical data format** (GUARD-03 compliance)
2. **Add an in-memory caching layer** in the backend that holds parsed representations of STATE.md, ROADMAP.md, phase index, and config
3. **Use chokidar for file watching** (already proven in the dashboard)
4. **Implement optimistic concurrency** for backend writes with hash-based conflict detection and retry
5. **Redefine "source of truth"** (per Section 7): files are persistent truth, backend is the authoritative reader and preferred writer
6. **Consolidate parsing logic**: the dashboard's duplicate parsing functions (`parseRoadmap`, `parseState`, etc.) should be replaced by the core module functions from `packages/cli/src/core/`

### Implementation Priority

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Caching layer with file watcher invalidation | Medium |
| P0 | Optimistic write with conflict detection | Low |
| P1 | Consolidate dashboard + CLI parsing into shared core | Medium |
| P1 | Write suppression for backend writes (already exists) | Done |
| P2 | Polling fallback for file watcher in problematic environments | Low |
| P2 | Multi-file operation consistency checks | Low |

### What NOT to Do

- Do not introduce SQLite or any native dependency for state storage
- Do not implement pessimistic file locking (agents cannot participate)
- Do not move state out of `.planning/` markdown files
- Do not require agents to write through the backend API (they must remain able to use Bash/Write tools directly)

---

## References

- `packages/cli/src/core/state.ts` — State module with field extraction, section manipulation, snapshot
- `packages/cli/src/core/phase.ts` — Phase lifecycle (add, insert, remove, complete) with multi-file writes
- `packages/cli/src/core/roadmap.ts` — Roadmap parsing and progress tracking
- `packages/dashboard/src/server.ts` — Chokidar file watcher (lines 282-325), write suppression (lines 201-228)
- `.planning/REQUIREMENTS.md` — GUARD-03 (file format stability), GUARD-04 (npm package completeness)
- [chokidar GitHub](https://github.com/paulmillr/chokidar) — Cross-platform file watching library
- [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile) — Inter-process lockfile utility (evaluated, not recommended)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Embedded SQLite for Node.js (evaluated, not recommended)
- [Vite fs.watch discussion](https://github.com/vitejs/vite/issues/12495) — Why native fs.watch is not ready to replace chokidar
