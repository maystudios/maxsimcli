import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inject } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createMockProject, type MockProject } from './fixtures/mock-project.js';

// Helper: run maxsim-tools command against a project directory
function runTool(args: string, projectDir: string): { stdout: string; exitCode: number } {
  const toolsPath = inject('toolsPath');
  try {
    const stdout = execSync(`node "${toolsPath}" ${args} --cwd "${projectDir}"`, {
      encoding: 'utf8',
      timeout: 15_000,
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

describe('TOOL-01: phase commands', () => {
  let mock: MockProject;
  beforeEach(() => { mock = createMockProject(); });
  afterEach(() => { mock.cleanup(); });

  it('phases list returns directory list', () => {
    const result = runTool('phases list', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data).toHaveProperty('directories');
    expect(Array.isArray(data.directories)).toBe(true);
  });

  it('phase add creates a new phase in ROADMAP.md', () => {
    const result = runTool('phase add "New Phase"', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    // phase add returns { phase_number, padded, name, slug, directory }
    expect(data).toHaveProperty('phase_number');
    expect(data).toHaveProperty('name', 'New Phase');
  });

  it('phase complete marks a phase complete', () => {
    const result = runTool('phase complete 01', mock.dir);
    expect(result.exitCode).toBe(0);
  });
});

describe('TOOL-02: state commands', () => {
  let mock: MockProject;
  beforeEach(() => { mock = createMockProject(); });
  afterEach(() => { mock.cleanup(); });

  it('state returns STATE.md content', () => {
    const result = runTool('state', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.state_exists).toBe(true);
  });

  it('state add-decision adds a decision to STATE.md', () => {
    const result = runTool(
      'state add-decision --phase 01 --summary "Test decision" --rationale "For E2E validation"',
      mock.dir
    );
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.added).toBe(true);
  });

  it('state add-blocker adds a blocker to STATE.md', () => {
    const result = runTool(
      'state add-blocker --text "Test blocker for E2E"',
      mock.dir
    );
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.added).toBe(true);
  });
});

describe('TOOL-03: roadmap commands', () => {
  let mock: MockProject;
  beforeEach(() => { mock = createMockProject(); });
  afterEach(() => { mock.cleanup(); });

  it('roadmap analyze returns structured phase data', () => {
    const result = runTool('roadmap analyze', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data.phases)).toBe(true);
    // Mock project has 2 phases
    expect(data.phases.length).toBeGreaterThanOrEqual(1);
  });
});

describe('TOOL-04: todo commands', () => {
  let mock: MockProject;
  beforeEach(() => { mock = createMockProject(); });
  afterEach(() => { mock.cleanup(); });

  it('list-todos returns the pre-created pending todo', () => {
    const result = runTool('list-todos', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    // Mock fixture creates 1 pending todo
    expect(data.count).toBe(1);
    expect(Array.isArray(data.todos)).toBe(true);
  });

  it('todo complete moves the todo to completed/', () => {
    // The mock fixture creates todo-001-test-task.md in todos/pending/
    const result = runTool('todo complete todo-001-test-task.md', mock.dir);
    expect(result.exitCode).toBe(0);
    // After completion, the file should be in todos/completed/
    const completedPath = join(mock.dir, '.planning', 'todos', 'completed', 'todo-001-test-task.md');
    expect(existsSync(completedPath)).toBe(true);
  });
});

describe('TOOL-05: validate and milestone commands', () => {
  let mock: MockProject;
  beforeEach(() => { mock = createMockProject(); });
  afterEach(() => { mock.cleanup(); });

  it('validate health returns a valid status', () => {
    const result = runTool('validate health', mock.dir);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(['ok', 'degraded', 'error']).toContain(data.status);
  });
});
