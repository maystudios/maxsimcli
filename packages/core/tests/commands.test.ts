/**
 * MAXSIM Tools Tests - Commands
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

describe('history-digest command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns valid schema', () => {
    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);

    expect(digest.phases).toEqual({});
    expect(digest.decisions).toEqual([]);
    expect(digest.tech_stack).toEqual([]);
  });

  test('nested frontmatter fields extracted correctly', () => {
    // Create phase directory with SUMMARY containing nested frontmatter
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
  - "JWT auth flow"
key-decisions:
  - "Use Prisma over Drizzle"
  - "JWT in httpOnly cookies"
---

# Summary content here
`;

    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);

    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);

    // Check nested dependency-graph.provides
    expect(digest.phases['01'], 'Phase 01 should exist').toBeTruthy();
    expect(
      digest.phases['01'].provides.sort()
    ).toEqual(['Auth system', 'Database schema']);

    // Check nested dependency-graph.affects
    expect(
      digest.phases['01'].affects
    ).toEqual(['API layer']);

    // Check nested tech-stack.added
    expect(
      digest.tech_stack.sort()
    ).toEqual(['jose', 'prisma']);

    // Check patterns-established (flat array)
    expect(
      digest.phases['01'].patterns.sort()
    ).toEqual(['JWT auth flow', 'Repository pattern']);

    // Check key-decisions
    expect(digest.decisions.length, 'Should have 2 decisions').toBe(2);
    expect(
      digest.decisions.some((d: { decision: string }) => d.decision === 'Use Prisma over Drizzle'),
      'Should contain first decision'
    ).toBeTruthy();
  });

  test('multiple phases merged into single digest', () => {
    // Create phase 01
    const phase01Dir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phase01Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase01Dir, '01-01-SUMMARY.md'),
      `---
phase: "01"
name: "Foundation"
provides:
  - "Database"
patterns-established:
  - "Pattern A"
key-decisions:
  - "Decision 1"
---
`
    );

    // Create phase 02
    const phase02Dir = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase02Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase02Dir, '02-01-SUMMARY.md'),
      `---
phase: "02"
name: "API"
provides:
  - "REST endpoints"
patterns-established:
  - "Pattern B"
key-decisions:
  - "Decision 2"
tech-stack:
  added:
    - "zod"
---
`
    );

    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);

    // Both phases present
    expect(digest.phases['01'], 'Phase 01 should exist').toBeTruthy();
    expect(digest.phases['02'], 'Phase 02 should exist').toBeTruthy();

    // Decisions merged
    expect(digest.decisions.length, 'Should have 2 decisions total').toBe(2);

    // Tech stack merged
    expect(digest.tech_stack).toEqual(['zod']);
  });

  test('malformed SUMMARY.md skipped gracefully', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    // Valid summary
    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Valid feature"
---
`
    );

    // Malformed summary (no frontmatter)
    fs.writeFileSync(
      path.join(phaseDir, '01-02-SUMMARY.md'),
      `# Just a heading
No frontmatter here
`
    );

    // Another malformed summary (broken YAML)
    fs.writeFileSync(
      path.join(phaseDir, '01-03-SUMMARY.md'),
      `---
broken: [unclosed
---
`
    );

    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command should succeed despite malformed files: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);
    expect(digest.phases['01'], 'Phase 01 should exist').toBeTruthy();
    expect(
      digest.phases['01'].provides.includes('Valid feature'),
      'Valid feature should be extracted'
    ).toBeTruthy();
  });

  test('flat provides field still works (backward compatibility)', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Direct provides"
---
`
    );

    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);
    expect(
      digest.phases['01'].provides
    ).toEqual(['Direct provides']);
  });

  test('inline array syntax supported', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides: [Feature A, Feature B]
patterns-established: ["Pattern X", "Pattern Y"]
---
`
    );

    const result = runMaxsimTools('history-digest', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const digest = JSON.parse(result.output);
    expect(
      digest.phases['01'].provides.sort()
    ).toEqual(['Feature A', 'Feature B']);
    expect(
      digest.phases['01'].patterns.sort()
    ).toEqual(['Pattern X', 'Pattern Y']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phases list command
// ─────────────────────────────────────────────────────────────────────────────


describe('summary-extract command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('missing file returns error', () => {
    const result = runMaxsimTools('summary-extract .planning/phases/01-test/01-01-SUMMARY.md', tmpDir);
    expect(result.success, `Command should succeed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.error, 'should report missing file').toBe('File not found');
  });

  test('extracts all fields from SUMMARY.md', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Set up Prisma with User and Project models
key-files:
  - prisma/schema.prisma
  - src/lib/db.ts
tech-stack:
  added:
    - prisma
    - zod
patterns-established:
  - Repository pattern
  - Dependency injection
key-decisions:
  - Use Prisma over Drizzle: Better DX and ecosystem
  - Single database: Start simple, shard later
requirements-completed:
  - AUTH-01
  - AUTH-02
---

# Summary

Full summary content here.
`
    );

    const result = runMaxsimTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.path, 'path correct').toBe('.planning/phases/01-foundation/01-01-SUMMARY.md');
    expect(output.one_liner, 'one-liner extracted').toBe('Set up Prisma with User and Project models');
    expect(output.key_files).toEqual(['prisma/schema.prisma', 'src/lib/db.ts']);
    expect(output.tech_added).toEqual(['prisma', 'zod']);
    expect(output.patterns).toEqual(['Repository pattern', 'Dependency injection']);
    expect(output.decisions.length, 'decisions extracted').toBe(2);
    expect(output.requirements_completed).toEqual(['AUTH-01', 'AUTH-02']);
  });

  test('selective extraction with --fields', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Set up database
key-files:
  - prisma/schema.prisma
tech-stack:
  added:
    - prisma
patterns-established:
  - Repository pattern
key-decisions:
  - Use Prisma: Better DX
requirements-completed:
  - AUTH-01
---
`
    );

    const result = runMaxsimTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md --fields one_liner,key_files,requirements_completed', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.one_liner, 'one_liner included').toBe('Set up database');
    expect(output.key_files).toEqual(['prisma/schema.prisma']);
    expect(output.requirements_completed).toEqual(['AUTH-01']);
    expect(output.tech_added, 'tech_added excluded').toBeUndefined();
    expect(output.patterns, 'patterns excluded').toBeUndefined();
    expect(output.decisions, 'decisions excluded').toBeUndefined();
  });

  test('handles missing frontmatter fields gracefully', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Minimal summary
---

# Summary
`
    );

    const result = runMaxsimTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.one_liner, 'one-liner extracted').toBe('Minimal summary');
    expect(output.key_files).toEqual([]);
    expect(output.tech_added).toEqual([]);
    expect(output.patterns).toEqual([]);
    expect(output.decisions).toEqual([]);
    expect(output.requirements_completed).toEqual([]);
  });

  test('parses key-decisions with rationale', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
key-decisions:
  - Use Prisma: Better DX than alternatives
  - JWT tokens: Stateless auth for scalability
---
`
    );

    const result = runMaxsimTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.decisions[0].summary, 'decision summary parsed').toBe('Use Prisma');
    expect(output.decisions[0].rationale, 'decision rationale parsed').toBe('Better DX than alternatives');
    expect(output.decisions[1].summary, 'second decision summary').toBe('JWT tokens');
    expect(output.decisions[1].rationale, 'second decision rationale').toBe('Stateless auth for scalability');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// init commands tests
// ─────────────────────────────────────────────────────────────────────────────


describe('progress command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('renders JSON progress', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');
    fs.writeFileSync(path.join(p1, '01-02-PLAN.md'), '# Plan 2');

    const result = runMaxsimTools('progress json', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.total_plans, '2 total plans').toBe(2);
    expect(output.total_summaries, '1 summary').toBe(1);
    expect(output.percent, '50%').toBe(50);
    expect(output.phases.length, '1 phase').toBe(1);
    expect(output.phases[0].status, 'phase in progress').toBe('In Progress');
  });

  test('renders bar format', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');

    const result = runMaxsimTools('progress bar --raw', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();
    expect(result.output).toMatch(/1\/1/);
    expect(result.output).toMatch(/100%/);
  });

  test('renders table format', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');

    const result = runMaxsimTools('progress table --raw', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();
    expect(result.output).toMatch(/Phase/);
    expect(result.output).toMatch(/foundation/);
  });

  test('does not crash when summaries exceed plans (orphaned SUMMARY.md)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    // 1 plan but 2 summaries (orphaned SUMMARY.md after PLAN.md deletion)
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');
    fs.writeFileSync(path.join(p1, '01-02-SUMMARY.md'), '# Orphaned summary');

    // bar format - should not crash with RangeError
    const barResult = runMaxsimTools('progress bar --raw', tmpDir);
    expect(barResult.success, `Bar format crashed: ${barResult.error}`).toBeTruthy();
    expect(barResult.output).toMatch(/100%/);

    // table format - should not crash with RangeError
    const tableResult = runMaxsimTools('progress table --raw', tmpDir);
    expect(tableResult.success, `Table format crashed: ${tableResult.error}`).toBeTruthy();

    // json format - percent should be clamped
    const jsonResult = runMaxsimTools('progress json', tmpDir);
    expect(jsonResult.success, `JSON format crashed: ${jsonResult.error}`).toBeTruthy();
    const output = JSON.parse(jsonResult.output);
    expect(output.percent <= 100, `percent should be <= 100 but got ${output.percent}`).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// todo complete command
// ─────────────────────────────────────────────────────────────────────────────


describe('todo complete command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('moves todo from pending to completed', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });
    fs.writeFileSync(
      path.join(pendingDir, 'add-dark-mode.md'),
      `title: Add dark mode\narea: ui\ncreated: 2025-01-01\n`
    );

    const result = runMaxsimTools('todo complete add-dark-mode.md', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.completed).toBe(true);

    // Verify moved
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'todos', 'pending', 'add-dark-mode.md'))
    ).toBeFalsy();
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md'))
    ).toBeTruthy();

    // Verify completion timestamp added
    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md'),
      'utf-8'
    );
    expect(content.startsWith('completed:')).toBeTruthy();
  });

  test('fails for nonexistent todo', () => {
    const result = runMaxsimTools('todo complete nonexistent.md', tmpDir);
    expect(result.success).toBeFalsy();
    expect(result.error).toMatch(/not found/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scaffold command
// ─────────────────────────────────────────────────────────────────────────────


describe('scaffold command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('scaffolds context file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runMaxsimTools('scaffold context --phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    // Verify file content
    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-CONTEXT.md'),
      'utf-8'
    );
    expect(content).toMatch(/Phase 3/);
    expect(content).toMatch(/Decisions/);
    expect(content).toMatch(/Discretion Areas/);
  });

  test('scaffolds UAT file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runMaxsimTools('scaffold uat --phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-UAT.md'),
      'utf-8'
    );
    expect(content).toMatch(/User Acceptance Testing/);
    expect(content).toMatch(/Test Results/);
  });

  test('scaffolds verification file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runMaxsimTools('scaffold verification --phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-VERIFICATION.md'),
      'utf-8'
    );
    expect(content).toMatch(/Goal-Backward Verification/);
  });

  test('scaffolds phase directory', () => {
    const result = runMaxsimTools('scaffold phase-dir --phase 5 --name User Dashboard', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '05-user-dashboard'))
    ).toBeTruthy();
  });

  test('does not overwrite existing files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Existing content');

    const result = runMaxsimTools('scaffold context --phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.created, 'should not overwrite').toBe(false);
    expect(output.reason).toBe('already_exists');
  });
});
