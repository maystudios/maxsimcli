/**
 * Artefakte — CRUD operations for project-level artefakte files
 *
 * Manages DECISIONS.md, ACCEPTANCE-CRITERIA.md, and NO-GOS.md
 * at both project level (.planning/) and phase level (.planning/phases/<phase>/).
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  loadConfig,
  output,
  error,
  rethrowCliSignals,
  safeReadFile,
  planningPath,
  findPhaseInternal,
  debugLog,
  todayISO,
} from './core.js';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArtefaktType = 'decisions' | 'acceptance-criteria' | 'no-gos';

const ARTEFAKT_FILES: Record<ArtefaktType, string> = {
  'decisions': 'DECISIONS.md',
  'acceptance-criteria': 'ACCEPTANCE-CRITERIA.md',
  'no-gos': 'NO-GOS.md',
};

// ─── Internal helpers ────────────────────────────────────────────────────────

function resolveArtefaktPath(cwd: string, type: ArtefaktType, phase?: string): string {
  const filename = ARTEFAKT_FILES[type];
  if (phase) {
    const phaseInfo = findPhaseInternal(cwd, phase);
    if (!phaseInfo?.directory) {
      error(`Phase ${phase} not found`);
    }
    return path.join(cwd, phaseInfo!.directory, filename);
  }
  return planningPath(cwd, filename);
}

function validateType(type: string | undefined): ArtefaktType {
  if (!type || !(type in ARTEFAKT_FILES)) {
    error(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
  }
  return type as ArtefaktType;
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
): void {
  const artefaktType = validateType(type);
  const filePath = resolveArtefaktPath(cwd, artefaktType, phase);

  const content = safeReadFile(filePath);
  if (content === null) {
    output({ exists: false, type: artefaktType, phase: phase ?? null, content: null }, raw, '');
    return;
  }

  output({ exists: true, type: artefaktType, phase: phase ?? null, content }, raw, content);
}

export function cmdArtefakteWrite(
  cwd: string,
  type: string | undefined,
  content: string | undefined,
  phase: string | undefined,
  raw: boolean,
): void {
  const artefaktType = validateType(type);

  // If no content provided, use the template
  const fileContent = content ?? getTemplate(artefaktType);
  const filePath = resolveArtefaktPath(cwd, artefaktType, phase);

  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, fileContent, 'utf-8');
  const relPath = path.relative(cwd, filePath);
  output({ written: true, type: artefaktType, phase: phase ?? null, path: relPath }, raw, relPath);
}

export function cmdArtefakteAppend(
  cwd: string,
  type: string | undefined,
  entry: string | undefined,
  phase: string | undefined,
  raw: boolean,
): void {
  if (!entry) {
    error('entry required for artefakte append');
  }

  const artefaktType = validateType(type);
  const filePath = resolveArtefaktPath(cwd, artefaktType, phase);

  let content = safeReadFile(filePath);
  if (content === null) {
    // Auto-create from template
    content = getTemplate(artefaktType);
  }

  // Remove placeholder lines like "- _No entries yet._"
  content = content.replace(/^-\s*_No entries yet\._\s*$/m, '');

  // Append the entry
  const today = todayISO();
  let appendLine: string;

  if (artefaktType === 'decisions') {
    // Count existing rows to get next number
    const rowCount = (content.match(/^\|\s*\d+/gm) || []).length;
    appendLine = `| ${rowCount + 1} | ${entry} | - | ${today} | - |`;
  } else if (artefaktType === 'acceptance-criteria') {
    const rowCount = (content.match(/^\|\s*\d+/gm) || []).length;
    appendLine = `| ${rowCount + 1} | ${entry} | pending | - |`;
  } else {
    appendLine = `- ${entry}`;
  }

  content = content.trimEnd() + '\n' + appendLine + '\n';
  fs.writeFileSync(filePath, content, 'utf-8');

  const relPath = path.relative(cwd, filePath);
  output({ appended: true, type: artefaktType, phase: phase ?? null, entry: appendLine, path: relPath }, raw, 'true');
}

export function cmdArtefakteList(
  cwd: string,
  phase: string | undefined,
  raw: boolean,
): void {
  const results: Array<{ type: ArtefaktType; exists: boolean; path: string }> = [];

  for (const [type, filename] of Object.entries(ARTEFAKT_FILES)) {
    let filePath: string;
    if (phase) {
      const phaseInfo = findPhaseInternal(cwd, phase);
      if (!phaseInfo?.directory) {
        output({ error: `Phase ${phase} not found` }, raw);
        return;
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

  output({ phase: phase ?? null, artefakte: results }, raw);
}
