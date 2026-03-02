/**
 * Skills — List, install, and update CLI skills
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { output, error, rethrowCliSignals } from './core.js';
import { extractFrontmatter } from './frontmatter.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Skills installed by MAXSIM (not user-created). */
const BUILT_IN_SKILLS = [
  'tdd',
  'systematic-debugging',
  'verification-before-completion',
  'code-review',
  'simplify',
  'memory-management',
  'using-maxsim',
  'batch-execution',
  'subagent-driven-development',
  'writing-plans',
] as const;

/** Installed skills directory under the Claude config. */
function skillsDir(): string {
  return path.join(os.homedir(), '.claude', 'agents', 'skills');
}

/** Bundled skills directory inside the npm package. */
function bundledSkillsDir(): string {
  return path.resolve(__dirname, 'assets', 'templates', 'skills');
}

// ─── skill list ──────────────────────────────────────────────────────────────

interface SkillInfo {
  name: string;
  description: string;
  path: string;
  builtIn: boolean;
}

export function cmdSkillList(_cwd: string, raw: boolean): void {
  const dir = skillsDir();

  if (!fs.existsSync(dir)) {
    output({ count: 0, skills: [] }, raw, '0 skills installed');
    return;
  }

  const skills: SkillInfo[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMd = path.join(dir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;

      try {
        const content = fs.readFileSync(skillMd, 'utf-8');
        const fm = extractFrontmatter(content);
        skills.push({
          name: (fm.name as string) || entry.name,
          description: (fm.description as string) || '',
          path: path.join(dir, entry.name),
          builtIn: (BUILT_IN_SKILLS as readonly string[]).includes(entry.name),
        });
      } catch {
        // Skill exists but SKILL.md is malformed — still list it
        skills.push({
          name: entry.name,
          description: '',
          path: path.join(dir, entry.name),
          builtIn: (BUILT_IN_SKILLS as readonly string[]).includes(entry.name),
        });
      }
    }
  } catch (e: unknown) {
    rethrowCliSignals(e);
    error('Failed to list skills: ' + (e as Error).message);
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const summary = skills.map(s => `${s.name}: ${s.description}`).join('\n');
  output({ count: skills.length, skills }, raw, `${skills.length} skills installed\n${summary}`);
}

// ─── skill install ───────────────────────────────────────────────────────────

export function cmdSkillInstall(_cwd: string, skillName: string | undefined, raw: boolean): void {
  if (!skillName) {
    error('skill name required for skill install');
  }

  const bundled = bundledSkillsDir();
  const srcDir = path.join(bundled, skillName);
  const srcFile = path.join(srcDir, 'SKILL.md');

  if (!fs.existsSync(srcFile)) {
    const available = listBundledSkillNames(bundled);
    error(`Skill '${skillName}' not found in bundle. Available: ${available.join(', ') || 'none'}`);
  }

  const destDir = path.join(skillsDir(), skillName);
  installSkillFromBundle(srcDir, destDir);

  output(
    { installed: true, skill: skillName, path: destDir },
    raw,
    `Installed skill '${skillName}' to ${destDir}`,
  );
}

// ─── skill update ────────────────────────────────────────────────────────────

export function cmdSkillUpdate(_cwd: string, raw: boolean): void {
  const bundled = bundledSkillsDir();

  if (!fs.existsSync(bundled)) {
    error('Bundled skills directory not found. Is MAXSIM installed correctly?');
  }

  const dest = skillsDir();
  fs.mkdirSync(dest, { recursive: true });

  let updated = 0;
  const updatedNames: string[] = [];

  for (const skillName of BUILT_IN_SKILLS) {
    const srcDir = path.join(bundled, skillName);
    if (!fs.existsSync(srcDir)) continue;

    const destSkillDir = path.join(dest, skillName);

    // Remove old version if present
    if (fs.existsSync(destSkillDir)) {
      fs.rmSync(destSkillDir, { recursive: true });
    }

    installSkillFromBundle(srcDir, destSkillDir);
    updated++;
    updatedNames.push(skillName);
  }

  output(
    { updated, skills: updatedNames },
    raw,
    `Updated ${updated} built-in skills`,
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Copy a bundled skill to the destination and process path replacements. */
function installSkillFromBundle(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  copyDirRecursive(srcDir, destDir);

  // Expand ~/.claude/ to absolute home path for consistency
  const destFile = path.join(destDir, 'SKILL.md');
  let content = fs.readFileSync(destFile, 'utf-8');
  const homePrefix = path.join(os.homedir(), '.claude') + '/';
  content = content.replace(/~\/\.claude\//g, homePrefix.replace(/\\/g, '/'));
  fs.writeFileSync(destFile, content, 'utf-8');
}

/** Recursively copy a directory. */
function copyDirRecursive(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** List skill names available in a bundled skills directory. */
function listBundledSkillNames(bundledDir: string): string[] {
  try {
    return fs.readdirSync(bundledDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(bundledDir, e.name, 'SKILL.md')))
      .map(e => e.name);
  } catch {
    return [];
  }
}
