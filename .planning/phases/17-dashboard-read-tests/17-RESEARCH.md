# Phase 17: Dashboard Read Tests - Research

**Researched:** 2026-02-25
**Domain:** Vitest E2E testing of a Next.js server process spawned from an installed npm path
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Test file placement**
- Single test file: `packages/e2e/src/dashboard.test.ts`
- Sits alongside existing `install.test.ts` and `tools.test.ts` in the same Vitest E2E suite
- No new Vitest config needed — picked up automatically

**Server lifecycle**
- Spawn dashboard server in `beforeAll`, kill in `afterAll` of the `describe('dashboard read API')` block
- NOT in globalSetup — server is dashboard-test-specific, not needed for install/tools tests
- Use `child_process.spawn('node', [serverPath])` — non-blocking, returns a handle
- Kill with `server.kill('SIGTERM')` in afterAll; wait for `'close'` event before resolving

**Server path and env**
- Dashboard server path: `join(inject('installDir'), '.claude', 'dashboard', 'server.js')`
- `inject('installDir')` is already provided by the existing globalSetup
- Spawn env: `{ ...process.env, MAXSIM_PROJECT_CWD: mockProject.dir, PORT: String(port) }`
- Use a dynamically chosen free port (random in range 13000–13999) to avoid CI conflicts

**Mock project**
- Reuse existing `createMockProject()` from `fixtures/mock-project.ts` — it already has PROJECT.md, ROADMAP.md, STATE.md, and a pending todo
- Create the mock project in `beforeAll`, clean it up in `afterAll`
- The mock has the exact fields the dashboard parsers read: project name, phase list, decisions, blocker section, todos

**Health poll strategy**
- Poll `/api/health` immediately after spawn, retry every 250ms
- Timeout: 30 seconds total — throw if no response by then
- No fixed `sleep()` calls — pure retry loop using `fetch` with `signal: AbortSignal.timeout(500)` per attempt
- On `{ status: 'ok' }` received, proceed to endpoint tests

**Endpoint assertions (what to verify)**
- `/api/health` → `res.status === 200` and `body.status === 'ok'`
- `/api/project` → `body` contains the string `"Mock Test Project"` (project name from mock) and `"Validates maxsim-tools"` (core value substring)
- `/api/phases` → `Array.isArray(body)`, `body.length === 2`, names include `"Foundation"` and `"Integration"`, all statuses are `"pending"`
- `/api/state` → `body.decisions` is an array containing an entry matching `"Mock decision one"`
- `/api/todos` → `Array.isArray(body)`, at least one entry with title matching `"Test Task"`

**What to assert vs. leave loose**
- Assert field presence and key values — do NOT assert exact object shapes or extra fields
- Assertions should survive minor dashboard parser additions (new fields) without failing
- Use `expect(body).toMatchObject({...})` style where applicable

**`vitest.d.ts` update**
- Add `dashboardPath: string` to `ProvidedContext` only IF globalSetup is extended to provide it
- Preferred: avoid extending globalSetup — compute dashboard path inline in the test from `installDir`
- This keeps globalSetup single-responsibility (pack + install only)

### Claude's Discretion
- Exact port selection implementation (random pick or fixed fallback)
- Whether to use Node built-in `fetch` or `node:http` for polling
- Stdout/stderr capture from spawned server (pipe vs ignore)
- Exact error message when server fails to start within 30s

### Deferred Ideas (OUT OF SCOPE)
- Dashboard write API tests (PATCH task toggle, PUT state) — Phase 18
- Testing `/api/phase/[id]` and `/api/plan/[...path]` endpoints — may be added to Phase 17 if trivial, otherwise Phase 18 or later
- WebSocket/live-reload testing — out of scope entirely for E2E test suite
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Dashboard server spawns from installed path, starts without errors, `/api/health` returns `{ status: 'ok' }` within 30s | pollUntilReady pattern + beforeAll/afterAll lifecycle; server.js at `{installDir}/.claude/dashboard/server.js` |
| DASH-02 | `/api/project` returns data matching mock PROJECT.md (project name, core value present) | `parseProject()` returns `{ project: string, requirements: string }` — assert `body.project` contains "Mock Test Project" and "Validates maxsim-tools" |
| DASH-03 | `/api/phases` returns phases array matching mock ROADMAP.md (correct phase count, names, statuses) | `parsePhases()` scans `.planning/phases/` dirs — mock has `01-foundation` dir, asserts `body.length === 2` from ROADMAP.md parse requires ROADMAP approach |
| DASH-04 | `/api/state` returns data matching mock STATE.md (decisions, blockers present) | `parseState()` extracts decisions array — assert `body.decisions` includes "Mock decision one" |
| DASH-05 | `/api/todos` returns todos array matching mock `todos/` directory (pending todos present) | `parseTodos()` returns `{ pending, completed }` — assert `body.pending` includes entry with "Test Task" |
</phase_requirements>

## Summary

Phase 17 adds `dashboard.test.ts` to the existing Vitest E2E suite in `packages/e2e/src/`. The test spawns the dashboard server process from the path installed by globalSetup (`{installDir}/.claude/dashboard/server.js`), waits for `/api/health` to respond, then validates five read-only API endpoints against a mock project fixture.

The dashboard's `server.js` is a tsdown-compiled CJS bundle produced by `packages/dashboard/build:standalone` — it uses `detectPort(3333)` internally and does NOT read `process.env.PORT`. This means the test cannot pre-assign a port via env var; instead, it must discover the actual port from the server's stderr output (the server logs `Dashboard ready at http://localhost:{port}` to stderr on startup). The poll strategy must target this discovered port.

The mock fixture (`createMockProject()`) already contains all the data the API endpoints parse: PROJECT.md with "Mock Test Project", ROADMAP.md with 2 phases ("Foundation" and "Integration"), STATE.md with "Mock decision one" decision, and one pending todo "todo-001-test-task.md". The API parser behaviors are fully understood from reading `packages/dashboard/lib/parsers.ts`.

**Primary recommendation:** Implement dashboard.test.ts with server port discovery via stderr parsing, beforeAll/afterAll lifecycle, and the existing pollUntilReady pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | (from workspace) | Test runner + inject() + beforeAll/afterAll | Already the E2E suite runner; no new setup needed |
| node:child_process | built-in | `spawn()` to start server process non-blocking | Standard Node.js; no extra dependency |
| node:fetch / global fetch | Node 22 built-in | HTTP polling for health check and endpoint assertions | Node 22 is project minimum; global fetch is available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:os | built-in | `tmpdir()` for mock project path (via createMockProject) | Used by existing mock fixture |
| node:path | built-in | path joining for installDir, serverPath | Used throughout E2E suite |
| node:timers/promises | built-in | `setImmediate` or `setTimeout` with promises if needed | Only if pure polling loop needs it |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| stderr parsing for port | `get-port` npm package | CONTEXT.md allows `get-port` but since server ignores PORT env var, parsing stderr is the correct approach |
| global fetch | node:http requests | Global fetch is cleaner; Node 22 has it; no reason to use http module |
| AbortSignal.timeout(500) | manual timeout race | AbortSignal.timeout is cleaner; available in Node 22 |

**Installation:**
```bash
# No new dependencies needed — global fetch (Node 22), spawn, and existing vitest are sufficient
# If get-port is needed for a pre-pick fallback: pnpm add -w get-port
```

## Architecture Patterns

### Recommended Project Structure
```
packages/e2e/src/
├── globalSetup.ts           # UNCHANGED: pack + install only
├── vitest.d.ts              # No change needed (do NOT add dashboardPath)
├── install.test.ts          # UNCHANGED
├── tools.test.ts            # UNCHANGED
├── dashboard.test.ts        # NEW: Phase 17 deliverable
└── fixtures/
    └── mock-project.ts      # UNCHANGED: reuse createMockProject()
```

### Pattern 1: Server Lifecycle with Port Discovery

The server.js uses `detectPort(3333)` internally and logs the actual port to stderr. The test must capture stderr, extract the port, then poll that port.

**What:** Spawn server, capture stderr, parse `"Dashboard ready at http://localhost:{port}"` line
**When to use:** Any time the spawned process owns port selection

```typescript
// Source: packages/dashboard/server.ts + server.js (line 94/151)
// The server logs: console.error(`Dashboard ready at ${url}`);
// url = `http://localhost:${port}` where port = await detectPort(3333)

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { inject } from 'vitest';
import { createMockProject, type MockProject } from './fixtures/mock-project.js';

let server: ReturnType<typeof spawn> | null = null;
let baseUrl = '';
let mockProject: MockProject | null = null;

beforeAll(async () => {
  mockProject = createMockProject();
  const serverPath = join(inject('installDir'), '.claude', 'dashboard', 'server.js');
  const serverDir = join(inject('installDir'), '.claude', 'dashboard');

  server = spawn('node', [serverPath], {
    cwd: serverDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MAXSIM_PROJECT_CWD: mockProject.dir,
      NODE_ENV: 'production',
    },
  });

  // Capture port from stderr output
  baseUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Dashboard failed to start within 30s')), 30_000);

    server!.stderr!.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const match = text.match(/Dashboard ready at (http:\/\/localhost:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });

    server!.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    server!.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}, 35_000); // Generous timeout for server startup

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.on('close', () => resolve());
      server!.kill('SIGTERM');
      setTimeout(resolve, 5_000); // Force resolve after 5s
    });
  }
  mockProject?.cleanup();
});
```

### Pattern 2: Health Poll as Fallback Verification

Even after the port is discovered via stderr, poll `/api/health` to confirm the server is ready for requests (Next.js app may not be fully ready right when the server logs the URL).

```typescript
async function pollUntilReady(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (res.ok) {
        const body = await res.json() as { status: string };
        if (body.status === 'ok') return;
      }
    } catch {
      // Not ready yet, retry
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}
```

### Pattern 3: API Response Assertions

Follow the CONTEXT.md directive: assert field presence and key values using `toMatchObject`-style patterns, NOT exact shapes.

```typescript
it('/api/project returns mock project data', async () => {
  const res = await fetch(`${baseUrl}/api/project`);
  expect(res.status).toBe(200);
  const body = await res.json() as { project: string | null; requirements: string | null };
  expect(body.project).toContain('Mock Test Project');
  expect(body.project).toContain('Validates maxsim-tools');
});

it('/api/phases returns correct phase count', async () => {
  const res = await fetch(`${baseUrl}/api/phases`);
  expect(res.status).toBe(200);
  const body = await res.json() as Array<{ name: string; diskStatus: string }>;
  expect(Array.isArray(body)).toBe(true);
  // NOTE: parsePhases() scans .planning/phases/ dirs — mock only has 01-foundation dir
  // So body.length === 1, not 2. See CRITICAL FINDING below.
  const names = body.map(p => p.name.toLowerCase());
  expect(names.some(n => n.includes('foundation'))).toBe(true);
});

it('/api/state returns decisions', async () => {
  const res = await fetch(`${baseUrl}/api/state`);
  expect(res.status).toBe(200);
  const body = await res.json() as { decisions: string[] };
  expect(Array.isArray(body.decisions)).toBe(true);
  expect(body.decisions.some(d => d.includes('Mock decision one'))).toBe(true);
});

it('/api/todos returns pending todos', async () => {
  const res = await fetch(`${baseUrl}/api/todos`);
  expect(res.status).toBe(200);
  const body = await res.json() as { pending: Array<{ text: string }> };
  expect(Array.isArray(body.pending)).toBe(true);
  expect(body.pending.some(t => t.text === 'Test Task')).toBe(true);
});
```

### Anti-Patterns to Avoid

- **Setting PORT env var and expecting the server to use it:** The server.js uses `detectPort(3333)`, not `process.env.PORT`. Setting PORT in spawn env has no effect on the port the server binds to.
- **Fixed sleep before assertions:** Never use `await new Promise(r => setTimeout(r, 5000))`. Use the port-discovery + health-poll pattern.
- **Using `exec` instead of `spawn`:** `exec` buffers all output and doesn't support streaming stderr for port discovery. Use `spawn` with `stdio: ['ignore', 'pipe', 'pipe']`.
- **Asserting `body.phases.length === 2`:** The `/api/phases` endpoint uses `parsePhases()` which scans `.planning/phases/` directories — the mock only has `01-foundation/` dir, so it returns length 1. ROADMAP.md-based length (2 phases) requires `/api/roadmap` or similar, not `/api/phases`. See Critical Findings.
- **Forgetting `afterAll` cleanup:** Leaked server processes will block subsequent test runs on port 3333+.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Port assignment | Custom port-allocation logic with retries | stderr parsing of server startup message | Server owns the port via detectPort; no way to pre-set it |
| Polling with retries | Custom exponential backoff | Simple 250ms retry loop with deadline | The 30s window is generous; exponential backoff adds complexity with no benefit here |
| Process cleanup | Kill + immediate resolve | Kill + wait for `'close'` event | Avoids EADDRINUSE on next test run if port lingers |

**Key insight:** The test is a thin integration harness — the complexity lives in the dashboard server and parsers, not in the test.

## Common Pitfalls

### Pitfall 1: PORT env var does not control server port
**What goes wrong:** Test passes `PORT: '13000'` in spawn env, tries to poll `http://localhost:13000/api/health`, server is actually on 3333 (or whatever detectPort found).
**Why it happens:** `server.ts` never reads `process.env.PORT`. It calls `detectPort(3333)` directly (verified in both `server.ts` source and `server.js` compiled bundle, line 150).
**How to avoid:** Capture stderr stream and parse `"Dashboard ready at http://localhost:{port}"`. Use that port for all fetch calls.
**Warning signs:** Poll times out despite server process being alive.

### Pitfall 2: /api/phases returns 1 phase, not 2
**What goes wrong:** Asserting `body.length === 2` because ROADMAP.md has 2 phases; actual response has 1 because `parsePhases()` scans `.planning/phases/` directories.
**Why it happens:** `parsePhases()` (in `packages/dashboard/lib/parsers.ts`, line 234-286) reads from filesystem dirs — the mock only creates `01-foundation/` dir, not a `02-integration/` dir.
**How to avoid:** Assert `body.length === 1` and check that the returned phase has name containing "Foundation". OR add a `02-integration` dir to the mock fixture in a Wave 0 task.
**Warning signs:** Test fails with `Expected 2, received 1` on phases length assertion.

### Pitfall 3: Next.js not ready when server URL appears in stderr
**What goes wrong:** Port is parsed from stderr, immediate fetch to `/api/health` fails with ECONNREFUSED.
**Why it happens:** The server logs the URL in the `server.listen()` callback, but Next.js may still be initializing route handlers (especially in standalone mode with `app.prepare()` which is async).
**How to avoid:** After capturing the port from stderr, still run the `pollUntilReady` loop. The two-step approach (port discovery + health poll) is robust.
**Warning signs:** First health check fails even though port was correctly parsed.

### Pitfall 4: Dashboard build not present in dist/assets/
**What goes wrong:** E2E test fails at beforeAll because `{installDir}/.claude/dashboard/server.js` does not exist.
**Why it happens:** The dashboard was NOT built with `STANDALONE_BUILD=true` before `npm pack`. The current local dev build in `dist/assets/dashboard/` has no `server.js` (only `.next/static/`).
**How to avoid:** Before running `nx run e2e:e2e`, first run `STANDALONE_BUILD=true nx build dashboard && nx build cli`. On Windows this requires Git Bash or WSL (STANDALONE_BUILD env var). CI already does this.
**Warning signs:** `beforeAll` throws "server.js not found" or install.test.ts's server.js existence check fails.

### Pitfall 5: Server process leaks if beforeAll throws
**What goes wrong:** If server spawns but port discovery times out, `server` variable is set but `afterAll` never kills it cleanly.
**Why it happens:** If the Promise rejects, control jumps out of beforeAll; afterAll still runs, but `server` may be in a partially started state.
**How to avoid:** Always set `server` before starting port discovery, and in `afterAll` check `if (server) { server.kill() }`.

### Pitfall 6: Mock project dir cleaned up before server finishes using it
**What goes wrong:** `mockProject.cleanup()` runs while server is still processing a request, causing ENOENT in the parser.
**Why it happens:** Cleanup happens in `afterAll` in same block; if assertions fail mid-test, cleanup order matters.
**How to avoid:** Kill server fully (wait for `close` event) before calling `mockProject.cleanup()`. Sequence: kill → wait close → cleanup.

### Pitfall 7: `hookTimeout` not sufficient for server startup
**What goes wrong:** beforeAll times out because vitest's `hookTimeout` (120s per config) is plenty, but the nested Promise timeout is 30s, which may not account for Next.js startup time in standalone mode.
**Why it happens:** Standalone Next.js startup cold-start can be 15-25 seconds on slow CI machines.
**How to avoid:** Keep 30s timeout (per CONTEXT.md decision). The `beforeAll` explicit timeout should be `35_000` (slightly more than 30s Promise timeout) to give a clear error.

## Code Examples

### Full dashboard.test.ts skeleton

```typescript
// Source: derived from packages/e2e/src/tools.test.ts pattern + CONTEXT.md decisions

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inject } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { createMockProject, type MockProject } from './fixtures/mock-project.js';

let server: ChildProcess | null = null;
let baseUrl = '';
let mockProject: MockProject | null = null;

async function pollUntilReady(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (res.ok) {
        const body = await res.json() as { status: string };
        if (body.status === 'ok') return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

describe('dashboard read API', () => {
  beforeAll(async () => {
    mockProject = createMockProject();
    const installDir = inject('installDir');
    const serverPath = join(installDir, '.claude', 'dashboard', 'server.js');
    const serverDir = join(installDir, '.claude', 'dashboard');

    server = spawn('node', [serverPath], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MAXSIM_PROJECT_CWD: mockProject.dir,
        NODE_ENV: 'production',
      },
    });

    // Discover actual port from stderr
    baseUrl = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Dashboard did not start within 30s')),
        30_000
      );

      server!.stderr!.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        const match = text.match(/Dashboard ready at (http:\/\/localhost:\d+)/);
        if (match) {
          clearTimeout(timeout);
          resolve(match[1]);
        }
      });

      server!.on('error', (err) => { clearTimeout(timeout); reject(err); });
      server!.on('exit', (code) => {
        if (code !== 0) { clearTimeout(timeout); reject(new Error(`Server exited ${code}`)); }
      });
    });

    // Confirm API is responsive
    await pollUntilReady(baseUrl, 10_000);
  }, 35_000);

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.on('close', () => resolve());
        server!.kill('SIGTERM');
        setTimeout(resolve, 5_000);
      });
    }
    mockProject?.cleanup();
  });

  it('DASH-01: /api/health returns { status: ok }', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('DASH-02: /api/project contains mock project name and core value', async () => {
    const res = await fetch(`${baseUrl}/api/project`);
    expect(res.status).toBe(200);
    const body = await res.json() as { project: string | null };
    expect(body.project).toContain('Mock Test Project');
    expect(body.project).toContain('Validates maxsim-tools');
  });

  it('DASH-03: /api/phases returns phases array with Foundation', async () => {
    const res = await fetch(`${baseUrl}/api/phases`);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ name: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    const names = body.map(p => p.name.toLowerCase());
    expect(names.some(n => n.includes('foundation'))).toBe(true);
  });

  it('DASH-04: /api/state contains Mock decision one', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
    const body = await res.json() as { decisions: string[] };
    expect(Array.isArray(body.decisions)).toBe(true);
    expect(body.decisions.some(d => d.includes('Mock decision one'))).toBe(true);
  });

  it('DASH-05: /api/todos contains pending Test Task', async () => {
    const res = await fetch(`${baseUrl}/api/todos`);
    expect(res.status).toBe(200);
    const body = await res.json() as { pending: Array<{ text: string }> };
    expect(Array.isArray(body.pending)).toBe(true);
    expect(body.pending.some(t => t.text === 'Test Task')).toBe(true);
  });
});
```

### API Response Shapes (from parsers.ts)

```typescript
// /api/health (from packages/dashboard/app/api/health/route.ts)
{ status: 'ok', port: number, cwd: string, uptime: number }

// /api/project (from parseProject() in parsers.ts)
{ project: string | null, requirements: string | null }
// project = raw text of .planning/PROJECT.md

// /api/phases (from parsePhases() in parsers.ts)
Array<{
  number: string,       // e.g. "01"
  name: string,         // e.g. "foundation" (derived from dir name, dashes→spaces)
  goal: string,         // always '' (parsePhases doesn't read ROADMAP details)
  dependsOn: string[],  // always []
  planCount: number,
  summaryCount: number,
  diskStatus: 'empty' | 'planned' | 'partial' | 'complete' | 'no_directory',
  roadmapComplete: boolean,
  hasContext: boolean,
  hasResearch: boolean,
}>
// NOTE: only returns phases with .planning/phases/ directories, NOT ROADMAP.md entries

// /api/state (from parseState() in parsers.ts)
{
  position: string | null,
  lastActivity: string | null,
  currentPhase: string | null,
  currentPlan: string | null,
  status: string | null,
  progress: string | null,
  decisions: string[],  // bullet points from ### Decisions section
  blockers: string[],   // bullet points from ### Blockers/Concerns section
  content: string,      // full raw STATE.md content
}

// /api/todos (from parseTodos() in parsers.ts)
{
  pending: Array<{ text: string, completed: false, file: string }>,
  completed: Array<{ text: string, completed: true, file: string }>,
}
// text = "title:" frontmatter field OR filename without .md
// mock todo has: title: Test Task (line 1 is "# Todo: Test Task", no title: frontmatter)
```

**CRITICAL: Todo text extraction.** The `parseTodos()` function looks for `title:` frontmatter with `content.match(/^title:\s*(.+)$/m)`. The mock todo file starts with `# Todo: Test Task` — there is NO `title:` line. So `text` will be `file.replace('.md', '')` = `"todo-001-test-task"`, NOT `"Test Task"`.

The CONTEXT.md assertion says: `at least one entry with title matching "Test Task"`. This will fail unless:
a) The mock fixture is updated to add `title: Test Task` line to the todo file, OR
b) The assertion uses the filename-derived text: `"todo-001-test-task"`

**Recommendation:** Wave 0 task: update mock fixture todo file to add `title: Test Task` as first line (before the `#` heading). This is a 1-line change to `mock-project.ts`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| wait-on npm package for server polling | inline pollUntilReady loop | Phase 16 design decision | No extra dep; matches project pattern |
| Fixed port (3333) for test server | Port discovery via stderr | Phase 17 research finding | Tests don't conflict if 3333 is in use |
| get-port for pre-spawn port | N/A — server owns port | Phase 17 research finding | Test must discover port from server output |

**Deprecated/outdated:**
- `process.env.PORT` in spawn env: The current `server.js` does not read this env var. Setting it has no effect. This was a false assumption in the CONTEXT.md design (`PORT: String(port)` in spawn env is a no-op).

## Open Questions

1. **DASH-03 phase count: 1 or 2?**
   - What we know: `parsePhases()` scans `.planning/phases/` dirs. Mock creates only `01-foundation/` dir.
   - What's unclear: CONTEXT.md says `body.length === 2`. But the current mock only creates 1 phase dir.
   - Recommendation: Either add `02-integration/` dir to mock fixture, OR change assertion to `body.length >= 1` with name checks. Adding the dir to mock is cleaner (aligns assertion with ROADMAP.md entry count).

2. **DASH-05 todo text: "Test Task" vs "todo-001-test-task"**
   - What we know: `parseTodos()` reads `title:` frontmatter. Mock todo file has no `title:` line.
   - What's unclear: Should the mock be updated or should the assertion match filename-derived text?
   - Recommendation: Wave 0 task: update `mock-project.ts` todo file to prepend `title: Test Task\n` before the `# Todo:` heading.

3. **Browser open suppression in E2E context**
   - What we know: `server.ts` calls `open(url)` after startup, which tries to open a browser.
   - What's unclear: Does `open()` fail silently in headless CI? The code has `.catch(() => {})` so it should be fine.
   - Recommendation: No action needed — `open()` failures are already suppressed.

4. **MAXSIM_PROJECT_CWD vs dashboard.json**
   - What we know: The production flow writes `dashboard.json` next to the dashboard dir with `{ projectCwd }`. In tests, we set `MAXSIM_PROJECT_CWD` env var directly.
   - What's unclear: Does the server respect `MAXSIM_PROJECT_CWD` over `dashboard.json`?
   - Recommendation: Confirmed — `getProjectCwd()` in parsers.ts returns `process.env.MAXSIM_PROJECT_CWD || process.cwd()`. Env var wins. No `dashboard.json` needed.

## Sources

### Primary (HIGH confidence)
- `packages/dashboard/server.ts` - Server startup, port behavior, `detectPort(3333)` confirmed
- `packages/dashboard/server.js` (compiled) - Same logic confirmed in built artifact, line 150: `const port = await detectPort(3333);`
- `packages/dashboard/lib/parsers.ts` - All API response shapes verified directly
- `packages/dashboard/app/api/*/route.ts` - All 5 endpoint implementations read directly
- `packages/e2e/src/fixtures/mock-project.ts` - Exact mock content confirmed
- `packages/e2e/src/globalSetup.ts` - inject() pattern confirmed; installDir path confirmed
- `packages/e2e/vitest.config.ts` - hookTimeout: 120_000; testTimeout: 60_000 confirmed

### Secondary (MEDIUM confidence)
- `packages/dashboard/package.json` - `build:standalone` script shows server.js compilation path
- `packages/cli/scripts/copy-assets.cjs` - How dashboard lands in dist/assets/dashboard/
- `packages/cli/src/install.ts` (line 1488-1503) - How dashboard is installed to `{installDir}/.claude/dashboard/`

### Tertiary (LOW confidence)
- None — all findings are verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vitest + Node built-ins confirmed from existing codebase
- Architecture: HIGH — all server internals read directly; API shapes confirmed from parsers.ts
- Pitfalls: HIGH — PORT env var finding and phase count finding confirmed directly from source

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable codebase; dashboard server API unlikely to change before Phase 18)
