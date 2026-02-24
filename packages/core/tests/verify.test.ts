/**
 * MAXSIM Tools Tests - Verify
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

describe('validate consistency command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('passes for consistent project', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n### Phase 2: B\n### Phase 3: C\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-b'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-c'), { recursive: true });

    const result = runMaxsimTools('validate consistency', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.passed, 'should pass').toBe(true);
    expect(output.warning_count, 'no warnings').toBe(0);
  });

  test('warns about phase on disk but not in roadmap', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-orphan'), { recursive: true });

    const result = runMaxsimTools('validate consistency', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.warning_count > 0, 'should have warnings').toBeTruthy();
    expect(
      output.warnings.some((w: string) => w.includes('disk but not in ROADMAP')),
      'should warn about orphan directory'
    ).toBeTruthy();
  });

  test('warns about gaps in phase numbering', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n### Phase 3: C\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-c'), { recursive: true });

    const result = runMaxsimTools('validate consistency', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(
      output.warnings.some((w: string) => w.includes('Gap in phase numbering')),
      'should warn about gap'
    ).toBeTruthy();
  });
});
