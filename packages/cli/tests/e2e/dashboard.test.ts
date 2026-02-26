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

  // Step 2: Poll /api/health to confirm server is fully ready for requests
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

// ─── Read API ─────────────────────────────────────────────────────────────────

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

  it('DASH-03: /api/phases returns all 4 mock phases by name', async () => {
    const res = await fetch(`${baseUrl}/api/phases`);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ name: string; diskStatus: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(4);
    const names = body.map(p => p.name.toLowerCase());
    expect(names.some(n => n.includes('foundation'))).toBe(true);
    expect(names.some(n => n.includes('integration'))).toBe(true);
    expect(names.some(n => n.includes('discussion'))).toBe(true);
    expect(names.some(n => n.includes('research'))).toBe(true);
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

  it('DASH-08: /api/roadmap returns correct phase count and goals', async () => {
    const res = await fetch(`${baseUrl}/api/roadmap`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      phase_count: number;
      phases: Array<{ number: string; name: string; goal: string | null }>;
    };
    expect(body.phase_count).toBe(4);
    expect(Array.isArray(body.phases)).toBe(true);

    const phase01 = body.phases.find(p => p.number === '01');
    expect(phase01).toBeDefined();
    expect(phase01!.name).toBe('Foundation');
    expect(phase01!.goal).toBe('Build the core');

    const phase02 = body.phases.find(p => p.number === '02');
    expect(phase02).toBeDefined();
    expect(phase02!.goal).toBe('Wire it together');
  });

  it('DASH-09: /api/roadmap reflects correct diskStatus for each phase', async () => {
    const res = await fetch(`${baseUrl}/api/roadmap`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      phases: Array<{
        number: string;
        disk_status: string;
        roadmap_complete: boolean;
        plan_count: number;
        summary_count: number;
      }>;
    };

    const phase01 = body.phases.find(p => p.number === '01')!;
    // Phase 01 has 1 PLAN.md + 1 SUMMARY.md → complete
    expect(phase01.disk_status).toBe('complete');
    expect(phase01.plan_count).toBe(1);
    expect(phase01.summary_count).toBe(1);
    // Phase 01 checkbox is [x] in ROADMAP.md
    expect(phase01.roadmap_complete).toBe(true);

    const phase02 = body.phases.find(p => p.number === '02')!;
    // Phase 02 directory is empty → empty
    expect(phase02.disk_status).toBe('empty');
    expect(phase02.roadmap_complete).toBe(false);

    const phase03 = body.phases.find(p => p.number === '03')!;
    // Phase 03 has only CONTEXT.md → discussed
    expect(phase03.disk_status).toBe('discussed');

    const phase04 = body.phases.find(p => p.number === '04')!;
    // Phase 04 has only RESEARCH.md → researched
    expect(phase04.disk_status).toBe('researched');
  });

  it('DASH-10: /api/roadmap progress_percent reflects completed plans', async () => {
    const res = await fetch(`${baseUrl}/api/roadmap`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      total_plans: number;
      total_summaries: number;
      completed_phases: number;
      progress_percent: number;
      current_phase: string | null;
    };
    // 1 plan, 1 summary → 100% for phase 01; no other plans
    expect(body.total_plans).toBe(1);
    expect(body.total_summaries).toBe(1);
    expect(body.completed_phases).toBe(1);
    expect(body.progress_percent).toBe(100);
    // No planned/partial phases → current_phase is null
    expect(body.current_phase).toBeNull();
  });

  it('DASH-11: /api/phase/01 returns plan with YAML frontmatter and XML tasks', async () => {
    const res = await fetch(`${baseUrl}/api/phase/01`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      plans: Array<{
        path: string;
        content: string;
        frontmatter: Record<string, unknown>;
        tasks: Array<{
          name: string;
          type: string;
          files: string[];
          action: string;
          verify: string;
          done: string;
          completed: boolean;
        }>;
      }>;
      context: string | null;
      research: string | null;
    };

    expect(Array.isArray(body.plans)).toBe(true);
    expect(body.plans.length).toBe(1);

    const plan = body.plans[0];
    expect(plan.path).toContain('01-01-PLAN.md');

    // YAML frontmatter extracted
    expect(plan.frontmatter.phase).toBe('01');
    expect(plan.frontmatter.plan).toBe('01-01');
    expect(plan.frontmatter.type).toBe('implementation');
    expect(plan.frontmatter.wave).toBe(1);
    expect(plan.frontmatter.autonomous).toBe(true);

    // XML task parsed
    expect(Array.isArray(plan.tasks)).toBe(true);
    expect(plan.tasks.length).toBe(1);

    const task = plan.tasks[0];
    expect(task.name).toBe('Task one');
    expect(task.type).toBe('implementation');
    expect(task.files).toContain('src/index.ts');
    expect(task.action).toContain('first thing');
    expect(task.verify).toContain('src/index.ts');
    expect(task.done).toBe('[ ] Task one complete');
    expect(task.completed).toBe(false);

    // No context or research file in phase 01
    expect(body.context).toBeNull();
    expect(body.research).toBeNull();
  });

  it('DASH-12: /api/phase/03 returns context file content', async () => {
    const res = await fetch(`${baseUrl}/api/phase/03`);
    expect(res.status).toBe(200);
    const body = await res.json() as { plans: unknown[]; context: string | null; research: string | null };
    expect(body.plans).toHaveLength(0);
    expect(body.context).not.toBeNull();
    expect(body.context).toContain('Phase 03 Context');
    expect(body.research).toBeNull();
  });

  it('DASH-13: /api/phase/04 returns research file content', async () => {
    const res = await fetch(`${baseUrl}/api/phase/04`);
    expect(res.status).toBe(200);
    const body = await res.json() as { plans: unknown[]; context: string | null; research: string | null };
    expect(body.plans).toHaveLength(0);
    expect(body.context).toBeNull();
    expect(body.research).not.toBeNull();
    expect(body.research).toContain('Phase 04 Research');
  });

  it('DASH-14: /api/phases diskStatus for discussed/researched phases is not "empty"', async () => {
    const res = await fetch(`${baseUrl}/api/phases`);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ number: string; diskStatus: string }>;

    const phase03 = body.find(p => p.number === '03');
    expect(phase03).toBeDefined();
    // Phase 03 has CONTEXT.md — must not be 'empty'
    expect(phase03!.diskStatus).not.toBe('empty');
    expect(['discussed', 'empty']).toContain(phase03!.diskStatus); // 'discussed' after bug fix

    const phase04 = body.find(p => p.number === '04');
    expect(phase04).toBeDefined();
    // Phase 04 has RESEARCH.md — must not be 'empty'
    expect(phase04!.diskStatus).not.toBe('empty');
    expect(['researched', 'empty']).toContain(phase04!.diskStatus); // 'researched' after bug fix
  });

  it('DASH-15: /api/state has currentPhase and status populated', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      currentPhase: string | null;
      status: string | null;
    };
    // Mock STATE.md uses bold fields → stateExtractField should find them
    expect(body.currentPhase).toBe('01');
    expect(body.status).toBe('In progress');
  });
});

// ─── Write API ────────────────────────────────────────────────────────────────

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

    // Modify: replace first occurrence of [ ] Task one with [x]
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

  it('DASH-16: PATCH /api/roadmap toggles phase checkbox in ROADMAP.md', async () => {
    const roadmapPath = join(mockProject!.dir, '.planning', 'ROADMAP.md');
    const originalContent = readFileSync(roadmapPath, 'utf-8');

    // Phase 02 starts unchecked
    expect(originalContent).toContain('- [ ] **Phase 02: Integration**');

    try {
      // Check phase 02
      const checkRes = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseNumber: '02', checked: true }),
      });
      expect(checkRes.status).toBe(200);
      const checkBody = await checkRes.json() as { updated: boolean; phaseNumber: string; checked: boolean };
      expect(checkBody.updated).toBe(true);
      expect(checkBody.phaseNumber).toBe('02');
      expect(checkBody.checked).toBe(true);

      // Verify on disk: checkbox should now be [x]
      const afterCheck = readFileSync(roadmapPath, 'utf-8');
      expect(afterCheck).toContain('- [x] **Phase 02: Integration**');
      expect(afterCheck).not.toContain('- [ ] **Phase 02: Integration**');

      // Uncheck phase 02
      const uncheckRes = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseNumber: '02', checked: false }),
      });
      expect(uncheckRes.status).toBe(200);
      const afterUncheck = readFileSync(roadmapPath, 'utf-8');
      expect(afterUncheck).toContain('- [ ] **Phase 02: Integration**');
    } finally {
      writeFileSync(roadmapPath, originalContent, 'utf-8');
    }
  });

  it('DASH-17: POST /api/state/decision appends decision to STATE.md', async () => {
    const statePath = join(mockProject!.dir, '.planning', 'STATE.md');
    const originalContent = readFileSync(statePath, 'utf-8');

    try {
      const res = await fetch(`${baseUrl}/api/state/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: '02', text: 'Use REST over GraphQL' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { added: boolean; decision: string };
      expect(body.added).toBe(true);
      expect(body.decision).toContain('Use REST over GraphQL');

      // Verify on disk
      const diskContent = readFileSync(statePath, 'utf-8');
      expect(diskContent).toContain('Use REST over GraphQL');
      expect(diskContent).toContain('[Phase 02]');
    } finally {
      writeFileSync(statePath, originalContent, 'utf-8');
    }
  });

  it('DASH-18: POST /api/state/blocker appends blocker to STATE.md', async () => {
    const statePath = join(mockProject!.dir, '.planning', 'STATE.md');
    const originalContent = readFileSync(statePath, 'utf-8');

    try {
      const res = await fetch(`${baseUrl}/api/state/blocker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Waiting for API access credentials' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { added: boolean; blocker: string };
      expect(body.added).toBe(true);
      expect(body.blocker).toBe('Waiting for API access credentials');

      // Verify on disk
      const diskContent = readFileSync(statePath, 'utf-8');
      expect(diskContent).toContain('Waiting for API access credentials');
    } finally {
      writeFileSync(statePath, originalContent, 'utf-8');
    }
  });

  it('DASH-19: POST /api/todos creates a new pending todo', async () => {
    const res = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'E2E created todo item' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { created: boolean; file: string; text: string };
    expect(body.created).toBe(true);
    expect(body.text).toBe('E2E created todo item');
    expect(body.file).toMatch(/\.md$/);

    // Confirm it appears in /api/todos
    const listRes = await fetch(`${baseUrl}/api/todos`);
    const listBody = await listRes.json() as { pending: Array<{ text: string }> };
    expect(listBody.pending.some(t => t.text === 'E2E created todo item')).toBe(true);
  });
});
