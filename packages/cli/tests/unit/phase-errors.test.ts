/**
 * Error-path tests for phase lifecycle operations.
 *
 * Covers phaseAddCore(), phaseInsertCore(), phaseCompleteCore(),
 * and cmdPhaseRemove() under failure conditions like missing files,
 * invalid inputs, and absent directories.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  phaseAddCore,
  phaseInsertCore,
  phaseCompleteCore,
  cmdPhaseRemove,
} from '../../src/core/phase.js';
import { CliOutput, CliError } from '../../src/core/core.js';

// Track temp dirs for cleanup
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maxsim-phase-test-'));
  tempDirs.push(dir);
  return dir;
}

/**
 * Scaffold a minimal .planning directory structure inside cwd.
 */
function scaffoldPlanning(
  cwd: string,
  opts: {
    roadmap?: string;
    state?: string;
    phases?: Record<string, string[]>;
  } = {},
): void {
  const planningDir = path.join(cwd, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });

  if (opts.roadmap !== undefined) {
    fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), opts.roadmap);
  }
  if (opts.state !== undefined) {
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), opts.state);
  }
  if (opts.phases) {
    const phasesDir = path.join(planningDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    for (const [dirName, files] of Object.entries(opts.phases)) {
      const phaseDir = path.join(phasesDir, dirName);
      fs.mkdirSync(phaseDir, { recursive: true });
      for (const file of files) {
        fs.writeFileSync(path.join(phaseDir, file), '');
      }
    }
  }
}

/**
 * Call a function that uses output() (throws CliOutput) and return the result.
 * Throws if the function throws something other than CliOutput.
 */
function catchCliOutput(fn: () => void): unknown {
  try {
    fn();
    return undefined;
  } catch (e) {
    if (e instanceof CliOutput) return e.result;
    throw e;
  }
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
  tempDirs.length = 0;
});

// ─── phaseAddCore ───────────────────────────────────────────────────────────

describe('phaseAddCore', () => {
  it('throws when ROADMAP.md does not exist', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd); // no roadmap
    expect(() => phaseAddCore(cwd, 'New Phase')).toThrow('ROADMAP.md not found');
  });

  it('succeeds with an empty description (creates phase with empty slug)', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
    });
    const result = phaseAddCore(cwd, '');
    expect(result.phase_number).toBe(2);
    expect(result.description).toBe('');
  });

  it('appends phase after the last existing phase', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n\n### Phase 2: Integration\n\n**Goal:** Wire up\n',
    });
    const result = phaseAddCore(cwd, 'Testing');
    expect(result.phase_number).toBe(3);
    expect(result.description).toBe('Testing');
  });
});

// ─── phaseInsertCore ────────────────────────────────────────────────────────

describe('phaseInsertCore', () => {
  it('throws when ROADMAP.md does not exist', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd); // no roadmap
    expect(() => phaseInsertCore(cwd, '01', 'Urgent fix')).toThrow('ROADMAP.md not found');
  });

  it('throws when target phase number is not found in ROADMAP.md', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '### Phase 1: Foundation\n\n**Goal:** Build core\n',
    });
    expect(() => phaseInsertCore(cwd, '99', 'Urgent fix')).toThrow(
      'Phase 99 not found in ROADMAP.md',
    );
  });

  it('succeeds when inserting after an existing phase', () => {
    const cwd = makeTempDir();
    // Phase header must be at start of a line. getPhasePattern uses ^ without m flag,
    // so the header must be findable by the regex. The targetPattern.test() call
    // uses 'i' flag only. Put the phase header at start of string for the match.
    scaffoldPlanning(cwd, {
      roadmap: '### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '01-Foundation': ['.gitkeep'] },
    });
    const result = phaseInsertCore(cwd, '1', 'Hotfix');
    expect(result.phase_number).toBe('01.1');
    expect(result.after_phase).toBe('1');
  });
});

// ─── phaseCompleteCore ──────────────────────────────────────────────────────

describe('phaseCompleteCore', () => {
  it('throws when phase directory does not exist (phase not found)', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
    });
    expect(() => phaseCompleteCore(cwd, '99')).toThrow('Phase 99 not found');
  });

  it('proceeds when ROADMAP.md has no matching phase (roadmap regex is a no-op)', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '05-Missing': ['05-01-PLAN.md'] },
    });
    // Phase 05 exists on disk but not in roadmap. phaseCompleteCore proceeds
    // because findPhaseInternal only checks the filesystem.
    const result = phaseCompleteCore(cwd, '05');
    expect(result.completed_phase).toBe('05');
    expect(result.roadmap_updated).toBe(true);
  });

  it('completes successfully without STATE.md (state_updated = false)', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '01-Foundation': ['.gitkeep', '01-01-PLAN.md'] },
    });
    const result = phaseCompleteCore(cwd, '01');
    expect(result.completed_phase).toBe('01');
    expect(result.state_updated).toBe(false);
  });

  it('updates STATE.md when it exists', () => {
    const cwd = makeTempDir();
    const stateContent = [
      '# State',
      '',
      '**Current Phase:** 01',
      '**Current Phase Name:** Foundation',
      '**Status:** Executing',
      '**Current Plan:** 01-01',
      '**Last Activity:** 2026-01-01',
      '**Last Activity Description:** Started',
    ].join('\n');
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
      state: stateContent,
      phases: {
        '01-Foundation': ['.gitkeep', '01-01-PLAN.md', '01-01-SUMMARY.md'],
        '02-Integration': ['.gitkeep'],
      },
    });
    const result = phaseCompleteCore(cwd, '01');
    expect(result.state_updated).toBe(true);
    expect(result.next_phase).toBe('02');
    expect(result.is_last_phase).toBe(false);
  });

  it('marks is_last_phase when no subsequent phase exists', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '# Roadmap\n\n### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '01-Foundation': ['.gitkeep', '01-01-PLAN.md'] },
    });
    const result = phaseCompleteCore(cwd, '01');
    expect(result.is_last_phase).toBe(true);
    expect(result.next_phase).toBeNull();
  });
});

// ─── cmdPhaseRemove ─────────────────────────────────────────────────────────

describe('cmdPhaseRemove', () => {
  it('throws CliError when ROADMAP.md does not exist', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd); // no roadmap
    expect(() => cmdPhaseRemove(cwd, '01', { force: false }, true)).toThrow(CliError);
  });

  it('succeeds when target phase directory does not exist (removes from roadmap only)', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '### Phase 1: Foundation\n\n**Goal:** Build core\n\n### Phase 2: Integration\n\n**Goal:** Wire up\n',
      phases: { '01-Foundation': ['.gitkeep'] },
    });
    // cmdPhaseRemove calls output() which throws CliOutput -- catch it
    const result = catchCliOutput(() => cmdPhaseRemove(cwd, '2', { force: false }, true));
    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).removed).toBe('2');
    expect((result as Record<string, unknown>).directory_deleted).toBeNull();
  });

  it('removes a phase with its directory when force is true', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '01-Foundation': ['.gitkeep', '01-01-PLAN.md', '01-01-SUMMARY.md'] },
    });
    const result = catchCliOutput(() => cmdPhaseRemove(cwd, '1', { force: true }, true));
    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).removed).toBe('1');
    expect(
      fs.existsSync(path.join(cwd, '.planning', 'phases', '01-Foundation')),
    ).toBe(false);
  });

  it('throws CliError when phase has summaries and force is false', () => {
    const cwd = makeTempDir();
    scaffoldPlanning(cwd, {
      roadmap: '### Phase 1: Foundation\n\n**Goal:** Build core\n',
      phases: { '01-Foundation': ['.gitkeep', '01-01-PLAN.md', '01-01-SUMMARY.md'] },
    });
    expect(() => cmdPhaseRemove(cwd, '1', { force: false }, true)).toThrow(CliError);
  });
});
