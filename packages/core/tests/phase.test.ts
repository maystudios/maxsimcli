/**
 * MAXSIM Tools Tests - Phase
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

describe('phases list command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns empty array', () => {
    const result = runMaxsimTools('phases list', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.directories).toEqual([]);
    expect(output.count, 'count should be 0').toBe(0);
  });

  test('lists phase directories sorted numerically', () => {
    // Create out-of-order directories
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '10-final'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });

    const result = runMaxsimTools('phases list', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.count, 'should have 3 directories').toBe(3);
    expect(output.directories).toEqual(
      ['01-foundation', '02-api', '10-final']
    );
  });

  test('handles decimal phases in sort order', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02.1-hotfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02.2-patch'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-ui'), { recursive: true });

    const result = runMaxsimTools('phases list', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.directories).toEqual(
      ['02-api', '02.1-hotfix', '02.2-patch', '03-ui']
    );
  });

  test('--type plans lists only PLAN.md files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan 1');
    fs.writeFileSync(path.join(phaseDir, '01-02-PLAN.md'), '# Plan 2');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(path.join(phaseDir, 'RESEARCH.md'), '# Research');

    const result = runMaxsimTools('phases list --type plans', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.files.sort()).toEqual(
      ['01-01-PLAN.md', '01-02-PLAN.md']
    );
  });

  test('--type summaries lists only SUMMARY.md files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary 1');
    fs.writeFileSync(path.join(phaseDir, '01-02-SUMMARY.md'), '# Summary 2');

    const result = runMaxsimTools('phases list --type summaries', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.files.sort()).toEqual(
      ['01-01-SUMMARY.md', '01-02-SUMMARY.md']
    );
  });

  test('--phase filters to specific phase directory', () => {
    const phase01 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    const phase02 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase01, { recursive: true });
    fs.mkdirSync(phase02, { recursive: true });
    fs.writeFileSync(path.join(phase01, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase02, '02-01-PLAN.md'), '# Plan');

    const result = runMaxsimTools('phases list --type plans --phase 01', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.files).toEqual(['01-01-PLAN.md']);
    expect(output.phase_dir, 'should report phase name without number prefix').toBe('foundation');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// roadmap get-phase command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase next-decimal command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns X.1 when no decimal phases exist', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '07-next'), { recursive: true });

    const result = runMaxsimTools('phase next-decimal 06', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.next, 'should return 06.1').toBe('06.1');
    expect(output.existing).toEqual([]);
  });

  test('increments from existing decimal phases', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.1-hotfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.2-patch'), { recursive: true });

    const result = runMaxsimTools('phase next-decimal 06', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.next, 'should return 06.3').toBe('06.3');
    expect(output.existing).toEqual(['06.1', '06.2']);
  });

  test('handles gaps in decimal sequence', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.1-first'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.3-third'), { recursive: true });

    const result = runMaxsimTools('phase next-decimal 06', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    // Should take next after highest, not fill gap
    expect(output.next, 'should return 06.4, not fill gap at 06.2').toBe('06.4');
  });

  test('handles single-digit phase input', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });

    const result = runMaxsimTools('phase next-decimal 6', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.next, 'should normalize to 06.1').toBe('06.1');
    expect(output.base_phase, 'base phase should be padded').toBe('06');
  });

  test('returns error if base phase does not exist', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-start'), { recursive: true });

    const result = runMaxsimTools('phase next-decimal 06', tmpDir);
    expect(result.success, `Command should succeed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'base phase not found').toBe(false);
    expect(output.next, 'should still suggest 06.1').toBe('06.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase-plan-index command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase-plan-index command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phase directory returns empty plans array', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runMaxsimTools('phase-plan-index 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase, 'phase number correct').toBe('03');
    expect(output.plans).toEqual([]);
    expect(output.waves).toEqual({});
    expect(output.incomplete).toEqual([]);
    expect(output.has_checkpoints, 'no checkpoints').toBe(false);
  });

  test('extracts single plan with frontmatter', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '03-01-PLAN.md'),
      `---
wave: 1
autonomous: true
objective: Set up database schema
files-modified: [prisma/schema.prisma, src/lib/db.ts]
---

## Task 1: Create schema
## Task 2: Generate client
`
    );

    const result = runMaxsimTools('phase-plan-index 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.plans.length, 'should have 1 plan').toBe(1);
    expect(output.plans[0].id, 'plan id correct').toBe('03-01');
    expect(output.plans[0].wave, 'wave extracted').toBe(1);
    expect(output.plans[0].autonomous, 'autonomous extracted').toBe(true);
    expect(output.plans[0].objective, 'objective extracted').toBe('Set up database schema');
    expect(output.plans[0].files_modified).toEqual(['prisma/schema.prisma', 'src/lib/db.ts']);
    expect(output.plans[0].task_count, 'task count correct').toBe(2);
    expect(output.plans[0].has_summary, 'no summary yet').toBe(false);
  });

  test('groups multiple plans by wave', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '03-01-PLAN.md'),
      `---
wave: 1
autonomous: true
objective: Database setup
---

## Task 1: Schema
`
    );

    fs.writeFileSync(
      path.join(phaseDir, '03-02-PLAN.md'),
      `---
wave: 1
autonomous: true
objective: Auth setup
---

## Task 1: JWT
`
    );

    fs.writeFileSync(
      path.join(phaseDir, '03-03-PLAN.md'),
      `---
wave: 2
autonomous: false
objective: API routes
---

## Task 1: Routes
`
    );

    const result = runMaxsimTools('phase-plan-index 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.plans.length, 'should have 3 plans').toBe(3);
    expect(output.waves['1']).toEqual(['03-01', '03-02']);
    expect(output.waves['2']).toEqual(['03-03']);
  });

  test('detects incomplete plans (no matching summary)', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    // Plan with summary
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), `---\nwave: 1\n---\n## Task 1`);
    fs.writeFileSync(path.join(phaseDir, '03-01-SUMMARY.md'), `# Summary`);

    // Plan without summary
    fs.writeFileSync(path.join(phaseDir, '03-02-PLAN.md'), `---\nwave: 2\n---\n## Task 1`);

    const result = runMaxsimTools('phase-plan-index 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.plans[0].has_summary, 'first plan has summary').toBe(true);
    expect(output.plans[1].has_summary, 'second plan has no summary').toBe(false);
    expect(output.incomplete).toEqual(['03-02']);
  });

  test('detects checkpoints (autonomous: false)', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '03-01-PLAN.md'),
      `---
wave: 1
autonomous: false
objective: Manual review needed
---

## Task 1: Review
`
    );

    const result = runMaxsimTools('phase-plan-index 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.has_checkpoints, 'should detect checkpoint').toBe(true);
    expect(output.plans[0].autonomous, 'plan marked non-autonomous').toBe(false);
  });

  test('phase not found returns error', () => {
    const result = runMaxsimTools('phase-plan-index 99', tmpDir);
    expect(result.success, `Command should succeed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.error, 'should report phase not found').toBe('Phase not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// state-snapshot command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase add command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('adds phase after highest existing', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API

---
`
    );

    const result = runMaxsimTools('phase add User Dashboard', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_number, 'should be phase 3').toBe(3);
    expect(output.slug).toBe('user-dashboard');

    // Verify directory created
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '03-user-dashboard'))
    ).toBeTruthy();

    // Verify ROADMAP updated
    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/### Phase 3: User Dashboard/);
    expect(roadmap).toMatch(/\*\*Depends on:\*\* Phase 2/);
  });

  test('handles empty roadmap', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );

    const result = runMaxsimTools('phase add Initial Setup', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_number, 'should be phase 1').toBe(1);
  });

  test('phase add includes **Requirements**: TBD in new ROADMAP entry', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Setup\n\n---\n`
    );

    const result = runMaxsimTools('phase add User Dashboard', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/\*\*Requirements\*\*: TBD/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase insert command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase insert command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('inserts decimal phase after target', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API
`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });

    const result = runMaxsimTools('phase insert 1 Fix Critical Bug', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_number, 'should be 01.1').toBe('01.1');
    expect(output.after_phase).toBe('1');

    // Verify directory
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '01.1-fix-critical-bug'))
    ).toBeTruthy();

    // Verify ROADMAP
    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/Phase 01\.1: Fix Critical Bug \(INSERTED\)/);
  });

  test('increments decimal when siblings exist', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API
`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01.1-hotfix'), { recursive: true });

    const result = runMaxsimTools('phase insert 1 Another Fix', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_number, 'should be 01.2').toBe('01.2');
  });

  test('rejects missing phase', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: Test\n**Goal:** Test\n`
    );

    const result = runMaxsimTools('phase insert 99 Fix Something', tmpDir);
    expect(result.success).toBeFalsy();
    expect(result.error).toMatch(/not found/);
  });

  test('handles padding mismatch between input and roadmap', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

## Phase 09.05: Existing Decimal Phase
**Goal:** Test padding

## Phase 09.1: Next Phase
**Goal:** Test
`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '09.05-existing'), { recursive: true });

    // Pass unpadded "9.05" but roadmap has "09.05"
    const result = runMaxsimTools('phase insert 9.05 Padding Test', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.after_phase).toBe('9.05');

    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/\(INSERTED\)/);
  });

  test('phase insert includes **Requirements**: TBD in new ROADMAP entry', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 1: Foundation\n**Goal:** Setup\n\n### Phase 2: API\n**Goal:** Build API\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });

    const result = runMaxsimTools('phase insert 1 Fix Critical Bug', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/\*\*Requirements\*\*: TBD/);
  });

  test('handles #### heading depth from multi-milestone roadmaps', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### v1.1 Milestone

#### Phase 5: Feature Work
**Goal:** Build features

#### Phase 6: Polish
**Goal:** Polish
`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '05-feature-work'), { recursive: true });

    const result = runMaxsimTools('phase insert 5 Hotfix', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_number).toBe('05.1');

    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/Phase 05\.1: Hotfix \(INSERTED\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase remove command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase remove command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('removes phase directory and renumbers subsequent', () => {
    // Setup 3 phases
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Foundation
**Goal:** Setup
**Depends on:** Nothing

### Phase 2: Auth
**Goal:** Authentication
**Depends on:** Phase 1

### Phase 3: Features
**Goal:** Core features
**Depends on:** Phase 2
`
    );

    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
    const p2 = path.join(tmpDir, '.planning', 'phases', '02-auth');
    fs.mkdirSync(p2, { recursive: true });
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan');
    const p3 = path.join(tmpDir, '.planning', 'phases', '03-features');
    fs.mkdirSync(p3, { recursive: true });
    fs.writeFileSync(path.join(p3, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p3, '03-02-PLAN.md'), '# Plan 2');

    // Remove phase 2
    const result = runMaxsimTools('phase remove 2', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.removed).toBe('2');
    expect(output.directory_deleted).toBe('02-auth');

    // Phase 3 should be renumbered to 02
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '02-features'))
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '03-features'))
    ).toBeFalsy();

    // Files inside should be renamed
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '02-features', '02-01-PLAN.md'))
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '02-features', '02-02-PLAN.md'))
    ).toBeTruthy();

    // ROADMAP should be updated
    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).not.toMatch(/Phase 2: Auth/);
    expect(roadmap).toMatch(/Phase 2: Features/);
  });

  test('rejects removal of phase with summaries unless --force', () => {
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: Test\n**Goal:** Test\n`
    );

    // Should fail without --force
    const result = runMaxsimTools('phase remove 1', tmpDir);
    expect(result.success).toBeFalsy();
    expect(result.error).toMatch(/executed plan/);

    // Should succeed with --force
    const forceResult = runMaxsimTools('phase remove 1 --force', tmpDir);
    expect(forceResult.success, `Force remove failed: ${forceResult.error}`).toBeTruthy();
  });

  test('removes decimal phase and renumbers siblings', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 6: Main\n**Goal:** Main\n### Phase 6.1: Fix A\n**Goal:** Fix A\n### Phase 6.2: Fix B\n**Goal:** Fix B\n### Phase 6.3: Fix C\n**Goal:** Fix C\n`
    );

    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-main'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.1-fix-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.2-fix-b'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06.3-fix-c'), { recursive: true });

    const result = runMaxsimTools('phase remove 6.2', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    // 06.3 should become 06.2
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '06.2-fix-c'))
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'phases', '06.3-fix-c'))
    ).toBeFalsy();
  });

  test('updates STATE.md phase count', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n**Goal:** A\n### Phase 2: B\n**Goal:** B\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 1\n**Total Phases:** 2\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-b'), { recursive: true });

    runMaxsimTools('phase remove 2', tmpDir);

    const state = fs.readFileSync(path.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
    expect(state).toMatch(/\*\*Total Phases:\*\* 1/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phase complete command
// ─────────────────────────────────────────────────────────────────────────────


describe('phase complete command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('marks phase complete and transitions to next', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

- [ ] Phase 1: Foundation
- [ ] Phase 2: API

### Phase 1: Foundation
**Goal:** Setup
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Foundation\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working on phase 1\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.completed_phase).toBe('1');
    expect(output.plans_executed).toBe('1/1');
    expect(output.next_phase).toBe('02');
    expect(output.is_last_phase).toBe(false);

    // Verify STATE.md updated
    const state = fs.readFileSync(path.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
    expect(state).toMatch(/\*\*Current Phase:\*\* 02/);
    expect(state).toMatch(/\*\*Status:\*\* Ready to plan/);
    expect(state).toMatch(/\*\*Current Plan:\*\* Not started/);

    // Verify ROADMAP checkbox
    const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
    expect(roadmap).toMatch(/\[x\]/);
    expect(roadmap).toMatch(/completed/);
  });

  test('detects last phase in milestone', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: Only Phase\n**Goal:** Everything\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-only-phase');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.is_last_phase, 'should detect last phase').toBe(true);
    expect(output.next_phase, 'no next phase').toBe(null);

    const state = fs.readFileSync(path.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
    expect(state).toMatch(/Milestone complete/);
  });

  test('updates REQUIREMENTS.md traceability when phase completes', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** AUTH-01, AUTH-02
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
**Requirements:** API-01
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email
- [ ] **AUTH-02**: User can log in
- [ ] **AUTH-03**: User can reset password

### API

- [ ] **API-01**: REST endpoints

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-auth');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const req = fs.readFileSync(path.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');

    // Checkboxes updated for phase 1 requirements
    expect(req).toMatch(/- \[x\] \*\*AUTH-01\*\*/);
    expect(req).toMatch(/- \[x\] \*\*AUTH-02\*\*/);
    // Other requirements unchanged
    expect(req).toMatch(/- \[ \] \*\*AUTH-03\*\*/);
    expect(req).toMatch(/- \[ \] \*\*API-01\*\*/);

    // Traceability table updated
    expect(req).toMatch(/\| AUTH-01 \| Phase 1 \| Complete \|/);
    expect(req).toMatch(/\| AUTH-02 \| Phase 1 \| Complete \|/);
    expect(req).toMatch(/\| AUTH-03 \| Phase 2 \| Pending \|/);
    expect(req).toMatch(/\| API-01 \| Phase 2 \| Pending \|/);
  });

  test('handles requirements with bracket format [REQ-01, REQ-02]', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** [AUTH-01, AUTH-02]
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
**Requirements:** [API-01]
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email
- [ ] **AUTH-02**: User can log in
- [ ] **AUTH-03**: User can reset password

### API

- [ ] **API-01**: REST endpoints

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-auth');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const req = fs.readFileSync(path.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');

    // Checkboxes updated for phase 1 requirements (brackets stripped)
    expect(req).toMatch(/- \[x\] \*\*AUTH-01\*\*/);
    expect(req).toMatch(/- \[x\] \*\*AUTH-02\*\*/);
    // Other requirements unchanged
    expect(req).toMatch(/- \[ \] \*\*AUTH-03\*\*/);
    expect(req).toMatch(/- \[ \] \*\*API-01\*\*/);

    // Traceability table updated
    expect(req).toMatch(/\| AUTH-01 \| Phase 1 \| Complete \|/);
    expect(req).toMatch(/\| AUTH-02 \| Phase 1 \| Complete \|/);
    expect(req).toMatch(/\| AUTH-03 \| Phase 2 \| Pending \|/);
    expect(req).toMatch(/\| API-01 \| Phase 2 \| Pending \|/);
  });

  test('handles phase with no requirements mapping', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

- [ ] Phase 1: Setup

### Phase 1: Setup
**Goal:** Project setup (no requirements)
**Plans:** 1 plans
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements

## v1 Requirements

- [ ] **REQ-01**: Some requirement

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-01 | Phase 2 | Pending |
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    // REQUIREMENTS.md should be unchanged
    const req = fs.readFileSync(path.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
    expect(req).toMatch(/- \[ \] \*\*REQ-01\*\*/);
    expect(req).toMatch(/\| REQ-01 \| Phase 2 \| Pending \|/);
  });

  test('handles missing REQUIREMENTS.md gracefully', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

- [ ] Phase 1: Foundation
**Requirements:** REQ-01

### Phase 1: Foundation
**Goal:** Setup
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const result = runMaxsimTools('phase complete 1', tmpDir);
    expect(result.success, `Command should succeed even without REQUIREMENTS.md: ${result.error}`).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// comparePhaseNum and normalizePhaseName (imported directly)
// ─────────────────────────────────────────────────────────────────────────────

import { comparePhaseNum, normalizePhaseName } from '../src/core';

describe('comparePhaseNum', () => {
  test('sorts integer phases numerically', () => {
    expect(comparePhaseNum('2', '10') < 0).toBeTruthy();
    expect(comparePhaseNum('10', '2') > 0).toBeTruthy();
    expect(comparePhaseNum('5', '5')).toBe(0);
  });

  test('sorts decimal phases correctly', () => {
    expect(comparePhaseNum('12', '12.1') < 0).toBeTruthy();
    expect(comparePhaseNum('12.1', '12.2') < 0).toBeTruthy();
    expect(comparePhaseNum('12.2', '13') < 0).toBeTruthy();
  });

  test('sorts letter-suffix phases correctly', () => {
    expect(comparePhaseNum('12', '12A') < 0).toBeTruthy();
    expect(comparePhaseNum('12A', '12B') < 0).toBeTruthy();
    expect(comparePhaseNum('12B', '13') < 0).toBeTruthy();
  });

  test('sorts hybrid phases correctly', () => {
    expect(comparePhaseNum('12A', '12A.1') < 0).toBeTruthy();
    expect(comparePhaseNum('12A.1', '12A.2') < 0).toBeTruthy();
    expect(comparePhaseNum('12A.2', '12B') < 0).toBeTruthy();
  });

  test('handles full sort order', () => {
    const phases = ['13', '12B', '12A.2', '12', '12.1', '12A', '12A.1', '12.2'];
    phases.sort(comparePhaseNum);
    expect(phases).toEqual(['12', '12.1', '12.2', '12A', '12A.1', '12A.2', '12B', '13']);
  });

  test('handles directory names with slugs', () => {
    const dirs = ['13-deploy', '12B-hotfix', '12A.1-bugfix', '12-foundation', '12.1-inserted', '12A-split'];
    dirs.sort(comparePhaseNum);
    expect(dirs).toEqual([
      '12-foundation', '12.1-inserted', '12A-split', '12A.1-bugfix', '12B-hotfix', '13-deploy'
    ]);
  });

  test('case insensitive letter matching', () => {
    expect(comparePhaseNum('12a', '12B') < 0).toBeTruthy();
    expect(comparePhaseNum('12A', '12b') < 0).toBeTruthy();
    expect(comparePhaseNum('12a', '12A')).toBe(0);
  });

  test('falls back to localeCompare for non-phase strings', () => {
    const result = comparePhaseNum('abc', 'def');
    expect(typeof result).toBe('number');
  });
});

describe('normalizePhaseName', () => {
  test('pads single-digit integers', () => {
    expect(normalizePhaseName('3')).toBe('03');
    expect(normalizePhaseName('12')).toBe('12');
  });

  test('handles decimal phases', () => {
    expect(normalizePhaseName('3.1')).toBe('03.1');
    expect(normalizePhaseName('12.2')).toBe('12.2');
  });

  test('handles letter-suffix phases', () => {
    expect(normalizePhaseName('3A')).toBe('03A');
    expect(normalizePhaseName('12B')).toBe('12B');
  });

  test('handles hybrid phases', () => {
    expect(normalizePhaseName('3A.1')).toBe('03A.1');
    expect(normalizePhaseName('12A.2')).toBe('12A.2');
  });

  test('uppercases letters', () => {
    expect(normalizePhaseName('3a')).toBe('03A');
    expect(normalizePhaseName('12b.1')).toBe('12B.1');
  });

  test('returns non-matching input unchanged', () => {
    expect(normalizePhaseName('abc')).toBe('abc');
  });
});

describe('letter-suffix phase sorting', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('lists letter-suffix phases in correct order', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '12-foundation'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '12.1-inserted'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '12A-split'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '12A.1-bugfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '12B-hotfix'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '13-deploy'), { recursive: true });

    const result = runMaxsimTools('phases list', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.directories).toEqual(
      ['12-foundation', '12.1-inserted', '12A-split', '12A.1-bugfix', '12B-hotfix', '13-deploy']
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// milestone complete command
// ─────────────────────────────────────────────────────────────────────────────
