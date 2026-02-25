import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface MockProject {
  dir: string;
  cleanup: () => void;
}

export function createMockProject(): MockProject {
  const dir = mkdtempSync(join(tmpdir(), 'maxsim-mock-'));

  // Directory structure
  mkdirSync(join(dir, '.planning', 'phases', '01-foundation'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'phases', '02-integration'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'todos', 'pending'), { recursive: true });
  mkdirSync(join(dir, '.planning', 'todos', 'completed'), { recursive: true });

  // ROADMAP.md — 2 phases with proper ## Phases section
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), [
    '# Roadmap: Mock Project v1.0',
    '',
    '## Overview',
    '',
    'A mock project for E2E testing.',
    '',
    '## Phases',
    '',
    '- [ ] **Phase 01: Foundation** - Build core',
    '- [ ] **Phase 02: Integration** - Wire it together',
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
    '- [ ] 01-01-PLAN.md — Foundation tasks',
    '',
    '### Phase 02: Integration',
    '**Goal**: Wire it together',
    '**Depends on**: Phase 01',
    '**Requirements**: MOCK-02',
    '**Plans**: TBD',
  ].join('\n'));

  // STATE.md — must include Blockers/Concerns section for state add-blocker to work
  writeFileSync(join(dir, '.planning', 'STATE.md'), [
    '# Project State',
    '',
    '## Current Position',
    '',
    'Phase: 01',
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
    '### Pending Todos',
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

  // Phase 01-01 PLAN.md
  writeFileSync(
    join(dir, '.planning', 'phases', '01-foundation', '01-01-PLAN.md'),
    [
      '# Phase 01 Plan 01',
      '',
      '## Tasks',
      '',
      '- [ ] Task one: do the first thing',
      '- [ ] Task two: do the second thing',
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
