/**
 * Phase — Phase CRUD, query, and lifecycle operations
 *
 * Ported from maxsim/bin/lib/phase.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  normalizePhaseName,
  comparePhaseNum,
  getPhasePattern,
  findPhaseInternal,
  getArchivedPhaseDirs,
  generateSlugInternal,
  output,
  error,
} from './core.js';
import { extractFrontmatter } from './frontmatter.js';
import type {
  PhaseNumber,
  PhasesListOptions,
  FrontmatterData,
} from './types.js';

// ─── Phase list ─────────────────────────────────────────────────────────────

export function cmdPhasesList(cwd: string, options: PhasesListOptions, raw: boolean): void {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const { type, phase, includeArchived } = options;

  if (!fs.existsSync(phasesDir)) {
    if (type) {
      output({ files: [], count: 0 }, raw, '');
    } else {
      output({ directories: [], count: 0 }, raw, '');
    }
    return;
  }

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    let dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    if (includeArchived) {
      const archived = getArchivedPhaseDirs(cwd);
      for (const a of archived) {
        dirs.push(`${a.name} [${a.milestone}]`);
      }
    }

    dirs.sort((a, b) => comparePhaseNum(a, b));

    if (phase) {
      const normalized = normalizePhaseName(phase);
      const match = dirs.find(d => d.startsWith(normalized));
      if (!match) {
        output({ files: [], count: 0, phase_dir: null, error: 'Phase not found' }, raw, '');
        return;
      }
      dirs = [match];
    }

    if (type) {
      const files: string[] = [];
      for (const dir of dirs) {
        const dirPath = path.join(phasesDir, dir);
        const dirFiles = fs.readdirSync(dirPath);

        let filtered: string[];
        if (type === 'plans') {
          filtered = dirFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
        } else if (type === 'summaries') {
          filtered = dirFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
        } else {
          filtered = dirFiles;
        }

        files.push(...filtered.sort());
      }

      const result = {
        files,
        count: files.length,
        phase_dir: phase ? dirs[0].replace(/^\d+(?:\.\d+)?-?/, '') : null,
      };
      output(result, raw, files.join('\n'));
      return;
    }

    output({ directories: dirs, count: dirs.length }, raw, dirs.join('\n'));
  } catch (e: unknown) {
    error('Failed to list phases: ' + (e as Error).message);
  }
}

// ─── Next decimal ───────────────────────────────────────────────────────────

export function cmdPhaseNextDecimal(cwd: string, basePhase: string, raw: boolean): void {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(basePhase);

  if (!fs.existsSync(phasesDir)) {
    output(
      { found: false, base_phase: normalized, next: `${normalized}.1`, existing: [] },
      raw,
      `${normalized}.1`,
    );
    return;
  }

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    const baseExists = dirs.some(d => d.startsWith(normalized + '-') || d === normalized);

    const decimalPattern = new RegExp(`^${normalized}\\.(\\d+)`);
    const existingDecimals: string[] = [];

    for (const dir of dirs) {
      const match = dir.match(decimalPattern);
      if (match) {
        existingDecimals.push(`${normalized}.${match[1]}`);
      }
    }

    existingDecimals.sort((a, b) => {
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      return aNum - bNum;
    });

    let nextDecimal: string;
    if (existingDecimals.length === 0) {
      nextDecimal = `${normalized}.1`;
    } else {
      const lastDecimal = existingDecimals[existingDecimals.length - 1];
      const lastNum = parseInt(lastDecimal.split('.')[1], 10);
      nextDecimal = `${normalized}.${lastNum + 1}`;
    }

    output(
      { found: baseExists, base_phase: normalized, next: nextDecimal, existing: existingDecimals },
      raw,
      nextDecimal,
    );
  } catch (e: unknown) {
    error('Failed to calculate next decimal phase: ' + (e as Error).message);
  }
}

// ─── Find phase ─────────────────────────────────────────────────────────────

export function cmdFindPhase(cwd: string, phase: string | undefined, raw: boolean): void {
  if (!phase) {
    error('phase identifier required');
  }

  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(phase);

  const notFound = { found: false, directory: null, phase_number: null, phase_name: null, plans: [] as string[], summaries: [] as string[] };

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) {
      output(notFound, raw, '');
      return;
    }

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;

    const phaseDir = path.join(phasesDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);
    const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
    const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();

    const result = {
      found: true,
      directory: path.join('.planning', 'phases', match),
      phase_number: phaseNumber,
      phase_name: phaseName,
      plans,
      summaries,
    };

    output(result, raw, result.directory);
  } catch {
    output(notFound, raw, '');
  }
}

// ─── Phase plan index ───────────────────────────────────────────────────────

export function cmdPhasePlanIndex(cwd: string, phase: string | undefined, raw: boolean): void {
  if (!phase) {
    error('phase required for phase-plan-index');
  }

  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(phase);

  let phaseDir: string | null = null;
  let phaseDirName: string | null = null;
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized));
    if (match) {
      phaseDir = path.join(phasesDir, match);
      phaseDirName = match;
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  if (!phaseDir) {
    output({ phase: normalized, error: 'Phase not found', plans: [], waves: {}, incomplete: [], has_checkpoints: false }, raw);
    return;
  }

  const phaseFiles = fs.readdirSync(phaseDir);
  const planFiles = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
  const summaryFiles = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');

  const completedPlanIds = new Set(
    summaryFiles.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')),
  );

  const plans: Array<{
    id: string;
    wave: number;
    autonomous: boolean;
    objective: string | null;
    files_modified: string[];
    task_count: number;
    has_summary: boolean;
  }> = [];
  const waves: Record<string, string[]> = {};
  const incomplete: string[] = [];
  let hasCheckpoints = false;

  for (const planFile of planFiles) {
    const planId = planFile.replace('-PLAN.md', '').replace('PLAN.md', '');
    const planPath = path.join(phaseDir, planFile);
    const content = fs.readFileSync(planPath, 'utf-8');
    const fm = extractFrontmatter(content);

    const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
    const taskCount = taskMatches.length;

    const wave = parseInt(fm.wave as string, 10) || 1;

    let autonomous = true;
    if (fm.autonomous !== undefined) {
      autonomous = fm.autonomous === 'true' || fm.autonomous === true;
    }

    if (!autonomous) {
      hasCheckpoints = true;
    }

    let filesModified: string[] = [];
    if (fm['files-modified']) {
      filesModified = Array.isArray(fm['files-modified']) ? fm['files-modified'] as string[] : [fm['files-modified'] as string];
    }

    const hasSummary = completedPlanIds.has(planId);
    if (!hasSummary) {
      incomplete.push(planId);
    }

    const plan = {
      id: planId,
      wave,
      autonomous,
      objective: (fm.objective as string) || null,
      files_modified: filesModified,
      task_count: taskCount,
      has_summary: hasSummary,
    };

    plans.push(plan);

    const waveKey = String(wave);
    if (!waves[waveKey]) {
      waves[waveKey] = [];
    }
    waves[waveKey].push(planId);
  }

  output({ phase: normalized, plans, waves, incomplete, has_checkpoints: hasCheckpoints }, raw);
}

// ─── Phase add ──────────────────────────────────────────────────────────────

export function cmdPhaseAdd(cwd: string, description: string | undefined, raw: boolean): void {
  if (!description) {
    error('description required for phase add');
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) {
    error('ROADMAP.md not found');
  }

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const slug = generateSlugInternal(description);

  const phasePattern = getPhasePattern();
  let maxPhase = 0;
  let m: RegExpExecArray | null;
  while ((m = phasePattern.exec(content)) !== null) {
    const num = parseInt(m[1], 10);
    if (num > maxPhase) maxPhase = num;
  }

  const newPhaseNum = maxPhase + 1;
  const paddedNum = String(newPhaseNum).padStart(2, '0');
  const dirName = `${paddedNum}-${slug}`;
  const dirPath = path.join(cwd, '.planning', 'phases', dirName);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  const phaseEntry = `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${newPhaseNum} to break down)\n`;

  let updatedContent: string;
  const lastSeparator = content.lastIndexOf('\n---');
  if (lastSeparator > 0) {
    updatedContent = content.slice(0, lastSeparator) + phaseEntry + content.slice(lastSeparator);
  } else {
    updatedContent = content + phaseEntry;
  }

  fs.writeFileSync(roadmapPath, updatedContent, 'utf-8');

  output(
    { phase_number: newPhaseNum, padded: paddedNum, name: description, slug, directory: `.planning/phases/${dirName}` },
    raw,
    paddedNum,
  );
}

// ─── Phase insert ───────────────────────────────────────────────────────────

export function cmdPhaseInsert(cwd: string, afterPhase: string | undefined, description: string | undefined, raw: boolean): void {
  if (!afterPhase || !description) {
    error('after-phase and description required for phase insert');
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) {
    error('ROADMAP.md not found');
  }

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const slug = generateSlugInternal(description);

  const normalizedAfter = normalizePhaseName(afterPhase);
  const unpadded = normalizedAfter.replace(/^0+/, '');
  const afterPhaseEscaped = unpadded.replace(/\./g, '\\.');
  const targetPattern = getPhasePattern(afterPhaseEscaped, 'i');
  if (!targetPattern.test(content)) {
    error(`Phase ${afterPhase} not found in ROADMAP.md`);
  }

  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalizedBase = normalizePhaseName(afterPhase);
  const existingDecimals: number[] = [];

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    const decimalPattern = new RegExp(`^${normalizedBase}\\.(\\d+)`);
    for (const dir of dirs) {
      const dm = dir.match(decimalPattern);
      if (dm) existingDecimals.push(parseInt(dm[1], 10));
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  const nextDecimal = existingDecimals.length === 0 ? 1 : Math.max(...existingDecimals) + 1;
  const decimalPhase = `${normalizedBase}.${nextDecimal}`;
  const dirName = `${decimalPhase}-${slug}`;
  const dirPath = path.join(cwd, '.planning', 'phases', dirName);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  const phaseEntry = `\n### Phase ${decimalPhase}: ${description} (INSERTED)\n\n**Goal:** [Urgent work - to be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${afterPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${decimalPhase} to break down)\n`;

  const headerPattern = new RegExp(`(#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:[^\\n]*\\n)`, 'i');
  const headerMatch = content.match(headerPattern);
  if (!headerMatch) {
    error(`Could not find Phase ${afterPhase} header`);
  }

  const headerIdx = content.indexOf(headerMatch![0]);
  const afterHeader = content.slice(headerIdx + headerMatch![0].length);
  const nextPhaseMatch = afterHeader.match(/\n#{2,4}\s+Phase\s+\d/i);

  let insertIdx: number;
  if (nextPhaseMatch) {
    insertIdx = headerIdx + headerMatch![0].length + nextPhaseMatch.index!;
  } else {
    insertIdx = content.length;
  }

  const updatedContent = content.slice(0, insertIdx) + phaseEntry + content.slice(insertIdx);
  fs.writeFileSync(roadmapPath, updatedContent, 'utf-8');

  output(
    { phase_number: decimalPhase, after_phase: afterPhase, name: description, slug, directory: `.planning/phases/${dirName}` },
    raw,
    decimalPhase,
  );
}

// ─── Phase remove ───────────────────────────────────────────────────────────

export function cmdPhaseRemove(
  cwd: string,
  targetPhase: string | undefined,
  options: { force: boolean },
  raw: boolean,
): void {
  if (!targetPhase) {
    error('phase number required for phase remove');
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const force = options.force || false;

  if (!fs.existsSync(roadmapPath)) {
    error('ROADMAP.md not found');
  }

  const normalized = normalizePhaseName(targetPhase);
  const isDecimal = targetPhase.includes('.');

  let targetDir: string | null = null;
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    targetDir = dirs.find(d => d.startsWith(normalized + '-') || d === normalized) || null;
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  if (targetDir && !force) {
    const targetPath = path.join(phasesDir, targetDir);
    const files = fs.readdirSync(targetPath);
    const summaries = files.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
    if (summaries.length > 0) {
      error(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
    }
  }

  if (targetDir) {
    fs.rmSync(path.join(phasesDir, targetDir), { recursive: true, force: true });
  }

  const renamedDirs: Array<{ from: string; to: string }> = [];
  const renamedFiles: Array<{ from: string; to: string }> = [];

  if (isDecimal) {
    const baseParts = normalized.split('.');
    const baseInt = baseParts[0];
    const removedDecimal = parseInt(baseParts[1], 10);

    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

      const decPattern = new RegExp(`^${baseInt}\\.(\\d+)-(.+)$`);
      const toRename: Array<{ dir: string; oldDecimal: number; slug: string }> = [];
      for (const dir of dirs) {
        const dm = dir.match(decPattern);
        if (dm && parseInt(dm[1], 10) > removedDecimal) {
          toRename.push({ dir, oldDecimal: parseInt(dm[1], 10), slug: dm[2] });
        }
      }

      toRename.sort((a, b) => b.oldDecimal - a.oldDecimal);

      for (const item of toRename) {
        const newDecimal = item.oldDecimal - 1;
        const oldPhaseId = `${baseInt}.${item.oldDecimal}`;
        const newPhaseId = `${baseInt}.${newDecimal}`;
        const newDirName = `${baseInt}.${newDecimal}-${item.slug}`;

        fs.renameSync(path.join(phasesDir, item.dir), path.join(phasesDir, newDirName));
        renamedDirs.push({ from: item.dir, to: newDirName });

        const dirFiles = fs.readdirSync(path.join(phasesDir, newDirName));
        for (const f of dirFiles) {
          if (f.includes(oldPhaseId)) {
            const newFileName = f.replace(oldPhaseId, newPhaseId);
            fs.renameSync(
              path.join(phasesDir, newDirName, f),
              path.join(phasesDir, newDirName, newFileName),
            );
            renamedFiles.push({ from: f, to: newFileName });
          }
        }
      }
    } catch (e) {
      /* optional op, ignore */
      if (process.env.MAXSIM_DEBUG) console.error(e);
    }
  } else {
    const removedInt = parseInt(normalized, 10);

    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

      const toRename: Array<{ dir: string; oldInt: number; letter: string; decimal: number | null; slug: string }> = [];
      for (const dir of dirs) {
        const dm = dir.match(/^(\d+)([A-Z])?(?:\.(\d+))?-(.+)$/i);
        if (!dm) continue;
        const dirInt = parseInt(dm[1], 10);
        if (dirInt > removedInt) {
          toRename.push({
            dir,
            oldInt: dirInt,
            letter: dm[2] ? dm[2].toUpperCase() : '',
            decimal: dm[3] ? parseInt(dm[3], 10) : null,
            slug: dm[4],
          });
        }
      }

      toRename.sort((a, b) => {
        if (a.oldInt !== b.oldInt) return b.oldInt - a.oldInt;
        return (b.decimal || 0) - (a.decimal || 0);
      });

      for (const item of toRename) {
        const newInt = item.oldInt - 1;
        const newPadded = String(newInt).padStart(2, '0');
        const oldPadded = String(item.oldInt).padStart(2, '0');
        const letterSuffix = item.letter || '';
        const decimalSuffix = item.decimal !== null ? `.${item.decimal}` : '';
        const oldPrefix = `${oldPadded}${letterSuffix}${decimalSuffix}`;
        const newPrefix = `${newPadded}${letterSuffix}${decimalSuffix}`;
        const newDirName = `${newPrefix}-${item.slug}`;

        fs.renameSync(path.join(phasesDir, item.dir), path.join(phasesDir, newDirName));
        renamedDirs.push({ from: item.dir, to: newDirName });

        const dirFiles = fs.readdirSync(path.join(phasesDir, newDirName));
        for (const f of dirFiles) {
          if (f.startsWith(oldPrefix)) {
            const newFileName = newPrefix + f.slice(oldPrefix.length);
            fs.renameSync(
              path.join(phasesDir, newDirName, f),
              path.join(phasesDir, newDirName, newFileName),
            );
            renamedFiles.push({ from: f, to: newFileName });
          }
        }
      }
    } catch (e) {
      /* optional op, ignore */
      if (process.env.MAXSIM_DEBUG) console.error(e);
    }
  }

  // Update ROADMAP.md
  let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  const targetEscaped = targetPhase.replace(/\./g, '\\.');
  const sectionPattern = new RegExp(
    `\\n?#{2,4}\\s*Phase\\s+${targetEscaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+Phase\\s+\\d|$)`,
    'i',
  );
  roadmapContent = roadmapContent.replace(sectionPattern, '');

  const checkboxPattern = new RegExp(`\\n?-\\s*\\[[ x]\\]\\s*.*Phase\\s+${targetEscaped}[:\\s][^\\n]*`, 'gi');
  roadmapContent = roadmapContent.replace(checkboxPattern, '');

  const tableRowPattern = new RegExp(`\\n?\\|\\s*${targetEscaped}\\.?\\s[^|]*\\|[^\\n]*`, 'gi');
  roadmapContent = roadmapContent.replace(tableRowPattern, '');

  if (!isDecimal) {
    const removedInt = parseInt(normalized, 10);
    const maxPhase = 99;
    for (let oldNum = maxPhase; oldNum > removedInt; oldNum--) {
      const newNum = oldNum - 1;
      const oldStr = String(oldNum);
      const newStr = String(newNum);
      const oldPad = oldStr.padStart(2, '0');
      const newPad = newStr.padStart(2, '0');

      roadmapContent = roadmapContent.replace(
        new RegExp(`(#{2,4}\\s*Phase\\s+)${oldStr}(\\s*:)`, 'gi'),
        `$1${newStr}$2`,
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`(Phase\\s+)${oldStr}([:\\s])`, 'g'),
        `$1${newStr}$2`,
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`${oldPad}-(\\d{2})`, 'g'),
        `${newPad}-$1`,
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`(\\|\\s*)${oldStr}\\.\\s`, 'g'),
        `$1${newStr}. `,
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`(Depends on:\\*\\*\\s*Phase\\s+)${oldStr}\\b`, 'gi'),
        `$1${newStr}`,
      );
    }
  }

  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

  // Update STATE.md phase count
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  if (fs.existsSync(statePath)) {
    let stateContent = fs.readFileSync(statePath, 'utf-8');
    const totalPattern = /(\*\*Total Phases:\*\*\s*)(\d+)/;
    const totalMatch = stateContent.match(totalPattern);
    if (totalMatch) {
      const oldTotal = parseInt(totalMatch[2], 10);
      stateContent = stateContent.replace(totalPattern, `$1${oldTotal - 1}`);
    }
    const ofPattern = /(\bof\s+)(\d+)(\s*(?:\(|phases?))/i;
    const ofMatch = stateContent.match(ofPattern);
    if (ofMatch) {
      const oldTotal = parseInt(ofMatch[2], 10);
      stateContent = stateContent.replace(ofPattern, `$1${oldTotal - 1}$3`);
    }
    fs.writeFileSync(statePath, stateContent, 'utf-8');
  }

  output({
    removed: targetPhase,
    directory_deleted: targetDir || null,
    renamed_directories: renamedDirs,
    renamed_files: renamedFiles,
    roadmap_updated: true,
    state_updated: fs.existsSync(statePath),
  }, raw);
}

// ─── Phase complete ─────────────────────────────────────────────────────────

export function cmdPhaseComplete(cwd: string, phaseNum: string | undefined, raw: boolean): void {
  if (!phaseNum) {
    error('phase number required for phase complete');
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(phaseNum);
  const today = new Date().toISOString().split('T')[0];

  const phaseInfo = findPhaseInternal(cwd, phaseNum);
  if (!phaseInfo) {
    error(`Phase ${phaseNum} not found`);
  }

  const planCount = phaseInfo!.plans.length;
  const summaryCount = phaseInfo!.summaries.length;

  if (fs.existsSync(roadmapPath)) {
    let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

    const checkboxPattern = new RegExp(
      `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseNum.replace('.', '\\.')}[:\\s][^\\n]*)`,
      'i',
    );
    roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);

    const phaseEscaped = phaseNum.replace('.', '\\.');
    const tablePattern = new RegExp(
      `(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|[^|]*\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`,
      'i',
    );
    roadmapContent = roadmapContent.replace(
      tablePattern,
      `$1 Complete    $2 ${today} $3`,
    );

    const planCountPattern = new RegExp(
      `(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`,
      'i',
    );
    roadmapContent = roadmapContent.replace(
      planCountPattern,
      `$1${summaryCount}/${planCount} plans complete`,
    );

    fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

    // Update REQUIREMENTS.md
    const reqPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');
    if (fs.existsSync(reqPath)) {
      const reqMatch = roadmapContent.match(
        new RegExp(`Phase\\s+${phaseNum.replace('.', '\\.')}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, 'i'),
      );

      if (reqMatch) {
        const reqIds = reqMatch[1].replace(/[\[\]]/g, '').split(/[,\s]+/).map(r => r.trim()).filter(Boolean);
        let reqContent = fs.readFileSync(reqPath, 'utf-8');

        for (const reqId of reqIds) {
          reqContent = reqContent.replace(
            new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, 'gi'),
            '$1x$2',
          );
          reqContent = reqContent.replace(
            new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'),
            '$1 Complete $2',
          );
        }

        fs.writeFileSync(reqPath, reqContent, 'utf-8');
      }
    }
  }

  // Find next phase
  let nextPhaseNum: string | null = null;
  let nextPhaseName: string | null = null;
  let isLastPhase = true;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
      if (dm) {
        if (comparePhaseNum(dm[1], phaseNum) > 0) {
          nextPhaseNum = dm[1];
          nextPhaseName = dm[2] || null;
          isLastPhase = false;
          break;
        }
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  // Update STATE.md
  if (fs.existsSync(statePath)) {
    let stateContent = fs.readFileSync(statePath, 'utf-8');

    stateContent = stateContent.replace(
      /(\*\*Current Phase:\*\*\s*).*/,
      `$1${nextPhaseNum || phaseNum}`,
    );

    if (nextPhaseName) {
      stateContent = stateContent.replace(
        /(\*\*Current Phase Name:\*\*\s*).*/,
        `$1${nextPhaseName.replace(/-/g, ' ')}`,
      );
    }

    stateContent = stateContent.replace(
      /(\*\*Status:\*\*\s*).*/,
      `$1${isLastPhase ? 'Milestone complete' : 'Ready to plan'}`,
    );

    stateContent = stateContent.replace(
      /(\*\*Current Plan:\*\*\s*).*/,
      `$1Not started`,
    );

    stateContent = stateContent.replace(
      /(\*\*Last Activity:\*\*\s*).*/,
      `$1${today}`,
    );

    stateContent = stateContent.replace(
      /(\*\*Last Activity Description:\*\*\s*).*/,
      `$1Phase ${phaseNum} complete${nextPhaseNum ? `, transitioned to Phase ${nextPhaseNum}` : ''}`,
    );

    fs.writeFileSync(statePath, stateContent, 'utf-8');
  }

  output({
    completed_phase: phaseNum,
    phase_name: phaseInfo!.phase_name,
    plans_executed: `${summaryCount}/${planCount}`,
    next_phase: nextPhaseNum,
    next_phase_name: nextPhaseName,
    is_last_phase: isLastPhase,
    date: today,
    roadmap_updated: fs.existsSync(roadmapPath),
    state_updated: fs.existsSync(statePath),
  }, raw);
}
