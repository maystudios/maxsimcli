/**
 * Context Loader — Intelligent file selection for workflow context assembly
 *
 * Selects relevant planning files based on the current task/phase domain,
 * preventing context overload by loading only what matters.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  loadConfig,
  safeReadFile,
  planningPath,
  phasesPath,
  findPhaseInternal,
  getRoadmapPhaseInternal,
  pathExistsInternal,
  debugLog,
  listSubDirs,
  isSummaryFile,
} from './core.js';
import type { CmdResult } from './types.js';
import { cmdOk } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContextFile {
  path: string;
  role: string;
  size: number;
}

export interface ContextLoadResult {
  files: ContextFile[];
  total_size: number;
  phase: string | null;
  topic: string | null;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function fileEntry(cwd: string, relPath: string, role: string): ContextFile | null {
  const fullPath = path.join(cwd, relPath);
  try {
    const stats = fs.statSync(fullPath);
    return { path: relPath, role, size: stats.size };
  } catch {
    return null;
  }
}

function addIfExists(files: ContextFile[], cwd: string, relPath: string, role: string): void {
  const entry = fileEntry(cwd, relPath, role);
  if (entry) files.push(entry);
}

// ─── Context loading strategies ──────────────────────────────────────────────

function loadProjectContext(cwd: string): ContextFile[] {
  const files: ContextFile[] = [];
  addIfExists(files, cwd, '.planning/PROJECT.md', 'project-vision');
  addIfExists(files, cwd, '.planning/REQUIREMENTS.md', 'requirements');
  addIfExists(files, cwd, '.planning/STATE.md', 'state');
  addIfExists(files, cwd, '.planning/config.json', 'config');
  return files;
}

function loadRoadmapContext(cwd: string): ContextFile[] {
  const files: ContextFile[] = [];
  addIfExists(files, cwd, '.planning/ROADMAP.md', 'roadmap');
  return files;
}

function loadPhaseContext(cwd: string, phase: string): ContextFile[] {
  const files: ContextFile[] = [];
  const phaseInfo = findPhaseInternal(cwd, phase);
  if (!phaseInfo?.directory) return files;

  const phaseDir = phaseInfo.directory;

  // Add phase-specific files
  try {
    const phaseFiles = fs.readdirSync(path.join(cwd, phaseDir));
    for (const f of phaseFiles) {
      const relPath = path.join(phaseDir, f);
      if (f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md') {
        addIfExists(files, cwd, relPath, 'phase-context');
      } else if (f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md') {
        addIfExists(files, cwd, relPath, 'phase-research');
      } else if (f.endsWith('-PLAN.md')) {
        addIfExists(files, cwd, relPath, 'phase-plan');
      } else if (f.endsWith('-SUMMARY.md')) {
        addIfExists(files, cwd, relPath, 'phase-summary');
      } else if (f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md') {
        addIfExists(files, cwd, relPath, 'phase-verification');
      }
    }
  } catch (e) {
    debugLog('context-loader-phase-files-failed', e);
  }

  return files;
}

function loadArtefakteContext(cwd: string, phase?: string): ContextFile[] {
  const files: ContextFile[] = [];
  const artefakte = ['DECISIONS.md', 'ACCEPTANCE-CRITERIA.md', 'NO-GOS.md'];

  for (const filename of artefakte) {
    if (phase) {
      const phaseInfo = findPhaseInternal(cwd, phase);
      if (phaseInfo?.directory) {
        addIfExists(files, cwd, path.join(phaseInfo.directory, filename), `artefakt-${filename.toLowerCase()}`);
      }
    }
    // Always include project-level artefakte
    addIfExists(files, cwd, `.planning/${filename}`, `artefakt-${filename.toLowerCase()}`);
  }

  return files;
}

function loadHistoryContext(cwd: string, currentPhase?: string): ContextFile[] {
  const files: ContextFile[] = [];
  const pd = phasesPath(cwd);

  try {
    const dirs = listSubDirs(pd, true);
    for (const dir of dirs) {
      // Skip current phase — it's loaded separately
      if (currentPhase) {
        const dirPhase = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)/i)?.[1];
        if (dirPhase === currentPhase) continue;
      }

      const dirPath = path.join(pd, dir);
      const phaseFiles = fs.readdirSync(dirPath);
      // Only load summaries from completed phases (lightweight history)
      const summaries = phaseFiles.filter(f => isSummaryFile(f));
      for (const s of summaries) {
        addIfExists(files, cwd, path.join('.planning', 'phases', dir, s), 'history-summary');
      }
    }
  } catch (e) {
    debugLog('context-loader-history-failed', e);
  }

  return files;
}

// ─── Commands ────────────────────────────────────────────────────────────────

export function cmdContextLoad(
  cwd: string,
  phase: string | undefined,
  topic: string | undefined,
  includeHistory: boolean,
): CmdResult {
  const allFiles: ContextFile[] = [];

  // Always load core project context
  allFiles.push(...loadProjectContext(cwd));
  allFiles.push(...loadRoadmapContext(cwd));

  // Load artefakte
  allFiles.push(...loadArtefakteContext(cwd, phase));

  // Phase-specific context
  if (phase) {
    allFiles.push(...loadPhaseContext(cwd, phase));
  }

  // History from completed phases
  if (includeHistory) {
    allFiles.push(...loadHistoryContext(cwd, phase));
  }

  // Deduplicate by path
  const seen = new Set<string>();
  const deduped = allFiles.filter(f => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });

  const totalSize = deduped.reduce((sum, f) => sum + f.size, 0);

  const result: ContextLoadResult = {
    files: deduped,
    total_size: totalSize,
    phase: phase ?? null,
    topic: topic ?? null,
  };

  return cmdOk(result);
}
