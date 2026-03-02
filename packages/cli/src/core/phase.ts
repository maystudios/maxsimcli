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
  phasesPath,
  roadmapPath,
  statePath,
  planningPath,
  isPlanFile,
  isSummaryFile,
  planId,
  summaryId,
  listSubDirs,
  listSubDirsAsync,
  debugLog,
  errorMsg,
  todayISO,
  escapePhaseNum,
} from './core.js';
import { extractFrontmatter } from './frontmatter.js';
import { cmdOk, cmdErr } from './types.js';
import type {
  PhasesListOptions,
  CmdResult,
} from './types.js';

// ─── Core result types ──────────────────────────────────────────────────────

export interface PhaseCreateOptions {
  includeStubs?: boolean;
}

export interface PhaseAddResult {
  phase_number: number;
  padded: string;
  slug: string;
  directory: string;
  description: string;
}

export interface PhaseInsertResult {
  phase_number: string;
  after_phase: string;
  slug: string;
  directory: string;
  description: string;
}

export interface PhaseCompleteResult {
  completed_phase: string;
  phase_name: string | null;
  plans_executed: string;
  next_phase: string | null;
  next_phase_name: string | null;
  is_last_phase: boolean;
  date: string;
  roadmap_updated: boolean;
  state_updated: boolean;
  requirements_updated: boolean;
}

// ─── Stub scaffolding ───────────────────────────────────────────────────────

export function scaffoldPhaseStubs(dirPath: string, phaseId: string, name: string): void {
  const today = todayISO();
  fs.writeFileSync(
    path.join(dirPath, `${phaseId}-CONTEXT.md`),
    `# Phase ${phaseId} Context: ${name}\n\n**Created:** ${today}\n**Phase goal:** [To be defined during /maxsim:discuss-phase]\n\n---\n\n_Context will be populated by /maxsim:discuss-phase_\n`,
  );
  fs.writeFileSync(
    path.join(dirPath, `${phaseId}-RESEARCH.md`),
    `# Phase ${phaseId}: ${name} - Research\n\n**Researched:** Not yet\n**Domain:** TBD\n**Confidence:** TBD\n\n---\n\n_Research will be populated by /maxsim:research-phase_\n`,
  );
}

// ─── Core functions ─────────────────────────────────────────────────────────

export function phaseAddCore(cwd: string, description: string, options?: PhaseCreateOptions): PhaseAddResult {
  const rmPath = roadmapPath(cwd);
  if (!fs.existsSync(rmPath)) {
    throw new Error('ROADMAP.md not found');
  }

  const content = fs.readFileSync(rmPath, 'utf-8');
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
  const dirPath = planningPath(cwd, 'phases', dirName);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  if (options?.includeStubs) {
    scaffoldPhaseStubs(dirPath, paddedNum, description);
  }

  const phaseEntry = `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${newPhaseNum} to break down)\n`;

  let updatedContent: string;
  const lastSeparator = content.lastIndexOf('\n---');
  if (lastSeparator > 0) {
    updatedContent = content.slice(0, lastSeparator) + phaseEntry + content.slice(lastSeparator);
  } else {
    updatedContent = content + phaseEntry;
  }

  fs.writeFileSync(rmPath, updatedContent, 'utf-8');

  return {
    phase_number: newPhaseNum,
    padded: paddedNum,
    slug,
    directory: `.planning/phases/${dirName}`,
    description,
  };
}

export function phaseInsertCore(cwd: string, afterPhase: string, description: string, options?: PhaseCreateOptions): PhaseInsertResult {
  const rmPath = roadmapPath(cwd);
  if (!fs.existsSync(rmPath)) {
    throw new Error('ROADMAP.md not found');
  }

  const content = fs.readFileSync(rmPath, 'utf-8');
  const slug = generateSlugInternal(description);

  const normalizedAfter = normalizePhaseName(afterPhase);
  const unpadded = normalizedAfter.replace(/^0+/, '');
  const afterPhaseEscaped = '0*' + unpadded.replace(/\./g, '\\.');
  const targetPattern = getPhasePattern(afterPhaseEscaped, 'i');
  if (!targetPattern.test(content)) {
    throw new Error(`Phase ${afterPhase} not found in ROADMAP.md`);
  }

  const phasesDirPath = phasesPath(cwd);
  const normalizedBase = normalizePhaseName(afterPhase);
  const existingDecimals: number[] = [];

  try {
    const dirs = listSubDirs(phasesDirPath);
    const decimalPattern = new RegExp(`^${normalizedBase}\\.(\\d+)`);
    for (const dir of dirs) {
      const dm = dir.match(decimalPattern);
      if (dm) existingDecimals.push(parseInt(dm[1], 10));
    }
  } catch (e) {
    debugLog('phase-insert-decimal-scan-failed', e);
  }

  const nextDecimal = existingDecimals.length === 0 ? 1 : Math.max(...existingDecimals) + 1;
  const decimalPhase = `${normalizedBase}.${nextDecimal}`;
  const dirName = `${decimalPhase}-${slug}`;
  const dirPath = planningPath(cwd, 'phases', dirName);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  if (options?.includeStubs) {
    scaffoldPhaseStubs(dirPath, decimalPhase, description);
  }

  const phaseEntry = `\n### Phase ${decimalPhase}: ${description} (INSERTED)\n\n**Goal:** [Urgent work - to be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${afterPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${decimalPhase} to break down)\n`;

  const headerPattern = new RegExp(`(#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:[^\\n]*\\n)`, 'i');
  const headerMatch = content.match(headerPattern);
  if (!headerMatch) {
    throw new Error(`Could not find Phase ${afterPhase} header`);
  }

  const headerIdx = content.indexOf(headerMatch[0]);
  const afterHeader = content.slice(headerIdx + headerMatch[0].length);
  const nextPhaseMatch = afterHeader.match(/\n#{2,4}\s+Phase\s+\d/i);

  let insertIdx: number;
  if (nextPhaseMatch) {
    insertIdx = headerIdx + headerMatch[0].length + nextPhaseMatch.index!;
  } else {
    insertIdx = content.length;
  }

  const updatedContent = content.slice(0, insertIdx) + phaseEntry + content.slice(insertIdx);
  fs.writeFileSync(rmPath, updatedContent, 'utf-8');

  return {
    phase_number: decimalPhase,
    after_phase: afterPhase,
    slug,
    directory: `.planning/phases/${dirName}`,
    description,
  };
}

export function phaseCompleteCore(cwd: string, phaseNum: string): PhaseCompleteResult {
  const rmPath = roadmapPath(cwd);
  const stPath = statePath(cwd);
  const phasesDirPath = phasesPath(cwd);
  const today = todayISO();

  const phaseInfo = findPhaseInternal(cwd, phaseNum);
  if (!phaseInfo) {
    throw new Error(`Phase ${phaseNum} not found`);
  }

  const planCount = phaseInfo.plans.length;
  const summaryCount = phaseInfo.summaries.length;
  let requirementsUpdated = false;

  if (fs.existsSync(rmPath)) {
    let roadmapContent = fs.readFileSync(rmPath, 'utf-8');

    const checkboxPattern = new RegExp(
      `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${escapePhaseNum(phaseNum)}[:\\s][^\\n]*)`,
      'i',
    );
    roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);

    const phaseEscaped = escapePhaseNum(phaseNum);
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

    debugLog('phase-complete-write', `writing ROADMAP.md for phase ${phaseNum}`);
    fs.writeFileSync(rmPath, roadmapContent, 'utf-8');
    debugLog('phase-complete-write', `ROADMAP.md updated for phase ${phaseNum}`);

    // Update REQUIREMENTS.md
    const reqPath = planningPath(cwd, 'REQUIREMENTS.md');
    if (fs.existsSync(reqPath)) {
      const reqMatch = roadmapContent.match(
        new RegExp(`Phase\\s+${escapePhaseNum(phaseNum)}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, 'i'),
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

        debugLog('phase-complete-write', `writing REQUIREMENTS.md for phase ${phaseNum}`);
        fs.writeFileSync(reqPath, reqContent, 'utf-8');
        debugLog('phase-complete-write', `REQUIREMENTS.md updated for phase ${phaseNum}`);
        requirementsUpdated = true;
      }
    }
  }

  // Find next phase
  let nextPhaseNum: string | null = null;
  let nextPhaseName: string | null = null;
  let isLastPhase = true;

  try {
    const dirs = listSubDirs(phasesDirPath, true);

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
    debugLog('phase-complete-next-phase-scan-failed', e);
  }

  // Update STATE.md
  if (fs.existsSync(stPath)) {
    let stateContent = fs.readFileSync(stPath, 'utf-8');

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

    debugLog('phase-complete-write', `writing STATE.md for phase ${phaseNum}`);
    fs.writeFileSync(stPath, stateContent, 'utf-8');
    debugLog('phase-complete-write', `STATE.md updated for phase ${phaseNum}`);
  }

  return {
    completed_phase: phaseNum,
    phase_name: phaseInfo.phase_name,
    plans_executed: `${summaryCount}/${planCount}`,
    next_phase: nextPhaseNum,
    next_phase_name: nextPhaseName,
    is_last_phase: isLastPhase,
    date: today,
    roadmap_updated: fs.existsSync(rmPath),
    state_updated: fs.existsSync(stPath),
    requirements_updated: requirementsUpdated,
  };
}

// ─── Phase list ─────────────────────────────────────────────────────────────

export async function cmdPhasesList(cwd: string, options: PhasesListOptions): Promise<CmdResult> {
  const phasesDirPath = phasesPath(cwd);
  const { type, phase, includeArchived, offset, limit } = options;

  if (!fs.existsSync(phasesDirPath)) {
    if (type) {
      return cmdOk({ files: [], count: 0, total: 0 }, '');
    } else {
      return cmdOk({ directories: [], count: 0, total: 0 }, '');
    }
  }

  try {
    let dirs = await listSubDirsAsync(phasesDirPath);

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
        return cmdOk({ files: [], count: 0, total: 0, phase_dir: null, error: 'Phase not found' }, '');
      }
      dirs = [match];
    }

    if (type) {
      const fileResults = await Promise.all(
        dirs.map(async (dir) => {
          const dirPath = path.join(phasesDirPath, dir);
          const dirFiles = await fs.promises.readdir(dirPath);

          let filtered: string[];
          if (type === 'plans') {
            filtered = dirFiles.filter(isPlanFile);
          } else if (type === 'summaries') {
            filtered = dirFiles.filter(isSummaryFile);
          } else {
            filtered = dirFiles;
          }

          return filtered.sort();
        }),
      );
      const files = fileResults.flat();

      const result = {
        files,
        count: files.length,
        total: files.length,
        phase_dir: phase ? dirs[0].replace(/^\d+(?:\.\d+)?-?/, '') : null,
      };
      return cmdOk(result, files.join('\n'));
    }

    // Apply pagination
    const total = dirs.length;
    const start = offset ?? 0;
    const paginated = limit !== undefined ? dirs.slice(start, start + limit) : dirs.slice(start);

    return cmdOk({ directories: paginated, count: paginated.length, total }, paginated.join('\n'));
  } catch (e: unknown) {
    return cmdErr('Failed to list phases: ' + (e as Error).message);
  }
}

// ─── Next decimal ───────────────────────────────────────────────────────────

export function cmdPhaseNextDecimal(cwd: string, basePhase: string): CmdResult {
  const phasesDirPath = phasesPath(cwd);
  const normalized = normalizePhaseName(basePhase);

  if (!fs.existsSync(phasesDirPath)) {
    return cmdOk(
      { found: false, base_phase: normalized, next: `${normalized}.1`, existing: [] },
      `${normalized}.1`,
    );
  }

  try {
    const dirs = listSubDirs(phasesDirPath);

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

    return cmdOk(
      { found: baseExists, base_phase: normalized, next: nextDecimal, existing: existingDecimals },
      nextDecimal,
    );
  } catch (e: unknown) {
    return cmdErr('Failed to calculate next decimal phase: ' + (e as Error).message);
  }
}

// ─── Find phase ─────────────────────────────────────────────────────────────

export function cmdFindPhase(cwd: string, phase: string | undefined): CmdResult {
  if (!phase) {
    return cmdErr('phase identifier required');
  }

  const phasesDirPath = phasesPath(cwd);
  const normalized = normalizePhaseName(phase);

  const notFound = { found: false, directory: null, phase_number: null, phase_name: null, plans: [] as string[], summaries: [] as string[] };

  try {
    const dirs = listSubDirs(phasesDirPath, true);

    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) {
      return cmdOk(notFound, '');
    }

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;

    const phaseDir = path.join(phasesDirPath, match);
    const phaseFiles = fs.readdirSync(phaseDir);
    const plans = phaseFiles.filter(isPlanFile).sort();
    const summaries = phaseFiles.filter(isSummaryFile).sort();

    const result = {
      found: true,
      directory: path.join('.planning', 'phases', match),
      phase_number: phaseNumber,
      phase_name: phaseName,
      plans,
      summaries,
    };

    return cmdOk(result, result.directory);
  } catch (e: unknown) {
    return cmdOk(notFound, '');
  }
}

// ─── Phase plan index ───────────────────────────────────────────────────────

export function cmdPhasePlanIndex(cwd: string, phase: string | undefined): CmdResult {
  if (!phase) {
    return cmdErr('phase required for phase-plan-index');
  }

  const phasesDirPath = phasesPath(cwd);
  const normalized = normalizePhaseName(phase);

  let phaseDir: string | null = null;
  let phaseDirName: string | null = null;
  try {
    const dirs = listSubDirs(phasesDirPath, true);
    const match = dirs.find(d => d.startsWith(normalized));
    if (match) {
      phaseDir = path.join(phasesDirPath, match);
      phaseDirName = match;
    }
  } catch (e) {
    debugLog('phase-plan-index-failed', e);
  }

  if (!phaseDir) {
    return cmdOk({ phase: normalized, error: 'Phase not found', plans: [], waves: {}, incomplete: [], has_checkpoints: false });
  }

  const phaseFiles = fs.readdirSync(phaseDir);
  const planFiles = phaseFiles.filter(isPlanFile).sort();
  const summaryFiles = phaseFiles.filter(isSummaryFile);

  const completedPlanIds = new Set(
    summaryFiles.map(summaryId),
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
    const id = planId(planFile);
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

    const hasSummary = completedPlanIds.has(id);
    if (!hasSummary) {
      incomplete.push(id);
    }

    const plan = {
      id,
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
    waves[waveKey].push(id);
  }

  return cmdOk({ phase: normalized, plans, waves, incomplete, has_checkpoints: hasCheckpoints });
}

// ─── Phase add ──────────────────────────────────────────────────────────────

export function cmdPhaseAdd(cwd: string, description: string | undefined): CmdResult {
  if (!description) {
    return cmdErr('description required for phase add');
  }

  try {
    const result = phaseAddCore(cwd, description, { includeStubs: false });
    return cmdOk(
      { phase_number: result.phase_number, padded: result.padded, name: result.description, slug: result.slug, directory: result.directory },
      result.padded,
    );
  } catch (e) {
    return cmdErr((e as Error).message);
  }
}

// ─── Phase insert ───────────────────────────────────────────────────────────

export function cmdPhaseInsert(cwd: string, afterPhase: string | undefined, description: string | undefined): CmdResult {
  if (!afterPhase || !description) {
    return cmdErr('after-phase and description required for phase insert');
  }

  try {
    const result = phaseInsertCore(cwd, afterPhase, description, { includeStubs: false });
    return cmdOk(
      { phase_number: result.phase_number, after_phase: result.after_phase, name: result.description, slug: result.slug, directory: result.directory },
      result.phase_number,
    );
  } catch (e) {
    return cmdErr((e as Error).message);
  }
}

// ─── Phase remove ───────────────────────────────────────────────────────────

export function cmdPhaseRemove(
  cwd: string,
  targetPhase: string | undefined,
  options: { force: boolean },
): CmdResult {
  if (!targetPhase) {
    return cmdErr('phase number required for phase remove');
  }

  const rmPath = roadmapPath(cwd);
  const phasesDirPath = phasesPath(cwd);
  const force = options.force || false;

  if (!fs.existsSync(rmPath)) {
    return cmdErr('ROADMAP.md not found');
  }

  const normalized = normalizePhaseName(targetPhase);
  const isDecimal = targetPhase.includes('.');

  let targetDir: string | null = null;
  try {
    const dirs = listSubDirs(phasesDirPath, true);
    targetDir = dirs.find(d => d.startsWith(normalized + '-') || d === normalized) || null;
  } catch (e) {
    debugLog('phase-remove-find-target-failed', e);
  }

  if (targetDir && !force) {
    const targetPath = path.join(phasesDirPath, targetDir);
    const files = fs.readdirSync(targetPath);
    const summaries = files.filter(isSummaryFile);
    if (summaries.length > 0) {
      return cmdErr(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
    }
  }

  if (targetDir) {
    fs.rmSync(path.join(phasesDirPath, targetDir), { recursive: true, force: true });
  }

  const renamedDirs: Array<{ from: string; to: string }> = [];
  const renamedFiles: Array<{ from: string; to: string }> = [];

  if (isDecimal) {
    const baseParts = normalized.split('.');
    const baseInt = baseParts[0];
    const removedDecimal = parseInt(baseParts[1], 10);

    try {
      const dirs = listSubDirs(phasesDirPath, true);

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

        fs.renameSync(path.join(phasesDirPath, item.dir), path.join(phasesDirPath, newDirName));
        renamedDirs.push({ from: item.dir, to: newDirName });

        const dirFiles = fs.readdirSync(path.join(phasesDirPath, newDirName));
        for (const f of dirFiles) {
          if (f.includes(oldPhaseId)) {
            const newFileName = f.replace(oldPhaseId, newPhaseId);
            fs.renameSync(
              path.join(phasesDirPath, newDirName, f),
              path.join(phasesDirPath, newDirName, newFileName),
            );
            renamedFiles.push({ from: f, to: newFileName });
          }
        }
      }
    } catch (e) {
      debugLog('phase-remove-decimal-rename-failed', { phase: targetPhase, error: errorMsg(e) });
    }
  } else {
    const removedInt = parseInt(normalized, 10);

    try {
      const dirs = listSubDirs(phasesDirPath, true);

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

        fs.renameSync(path.join(phasesDirPath, item.dir), path.join(phasesDirPath, newDirName));
        renamedDirs.push({ from: item.dir, to: newDirName });

        const dirFiles = fs.readdirSync(path.join(phasesDirPath, newDirName));
        for (const f of dirFiles) {
          if (f.startsWith(oldPrefix)) {
            const newFileName = newPrefix + f.slice(oldPrefix.length);
            fs.renameSync(
              path.join(phasesDirPath, newDirName, f),
              path.join(phasesDirPath, newDirName, newFileName),
            );
            renamedFiles.push({ from: f, to: newFileName });
          }
        }
      }
    } catch (e) {
      debugLog('phase-remove-int-rename-failed', { phase: targetPhase, error: errorMsg(e) });
    }
  }

  // Update ROADMAP.md
  let roadmapContent = fs.readFileSync(rmPath, 'utf-8');

  const targetEscaped = escapePhaseNum(targetPhase);
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

  fs.writeFileSync(rmPath, roadmapContent, 'utf-8');

  // Update STATE.md phase count
  const stPath = statePath(cwd);
  if (fs.existsSync(stPath)) {
    let stateContent = fs.readFileSync(stPath, 'utf-8');
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
    fs.writeFileSync(stPath, stateContent, 'utf-8');
  }

  return cmdOk({
    removed: targetPhase,
    directory_deleted: targetDir || null,
    renamed_directories: renamedDirs,
    renamed_files: renamedFiles,
    roadmap_updated: true,
    state_updated: fs.existsSync(stPath),
  });
}

// ─── Phase complete ─────────────────────────────────────────────────────────

export function cmdPhaseComplete(cwd: string, phaseNum: string | undefined): CmdResult {
  if (!phaseNum) {
    return cmdErr('phase number required for phase complete');
  }

  try {
    const result = phaseCompleteCore(cwd, phaseNum);
    return cmdOk({
      completed_phase: result.completed_phase,
      phase_name: result.phase_name,
      plans_executed: result.plans_executed,
      next_phase: result.next_phase,
      next_phase_name: result.next_phase_name,
      is_last_phase: result.is_last_phase,
      date: result.date,
      roadmap_updated: result.roadmap_updated,
      state_updated: result.state_updated,
    });
  } catch (e) {
    return cmdErr((e as Error).message);
  }
}
