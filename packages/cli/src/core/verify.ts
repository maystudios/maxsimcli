/**
 * Verify — Verification suite, consistency, and health validation
 *
 * Ported from maxsim/bin/lib/verify.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  safeReadFile,
  normalizePhaseName,
  getPhasePattern,
  execGit,
  findPhaseInternal,
  getMilestoneInfo,
  output,
  error,
} from './core.js';
import { extractFrontmatter, parseMustHavesBlock } from './frontmatter.js';
import type { FrontmatterData } from './types.js';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ValidationError {
  code?: string;
  message: string;
  fix?: string;
  repairable?: boolean;
}

export interface ValidationWarning {
  code?: string;
  message: string;
  fix?: string;
  repairable?: boolean;
}

export interface TaskInfo {
  name: string;
  hasFiles: boolean;
  hasAction: boolean;
  hasVerify: boolean;
  hasDone: boolean;
}

export interface VerificationResult {
  passed: boolean;
  checks: {
    summary_exists: boolean;
    files_created: { checked: number; found: number; missing: string[] };
    commits_exist: boolean;
    self_check: 'not_found' | 'passed' | 'failed';
  };
  errors: string[];
}

export interface PlanStructureResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  task_count: number;
  tasks: TaskInfo[];
  frontmatter_fields: string[];
}

export interface PhaseCompletenessResult {
  complete: boolean;
  phase: string;
  plan_count: number;
  summary_count: number;
  incomplete_plans: string[];
  orphan_summaries: string[];
  errors: string[];
  warnings: string[];
}

export interface ReferencesResult {
  valid: boolean;
  found: number;
  missing: string[];
  total: number;
}

export interface CommitsResult {
  all_valid: boolean;
  valid: string[];
  invalid: string[];
  total: number;
}

export interface ArtifactCheck {
  path: string;
  exists: boolean;
  issues: string[];
  passed: boolean;
}

export interface ArtifactsResult {
  all_passed: boolean;
  passed: number;
  total: number;
  artifacts: ArtifactCheck[];
}

export interface KeyLinkCheck {
  from: string;
  to: string;
  via: string;
  verified: boolean;
  detail: string;
}

export interface KeyLinksResult {
  all_verified: boolean;
  verified: number;
  total: number;
  links: KeyLinkCheck[];
}

export interface ConsistencyResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  warning_count: number;
}

export interface HealthResult {
  status: 'healthy' | 'degraded' | 'broken';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationError[];
  repairable_count: number;
  repairs_performed?: RepairAction[];
}

interface RepairAction {
  action: string;
  success: boolean;
  path?: string;
  error?: string;
}

interface HealthOptions {
  repair?: boolean;
}

// ─── Verify Summary ──────────────────────────────────────────────────────────

export async function cmdVerifySummary(
  cwd: string,
  summaryPath: string | null,
  checkFileCount: number | null,
  raw: boolean,
): Promise<void> {
  if (!summaryPath) {
    error('summary-path required');
  }

  const fullPath = path.join(cwd, summaryPath);
  const checkCount = checkFileCount || 2;

  if (!fs.existsSync(fullPath)) {
    const result: VerificationResult = {
      passed: false,
      checks: {
        summary_exists: false,
        files_created: { checked: 0, found: 0, missing: [] },
        commits_exist: false,
        self_check: 'not_found',
      },
      errors: ['SUMMARY.md not found'],
    };
    output(result, raw, 'failed');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const errors: string[] = [];

  // Spot-check files mentioned in summary
  const mentionedFiles = new Set<string>();
  const patterns: RegExp[] = [
    /`([^`]+\.[a-zA-Z]+)`/g,
    /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi,
  ];

  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(content)) !== null) {
      const filePath = m[1];
      if (filePath && !filePath.startsWith('http') && filePath.includes('/')) {
        mentionedFiles.add(filePath);
      }
    }
  }

  const filesToCheck = Array.from(mentionedFiles).slice(0, checkCount);
  const missing: string[] = [];
  for (const file of filesToCheck) {
    if (!fs.existsSync(path.join(cwd, file))) {
      missing.push(file);
    }
  }

  // Check commits exist
  const commitHashPattern = /\b[0-9a-f]{7,40}\b/g;
  const hashes = content.match(commitHashPattern) || [];
  let commitsExist = false;
  if (hashes.length > 0) {
    for (const hash of hashes.slice(0, 3)) {
      const result = await execGit(cwd, ['cat-file', '-t', hash]);
      if (result.exitCode === 0 && result.stdout === 'commit') {
        commitsExist = true;
        break;
      }
    }
  }

  // Self-check section
  let selfCheck: 'not_found' | 'passed' | 'failed' = 'not_found';
  const selfCheckPattern = /##\s*(?:Self[- ]?Check|Verification|Quality Check)/i;
  if (selfCheckPattern.test(content)) {
    const passPattern = /(?:all\s+)?(?:pass|✓|✅|complete|succeeded)/i;
    const failPattern = /(?:fail|✗|❌|incomplete|blocked)/i;
    const checkSection = content.slice(content.search(selfCheckPattern));
    if (failPattern.test(checkSection)) {
      selfCheck = 'failed';
    } else if (passPattern.test(checkSection)) {
      selfCheck = 'passed';
    }
  }

  if (missing.length > 0) errors.push('Missing files: ' + missing.join(', '));
  if (!commitsExist && hashes.length > 0) errors.push('Referenced commit hashes not found in git history');
  if (selfCheck === 'failed') errors.push('Self-check section indicates failure');

  const checks = {
    summary_exists: true,
    files_created: { checked: filesToCheck.length, found: filesToCheck.length - missing.length, missing },
    commits_exist: commitsExist,
    self_check: selfCheck,
  };

  const passed = missing.length === 0 && selfCheck !== 'failed';
  const result: VerificationResult = { passed, checks, errors };
  output(result, raw, passed ? 'passed' : 'failed');
}

// ─── Verify Plan Structure ───────────────────────────────────────────────────

export function cmdVerifyPlanStructure(cwd: string, filePath: string | null, raw: boolean): void {
  if (!filePath) {
    error('file path required');
  }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }

  const fm = extractFrontmatter(content);
  const errors: string[] = [];
  const warnings: string[] = [];

  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  for (const field of required) {
    if (fm[field] === undefined) errors.push(`Missing required frontmatter field: ${field}`);
  }

  const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
  const tasks: TaskInfo[] = [];
  let taskMatch: RegExpExecArray | null;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskContent = taskMatch[1];
    const nameMatch = taskContent.match(/<name>([\s\S]*?)<\/name>/);
    const taskName = nameMatch ? nameMatch[1].trim() : 'unnamed';
    const hasFiles = /<files>/.test(taskContent);
    const hasAction = /<action>/.test(taskContent);
    const hasVerify = /<verify>/.test(taskContent);
    const hasDone = /<done>/.test(taskContent);

    if (!nameMatch) errors.push('Task missing <name> element');
    if (!hasAction) errors.push(`Task '${taskName}' missing <action>`);
    if (!hasVerify) warnings.push(`Task '${taskName}' missing <verify>`);
    if (!hasDone) warnings.push(`Task '${taskName}' missing <done>`);
    if (!hasFiles) warnings.push(`Task '${taskName}' missing <files>`);

    tasks.push({ name: taskName, hasFiles, hasAction, hasVerify, hasDone });
  }

  if (tasks.length === 0) warnings.push('No <task> elements found');

  if (fm.wave && parseInt(String(fm.wave)) > 1 && (!fm.depends_on || (Array.isArray(fm.depends_on) && fm.depends_on.length === 0))) {
    warnings.push('Wave > 1 but depends_on is empty');
  }

  const hasCheckpoints = /<task\s+type=["']?checkpoint/.test(content);
  if (hasCheckpoints && fm.autonomous !== 'false' && fm.autonomous !== false) {
    errors.push('Has checkpoint tasks but autonomous is not false');
  }

  const result: PlanStructureResult = {
    valid: errors.length === 0,
    errors,
    warnings,
    task_count: tasks.length,
    tasks,
    frontmatter_fields: Object.keys(fm),
  };
  output(result, raw, errors.length === 0 ? 'valid' : 'invalid');
}

// ─── Verify Phase Completeness ───────────────────────────────────────────────

export function cmdVerifyPhaseCompleteness(cwd: string, phase: string | null, raw: boolean): void {
  if (!phase) {
    error('phase required');
  }
  const phaseInfo = findPhaseInternal(cwd, phase);
  if (!phaseInfo) {
    output({ error: 'Phase not found', phase }, raw);
    return;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const phaseDir = path.join(cwd, phaseInfo.directory);

  let files: string[];
  try {
    files = fs.readdirSync(phaseDir);
  } catch {
    output({ error: 'Cannot read phase directory' }, raw);
    return;
  }

  const plans = files.filter(f => /-PLAN\.md$/i.test(f));
  const summaries = files.filter(f => /-SUMMARY\.md$/i.test(f));

  const planIds = new Set(plans.map(p => p.replace(/-PLAN\.md$/i, '')));
  const summaryIds = new Set(summaries.map(s => s.replace(/-SUMMARY\.md$/i, '')));

  const incompletePlans = [...planIds].filter(id => !summaryIds.has(id));
  if (incompletePlans.length > 0) {
    errors.push(`Plans without summaries: ${incompletePlans.join(', ')}`);
  }

  const orphanSummaries = [...summaryIds].filter(id => !planIds.has(id));
  if (orphanSummaries.length > 0) {
    warnings.push(`Summaries without plans: ${orphanSummaries.join(', ')}`);
  }

  const result: PhaseCompletenessResult = {
    complete: errors.length === 0,
    phase: phaseInfo.phase_number,
    plan_count: plans.length,
    summary_count: summaries.length,
    incomplete_plans: incompletePlans,
    orphan_summaries: orphanSummaries,
    errors,
    warnings,
  };
  output(result, raw, errors.length === 0 ? 'complete' : 'incomplete');
}

// ─── Verify References ───────────────────────────────────────────────────────

export function cmdVerifyReferences(cwd: string, filePath: string | null, raw: boolean): void {
  if (!filePath) {
    error('file path required');
  }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: filePath }, raw);
    return;
  }

  const found: string[] = [];
  const missing: string[] = [];

  const atRefs = content.match(/@([^\s\n,)]+\/[^\s\n,)]+)/g) || [];
  for (const ref of atRefs) {
    const cleanRef = ref.slice(1);
    const resolved = cleanRef.startsWith('~/')
      ? path.join(process.env.HOME || '', cleanRef.slice(2))
      : path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];
  for (const ref of backtickRefs) {
    const cleanRef = ref.slice(1, -1);
    if (cleanRef.startsWith('http') || cleanRef.includes('${') || cleanRef.includes('{{')) continue;
    if (found.includes(cleanRef) || missing.includes(cleanRef)) continue;
    const resolved = path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  const result: ReferencesResult = {
    valid: missing.length === 0,
    found: found.length,
    missing,
    total: found.length + missing.length,
  };
  output(result, raw, missing.length === 0 ? 'valid' : 'invalid');
}

// ─── Verify Commits ──────────────────────────────────────────────────────────

export async function cmdVerifyCommits(cwd: string, hashes: string[], raw: boolean): Promise<void> {
  if (!hashes || hashes.length === 0) {
    error('At least one commit hash required');
  }

  const valid: string[] = [];
  const invalid: string[] = [];
  for (const hash of hashes) {
    const result = await execGit(cwd, ['cat-file', '-t', hash]);
    if (result.exitCode === 0 && result.stdout.trim() === 'commit') {
      valid.push(hash);
    } else {
      invalid.push(hash);
    }
  }

  const commitResult: CommitsResult = {
    all_valid: invalid.length === 0,
    valid,
    invalid,
    total: hashes.length,
  };
  output(commitResult, raw, invalid.length === 0 ? 'valid' : 'invalid');
}

// ─── Verify Artifacts ────────────────────────────────────────────────────────

interface MustHaveArtifact {
  path?: string;
  min_lines?: number;
  contains?: string;
  exports?: string | string[];
  [key: string]: string | number | string[] | undefined;
}

export function cmdVerifyArtifacts(cwd: string, planFilePath: string | null, raw: boolean): void {
  if (!planFilePath) {
    error('plan file path required');
  }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: planFilePath }, raw);
    return;
  }

  const artifacts = parseMustHavesBlock(content, 'artifacts');
  if (artifacts.length === 0) {
    output({ error: 'No must_haves.artifacts found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results: ArtifactCheck[] = [];
  for (const artifact of artifacts) {
    if (typeof artifact === 'string') continue;
    const artObj = artifact as MustHaveArtifact;
    const artPath = artObj.path;
    if (!artPath) continue;

    const artFullPath = path.join(cwd, artPath);
    const exists = fs.existsSync(artFullPath);
    const check: ArtifactCheck = { path: artPath, exists, issues: [], passed: false };

    if (exists) {
      const fileContent = safeReadFile(artFullPath) || '';
      const lineCount = fileContent.split('\n').length;

      if (artObj.min_lines && lineCount < artObj.min_lines) {
        check.issues.push(`Only ${lineCount} lines, need ${artObj.min_lines}`);
      }
      if (artObj.contains && !fileContent.includes(artObj.contains)) {
        check.issues.push(`Missing pattern: ${artObj.contains}`);
      }
      if (artObj.exports) {
        const exportList = Array.isArray(artObj.exports) ? artObj.exports : [artObj.exports];
        for (const exp of exportList) {
          if (!fileContent.includes(exp)) check.issues.push(`Missing export: ${exp}`);
        }
      }
      check.passed = check.issues.length === 0;
    } else {
      check.issues.push('File not found');
    }

    results.push(check);
  }

  const passed = results.filter(r => r.passed).length;
  const artifactsResult: ArtifactsResult = {
    all_passed: passed === results.length,
    passed,
    total: results.length,
    artifacts: results,
  };
  output(artifactsResult, raw, passed === results.length ? 'valid' : 'invalid');
}

// ─── Verify Key Links ────────────────────────────────────────────────────────

interface MustHaveKeyLink {
  from?: string;
  to?: string;
  via?: string;
  pattern?: string;
  [key: string]: string | number | string[] | undefined;
}

export function cmdVerifyKeyLinks(cwd: string, planFilePath: string | null, raw: boolean): void {
  if (!planFilePath) {
    error('plan file path required');
  }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) {
    output({ error: 'File not found', path: planFilePath }, raw);
    return;
  }

  const keyLinks = parseMustHavesBlock(content, 'key_links');
  if (keyLinks.length === 0) {
    output({ error: 'No must_haves.key_links found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results: KeyLinkCheck[] = [];
  for (const link of keyLinks) {
    if (typeof link === 'string') continue;
    const linkObj = link as MustHaveKeyLink;
    const check: KeyLinkCheck = {
      from: linkObj.from || '',
      to: linkObj.to || '',
      via: linkObj.via || '',
      verified: false,
      detail: '',
    };

    const sourceContent = safeReadFile(path.join(cwd, linkObj.from || ''));
    if (!sourceContent) {
      check.detail = 'Source file not found';
    } else if (linkObj.pattern) {
      try {
        const regex = new RegExp(linkObj.pattern);
        if (regex.test(sourceContent)) {
          check.verified = true;
          check.detail = 'Pattern found in source';
        } else {
          const targetContent = safeReadFile(path.join(cwd, linkObj.to || ''));
          if (targetContent && regex.test(targetContent)) {
            check.verified = true;
            check.detail = 'Pattern found in target';
          } else {
            check.detail = `Pattern "${linkObj.pattern}" not found in source or target`;
          }
        }
      } catch {
        check.detail = `Invalid regex pattern: ${linkObj.pattern}`;
      }
    } else {
      if (sourceContent.includes(linkObj.to || '')) {
        check.verified = true;
        check.detail = 'Target referenced in source';
      } else {
        check.detail = 'Target not referenced in source';
      }
    }

    results.push(check);
  }

  const verified = results.filter(r => r.verified).length;
  const linksResult: KeyLinksResult = {
    all_verified: verified === results.length,
    verified,
    total: results.length,
    links: results,
  };
  output(linksResult, raw, verified === results.length ? 'valid' : 'invalid');
}

// ─── Validate Consistency ────────────────────────────────────────────────────

export function cmdValidateConsistency(cwd: string, raw: boolean): void {
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(roadmapPath)) {
    errors.push('ROADMAP.md not found');
    output({ passed: false, errors, warnings }, raw, 'failed');
    return;
  }

  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  const roadmapPhases = new Set<string>();
  const phasePattern = getPhasePattern();
  let m: RegExpExecArray | null;
  while ((m = phasePattern.exec(roadmapContent)) !== null) {
    roadmapPhases.add(m[1]);
  }

  const diskPhases = new Set<string>();
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
      if (dm) diskPhases.add(dm[1]);
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  for (const p of roadmapPhases) {
    if (!diskPhases.has(p) && !diskPhases.has(normalizePhaseName(p))) {
      warnings.push(`Phase ${p} in ROADMAP.md but no directory on disk`);
    }
  }

  for (const p of diskPhases) {
    const unpadded = String(parseInt(p, 10));
    if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
      warnings.push(`Phase ${p} exists on disk but not in ROADMAP.md`);
    }
  }

  const integerPhases = [...diskPhases]
    .filter(p => !p.includes('.'))
    .map(p => parseInt(p, 10))
    .sort((a, b) => a - b);

  for (let i = 1; i < integerPhases.length; i++) {
    if (integerPhases[i] !== integerPhases[i - 1] + 1) {
      warnings.push(`Gap in phase numbering: ${integerPhases[i - 1]} → ${integerPhases[i]}`);
    }
  }

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md')).sort();

      const planNums = plans.map(p => {
        const pm = p.match(/-(\d{2})-PLAN\.md$/);
        return pm ? parseInt(pm[1], 10) : null;
      }).filter((n): n is number => n !== null);

      for (let i = 1; i < planNums.length; i++) {
        if (planNums[i] !== planNums[i - 1] + 1) {
          warnings.push(`Gap in plan numbering in ${dir}: plan ${planNums[i - 1]} → ${planNums[i]}`);
        }
      }

      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md'));
      const planIdsSet = new Set(plans.map(p => p.replace('-PLAN.md', '')));
      const summaryIdsSet = new Set(summaries.map(s => s.replace('-SUMMARY.md', '')));

      for (const sid of summaryIdsSet) {
        if (!planIdsSet.has(sid)) {
          warnings.push(`Summary ${sid}-SUMMARY.md in ${dir} has no matching PLAN.md`);
        }
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md'));

      for (const plan of plans) {
        const content = fs.readFileSync(path.join(phasesDir, dir, plan), 'utf-8');
        const fm = extractFrontmatter(content);

        if (!fm.wave) {
          warnings.push(`${dir}/${plan}: missing 'wave' in frontmatter`);
        }
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  const passed = errors.length === 0;
  const result: ConsistencyResult = { passed, errors, warnings, warning_count: warnings.length };
  output(result, raw, passed ? 'passed' : 'failed');
}

// ─── Validate Health ─────────────────────────────────────────────────────────

export function cmdValidateHealth(cwd: string, options: HealthOptions, raw: boolean): void {
  const planningDir = path.join(cwd, '.planning');
  const projectPath = path.join(planningDir, 'PROJECT.md');
  const roadmapPath = path.join(planningDir, 'ROADMAP.md');
  const statePath = path.join(planningDir, 'STATE.md');
  const configPath = path.join(planningDir, 'config.json');
  const phasesDir = path.join(planningDir, 'phases');

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const info: ValidationError[] = [];
  const repairs: string[] = [];

  const addIssue = (
    severity: 'error' | 'warning' | 'info',
    code: string,
    message: string,
    fix: string,
    repairable = false,
  ): void => {
    const issue: ValidationError = { code, message, fix, repairable };
    if (severity === 'error') errors.push(issue);
    else if (severity === 'warning') warnings.push(issue);
    else info.push(issue);
  };

  // Check 1: .planning/ exists
  if (!fs.existsSync(planningDir)) {
    addIssue('error', 'E001', '.planning/ directory not found', 'Run /maxsim:new-project to initialize');
    output({
      status: 'broken',
      errors,
      warnings,
      info,
      repairable_count: 0,
    }, raw);
    return;
  }

  // Check 2: PROJECT.md
  if (!fs.existsSync(projectPath)) {
    addIssue('error', 'E002', 'PROJECT.md not found', 'Run /maxsim:new-project to create');
  } else {
    const content = fs.readFileSync(projectPath, 'utf-8');
    const requiredSections = ['## What This Is', '## Core Value', '## Requirements'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        addIssue('warning', 'W001', `PROJECT.md missing section: ${section}`, 'Add section manually');
      }
    }
  }

  // Check 3: ROADMAP.md
  if (!fs.existsSync(roadmapPath)) {
    addIssue('error', 'E003', 'ROADMAP.md not found', 'Run /maxsim:new-milestone to create roadmap');
  }

  // Check 4: STATE.md
  if (!fs.existsSync(statePath)) {
    addIssue('error', 'E004', 'STATE.md not found', 'Run /maxsim:health --repair to regenerate', true);
    repairs.push('regenerateState');
  } else {
    const stateContent = fs.readFileSync(statePath, 'utf-8');
    const phaseRefs = [...stateContent.matchAll(/[Pp]hase\s+(\d+(?:\.\d+)?)/g)].map(m => m[1]);
    const diskPhases = new Set<string>();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const dm = e.name.match(/^(\d+(?:\.\d+)?)/);
          if (dm) diskPhases.add(dm[1]);
        }
      }
    } catch (e) {
      /* optional op, ignore */
      if (process.env.MAXSIM_DEBUG) console.error(e);
    }
    for (const ref of phaseRefs) {
      const normalizedRef = String(parseInt(ref, 10)).padStart(2, '0');
      if (!diskPhases.has(ref) && !diskPhases.has(normalizedRef) && !diskPhases.has(String(parseInt(ref, 10)))) {
        if (diskPhases.size > 0) {
          addIssue('warning', 'W002', `STATE.md references phase ${ref}, but only phases ${[...diskPhases].sort().join(', ')} exist`, 'Run /maxsim:health --repair to regenerate STATE.md', true);
          if (!repairs.includes('regenerateState')) repairs.push('regenerateState');
        }
      }
    }
  }

  // Check 5: config.json
  if (!fs.existsSync(configPath)) {
    addIssue('warning', 'W003', 'config.json not found', 'Run /maxsim:health --repair to create with defaults', true);
    repairs.push('createConfig');
  } else {
    try {
      const rawContent = fs.readFileSync(configPath, 'utf-8');
      const parsed: Record<string, unknown> = JSON.parse(rawContent) as Record<string, unknown>;
      const validProfiles = ['quality', 'balanced', 'budget', 'tokenburner'];
      if (parsed.model_profile && !validProfiles.includes(parsed.model_profile as string)) {
        addIssue('warning', 'W004', `config.json: invalid model_profile "${parsed.model_profile}"`, `Valid values: ${validProfiles.join(', ')}`);
      }
    } catch (thrown: unknown) {
      const parseErr = thrown as Error;
      addIssue('error', 'E005', `config.json: JSON parse error - ${parseErr.message}`, 'Run /maxsim:health --repair to reset to defaults', true);
      repairs.push('resetConfig');
    }
  }

  // Check 6: Phase directory naming
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.match(/^\d{2}(?:\.\d+)?-[\w-]+$/)) {
        addIssue('warning', 'W005', `Phase directory "${e.name}" doesn't follow NN-name format`, 'Rename to match pattern (e.g., 01-setup)');
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  // Check 7: Orphaned plans
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const phaseFiles = fs.readdirSync(path.join(phasesDir, e.name));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const summaryBases = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));

      for (const plan of plans) {
        const planBase = plan.replace('-PLAN.md', '').replace('PLAN.md', '');
        if (!summaryBases.has(planBase)) {
          addIssue('info', 'I001', `${e.name}/${plan} has no SUMMARY.md`, 'May be in progress');
        }
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  // Check 8: Roadmap consistency
  if (fs.existsSync(roadmapPath)) {
    const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
    const roadmapPhases = new Set<string>();
    const phasePattern = getPhasePattern();
    let m: RegExpExecArray | null;
    while ((m = phasePattern.exec(roadmapContent)) !== null) {
      roadmapPhases.add(m[1]);
    }

    const diskPhases = new Set<string>();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
          if (dm) diskPhases.add(dm[1]);
        }
      }
    } catch (e) {
      /* optional op, ignore */
      if (process.env.MAXSIM_DEBUG) console.error(e);
    }

    for (const p of roadmapPhases) {
      const padded = String(parseInt(p, 10)).padStart(2, '0');
      if (!diskPhases.has(p) && !diskPhases.has(padded)) {
        addIssue('warning', 'W006', `Phase ${p} in ROADMAP.md but no directory on disk`, 'Create phase directory or remove from roadmap');
      }
    }

    for (const p of diskPhases) {
      const unpadded = String(parseInt(p, 10));
      if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
        addIssue('warning', 'W007', `Phase ${p} exists on disk but not in ROADMAP.md`, 'Add to roadmap or remove directory');
      }
    }
  }

  // Perform repairs if requested
  const repairActions: RepairAction[] = [];
  if (options.repair && repairs.length > 0) {
    for (const repair of repairs) {
      try {
        switch (repair) {
          case 'createConfig':
          case 'resetConfig': {
            const defaults = {
              model_profile: 'balanced',
              commit_docs: true,
              search_gitignored: false,
              branching_strategy: 'none',
              research: true,
              plan_checker: true,
              verifier: true,
              parallelization: true,
            };
            fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf-8');
            repairActions.push({ action: repair, success: true, path: 'config.json' });
            break;
          }
          case 'regenerateState': {
            if (fs.existsSync(statePath)) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const backupPath = `${statePath}.bak-${timestamp}`;
              fs.copyFileSync(statePath, backupPath);
              repairActions.push({ action: 'backupState', success: true, path: backupPath });
            }
            const milestone = getMilestoneInfo(cwd);
            let stateContent = `# Session State\n\n`;
            stateContent += `## Project Reference\n\n`;
            stateContent += `See: .planning/PROJECT.md\n\n`;
            stateContent += `## Position\n\n`;
            stateContent += `**Milestone:** ${milestone.version} ${milestone.name}\n`;
            stateContent += `**Current phase:** (determining...)\n`;
            stateContent += `**Status:** Resuming\n\n`;
            stateContent += `## Session Log\n\n`;
            stateContent += `- ${new Date().toISOString().split('T')[0]}: STATE.md regenerated by /maxsim:health --repair\n`;
            fs.writeFileSync(statePath, stateContent, 'utf-8');
            repairActions.push({ action: repair, success: true, path: 'STATE.md' });
            break;
          }
        }
      } catch (thrown: unknown) {
        const repairErr = thrown as Error;
        repairActions.push({ action: repair, success: false, error: repairErr.message });
      }
    }
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'broken';
  if (errors.length > 0) {
    status = 'broken';
  } else if (warnings.length > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const repairableCount = errors.filter(e => e.repairable).length +
                           warnings.filter(w => w.repairable).length;

  const result: HealthResult = {
    status,
    errors,
    warnings,
    info,
    repairable_count: repairableCount,
    repairs_performed: repairActions.length > 0 ? repairActions : undefined,
  };
  output(result, raw);
}
