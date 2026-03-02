/**
 * Unit tests for skills.ts — CmdResult pattern
 *
 * Validates that cmdSkillList, cmdSkillInstall, and cmdSkillUpdate
 * return CmdResult objects instead of throwing via output()/error().
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { cmdSkillList, cmdSkillInstall, cmdSkillUpdate } from '../../src/core/skills.js';

// ─── cmdSkillList ─────────────────────────────────────────────────────────────

describe('cmdSkillList', () => {
  it('returns ok with empty skills when .claude/skills/ does not exist', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-list-none-${Date.now()}`);
    const result = cmdSkillList(fakeCwd);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.result as { skills: unknown[]; count: number };
      expect(data.skills).toEqual([]);
      expect(data.count).toBe(0);
    }
  });

  it('returns ok with skill entries when directory has subdirs with SKILL.md files', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-list-found-${Date.now()}`);
    const skillDir = path.join(fakeCwd, '.claude', 'skills', 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: My Skill\ndescription: A test skill\n---\n# My Skill',
      'utf-8',
    );

    const result = cmdSkillList(fakeCwd);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.result as { skills: Array<{ name: string; description: string }>; count: number };
      expect(data.count).toBe(1);
      expect(data.skills[0].name).toBe('My Skill');
      expect(data.skills[0].description).toBe('A test skill');
    }

    fs.rmSync(fakeCwd, { recursive: true, force: true });
  });
});

// ─── cmdSkillInstall ──────────────────────────────────────────────────────────

describe('cmdSkillInstall', () => {
  it('returns err when skillName is undefined', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-install-noname-${Date.now()}`);
    const result = cmdSkillInstall(fakeCwd, undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('skill name required');
    }
  });

  it('returns err when skill template does not exist', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-install-missing-${Date.now()}`);
    const result = cmdSkillInstall(fakeCwd, 'nonexistent-skill');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not found in templates');
    }
  });
});

// ─── cmdSkillUpdate ───────────────────────────────────────────────────────────

describe('cmdSkillUpdate', () => {
  it('returns ok with empty arrays when no skills directory (update all)', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-update-none-${Date.now()}`);
    const result = cmdSkillUpdate(fakeCwd, undefined);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.result as { updated: string[]; skipped: string[]; not_found: string[] };
      expect(data.updated).toEqual([]);
      expect(data.skipped).toEqual([]);
    }
  });

  it('returns err when single skill not installed', () => {
    const fakeCwd = path.join(os.tmpdir(), `maxsim-test-skill-update-notinst-${Date.now()}`);
    const result = cmdSkillUpdate(fakeCwd, 'nonexistent-skill');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Could be "not found" (template missing) or "not installed"
      expect(result.error).toBeTruthy();
    }
  });
});
