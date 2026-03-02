/**
 * Artefakte — CRUD operations for project-level artefakte files
 *
 * Manages DECISIONS.md, ACCEPTANCE-CRITERIA.md, and NO-GOS.md
 * at both project level (.planning/) and phase level (.planning/phases/<phase>/).
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  safeReadFile,
  planningPath,
  findPhaseInternal,
  todayISO,
} from './core.js';
import type { CmdResult } from './types.js';
import { cmdOk, cmdErr } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtefaktType = 'decisions' | 'acceptance-criteria' | 'no-gos';

const ARTEFAKT_FILES: Record<ArtefaktType, string> = {
  'decisions': 'DECISIONS.md',
  'acceptance-criteria': 'ACCEPTANCE-CRITERIA.md',
  'no-gos': 'NO-GOS.md',
};

// ─── Internal helpers ────────────────────────────────────────────────────────

function isValidType(type: string | undefined): type is ArtefaktType {
  return !!type && type in ARTEFAKT_FILES;
}

function resolveArtefaktPath(cwd: string, type: ArtefaktType, phase?: string): string | null {
  const filename = ARTEFAKT_FILES[type];
  if (phase) {
    const phaseInfo = findPhaseInternal(cwd, phase);
    if (!phaseInfo?.directory) return null;
    return path.join(cwd, phaseInfo.directory, filename);
  }
  return planningPath(cwd, filename);
}

function getTemplate(type: ArtefaktType): string {
  const today = todayISO();
  switch (type) {
    case 'decisions':
      return `# Decisions\n\n> Architectural and design decisions for this project.\n\n**Created:** ${today}\n\n## Decision Log\n\n| # | Decision | Rationale | Date | Phase |\n|---|----------|-----------|------|-------|\n`;
    case 'acceptance-criteria':
      return `# Acceptance Criteria\n\n> Conditions that must be met for deliverables to be accepted.\n\n**Created:** ${today}\n\n## Criteria\n\n| # | Criterion | Status | Verified |\n|---|-----------|--------|----------|\n`;
    case 'no-gos':
      return `# No-Gos\n\n> Things explicitly out of scope or forbidden.\n\n**Created:** ${today}\n\n## Boundaries\n\n- _No entries yet._\n`;
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────

export function cmdArtefakteRead(
  cwd: string,
  type: string | undefined,
  phase: string | undefined,
  raw: boolean,
): CmdResult {
  if (!isValidType(type)) {
    return cmdErr(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
  }

  const filePath = resolveArtefaktPath(cwd, type, phase);
  if (!filePath) return cmdErr(`Phase ${phase} not found`);

  const content = safeReadFile(filePath);
  if (content === null) {
    return cmdOk({ exists: false, type, phase: phase ?? null, content: null }, raw ? '' : undefined);
  }

  return cmdOk({ exists: true, type, phase: phase ?? null, content }, raw ? content : undefined);
}

export function cmdArtefakteWrite(
  cwd: string,
  type: string | undefined,
  content: string | undefined,
  phase: string | undefined,
  raw: boolean,
): CmdResult {
  if (!isValidType(type)) {
    return cmdErr(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
  }

  const fileContent = content ?? getTemplate(type);
  const filePath = resolveArtefaktPath(cwd, type, phase);
  if (!filePath) return cmdErr(`Phase ${phase} not found`);

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, fileContent, 'utf-8');
  const relPath = path.relative(cwd, filePath);
  return cmdOk({ written: true, type, phase: phase ?? null, path: relPath }, raw ? relPath : undefined);
}

export function cmdArtefakteAppend(
  cwd: string,
  type: string | undefined,
  entry: string | undefined,
  phase: string | undefined,
  raw: boolean,
): CmdResult {
  if (!entry) {
    return cmdErr('entry required for artefakte append');
  }

  if (!isValidType(type)) {
    return cmdErr(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
  }

  const filePath = resolveArtefaktPath(cwd, type, phase);
  if (!filePath) return cmdErr(`Phase ${phase} not found`);

  let fileContent = safeReadFile(filePath);
  if (fileContent === null) {
    // Auto-create from template
    fileContent = getTemplate(type);
  }

  // Remove placeholder lines like "- _No entries yet._"
  fileContent = fileContent.replace(/^-\s*_No entries yet\._\s*$/m, '');

  // Append the entry
  const today = todayISO();
  let appendLine: string;

  if (type === 'decisions') {
    const rowCount = (fileContent.match(/^\|\s*\d+/gm) || []).length;
    appendLine = `| ${rowCount + 1} | ${entry} | - | ${today} | - |`;
  } else if (type === 'acceptance-criteria') {
    const rowCount = (fileContent.match(/^\|\s*\d+/gm) || []).length;
    appendLine = `| ${rowCount + 1} | ${entry} | pending | - |`;
  } else {
    appendLine = `- ${entry}`;
  }

  fileContent = fileContent.trimEnd() + '\n' + appendLine + '\n';
  fs.writeFileSync(filePath, fileContent, 'utf-8');

  const relPath = path.relative(cwd, filePath);
  return cmdOk({ appended: true, type, phase: phase ?? null, entry: appendLine, path: relPath }, raw ? 'true' : undefined);
}

export function cmdArtefakteList(
  cwd: string,
  phase: string | undefined,
  raw: boolean,
): CmdResult {
  const results: Array<{ type: ArtefaktType; exists: boolean; path: string }> = [];

  for (const [type, filename] of Object.entries(ARTEFAKT_FILES)) {
    let filePath: string;
    if (phase) {
      const phaseInfo = findPhaseInternal(cwd, phase);
      if (!phaseInfo?.directory) {
        return cmdOk({ error: `Phase ${phase} not found` });
      }
      filePath = path.join(cwd, phaseInfo.directory, filename);
    } else {
      filePath = planningPath(cwd, filename);
    }

    results.push({
      type: type as ArtefaktType,
      exists: fs.existsSync(filePath),
      path: path.relative(cwd, filePath),
    });
  }

  return cmdOk({ phase: phase ?? null, artefakte: results });
}
