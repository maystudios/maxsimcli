/**
 * Error-path tests for core.ts
 *
 * Validates graceful handling of corrupted configs, nonexistent files,
 * and edge-case inputs for the pure utility functions in core.ts.
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {
  loadConfig,
  safeReadFile,
  normalizePhaseName,
  comparePhaseNum,
  findPhaseInternal,
  escapePhaseNum,
  listSubDirs,
} from '../../src/core/core.js';

// ─── loadConfig — error paths ────────────────────────────────────────────────

describe('loadConfig error paths', () => {
  // loadConfig has an internal cache keyed by cwd. We use unique fake paths
  // per test to avoid cache interference.

  it('returns defaults when config.json does not exist', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-no-config-${Date.now()}`);
    const config = loadConfig(fakeCwd);
    expect(config.model_profile).toBe('balanced');
    expect(config.commit_docs).toBe(true);
    expect(config.branching_strategy).toBe('none');
    expect(config.research).toBe(true);
    expect(config.plan_checker).toBe(true);
    expect(config.verifier).toBe(true);
    expect(config.parallelization).toBe(true);
    expect(config.brave_search).toBe(false);
  });

  it('returns defaults when config.json contains corrupted JSON', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-corrupt-${Date.now()}`);
    const cfgDir = path.join(fakeCwd, '.planning');
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(path.join(cfgDir, 'config.json'), '{invalid json!!!', 'utf-8');

    const config = loadConfig(fakeCwd);
    expect(config.model_profile).toBe('balanced');
    expect(config.commit_docs).toBe(true);
    expect(config.branching_strategy).toBe('none');

    // Cleanup
    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });

  it('returns defaults when config.json is empty', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-empty-cfg-${Date.now()}`);
    const cfgDir = path.join(fakeCwd, '.planning');
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(path.join(cfgDir, 'config.json'), '', 'utf-8');

    const config = loadConfig(fakeCwd);
    // Empty string is invalid JSON, so catch block returns defaults
    expect(config.model_profile).toBe('balanced');

    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });

  it('merges partial config with defaults', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-partial-${Date.now()}`);
    const cfgDir = path.join(fakeCwd, '.planning');
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, 'config.json'),
      JSON.stringify({ model_profile: 'quality' }),
      'utf-8',
    );

    const config = loadConfig(fakeCwd);
    expect(config.model_profile).toBe('quality');
    // Other fields should be defaults
    expect(config.commit_docs).toBe(true);
    expect(config.branching_strategy).toBe('none');

    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });

  it('returns cached config on second call with same cwd', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-cache-${Date.now()}`);
    const config1 = loadConfig(fakeCwd);
    const config2 = loadConfig(fakeCwd);
    // Should be the exact same object reference (cached)
    expect(config1).toBe(config2);
  });
});

// ─── safeReadFile — error paths ──────────────────────────────────────────────

describe('safeReadFile error paths', () => {
  it('returns null for a nonexistent file path', () => {
    const result = safeReadFile('/nonexistent/path/to/file.txt');
    expect(result).toBeNull();
  });

  it('returns null for a path that is a directory, not a file', () => {
    const result = safeReadFile(os.tmpdir());
    // Reading a directory with readFileSync throws, so safeReadFile returns null
    expect(result).toBeNull();
  });

  it('returns file content for a valid file', () => {
    const tmpFile = path.join(os.tmpdir(), `maxsim-test-safe-read-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'hello world', 'utf-8');
    const result = safeReadFile(tmpFile);
    expect(result).toBe('hello world');
    fs.unlinkSync(tmpFile);
  });

  it('returns empty string for an empty file (not null)', () => {
    const tmpFile = path.join(os.tmpdir(), `maxsim-test-empty-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, '', 'utf-8');
    const result = safeReadFile(tmpFile);
    expect(result).toBe('');
    fs.unlinkSync(tmpFile);
  });
});

// ─── normalizePhaseName — edge cases ─────────────────────────────────────────

describe('normalizePhaseName edge cases', () => {
  it('returns empty string unchanged for empty input', () => {
    expect(normalizePhaseName('')).toBe('');
  });

  it('returns input unchanged for special characters only', () => {
    expect(normalizePhaseName('---')).toBe('---');
    expect(normalizePhaseName('!!!')).toBe('!!!');
    expect(normalizePhaseName('@#$')).toBe('@#$');
  });

  it('returns input unchanged for pure alphabetic input (no leading digits)', () => {
    expect(normalizePhaseName('abc')).toBe('abc');
    expect(normalizePhaseName('Foundation')).toBe('Foundation');
  });

  it('handles very large numbers', () => {
    expect(normalizePhaseName('999')).toBe('999');
    expect(normalizePhaseName('100')).toBe('100');
  });

  it('handles single digit with letter and decimal', () => {
    // Edge case: letter + decimal not typical but let's see behavior
    expect(normalizePhaseName('1A.1')).toBe('01A.1');
  });

  it('only matches first letter suffix (single letter)', () => {
    // "1AB" — regex matches (\d+)([A-Z])? so captures "1" and "A", "B" is ignored
    const result = normalizePhaseName('1AB');
    expect(result).toBe('01A');
  });

  it('handles leading zeros beyond 2 digits', () => {
    expect(normalizePhaseName('001')).toBe('001');
  });

  it('handles phase number with trailing text after the number part', () => {
    // "01-Foundation" — regex /^(\d+)([A-Z])?(\.\d+)?/i matches "01" prefix
    // The function reconstructs from captured groups: padded + letter + decimal = "01"
    // The trailing "-Foundation" is NOT included in the result
    const result = normalizePhaseName('01-Foundation');
    expect(result).toBe('01');
  });
});

// ─── comparePhaseNum — edge cases ────────────────────────────────────────────

describe('comparePhaseNum edge cases', () => {
  it('handles empty strings (falls back to localeCompare)', () => {
    const result = comparePhaseNum('', '');
    expect(result).toBe(0);
  });

  it('handles one empty string and one valid phase', () => {
    // Empty string doesn't match the regex, so falls back to localeCompare
    const result = comparePhaseNum('', '01');
    expect(typeof result).toBe('number');
  });

  it('handles special characters (falls back to localeCompare)', () => {
    const result = comparePhaseNum('---', '!!!');
    expect(typeof result).toBe('number');
  });

  it('handles numeric input (number type)', () => {
    expect(comparePhaseNum(1, 2)).toBeLessThan(0);
    expect(comparePhaseNum(10, 3)).toBeGreaterThan(0);
    expect(comparePhaseNum(5, 5)).toBe(0);
  });

  it('handles mixed numeric and string input', () => {
    expect(comparePhaseNum(1, '2')).toBeLessThan(0);
    expect(comparePhaseNum('1', 2)).toBeLessThan(0);
  });

  it('handles same integer but one with letter and one with decimal', () => {
    // 01A vs 01.1 — letter sorts before decimal in the algorithm
    // Letter: la='A', lb='' (no letter in 01.1), so lb is empty → la wins (return 1 for A having a letter)
    // Actually: 01A matches (\d+)([A-Z])?(\.\d+)? → [1]='01', [2]='A', [3]=undefined
    //           01.1 matches → [1]='01', [2]=undefined, [3]='.1'
    // la='A', lb='' → !lb is true → return 1 (A comes AFTER no-letter)
    // So 01A > 01.1? Let's verify:
    const result = comparePhaseNum('01A', '01.1');
    // The algorithm: la='A', lb=''. !la is false, !lb is true → return 1
    // So 01A > 01.1
    expect(result).toBeGreaterThan(0);
  });

  it('handles zero as phase number', () => {
    expect(comparePhaseNum('0', '1')).toBeLessThan(0);
    expect(comparePhaseNum('00', '01')).toBeLessThan(0);
  });
});

// ─── escapePhaseNum ──────────────────────────────────────────────────────────

describe('escapePhaseNum edge cases', () => {
  it('escapes dots in phase numbers', () => {
    expect(escapePhaseNum('01.1')).toBe('01\\.1');
  });

  it('returns plain number string unchanged', () => {
    expect(escapePhaseNum('01')).toBe('01');
    expect(escapePhaseNum('1')).toBe('1');
  });

  it('handles numeric input', () => {
    expect(escapePhaseNum(1)).toBe('1');
    expect(escapePhaseNum(10)).toBe('10');
  });

  it('handles multiple dots', () => {
    expect(escapePhaseNum('1.2.3')).toBe('1\\.2\\.3');
  });

  it('handles empty string', () => {
    expect(escapePhaseNum('')).toBe('');
  });
});

// ─── findPhaseInternal / searchPhaseInDir — nonexistent directory ─────────────

describe('findPhaseInternal with nonexistent directory', () => {
  it('returns null when phases directory does not exist', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-no-phases-${Date.now()}`);
    const result = findPhaseInternal(fakeCwd, '01');
    expect(result).toBeNull();
  });

  it('returns null for empty phase string', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-empty-phase-${Date.now()}`);
    const result = findPhaseInternal(fakeCwd, '');
    expect(result).toBeNull();
  });

  it('returns null when phases directory exists but is empty', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-empty-dir-${Date.now()}`);
    const phasesDir = path.join(fakeCwd, '.planning', 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });

    const result = findPhaseInternal(fakeCwd, '01');
    expect(result).toBeNull();

    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });

  it('finds a phase when directory matches', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-find-phase-${Date.now()}`);
    const phaseDir = path.join(fakeCwd, '.planning', 'phases', '01-Foundation');
    fs.mkdirSync(phaseDir, { recursive: true });
    // Create a plan file
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan', 'utf-8');

    const result = findPhaseInternal(fakeCwd, '01');
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.phase_number).toBe('01');
    expect(result!.phase_name).toBe('Foundation');
    expect(result!.plans).toContain('01-01-PLAN.md');

    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });
});

// ─── listSubDirs — error paths ───────────────────────────────────────────────

describe('listSubDirs error paths', () => {
  it('throws when directory does not exist', () => {
    expect(() => listSubDirs('/nonexistent/directory/path')).toThrow();
  });

  it('returns empty array for an empty directory', () => {
    const tmpDir = path.join(os.tmpdir(), `maxsim-test-empty-subdir-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    expect(listSubDirs(tmpDir)).toEqual([]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ignores files, only returns directories', () => {
    const tmpDir = path.join(os.tmpdir(), `maxsim-test-files-subdir-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content', 'utf-8');
    fs.mkdirSync(path.join(tmpDir, 'subdir'));

    const result = listSubDirs(tmpDir);
    expect(result).toEqual(['subdir']);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
