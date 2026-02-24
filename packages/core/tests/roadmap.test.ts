/**
 * MAXSIM Tools Tests - Roadmap
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

describe('roadmap get-phase command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('extracts phase section from ROADMAP.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

### Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

Some description here.

### Phase 2: API
**Goal:** Build REST API
**Plans:** 3 plans
`
    );

    const result = runMaxsimTools('roadmap get-phase 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'phase should be found').toBe(true);
    expect(output.phase_number, 'phase number correct').toBe('1');
    expect(output.phase_name, 'phase name extracted').toBe('Foundation');
    expect(output.goal, 'goal extracted').toBe('Set up project infrastructure');
  });

  test('returns not found for missing phase', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up project
`
    );

    const result = runMaxsimTools('roadmap get-phase 5', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'phase should not be found').toBe(false);
  });

  test('handles decimal phase numbers', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 2: Main
**Goal:** Main work

### Phase 2.1: Hotfix
**Goal:** Emergency fix
`
    );

    const result = runMaxsimTools('roadmap get-phase 2.1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'decimal phase should be found').toBe(true);
    expect(output.phase_name, 'phase name correct').toBe('Hotfix');
    expect(output.goal, 'goal extracted').toBe('Emergency fix');
  });

  test('extracts full section content', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Setup
**Goal:** Initialize everything

This phase covers:
- Database setup
- Auth configuration
- CI/CD pipeline

### Phase 2: Build
**Goal:** Build features
`
    );

    const result = runMaxsimTools('roadmap get-phase 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.section, 'section includes description').toMatch(/Database setup/);
    expect(output.section, 'section includes all bullets').toMatch(/CI\/CD pipeline/);
    expect(output.section).not.toMatch(/Phase 2/);
  });

  test('handles missing ROADMAP.md gracefully', () => {
    const result = runMaxsimTools('roadmap get-phase 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'should return not found').toBe(false);
    expect(output.error, 'should explain why').toBe('ROADMAP.md not found');
  });

  test('accepts ## phase headers (two hashes)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

## Phase 2: API
**Goal:** Build REST API
`
    );

    const result = runMaxsimTools('roadmap get-phase 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'phase with ## header should be found').toBe(true);
    expect(output.phase_name, 'phase name extracted').toBe('Foundation');
    expect(output.goal, 'goal extracted').toBe('Set up project infrastructure');
  });

  test('detects malformed ROADMAP with summary list but no detail sections', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

## Phases

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API
`
    );

    const result = runMaxsimTools('roadmap get-phase 1', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.found, 'phase should not be found').toBe(false);
    expect(output.error, 'should identify malformed roadmap').toBe('malformed_roadmap');
    expect(output.message, 'should explain the issue').toMatch(/missing/);
  });
});

describe('roadmap analyze command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('missing ROADMAP.md returns error', () => {
    const result = runMaxsimTools('roadmap analyze', tmpDir);
    expect(result.success, `Command should succeed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.error).toBe('ROADMAP.md not found');
  });

  test('parses phases with goals and disk status', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up infrastructure

### Phase 2: Authentication
**Goal:** Add user auth

### Phase 3: Features
**Goal:** Build core features
`
    );

    // Create phase dirs with varying completion
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const p2 = path.join(tmpDir, '.planning', 'phases', '02-authentication');
    fs.mkdirSync(p2, { recursive: true });
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan');

    const result = runMaxsimTools('roadmap analyze', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_count, 'should find 3 phases').toBe(3);
    expect(output.phases[0].disk_status, 'phase 1 complete').toBe('complete');
    expect(output.phases[1].disk_status, 'phase 2 planned').toBe('planned');
    expect(output.phases[2].disk_status, 'phase 3 no directory').toBe('no_directory');
    expect(output.completed_phases, '1 phase complete').toBe(1);
    expect(output.total_plans, '2 total plans').toBe(2);
    expect(output.total_summaries, '1 total summary').toBe(1);
    expect(output.progress_percent, '50% complete').toBe(50);
    expect(output.current_phase, 'current phase is 2').toBe('2');
  });

  test('extracts goals and dependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Setup
**Goal:** Initialize project
**Depends on:** Nothing

### Phase 2: Build
**Goal:** Build features
**Depends on:** Phase 1
`
    );

    const result = runMaxsimTools('roadmap analyze', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phases[0].goal).toBe('Initialize project');
    expect(output.phases[0].depends_on).toBe('Nothing');
    expect(output.phases[1].goal).toBe('Build features');
    expect(output.phases[1].depends_on).toBe('Phase 1');
  });
});
