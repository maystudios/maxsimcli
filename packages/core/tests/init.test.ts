/**
 * MAXSIM Tools Tests - Init
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runMaxsimTools, createTempProject, cleanup } from './helpers';

/** Normalize path separators for cross-platform comparison */
const norm = (p: string) => p.replace(/\\/g, '/');

describe('init commands', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('init execute-phase returns file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');

    const result = runMaxsimTools('init execute-phase 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.state_path).toBe('.planning/STATE.md');
    expect(output.roadmap_path).toBe('.planning/ROADMAP.md');
    expect(output.config_path).toBe('.planning/config.json');
  });

  test('init plan-phase returns file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
    fs.writeFileSync(path.join(phaseDir, '03-RESEARCH.md'), '# Research Findings');
    fs.writeFileSync(path.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
    fs.writeFileSync(path.join(phaseDir, '03-UAT.md'), '# UAT');

    const result = runMaxsimTools('init plan-phase 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.state_path).toBe('.planning/STATE.md');
    expect(output.roadmap_path).toBe('.planning/ROADMAP.md');
    expect(output.requirements_path).toBe('.planning/REQUIREMENTS.md');
    expect(norm(output.context_path)).toBe('.planning/phases/03-api/03-CONTEXT.md');
    expect(norm(output.research_path)).toBe('.planning/phases/03-api/03-RESEARCH.md');
    expect(norm(output.verification_path)).toBe('.planning/phases/03-api/03-VERIFICATION.md');
    expect(norm(output.uat_path)).toBe('.planning/phases/03-api/03-UAT.md');
  });

  test('init progress returns file paths', () => {
    const result = runMaxsimTools('init progress', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.state_path).toBe('.planning/STATE.md');
    expect(output.roadmap_path).toBe('.planning/ROADMAP.md');
    expect(output.project_path).toBe('.planning/PROJECT.md');
    expect(output.config_path).toBe('.planning/config.json');
  });

  test('init phase-op returns core and optional phase file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
    fs.writeFileSync(path.join(phaseDir, '03-RESEARCH.md'), '# Research');
    fs.writeFileSync(path.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
    fs.writeFileSync(path.join(phaseDir, '03-UAT.md'), '# UAT');

    const result = runMaxsimTools('init phase-op 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.state_path).toBe('.planning/STATE.md');
    expect(output.roadmap_path).toBe('.planning/ROADMAP.md');
    expect(output.requirements_path).toBe('.planning/REQUIREMENTS.md');
    expect(norm(output.context_path)).toBe('.planning/phases/03-api/03-CONTEXT.md');
    expect(norm(output.research_path)).toBe('.planning/phases/03-api/03-RESEARCH.md');
    expect(norm(output.verification_path)).toBe('.planning/phases/03-api/03-VERIFICATION.md');
    expect(norm(output.uat_path)).toBe('.planning/phases/03-api/03-UAT.md');
  });

  test('init plan-phase omits optional paths if files missing', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    const result = runMaxsimTools('init plan-phase 03', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.context_path).toBe(undefined);
    expect(output.research_path).toBe(undefined);
  });

  // ── phase_req_ids extraction (fix for #684) ──────────────────────────────

  test('init plan-phase extracts phase_req_ids from ROADMAP', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02, CP-03\n**Plans:** 0 plans\n`
    );

    const result = runMaxsimTools('init plan-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe('CP-01, CP-02, CP-03');
  });

  test('init plan-phase strips brackets from phase_req_ids', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: [CP-01, CP-02]\n**Plans:** 0 plans\n`
    );

    const result = runMaxsimTools('init plan-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe('CP-01, CP-02');
  });

  test('init plan-phase returns null phase_req_ids when Requirements line is absent', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 0 plans\n`
    );

    const result = runMaxsimTools('init plan-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe(null);
  });

  test('init plan-phase returns null phase_req_ids when ROADMAP is absent', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runMaxsimTools('init plan-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe(null);
  });

  test('init execute-phase extracts phase_req_ids from ROADMAP', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02\n**Plans:** 1 plans\n`
    );

    const result = runMaxsimTools('init execute-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe('EX-01, EX-02');
  });

  test('init plan-phase returns null phase_req_ids when value is TBD', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: TBD\n**Plans:** 0 plans\n`
    );

    const result = runMaxsimTools('init plan-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids, 'TBD placeholder should return null').toBe(null);
  });

  test('init execute-phase returns null phase_req_ids when Requirements line is absent', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 1 plans\n`
    );

    const result = runMaxsimTools('init execute-phase 3', tmpDir);
    expect(result.success, `Command failed: ${result.error}`).toBeTruthy();

    const output = JSON.parse(result.output);
    expect(output.phase_req_ids).toBe(null);
  });
});
