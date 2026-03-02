/**
 * Skills — List, install, and update skill templates
 *
 * Skills are installed to `.claude/skills/<name>/SKILL.md`.
 * Source templates live in `templates/skills/<name>/SKILL.md`.
 */

import fs from 'node:fs';
import path from 'node:path';

import { output, error, safeReadFile } from './core.js';
import { extractFrontmatter } from './frontmatter.js';

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
export function cmdSkillList(cwd: string, raw: boolean): void {
  const dir = skillsDir(cwd);

  if (!fs.existsSync(dir)) {
    output({ skills: [], count: 0 }, raw, 'No skills installed.');
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const skills: SkillInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const info = readSkillInfo(path.join(dir, entry.name), entry.name);
    if (info) skills.push(info);
  }

  output({ skills, count: skills.length }, raw, skills.map(s => `${s.name}: ${s.description}`).join('\n'));
}

/**
 * Install a specific skill from the templates directory.
 */
export function cmdSkillInstall(cwd: string, skillName: string | undefined, raw: boolean): void {
  if (!skillName) {
    error('skill name required. Usage: skill-install <name>');
  }

  const srcFile = path.join(skillsTemplateDir(), skillName, 'SKILL.md');

  if (!fs.existsSync(srcFile)) {
    // List available skills for a helpful error
    const available = listAvailableTemplates();
    error(`Skill "${skillName}" not found in templates. Available: ${available.join(', ')}`);
  }

  const destDir = path.join(skillsDir(cwd), skillName);
  const destFile = path.join(destDir, 'SKILL.md');

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcFile, destFile);

  output({ installed: true, skill: skillName, path: path.relative(cwd, destFile) }, raw, `Installed skill: ${skillName}`);
}

/**
 * Update one or all installed skills from the templates source.
 */
export function cmdSkillUpdate(cwd: string, skillName: string | undefined, raw: boolean): void {
  const dir = skillsDir(cwd);
  const templateDir = skillsTemplateDir();

  if (skillName) {
    // Update a single skill
    const srcFile = path.join(templateDir, skillName, 'SKILL.md');
    if (!fs.existsSync(srcFile)) {
      error(`Skill template "${skillName}" not found.`);
    }

    const destDir = path.join(dir, skillName);
    if (!fs.existsSync(destDir)) {
      error(`Skill "${skillName}" is not installed. Use skill-install first.`);
    }

    const destFile = path.join(destDir, 'SKILL.md');
    fs.copyFileSync(srcFile, destFile);

    output({ updated: [skillName], skipped: [], not_found: [] }, raw, `Updated skill: ${skillName}`);
    return;
  }

  // Update all installed skills
  if (!fs.existsSync(dir)) {
    output({ updated: [], skipped: [], not_found: [] }, raw, 'No skills installed.');
    return;
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

  output({ updated, skipped }, raw, summary);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function listAvailableTemplates(): string[] {
  const dir = skillsTemplateDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}
