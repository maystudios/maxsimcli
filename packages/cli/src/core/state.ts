/**
 * State — STATE.md operations and progression engine
 *
 * Ported from maxsim/bin/lib/state.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

import escapeStringRegexp from 'escape-string-regexp';

import { loadConfig, rethrowCliSignals, safeReadFile, safeReadFileAsync, planningPath, statePath as statePathUtil, configPath, roadmapPath, phasesPath, debugLog, todayISO, isPlanFile, isSummaryFile } from './core.js';
import type {
  AppConfig,
  StatePatchResult,
  StateMetricOptions,
  StateDecisionOptions,
  StateBlockerOptions,
  StateSessionOptions,
  StateSnapshot,
  Decision,
  CmdResult,
} from './types.js';
import { cmdOk, cmdErr } from './types.js';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Parse a markdown table row into cells, handling escaped pipes (`\|`) within cell content.
 * Strips leading/trailing pipe characters and trims each cell.
 */
function parseTableRow(row: string): string[] {
  // Replace escaped pipes with a placeholder, split, then restore
  const placeholder = '\x00PIPE\x00';
  const safe = row.replace(/\\\|/g, placeholder);
  return safe.split('|').map(c => c.replaceAll(placeholder, '|').trim()).filter(Boolean);
}

export function stateExtractField(content: string, fieldName: string): string | null {
  const escaped = escapeStringRegexp(fieldName);
  // Match **fieldName:** with optional extra whitespace around the name and colon
  const boldPattern = new RegExp(`\\*\\*\\s*${escaped}\\s*:\\s*\\*\\*\\s*(.+)`, 'i');
  const boldMatch = content.match(boldPattern);
  if (boldMatch) return boldMatch[1].trim();
  // Fallback: match plain "fieldName: value" (no bold markers)
  const plainPattern = new RegExp(`^\\s*${escaped}\\s*:\\s*(.+)`, 'im');
  const plainMatch = content.match(plainPattern);
  return plainMatch ? plainMatch[1].trim() : null;
}

export function stateReplaceField(content: string, fieldName: string, newValue: string): string | null {
  const escaped = escapeStringRegexp(fieldName);
  // Match **fieldName:** with optional extra whitespace
  const boldPattern = new RegExp(`(\\*\\*\\s*${escaped}\\s*:\\s*\\*\\*\\s*)(.*)`, 'i');
  let replaced = content.replace(boldPattern, (_match, prefix: string) => `${prefix}${newValue}`);
  if (replaced !== content) return replaced;
  // Fallback: plain "fieldName: value"
  const plainPattern = new RegExp(`(^[ \\t]*${escaped}\\s*:\\s*)(.*)`, 'im');
  replaced = content.replace(plainPattern, (_match, prefix: string) => `${prefix}${newValue}`);
  return replaced !== content ? replaced : null;
}

function readTextArgOrFile(cwd: string, value: string | undefined, filePath: string | undefined, label: string): string | undefined {
  if (!filePath) return value;
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  try {
    return fs.readFileSync(resolvedPath, 'utf-8').trimEnd();
  } catch {
    throw new Error(`${label} file not found: ${filePath}`);
  }
}

/**
 * Append an entry to a section in STATE.md content, removing placeholder text.
 * Returns updated content or null if section not found.
 */
export function appendToStateSection(
  content: string,
  sectionPattern: RegExp,
  entry: string,
  placeholderPatterns?: RegExp[],
): string | null {
  const match = content.match(sectionPattern);
  if (!match) return null;

  let sectionBody = match[2];
  const defaults = [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi, /None\.?\s*\n?/gi];
  for (const pat of placeholderPatterns || defaults) {
    sectionBody = sectionBody.replace(pat, '');
  }
  sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';

  return content.replace(sectionPattern, (_m, header: string) => `${header}${sectionBody}`);
}

// ─── State commands ──────────────────────────────────────────────────────────

export async function cmdStateLoad(cwd: string, raw: boolean): Promise<CmdResult> {
  const config: AppConfig = loadConfig(cwd);

  const [stateContent, configExists, roadmapExists] = await Promise.all([
    safeReadFileAsync(statePathUtil(cwd)),
    fs.promises.access(configPath(cwd)).then(() => true, () => false),
    fs.promises.access(roadmapPath(cwd)).then(() => true, () => false),
  ]);

  const stateRaw = stateContent ?? '';
  const stateExists = stateRaw.length > 0;

  const result = {
    config,
    state_raw: stateRaw,
    state_exists: stateExists,
    roadmap_exists: roadmapExists,
    config_exists: configExists,
  };

  if (raw) {
    const c = config;
    const lines = [
      `model_profile=${c.model_profile}`,
      `commit_docs=${c.commit_docs}`,
      `branching_strategy=${c.branching_strategy}`,
      `phase_branch_template=${c.phase_branch_template}`,
      `milestone_branch_template=${c.milestone_branch_template}`,
      `parallelization=${c.parallelization}`,
      `research=${c.research}`,
      `plan_checker=${c.plan_checker}`,
      `verifier=${c.verifier}`,
      `config_exists=${configExists}`,
      `roadmap_exists=${roadmapExists}`,
      `state_exists=${stateExists}`,
    ];
    return cmdOk(result, lines.join('\n'));
  }

  return cmdOk(result);
}

export function cmdStateGet(cwd: string, section: string | null, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  try {
    const content = fs.readFileSync(statePath, 'utf-8');

    if (!section) {
      return cmdOk({ content }, raw ? content : undefined);
    }

    // Check for **field:** value (reuse stateExtractField for format tolerance)
    const fieldValue = stateExtractField(content, section);
    if (fieldValue !== null) {
      return cmdOk({ [section]: fieldValue }, raw ? fieldValue : undefined);
    }

    // Check for ## or ### Section, tolerating extra blank lines after header
    const fieldEscaped = escapeStringRegexp(section);
    const sectionPattern = new RegExp(`#{2,3}\\s*${fieldEscaped}\\s*\\n\\s*\\n?([\\s\\S]*?)(?=\\n#{2,3}\\s|$)`, 'i');
    const sectionMatch = content.match(sectionPattern);
    if (sectionMatch) {
      return cmdOk({ [section]: sectionMatch[1].trim() }, raw ? sectionMatch[1].trim() : undefined);
    }

    return cmdOk({ error: `Section or field "${section}" not found` }, raw ? '' : undefined);
  } catch (e: unknown) {
    rethrowCliSignals(e);
    return cmdErr('STATE.md not found');
  }
}

export function cmdStatePatch(cwd: string, patches: Record<string, string>, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  try {
    let content = fs.readFileSync(statePath, 'utf-8');
    const results: StatePatchResult = { updated: [], failed: [] };

    for (const [field, value] of Object.entries(patches)) {
      const result = stateReplaceField(content, field, value);
      if (result) {
        content = result;
        results.updated.push(field);
      } else {
        results.failed.push(field);
      }
    }

    if (results.updated.length > 0) {
      fs.writeFileSync(statePath, content, 'utf-8');
    }

    return cmdOk(results, raw ? (results.updated.length > 0 ? 'true' : 'false') : undefined);
  } catch (e: unknown) {
    rethrowCliSignals(e);
    return cmdErr('STATE.md not found');
  }
}

export function cmdStateUpdate(cwd: string, field: string | undefined, value: string | undefined): CmdResult {
  if (!field || value === undefined) {
    return cmdErr('field and value required for state update');
  }

  const statePath = statePathUtil(cwd);
  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const result = stateReplaceField(content, field, value);
    if (result) {
      fs.writeFileSync(statePath, result, 'utf-8');
      return cmdOk({ updated: true });
    } else {
      return cmdOk({ updated: false, reason: `Field "${field}" not found in STATE.md` });
    }
  } catch (e: unknown) {
    rethrowCliSignals(e);
    return cmdOk({ updated: false, reason: 'STATE.md not found' });
  }
}

// ─── State Progression Engine ────────────────────────────────────────────────

export function cmdStateAdvancePlan(cwd: string, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }

  let content = fs.readFileSync(statePath, 'utf-8');
  const currentPlan = parseInt(stateExtractField(content, 'Current Plan') ?? '', 10);
  const totalPlans = parseInt(stateExtractField(content, 'Total Plans in Phase') ?? '', 10);
  const today = todayISO();

  if (isNaN(currentPlan) || isNaN(totalPlans)) {
    return cmdOk({ error: 'Cannot parse Current Plan or Total Plans in Phase from STATE.md' });
  }

  if (currentPlan >= totalPlans) {
    content = stateReplaceField(content, 'Status', 'Phase complete — ready for verification') || content;
    content = stateReplaceField(content, 'Last Activity', today) || content;
    fs.writeFileSync(statePath, content, 'utf-8');
    return cmdOk({ advanced: false, reason: 'last_plan', current_plan: currentPlan, total_plans: totalPlans, status: 'ready_for_verification' }, raw ? 'false' : undefined);
  } else {
    const newPlan = currentPlan + 1;
    content = stateReplaceField(content, 'Current Plan', String(newPlan)) || content;
    content = stateReplaceField(content, 'Status', 'Ready to execute') || content;
    content = stateReplaceField(content, 'Last Activity', today) || content;
    fs.writeFileSync(statePath, content, 'utf-8');
    return cmdOk({ advanced: true, previous_plan: currentPlan, current_plan: newPlan, total_plans: totalPlans }, raw ? 'true' : undefined);
  }
}

export function cmdStateRecordMetric(cwd: string, options: StateMetricOptions, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }

  let content = fs.readFileSync(statePath, 'utf-8');
  const { phase, plan, duration, tasks, files } = options;

  if (!phase || !plan || !duration) {
    return cmdOk({ error: 'phase, plan, and duration required' });
  }

  // Flexible: tolerate varying heading levels (##/###), flexible separator lines (|---|, | --- |, |:---|)
  const metricsPattern = /(#{2,3}\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n)([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i;
  const metricsMatch = content.match(metricsPattern);

  if (metricsMatch) {
    let tableBody = metricsMatch[2].trimEnd();
    const newRow = `| Phase ${phase} P${plan} | ${duration} | ${tasks || '-'} tasks | ${files || '-'} files |`;

    if (tableBody.trim() === '' || tableBody.includes('None yet')) {
      tableBody = newRow;
    } else {
      tableBody = tableBody + '\n' + newRow;
    }

    content = content.replace(metricsPattern, (_match, header: string) => `${header}${tableBody}\n`);
    fs.writeFileSync(statePath, content, 'utf-8');
    return cmdOk({ recorded: true, phase, plan, duration }, raw ? 'true' : undefined);
  } else {
    return cmdOk({ recorded: false, reason: 'Performance Metrics section not found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateUpdateProgress(cwd: string, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }

  let content = fs.readFileSync(statePath, 'utf-8');

  const phasesDir = phasesPath(cwd);
  let totalPlans = 0;
  let totalSummaries = 0;

  if (fs.existsSync(phasesDir)) {
    const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    for (const dir of phaseDirs) {
      const files = fs.readdirSync(path.join(phasesDir, dir));
      totalPlans += files.filter(f => isPlanFile(f)).length;
      totalSummaries += files.filter(f => isSummaryFile(f)).length;
    }
  }

  const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
  const barWidth = 10;
  const filled = Math.round(percent / 100 * barWidth);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
  const progressStr = `[${bar}] ${percent}%`;

  const result = stateReplaceField(content, 'Progress', progressStr);
  if (result) {
    fs.writeFileSync(statePath, result, 'utf-8');
    return cmdOk({ updated: true, percent, completed: totalSummaries, total: totalPlans, bar: progressStr }, raw ? progressStr : undefined);
  } else {
    return cmdOk({ updated: false, reason: 'Progress field not found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateAddDecision(cwd: string, options: StateDecisionOptions, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }

  const { phase, summary, summary_file, rationale, rationale_file } = options;
  let summaryText: string | undefined;
  let rationaleText = '';

  try {
    summaryText = readTextArgOrFile(cwd, summary, summary_file, 'summary');
    rationaleText = readTextArgOrFile(cwd, rationale || '', rationale_file, 'rationale') || '';
  } catch (thrown: unknown) {
    const e = thrown as Error;
    return cmdOk({ added: false, reason: e.message }, raw ? 'false' : undefined);
  }

  if (!summaryText) { return cmdOk({ error: 'summary required' }); }

  const content = fs.readFileSync(statePath, 'utf-8');
  const entry = `- [Phase ${phase || '?'}]: ${summaryText}${rationaleText ? ` — ${rationaleText}` : ''}`;

  const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
  const updated = appendToStateSection(content, sectionPattern, entry, [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi]);

  if (updated) {
    fs.writeFileSync(statePath, updated, 'utf-8');
    return cmdOk({ added: true, decision: entry }, raw ? 'true' : undefined);
  } else {
    return cmdOk({ added: false, reason: 'Decisions section not found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateAddBlocker(cwd: string, text: string | StateBlockerOptions, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }
  const blockerOptions: StateBlockerOptions = typeof text === 'object' && text !== null ? text : { text: text as string };
  let blockerText: string | undefined;

  try {
    blockerText = readTextArgOrFile(cwd, blockerOptions.text, blockerOptions.text_file, 'blocker');
  } catch (thrown: unknown) {
    const e = thrown as Error;
    return cmdOk({ added: false, reason: e.message }, raw ? 'false' : undefined);
  }

  if (!blockerText) { return cmdOk({ error: 'text required' }); }

  const content = fs.readFileSync(statePath, 'utf-8');
  const entry = `- ${blockerText}`;

  const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
  const updated = appendToStateSection(content, sectionPattern, entry, [/None\.?\s*\n?/gi, /None yet\.?\s*\n?/gi]);

  if (updated) {
    fs.writeFileSync(statePath, updated, 'utf-8');
    return cmdOk({ added: true, blocker: blockerText }, raw ? 'true' : undefined);
  } else {
    return cmdOk({ added: false, reason: 'Blockers section not found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateResolveBlocker(cwd: string, text: string | null, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }
  if (!text) { return cmdOk({ error: 'text required' }); }

  let content = fs.readFileSync(statePath, 'utf-8');

  const sectionPattern = /(#{2,3}\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n\s*\n?)([\s\S]*?)(?=\n#{2,3}\s|$)/i;
  const match = content.match(sectionPattern);

  if (match) {
    const sectionBody = match[2];
    const lines = sectionBody.split('\n');
    const filtered = lines.filter(line => {
      // Match - or * bullets, optionally indented
      if (!/^\s*[-*]\s+/.test(line)) return true;
      return !line.toLowerCase().includes(text.toLowerCase());
    });

    let newBody = filtered.join('\n');
    if (!newBody.trim() || !/^\s*[-*]\s+/m.test(newBody)) {
      newBody = 'None\n';
    }

    content = content.replace(sectionPattern, (_match, header: string) => `${header}${newBody}`);
    fs.writeFileSync(statePath, content, 'utf-8');
    return cmdOk({ resolved: true, blocker: text }, raw ? 'true' : undefined);
  } else {
    return cmdOk({ resolved: false, reason: 'Blockers section not found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateRecordSession(cwd: string, options: StateSessionOptions, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);
  if (!fs.existsSync(statePath)) { return cmdOk({ error: 'STATE.md not found' }); }

  let content = fs.readFileSync(statePath, 'utf-8');
  const now = new Date().toISOString();
  const updated: string[] = [];

  let result = stateReplaceField(content, 'Last session', now);
  if (result) { content = result; updated.push('Last session'); }
  result = stateReplaceField(content, 'Last Date', now);
  if (result) { content = result; updated.push('Last Date'); }

  if (options.stopped_at) {
    result = stateReplaceField(content, 'Stopped At', options.stopped_at);
    if (!result) result = stateReplaceField(content, 'Stopped at', options.stopped_at);
    if (result) { content = result; updated.push('Stopped At'); }
  }

  const resumeFile = options.resume_file || 'None';
  result = stateReplaceField(content, 'Resume File', resumeFile);
  if (!result) result = stateReplaceField(content, 'Resume file', resumeFile);
  if (result) { content = result; updated.push('Resume File'); }

  if (updated.length > 0) {
    fs.writeFileSync(statePath, content, 'utf-8');
    return cmdOk({ recorded: true, updated }, raw ? 'true' : undefined);
  } else {
    return cmdOk({ recorded: false, reason: 'No session fields found in STATE.md' }, raw ? 'false' : undefined);
  }
}

export function cmdStateSnapshot(cwd: string, raw: boolean): CmdResult {
  const statePath = statePathUtil(cwd);

  if (!fs.existsSync(statePath)) {
    return cmdOk({ error: 'STATE.md not found' });
  }

  const content = fs.readFileSync(statePath, 'utf-8');

  const extractField = (fieldName: string): string | null => stateExtractField(content, fieldName);

  const currentPhase = extractField('Current Phase');
  const currentPhaseName = extractField('Current Phase Name');
  const totalPhasesRaw = extractField('Total Phases');
  const currentPlan = extractField('Current Plan');
  const totalPlansRaw = extractField('Total Plans in Phase');
  const status = extractField('Status');
  const progressRaw = extractField('Progress');
  const lastActivity = extractField('Last Activity');
  const lastActivityDesc = extractField('Last Activity Description');
  const pausedAt = extractField('Paused At');

  const totalPhases = totalPhasesRaw ? parseInt(totalPhasesRaw, 10) : null;
  const totalPlansInPhase = totalPlansRaw ? parseInt(totalPlansRaw, 10) : null;
  const progressPercent = progressRaw ? parseInt(progressRaw.replace('%', ''), 10) : null;

  const decisions: Decision[] = [];
  // Tolerate ##/### heading levels and flexible separator lines (|---|, | --- |, |:---|)
  const decisionsMatch = content.match(/#{2,3}\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i);
  if (decisionsMatch) {
    const tableBody = decisionsMatch[1];
    const rows = tableBody.trim().split('\n').filter(r => r.includes('|') && !r.match(/^\s*$/));
    for (const row of rows) {
      // Skip separator lines that snuck through
      if (/^\s*\|[\s:\-|]+\|\s*$/.test(row)) continue;
      const cells = parseTableRow(row);
      if (cells.length >= 3) {
        decisions.push({
          phase: cells[0],
          summary: cells[1],
          rationale: cells[2],
        });
      }
    }
  }

  const blockers: string[] = [];
  // Tolerate ##/### heading levels
  const blockersMatch = content.match(/#{2,3}\s*Blockers\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/i);
  if (blockersMatch) {
    const blockersSection = blockersMatch[1];
    // Match - or * bullets, optionally indented
    const items = blockersSection.match(/^\s*[-*]\s+(.+)$/gm) || [];
    for (const item of items) {
      blockers.push(item.replace(/^\s*[-*]\s+/, '').trim());
    }
  }

  const session: StateSnapshot['session'] = {
    last_date: null,
    stopped_at: null,
    resume_file: null,
  };

  const sessionMatch = content.match(/#{2,3}\s*Session\s*\n\s*\n?([\s\S]*?)(?=\n#{2,3}\s|$)/i);
  if (sessionMatch) {
    const sessionSection = sessionMatch[1];
    session.last_date = stateExtractField(sessionSection, 'Last Date');
    session.stopped_at = stateExtractField(sessionSection, 'Stopped At') || stateExtractField(sessionSection, 'Stopped at');
    session.resume_file = stateExtractField(sessionSection, 'Resume File') || stateExtractField(sessionSection, 'Resume file');
  }

  const snapshot: StateSnapshot = {
    current_phase: currentPhase,
    current_phase_name: currentPhaseName,
    total_phases: totalPhases,
    current_plan: currentPlan,
    total_plans_in_phase: totalPlansInPhase,
    status,
    progress_percent: progressPercent,
    last_activity: lastActivity,
    last_activity_desc: lastActivityDesc,
    decisions,
    blockers,
    paused_at: pausedAt,
    session,
  };

  return cmdOk(snapshot);
}
