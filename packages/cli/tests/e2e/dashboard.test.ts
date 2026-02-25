import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inject } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
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
      // Not ready yet — retry
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

// File-level lifecycle: runs once for ALL describe blocks in this file
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

  // Step 1: Discover actual port from stderr — server owns port via detectPort(3333)
  baseUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Dashboard did not log startup URL within 30s')),
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

    server!.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });

    server!.on('exit', (code: number | null) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Dashboard server exited with code ${code}`));
      }
    });
  });

  // Step 2: Poll /api/health to confirm Next.js is fully ready for requests
  await pollUntilReady(baseUrl, 10_000);
}, 35_000);

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.on('close', () => resolve());
      server!.kill('SIGTERM');
      // Force resolve after 5s to avoid hanging afterAll
      setTimeout(resolve, 5_000);
    });
    server = null;
  }
  mockProject?.cleanup();
  mockProject = null;
});

describe('dashboard read API', () => {
  it('DASH-01: /api/health returns { status: ok }', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('DASH-02: /api/project contains mock project name and core value', async () => {
    const res = await fetch(`${baseUrl}/api/project`);
    expect(res.status).toBe(200);
    const body = await res.json() as { project: string | null; requirements: string | null };
    expect(body.project).toContain('Mock Test Project');
    expect(body.project).toContain('Validates maxsim-tools');
  });

  it('DASH-03: /api/phases returns array with foundation and integration phases', async () => {
    const res = await fetch(`${baseUrl}/api/phases`);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ name: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    const names = body.map(p => p.name.toLowerCase());
    expect(names.some(n => n.includes('foundation'))).toBe(true);
    expect(names.some(n => n.includes('integration'))).toBe(true);
    // Note: diskStatus values are filesystem-derived ('empty', 'planned', etc.) — not 'pending'
    // Asserting on diskStatus is intentionally omitted; name presence is the meaningful check
  });

  it('DASH-04: /api/state decisions array contains Mock decision one', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
    const body = await res.json() as { decisions: string[] };
    expect(Array.isArray(body.decisions)).toBe(true);
    expect(body.decisions.some(d => d.includes('Mock decision one'))).toBe(true);
  });

  it('DASH-05: /api/todos pending array contains Test Task', async () => {
    const res = await fetch(`${baseUrl}/api/todos`);
    expect(res.status).toBe(200);
    const body = await res.json() as { pending: Array<{ text: string }> };
    expect(Array.isArray(body.pending)).toBe(true);
    expect(body.pending.some(t => t.text === 'Test Task')).toBe(true);
  });
});

describe('dashboard write API', () => {
  it('DASH-06: PUT /api/plan writes [x] to plan file on disk', async () => {
    const planPath = join(
      mockProject!.dir,
      '.planning',
      'phases',
      '01-foundation',
      '01-01-PLAN.md'
    );
    const originalContent = readFileSync(planPath, 'utf-8');

    // Ensure starting state is unchecked
    expect(originalContent).toContain('[ ] Task one');

    // Modify: replace [ ] with [x]
    const updatedContent = originalContent.replace('[ ] Task one', '[x] Task one');

    try {
      const res = await fetch(
        `${baseUrl}/api/plan/phases/01-foundation/01-01-PLAN.md`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent }),
        }
      );
      expect(res.status).toBe(200);
      const body = await res.json() as { written: boolean; path: string };
      expect(body.written).toBe(true);

      // Ground truth: read file directly from disk (not via GET endpoint)
      const diskContent = readFileSync(planPath, 'utf-8');
      expect(diskContent).toContain('[x] Task one');
    } finally {
      // Restore original file state regardless of test outcome
      writeFileSync(planPath, originalContent, 'utf-8');
    }
  });

  it('DASH-07: PATCH /api/state writes updated field to STATE.md on disk', async () => {
    const statePath = join(mockProject!.dir, '.planning', 'STATE.md');
    const originalContent = readFileSync(statePath, 'utf-8');

    try {
      const res = await fetch(`${baseUrl}/api/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'Status', value: 'Write test in progress' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { updated: boolean; field: string };
      expect(body.updated).toBe(true);
      expect(body.field).toBe('Status');

      // Ground truth: read file directly from disk (not via GET endpoint)
      const diskContent = readFileSync(statePath, 'utf-8');
      expect(diskContent).toContain('Write test in progress');
    } finally {
      // Restore original file state regardless of test outcome
      writeFileSync(statePath, originalContent, 'utf-8');
    }
  });
});
