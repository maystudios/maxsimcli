import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface MockProject {
  dir: string;
  cleanup: () => void;
}

export function createMockProject(): MockProject {
  const dir = mkdtempSync(join(tmpdir(), 'maxsim-mock-'));

  // Directory structure — 4 phases covering all diskStatus variants
  mkdirSync(join(dir, '.planning', 'phases', '01-foundation'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'phases', '02-integration'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'phases', '03-discussion'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'phases', '04-research'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'todos', 'pending'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'todos', 'completed'), { recursive: true });

  // ROADMAP.md — 4 phases; phase 01 checked [x], others unchecked
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), [
    '# Roadmap: Mock Project v1.0',
    '',
    '## Overview',
    '',
    'A mock project for E2E testing.',
    '',
    '## Phases',
    '',
    '- [x] **Phase 01: Foundation** - Build core',
    '- [ ] **Phase 02: Integration** - Wire it together',
    '- [ ] **Phase 03: Discussion** - Context gathered, planning pending',
    '- [ ] **Phase 04: Research** - Research gathered, planning pending',
    '',
    '## Phase Details',
    '',
    '### Phase 01: Foundation',
    '**Goal**: Build the core',
    '**Depends on**: Nothing',
    '**Requirements**: MOCK-01',
    '**Plans**: 1 plan',
    '',
    'Plans:',
    '- [x] 01-01-PLAN.md — Foundation tasks',
    '',
    '### Phase 02: Integration',
    '**Goal**: Wire it together',
    '**Depends on**: Phase 01',
    '**Requirements**: MOCK-02',
    '**Plans**: TBD',
    '',
    '### Phase 03: Discussion',
    '**Goal**: Gather context for planning',
    '**Depends on**: Phase 02',
    '**Requirements**: MOCK-03',
    '**Plans**: TBD',
    '',
    '### Phase 04: Research',
    '**Goal**: Research the approach',
    '**Depends on**: Phase 03',
    '**Requirements**: MOCK-04',
    '**Plans**: TBD',
  ].join('\n'));

  // STATE.md — uses bold field format so stateExtractField works for all fields
  writeFileSync(join(dir, '.planning', 'STATE.md'), [
    '# Project State',
    '',
    '## Current Position',
    '',
    '**Current Phase:** 01',
    '**Status:** In progress',
    '',
    '## Accumulated Context',
    '',
    '### Decisions',
    '',
    '- [Init]: Mock decision one — for testing purposes',
    '',
    '### Blockers/Concerns',
    '',
    'None yet.',
  ].join('\n'));

  // PROJECT.md
  writeFileSync(join(dir, '.planning', 'PROJECT.md'), [
    '# Mock Test Project',
    '',
    '## What This Is',
    '',
    'A mock project for E2E testing of maxsim-tools.',
    '',
    '## Core Value',
    '',
    'Validates maxsim-tools behavioral tests end-to-end.',
    '',
    '## Key Decisions',
    '',
    '| Decision | Rationale |',
    '|----------|-----------|',
    '| Use mocks | Speed and isolation |',
  ].join('\n'));

  // Phase 01 — PLAN.md with YAML frontmatter and an XML task
  writeFileSync(
    join(dir, '.planning', 'phases', '01-foundation', '01-01-PLAN.md'),
    [
      '---',
      'phase: "01"',
      'plan: "01-01"',
      'type: "implementation"',
      'wave: 1',
      'depends_on: []',
      'files_modified:',
      '  - src/index.ts',
      'autonomous: true',
      'must_haves:',
      '  implementation:',
      '    - "Task one done"',
      '---',
      '',
      '# Phase 01 Plan 01',
      '',
      '## Tasks',
      '',
      '- [ ] Task one: do the first thing',
      '- [ ] Task two: do the second thing',
      '',
      '<task type="implementation" status="pending">',
      '  <name>Task one</name>',
      '  <files>',
      '    src/index.ts',
      '  </files>',
      '  <action>',
      '    Do the first thing to set up the foundation.',
      '  </action>',
      '  <verify>',
      '    Confirm src/index.ts exists and exports the expected function.',
      '  </verify>',
      '  <done>[ ] Task one complete</done>',
      '</task>',
    ].join('\n')
  );

  // Phase 01 — SUMMARY.md (makes phase 01 diskStatus='complete')
  writeFileSync(
    join(dir, '.planning', 'phases', '01-foundation', '01-01-SUMMARY.md'),
    [
      '# Phase 01 Plan 01 — Summary',
      '',
      '## Outcome',
      '',
      'Foundation tasks completed successfully.',
      '',
      '## Files Changed',
      '',
      '- src/index.ts',
    ].join('\n')
  );

  // Phase 03 — CONTEXT.md only (diskStatus='discussed')
  writeFileSync(
    join(dir, '.planning', 'phases', '03-discussion', '03-CONTEXT.md'),
    [
      '# Phase 03 Context',
      '',
      '## User Decisions',
      '',
      '- Approach: incremental',
      '- Timeline: after phase 02',
    ].join('\n')
  );

  // Phase 04 — RESEARCH.md only (diskStatus='researched')
  writeFileSync(
    join(dir, '.planning', 'phases', '04-research', '04-RESEARCH.md'),
    [
      '# Phase 04 Research',
      '',
      '## Findings',
      '',
      'The best library for this is X.',
      '## Recommendation',
      '',
      'Use library X with configuration Y.',
    ].join('\n')
  );

  // Pending todo file
  writeFileSync(
    join(dir, '.planning', 'todos', 'pending', 'todo-001-test-task.md'),
    [
      'title: Test Task',
      '# Todo: Test Task',
      '',
      '**Area:** general',
      '',
      'Do the test task for E2E validation.',
    ].join('\n')
  );

  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
