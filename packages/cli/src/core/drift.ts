/**
 * Drift — Drift report CRUD, requirement extraction, and spec extraction
 *
 * Provides CLI tool commands for the drift-checker agent and realign workflow.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  planningPath,
  phasesPath,
  safeReadFile,
  listSubDirs,
  pathExistsInternal,
  getArchivedPhaseDirs,
  debugLog,
} from './core.js';
import { extractFrontmatter } from './frontmatter.js';
import type { CmdResult } from './types.js';
import { cmdOk, cmdErr } from './types.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const DRIFT_REPORT_NAME = 'DRIFT-REPORT.md';

// ─── Drift Report CRUD ──────────────────────────────────────────────────────

/**
 * Read the drift report from .planning/DRIFT-REPORT.md.
 * Returns parsed frontmatter and body content, or structured error if not found.
 */
export function cmdDriftReadReport(cwd: string): CmdResult {
  const reportPath = planningPath(cwd, DRIFT_REPORT_NAME);
  const content = safeReadFile(reportPath);

  if (!content) {
    return cmdOk({
      found: false,
      path: `.planning/${DRIFT_REPORT_NAME}`,
      error: 'Drift report not found',
    });
  }

  const frontmatter = extractFrontmatter(content);
  // Extract body (content after frontmatter)
  const bodyMatch = content.match(/^---\n[\s\S]+?\n---\n?([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : content;

  return cmdOk({
    found: true,
    path: `.planning/${DRIFT_REPORT_NAME}`,
    frontmatter,
    body,
  });
}

/**
 * Write content to .planning/DRIFT-REPORT.md.
 * Supports direct content or reading from a file (tmpfile pattern for large reports).
 */
export function cmdDriftWriteReport(
  cwd: string,
  content: string | null,
  contentFile: string | null,
): CmdResult {
  let reportContent: string;

  if (contentFile) {
    // Read from file (supports tmpfile pattern)
    const filePath = path.isAbsolute(contentFile) ? contentFile : path.join(cwd, contentFile);
    const fileContent = safeReadFile(filePath);
    if (!fileContent) {
      return cmdErr(`Content file not found: ${contentFile}`);
    }
    reportContent = fileContent;
  } else if (content) {
    reportContent = content;
  } else {
    return cmdErr('Either --content or --content-file is required');
  }

  const reportPath = planningPath(cwd, DRIFT_REPORT_NAME);

  // Ensure .planning/ directory exists
  const planningDir = planningPath(cwd);
  if (!fs.existsSync(planningDir)) {
    return cmdErr('.planning/ directory does not exist');
  }

  try {
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    return cmdOk({
      written: true,
      path: `.planning/${DRIFT_REPORT_NAME}`,
    });
  } catch (e) {
    debugLog('drift-write-report-failed', e);
    return cmdErr(`Failed to write drift report: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ─── Spec Extraction Commands ────────────────────────────────────────────────

/**
 * Extract all requirements from .planning/REQUIREMENTS.md.
 * Parses requirement lines matching `- [ ] **ID**: description` or `- [x] **ID**: description`.
 */
export function cmdDriftExtractRequirements(cwd: string): CmdResult {
  const reqPath = planningPath(cwd, 'REQUIREMENTS.md');
  const content = safeReadFile(reqPath);

  if (!content) {
    return cmdOk({
      found: false,
      path: '.planning/REQUIREMENTS.md',
      requirements: [],
    });
  }

  const requirements: Array<{
    id: string;
    description: string;
    complete: boolean;
    line_number: number;
  }> = [];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match: - [ ] **ID**: description  OR  - [x] **ID**: description
    const match = line.match(/^-\s+\[([ xX])\]\s+\*\*([^*]+)\*\*[:\s]+(.+)/);
    if (match) {
      requirements.push({
        id: match[2].trim(),
        description: match[3].trim(),
        complete: match[1].toLowerCase() === 'x',
        line_number: i + 1,
      });
    }
  }

  return cmdOk({
    found: true,
    path: '.planning/REQUIREMENTS.md',
    count: requirements.length,
    requirements,
  });
}

/**
 * Extract no-go rules from .planning/NO-GOS.md.
 * Returns array of no-go items with section context, or empty if file missing.
 */
export function cmdDriftExtractNoGos(cwd: string): CmdResult {
  const nogosPath = planningPath(cwd, 'NO-GOS.md');
  const content = safeReadFile(nogosPath);

  if (!content) {
    return cmdOk({
      found: false,
      path: '.planning/NO-GOS.md',
      nogos: [],
    });
  }

  const nogos: Array<{
    rule: string;
    section: string;
    line_number: number;
  }> = [];

  const lines = content.split('\n');
  let currentSection = 'General';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track sections (## or ### headings)
    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim();
      continue;
    }

    // Match bullet points (-, *, or numbered items) that contain substantive text
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) {
      const ruleText = bulletMatch[1].trim();
      // Skip empty or very short items
      if (ruleText.length > 5) {
        nogos.push({
          rule: ruleText,
          section: currentSection,
          line_number: i + 1,
        });
      }
    }
  }

  return cmdOk({
    found: true,
    path: '.planning/NO-GOS.md',
    count: nogos.length,
    nogos,
  });
}

/**
 * Read .planning/CONVENTIONS.md and return its full content.
 * Returns the raw content for agent analysis, or null if missing.
 */
export function cmdDriftExtractConventions(cwd: string): CmdResult {
  const convPath = planningPath(cwd, 'CONVENTIONS.md');
  const content = safeReadFile(convPath);

  if (!content) {
    return cmdOk({
      found: false,
      path: '.planning/CONVENTIONS.md',
      content: null,
    });
  }

  return cmdOk({
    found: true,
    path: '.planning/CONVENTIONS.md',
    content,
  });
}

/**
 * Read existing DRIFT-REPORT.md frontmatter for diff tracking.
 * Returns previous_hash and checked date, or null if no report exists.
 */
export function cmdDriftPreviousHash(cwd: string): CmdResult {
  const reportPath = planningPath(cwd, DRIFT_REPORT_NAME);
  const content = safeReadFile(reportPath);

  if (!content) {
    return cmdOk({
      found: false,
      hash: null,
      checked_date: null,
    });
  }

  const frontmatter = extractFrontmatter(content);

  return cmdOk({
    found: true,
    hash: (frontmatter.previous_hash as string) ?? null,
    checked_date: (frontmatter.checked as string) ?? null,
  });
}
