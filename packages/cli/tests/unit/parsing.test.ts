/**
 * Unit tests for core parsing functions.
 *
 * Tests the pure functions that underpin all ROADMAP.md, STATE.md,
 * and phase-directory reading in both the CLI tools and the dashboard server.
 * No filesystem access or server is required.
 */

import { describe, it, expect } from 'vitest';
import { normalizePhaseName, comparePhaseNum, getPhasePattern } from '../../src/core/core.js';
import { stateExtractField, stateReplaceField } from '../../src/core/state.js';

// ─── normalizePhaseName ───────────────────────────────────────────────────────

describe('normalizePhaseName', () => {
  it('pads single-digit numbers to 2 digits', () => {
    expect(normalizePhaseName('1')).toBe('01');
    expect(normalizePhaseName('5')).toBe('05');
    expect(normalizePhaseName('9')).toBe('09');
  });

  it('preserves already-padded numbers', () => {
    expect(normalizePhaseName('01')).toBe('01');
    expect(normalizePhaseName('10')).toBe('10');
    expect(normalizePhaseName('15')).toBe('15');
  });

  it('uppercases letter suffixes', () => {
    expect(normalizePhaseName('1a')).toBe('01A');
    expect(normalizePhaseName('3b')).toBe('03B');
    expect(normalizePhaseName('01A')).toBe('01A');
    expect(normalizePhaseName('15B')).toBe('15B');
  });

  it('handles decimal phases', () => {
    expect(normalizePhaseName('1.1')).toBe('01.1');
    expect(normalizePhaseName('01.2')).toBe('01.2');
    expect(normalizePhaseName('15.3')).toBe('15.3');
  });

  it('returns input unchanged when no numeric prefix matches', () => {
    expect(normalizePhaseName('no-match')).toBe('no-match');
  });
});

// ─── comparePhaseNum ─────────────────────────────────────────────────────────

describe('comparePhaseNum', () => {
  it('sorts ascending by integer part', () => {
    expect(comparePhaseNum('01', '02')).toBeLessThan(0);
    expect(comparePhaseNum('10', '02')).toBeGreaterThan(0);
    expect(comparePhaseNum('03', '03')).toBe(0);
  });

  it('returns 0 for identical phase strings', () => {
    expect(comparePhaseNum('01', '01')).toBe(0);
    expect(comparePhaseNum('01A', '01A')).toBe(0);
    expect(comparePhaseNum('01.1', '01.1')).toBe(0);
  });

  it('sorts base phases before letter-suffix phases', () => {
    expect(comparePhaseNum('01', '01A')).toBeLessThan(0);
    expect(comparePhaseNum('01A', '01')).toBeGreaterThan(0);
  });

  it('sorts letter suffixes alphabetically', () => {
    expect(comparePhaseNum('01A', '01B')).toBeLessThan(0);
    expect(comparePhaseNum('01B', '01A')).toBeGreaterThan(0);
    expect(comparePhaseNum('01A', '01C')).toBeLessThan(0);
  });

  it('sorts decimal phases correctly (01.1 < 01.2)', () => {
    expect(comparePhaseNum('01.1', '01.2')).toBeLessThan(0);
    expect(comparePhaseNum('01.2', '01.1')).toBeGreaterThan(0);
  });

  it('places decimal phases correctly relative to base phases', () => {
    // 01 < 01.1
    expect(comparePhaseNum('01', '01.1')).toBeLessThan(0);
    expect(comparePhaseNum('01.1', '01')).toBeGreaterThan(0);
  });

  it('sorts an array of mixed phase IDs in ascending order', () => {
    const phases = ['02', '01B', '01', '01.2', '01A', '01.1'];
    const sorted = [...phases].sort(comparePhaseNum);
    // All phases with integer 01 come before 02; within 01 the sub-sort is deterministic
    expect(sorted[0]).toBe('01');
    expect(sorted[sorted.length - 1]).toBe('02');
    // 01A < 01B (alphabetical)
    const idxA = sorted.indexOf('01A');
    const idxB = sorted.indexOf('01B');
    expect(idxA).toBeLessThan(idxB);
    // 01.1 < 01.2 (numeric)
    const idx11 = sorted.indexOf('01.1');
    const idx12 = sorted.indexOf('01.2');
    expect(idx11).toBeLessThan(idx12);
  });

  it('handles numeric strings as input', () => {
    // comparePhaseNum accepts string|number — cast to string internally
    expect(comparePhaseNum('1', '2')).toBeLessThan(0);
    expect(comparePhaseNum('10', '9')).toBeGreaterThan(0);
  });

  it('falls back to localeCompare for non-matching inputs', () => {
    // Both match the regex prefix, so this tests the edge case of no match
    const result = comparePhaseNum('abc', 'abd');
    // Should not throw — result direction is unspecified but must be a number
    expect(typeof result).toBe('number');
  });
});

// ─── getPhasePattern ─────────────────────────────────────────────────────────

describe('getPhasePattern', () => {
  it('general pattern matches standard ## Phase NN: Name headers', () => {
    const pattern = getPhasePattern();
    const match = pattern.exec('### Phase 01: Foundation');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('01');
    expect(match![2]).toBe('Foundation');
  });

  it('general pattern captures decimal phase numbers', () => {
    const pattern = getPhasePattern();
    const match = pattern.exec('### Phase 01.1: Sub-feature');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('01.1');
    expect(match![2]).toBe('Sub-feature');
  });

  it('general pattern captures letter-suffix phase numbers', () => {
    const pattern = getPhasePattern();
    const match = pattern.exec('### Phase 01A: Gap Work');
    expect(match).not.toBeNull();
    expect(match![1]).toBe('01A');
    expect(match![2]).toBe('Gap Work');
  });

  it('general pattern matches ## (h2) and #### (h4) headings', () => {
    const patternH2 = getPhasePattern();
    expect(patternH2.test('## Phase 01: Foundation')).toBe(true);
    const patternH4 = getPhasePattern();
    expect(patternH4.test('#### Phase 01: Foundation')).toBe(true);
  });

  it('general pattern does NOT match h1 or h5+ headings', () => {
    const pattern = getPhasePattern();
    expect(pattern.test('# Phase 01: Foundation')).toBe(false);
    pattern.lastIndex = 0;
    expect(pattern.test('##### Phase 01: Foundation')).toBe(false);
  });

  it('general pattern does NOT match plain text without # prefix', () => {
    const pattern = getPhasePattern();
    expect(pattern.test('Phase 01: Foundation')).toBe(false);
  });

  it('specific pattern matches only the requested phase number', () => {
    const pattern = getPhasePattern('01', 'i');
    expect(pattern.test('### Phase 01: Foundation')).toBe(true);
    expect(pattern.test('### Phase 02: Integration')).toBe(false);
    expect(pattern.test('### Phase 015: Other')).toBe(false);
  });

  it('specific pattern for decimal phase requires escaped dot', () => {
    // Caller must escape the dot before passing to getPhasePattern
    const escaped = '01\\.1';
    const pattern = getPhasePattern(escaped, 'i');
    expect(pattern.test('### Phase 01.1: Subtask')).toBe(true);
    expect(pattern.test('### Phase 0111: Other')).toBe(false);
  });

  it('general pattern iterates over multiple phases in a ROADMAP string', () => {
    const roadmap = [
      '## Phase Details',
      '',
      '### Phase 01: Foundation',
      '**Goal**: Build the core',
      '',
      '### Phase 02: Integration',
      '**Goal**: Wire it up',
    ].join('\n');

    const pattern = getPhasePattern();
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(roadmap)) !== null) {
      matches.push(m[1]);
    }
    expect(matches).toEqual(['01', '02']);
  });

  it('raw phase name captures text including (INSERTED) suffix', () => {
    // Server strips (INSERTED) after the match — the raw regex captures it
    const pattern = getPhasePattern();
    const match = pattern.exec('### Phase 72.1: Hotfix (INSERTED)');
    expect(match).not.toBeNull();
    // Raw match[2] includes (INSERTED); caller is responsible for stripping
    expect(match![2]).toContain('Hotfix');
    expect(match![2]).toContain('(INSERTED)');
  });
});

// ─── stateExtractField ───────────────────────────────────────────────────────

describe('stateExtractField', () => {
  const stateContent = [
    '# Project State',
    '',
    '## Current Position',
    '',
    '**Status:** In progress',
    '**Current Phase:** 03',
    '**Current Plan:** 03-01',
    '',
    '## Context',
    '',
    '**Last Activity:** 2026-02-26 — Completed research',
  ].join('\n');

  it('extracts a bold field value', () => {
    expect(stateExtractField(stateContent, 'Status')).toBe('In progress');
    expect(stateExtractField(stateContent, 'Current Phase')).toBe('03');
    expect(stateExtractField(stateContent, 'Current Plan')).toBe('03-01');
  });

  it('is case-insensitive for field names', () => {
    expect(stateExtractField(stateContent, 'status')).toBe('In progress');
    expect(stateExtractField(stateContent, 'current phase')).toBe('03');
    expect(stateExtractField(stateContent, 'CURRENT PLAN')).toBe('03-01');
  });

  it('returns null for fields that are not present', () => {
    expect(stateExtractField(stateContent, 'Missing Field')).toBeNull();
    expect(stateExtractField(stateContent, 'Progress')).toBeNull();
  });

  it('does NOT match non-bold "Key: value" format', () => {
    // STATE.md sometimes has plain "Phase: 01" lines — stateExtractField should NOT match these
    const plainContent = 'Phase: 01\nStatus: plain value\n';
    expect(stateExtractField(plainContent, 'Phase')).toBeNull();
    expect(stateExtractField(plainContent, 'Status')).toBeNull();
  });

  it('extracts value including special characters and dashes', () => {
    expect(stateExtractField(stateContent, 'Last Activity')).toBe('2026-02-26 — Completed research');
  });

  it('handles content with Windows CRLF line endings', () => {
    const crlfContent = '**Status:** Ready\r\n**Phase:** 01\r\n';
    // stateExtractField uses single-line regex match — \r\n does not break extraction
    // The captured group [1] includes the trailing \r if present; trim() is called
    const result = stateExtractField(crlfContent, 'Status');
    expect(result).not.toBeNull();
    expect(result?.trim()).toBe('Ready');
  });
});

// ─── stateReplaceField ───────────────────────────────────────────────────────

describe('stateReplaceField', () => {
  const stateContent = '**Status:** In progress\n**Phase:** 01\n**Plan:** 01-01\n';

  it('replaces an existing bold field value', () => {
    const result = stateReplaceField(stateContent, 'Status', 'Completed');
    expect(result).not.toBeNull();
    expect(result).toContain('**Status:** Completed');
    expect(result).not.toContain('**Status:** In progress');
  });

  it('preserves unmodified fields', () => {
    const result = stateReplaceField(stateContent, 'Status', 'Done');
    expect(result).toContain('**Phase:** 01');
    expect(result).toContain('**Plan:** 01-01');
  });

  it('returns null when field does not exist', () => {
    expect(stateReplaceField(stateContent, 'Missing', 'value')).toBeNull();
    expect(stateReplaceField(stateContent, 'NonExistent Field', 'x')).toBeNull();
  });

  it('is case-insensitive for field names', () => {
    const result = stateReplaceField(stateContent, 'status', 'Done');
    expect(result).not.toBeNull();
    expect(result).toContain('Done');
  });

  it('replaces with an empty string value', () => {
    const result = stateReplaceField(stateContent, 'Status', '');
    expect(result).not.toBeNull();
    expect(result).toContain('**Status:** ');
  });

  it('replaces with a value containing special characters', () => {
    const result = stateReplaceField(stateContent, 'Status', 'In progress — Phase 01 blocked');
    expect(result).not.toBeNull();
    expect(result).toContain('**Status:** In progress — Phase 01 blocked');
  });

  it('round-trips: extract the value that was just written', () => {
    const updated = stateReplaceField(stateContent, 'Phase', '07');
    expect(updated).not.toBeNull();
    expect(stateExtractField(updated!, 'Phase')).toBe('07');
  });
});

// ─── ROADMAP.md checkbox regex (used in parseRoadmap) ────────────────────────

describe('ROADMAP.md phase checkbox pattern', () => {
  /**
   * The dashboard server builds this regex for each phase to detect
   * whether the ROADMAP.md checklist item is checked:
   *   new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum}`, 'i')
   */
  function buildCheckboxPattern(phaseNum: string): RegExp {
    const escaped = phaseNum.replace('.', '\\.');
    return new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${escaped}`, 'i');
  }

  it('detects an unchecked phase', () => {
    const line = '- [ ] **Phase 01: Foundation** - Build core';
    const m = line.match(buildCheckboxPattern('01'));
    expect(m).not.toBeNull();
    expect(m![1]).toBe(' ');
  });

  it('detects a checked phase', () => {
    const line = '- [x] **Phase 01: Foundation** - Build core';
    const m = line.match(buildCheckboxPattern('01'));
    expect(m).not.toBeNull();
    expect(m![1]).toBe('x');
  });

  it('is case-insensitive (X and x both match)', () => {
    const line = '- [X] **Phase 01: Foundation** - Build core';
    const m = line.match(buildCheckboxPattern('01'));
    expect(m).not.toBeNull();
  });

  it('does not match the wrong phase number', () => {
    const line = '- [x] **Phase 02: Integration** - Wire it together';
    const m = line.match(buildCheckboxPattern('01'));
    expect(m).toBeNull();
  });

  it('matches decimal phase numbers when dot is escaped', () => {
    const line = '- [ ] **Phase 01.1: Subtask** - Do work';
    const m = line.match(buildCheckboxPattern('01.1'));
    expect(m).not.toBeNull();
    expect(m![1]).toBe(' ');
  });
});

// ─── Phase disk-status logic (inline verification) ───────────────────────────

describe('phase diskStatus derivation logic', () => {
  /**
   * Mirrors the diskStatus logic from parseRoadmap() in server.ts.
   * This ensures the logic is testable without spawning the full server.
   */
  function deriveDiskStatus(opts: {
    planCount: number;
    summaryCount: number;
    hasContext: boolean;
    hasResearch: boolean;
    dirExists: boolean;
  }): string {
    if (!opts.dirExists) return 'no_directory';
    const { planCount, summaryCount, hasContext, hasResearch } = opts;
    if (summaryCount >= planCount && planCount > 0) return 'complete';
    if (summaryCount > 0) return 'partial';
    if (planCount > 0) return 'planned';
    if (hasResearch) return 'researched';
    if (hasContext) return 'discussed';
    return 'empty';
  }

  it('no_directory when dir does not exist', () => {
    expect(deriveDiskStatus({ planCount: 0, summaryCount: 0, hasContext: false, hasResearch: false, dirExists: false })).toBe('no_directory');
  });

  it('empty when dir exists but has no relevant files', () => {
    expect(deriveDiskStatus({ planCount: 0, summaryCount: 0, hasContext: false, hasResearch: false, dirExists: true })).toBe('empty');
  });

  it('discussed when only context file exists', () => {
    expect(deriveDiskStatus({ planCount: 0, summaryCount: 0, hasContext: true, hasResearch: false, dirExists: true })).toBe('discussed');
  });

  it('researched when research file exists (takes precedence over context)', () => {
    expect(deriveDiskStatus({ planCount: 0, summaryCount: 0, hasContext: true, hasResearch: true, dirExists: true })).toBe('researched');
    expect(deriveDiskStatus({ planCount: 0, summaryCount: 0, hasContext: false, hasResearch: true, dirExists: true })).toBe('researched');
  });

  it('planned when plan(s) exist but no summaries', () => {
    expect(deriveDiskStatus({ planCount: 1, summaryCount: 0, hasContext: false, hasResearch: false, dirExists: true })).toBe('planned');
    expect(deriveDiskStatus({ planCount: 3, summaryCount: 0, hasContext: false, hasResearch: false, dirExists: true })).toBe('planned');
  });

  it('partial when some but not all plans have summaries', () => {
    expect(deriveDiskStatus({ planCount: 2, summaryCount: 1, hasContext: false, hasResearch: false, dirExists: true })).toBe('partial');
  });

  it('complete when all plans have summaries', () => {
    expect(deriveDiskStatus({ planCount: 1, summaryCount: 1, hasContext: false, hasResearch: false, dirExists: true })).toBe('complete');
    expect(deriveDiskStatus({ planCount: 3, summaryCount: 3, hasContext: false, hasResearch: false, dirExists: true })).toBe('complete');
  });

  it('complete even when extra summaries exist beyond plan count', () => {
    // summaryCount > planCount — treated as complete (over-complete)
    expect(deriveDiskStatus({ planCount: 1, summaryCount: 2, hasContext: false, hasResearch: false, dirExists: true })).toBe('complete');
  });
});
