/**
 * MAXSIM Tools Tests - Milestone
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

describe('milestone complete command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('archives roadmap, requirements, creates MILESTONES.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n\n### Phase 1: Foundation\n**Goal:** Setup\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements\n\n- [ ] User auth\n- [ ] Dashboard\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(
      path.join(p1, '01-01-SUMMARY.md'),
      `---\none-liner: Set up project infrastructure\n---\n# Summary\n`
    );

    const result = runMaxsimTools('milestone complete v1.0 --name MVP Foundation', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.version).toBe('v1.0');
    expect(output.phases).toBe(1);
    expect(output.archived.roadmap, 'roadmap should be archived').toBeTruthy();
    expect(output.archived.requirements, 'requirements should be archived').toBeTruthy();

    // Verify archive files exist
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'milestones', 'v1.0-ROADMAP.md')),
      'archived roadmap should exist'
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'milestones', 'v1.0-REQUIREMENTS.md')),
      'archived requirements should exist'
    ).toBeTruthy();

    // Verify MILESTONES.md created
    expect(
      fs.existsSync(path.join(tmpDir, '.planning', 'MILESTONES.md')),
      'MILESTONES.md should be created'
    ).toBeTruthy();
    const milestones = fs.readFileSync(path.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
    expect(milestones, 'milestone entry should contain name').toMatch(/v1\.0 MVP Foundation/);
    expect(milestones, 'accomplishments should be listed').toMatch(/Set up project infrastructure/);
  });

  test('appends to existing MILESTONES.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'MILESTONES.md'),
      `# Milestones\n\n## v0.9 Alpha (Shipped: 2025-01-01)\n\n---\n\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const result = runMaxsimTools('milestone complete v1.0 --name Beta', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const milestones = fs.readFileSync(path.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
    expect(milestones, 'existing entry should be preserved').toMatch(/v0\.9 Alpha/);
    expect(milestones, 'new entry should be appended').toMatch(/v1\.0 Beta/);
  });
});
