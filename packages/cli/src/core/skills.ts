/**
 * Skills — List, install, and update skill templates
 *
 * Skills are installed to `.claude/skills/<name>/SKILL.md`.
 * Source templates live in `templates/skills/<name>/SKILL.md`.
 */

import fs from 'node:fs';
import path from 'node:path';

import { safeReadFile } from './core.js';
import { extractFrontmatter } from './frontmatter.js';
import { cmdOk, cmdErr, type CmdResult } from './types.js';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Resolve the installed skills directory for the current project.
 * Skills live at `.claude/skills/` relative to cwd.
 */
function skillsDir(cwd: string): string {
  return path.join(cwd, '.claude', 'skills');
}

/**
 * Resolve the templates source directory for skills.
 * At runtime (from dist/cli.cjs), templates are bundled at dist/assets/templates/skills/.
 */
function skillsTemplateDir(): string {
  return path.resolve(__dirname, 'assets', 'templates', 'skills');
}

interface SkillInfo {
  name: string;
  description: string;
  directory: string;
}

/**
 * Read a single skill's metadata from its SKILL.md frontmatter.
 */
function readSkillInfo(skillDir: string, dirName: string): SkillInfo | null {
  const skillMd = path.join(skillDir, 'SKILL.md');
  const content = safeReadFile(skillMd);
  if (!content) return null;

  const fm = extractFrontmatter(content);
  return {
    name: (fm.name as string) ?? dirName,
    description: (fm.description as string) ?? '',
    directory: dirName,
  };
}

// ─── Commands ────────────────────────────────────────────────────────────────

/**
 * List all installed skills from `.claude/skills/`.
 */
export function cmdSkillList(cwd: string): CmdResult {
  const dir = skillsDir(cwd);

  if (!fs.existsSync(dir)) {
    return cmdOk({ skills: [], count: 0 }, 'No skills installed.');
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const skills: SkillInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const info = readSkillInfo(path.join(dir, entry.name), entry.name);
    if (info) skills.push(info);
  }

  return cmdOk({ skills, count: skills.length }, skills.map(s => `${s.name}: ${s.description}`).join('\n'));
}

/**
 * Install a specific skill from the templates directory.
 */
export function cmdSkillInstall(cwd: string, skillName: string | undefined): CmdResult {
  if (!skillName) {
    return cmdErr('skill name required. Usage: skill-install <name>');
  }

  const srcFile = path.join(skillsTemplateDir(), skillName, 'SKILL.md');

  if (!fs.existsSync(srcFile)) {
    // List available skills for a helpful error
    const available = listAvailableTemplates();
    return cmdErr(`Skill "${skillName}" not found in templates. Available: ${available.join(', ')}`);
  }

  const destDir = path.join(skillsDir(cwd), skillName);
  const destFile = path.join(destDir, 'SKILL.md');

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcFile, destFile);

  return cmdOk({ installed: true, skill: skillName, path: path.relative(cwd, destFile) }, `Installed skill: ${skillName}`);
}

/**
 * Update one or all installed skills from the templates source.
 */
export function cmdSkillUpdate(cwd: string, skillName: string | undefined): CmdResult {
  const dir = skillsDir(cwd);
  const templateDir = skillsTemplateDir();

  if (skillName) {
    // Update a single skill
    const srcFile = path.join(templateDir, skillName, 'SKILL.md');
    if (!fs.existsSync(srcFile)) {
      return cmdErr(`Skill template "${skillName}" not found.`);
    }

    const destDir = path.join(dir, skillName);
    if (!fs.existsSync(destDir)) {
      return cmdErr(`Skill "${skillName}" is not installed. Use skill-install first.`);
    }

    const destFile = path.join(destDir, 'SKILL.md');
    fs.copyFileSync(srcFile, destFile);

    return cmdOk({ updated: [skillName], skipped: [], not_found: [] }, `Updated skill: ${skillName}`);
  }

  // Update all installed skills
  if (!fs.existsSync(dir)) {
    return cmdOk({ updated: [], skipped: [], not_found: [] }, 'No skills installed.');
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const srcFile = path.join(templateDir, name, 'SKILL.md');

    if (!fs.existsSync(srcFile)) {
      // Custom/user skill — no template to update from
      skipped.push(name);
      continue;
    }

    const destFile = path.join(dir, name, 'SKILL.md');
    fs.copyFileSync(srcFile, destFile);
    updated.push(name);
  }

  const summary = updated.length > 0
    ? `Updated ${updated.length} skill(s): ${updated.join(', ')}`
    : 'No skills updated.';

  return cmdOk({ updated, skipped }, summary);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function listAvailableTemplates(): string[] {
  const dir = skillsTemplateDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}
