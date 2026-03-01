/**
 * Core — Shared utilities, constants, and internal helpers
 *
 * Ported from maxsim/bin/lib/core.cjs
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { simpleGit } from 'simple-git';
import slugify from 'slugify';

import type {
  BranchingStrategy,
  ModelProfiles,
  ModelProfileName,
  ModelResolution,
  AgentType,
  PhaseSearchResult,
  RoadmapPhaseInfo,
  ArchivedPhaseDir,
  GitResult,
  MilestoneInfo,
  AppConfig,
} from './types.js';

// ─── Model Profile Table ─────────────────────────────────────────────────────

export const MODEL_PROFILES: ModelProfiles = {
  'maxsim-planner':              { quality: 'opus', balanced: 'opus',   budget: 'sonnet', tokenburner: 'opus' },
  'maxsim-roadmapper':           { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
  'maxsim-executor':             { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
  'maxsim-phase-researcher':     { quality: 'opus', balanced: 'sonnet', budget: 'haiku',  tokenburner: 'opus' },
  'maxsim-project-researcher':   { quality: 'opus', balanced: 'sonnet', budget: 'haiku',  tokenburner: 'opus' },
  'maxsim-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
  'maxsim-debugger':             { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
  'maxsim-codebase-mapper':      { quality: 'sonnet', balanced: 'haiku', budget: 'haiku', tokenburner: 'opus' },
  'maxsim-verifier':             { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
  'maxsim-plan-checker':         { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
  'maxsim-integration-checker':  { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
};

// ─── Output helpers ──────────────────────────────────────────────────────────
// These throw CliOutput / CliError instead of calling process.exit() directly.
// The CLI entry point (cli.ts) catches these and calls process.exit() there.

/** Thrown by output() to signal successful command completion. */
export class CliOutput {
  readonly result: unknown;
  readonly raw: boolean;
  readonly rawValue: unknown;
  constructor(result: unknown, raw?: boolean, rawValue?: unknown) {
    this.result = result;
    this.raw = raw ?? false;
    this.rawValue = rawValue;
  }
}

/** Thrown by error() to signal a command error. */
export class CliError {
  readonly message: string;
  constructor(message: string) {
    this.message = message;
  }
}

export function output(result: unknown, raw?: boolean, rawValue?: unknown): never {
  throw new CliOutput(result, raw, rawValue);
}

export function error(message: string): never {
  throw new CliError(message);
}

/**
 * Handle a CliOutput by writing to stdout. Extracted so cli.ts can use it.
 */
export function writeOutput(out: CliOutput): void {
  if (out.raw && out.rawValue !== undefined) {
    process.stdout.write(String(out.rawValue));
  } else {
    const json = JSON.stringify(out.result, null, 2);
    if (json.length > 50000) {
      const tmpPath = path.join(os.tmpdir(), `maxsim-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
}

// ─── Shared micro-utilities ─────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Canonical .planning/ sub-paths. */
export function planningPath(cwd: string, ...segments: string[]): string {
  return path.join(cwd, '.planning', ...segments);
}
export function statePath(cwd: string): string { return planningPath(cwd, 'STATE.md'); }
export function roadmapPath(cwd: string): string { return planningPath(cwd, 'ROADMAP.md'); }
export function configPath(cwd: string): string { return planningPath(cwd, 'config.json'); }
export function phasesPath(cwd: string): string { return planningPath(cwd, 'phases'); }

/** Phase-file predicates. */
export const isPlanFile = (f: string): boolean => f.endsWith('-PLAN.md') || f === 'PLAN.md';
export const isSummaryFile = (f: string): boolean => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md';

/** Strip suffix to get plan/summary ID. */
export const planId = (f: string): string => f.replace('-PLAN.md', '').replace('PLAN.md', '');
export const summaryId = (f: string): string => f.replace('-SUMMARY.md', '').replace('SUMMARY.md', '');

/** List subdirectory names, optionally sorted by phase number. */
export function listSubDirs(dir: string, sortByPhase = false): string[] {
  const dirs = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  return sortByPhase ? dirs.sort((a, b) => comparePhaseNum(a, b)) : dirs;
}

/** Log only when MAXSIM_DEBUG is set. */
export function debugLog(e: unknown): void {
  if (process.env.MAXSIM_DEBUG) console.error(e);
}

/** Escape a phase number for use in regex. */
export function escapePhaseNum(phase: string | number): string {
  return String(phase).replace(/\./g, '\\.');
}

// ─── File & Config utilities ─────────────────────────────────────────────────

export function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

let _configCache: { cwd: string; config: AppConfig } | null = null;

export function loadConfig(cwd: string): AppConfig {
  if (_configCache && _configCache.cwd === cwd) return _configCache.config;
  const cfgPath = configPath(cwd);
  const defaults: AppConfig = {
    model_profile: 'balanced',
    commit_docs: true,
    search_gitignored: false,
    branching_strategy: 'none',
    phase_branch_template: 'maxsim/phase-{phase}-{slug}',
    milestone_branch_template: 'maxsim/{milestone}-{slug}',
    research: true,
    plan_checker: true,
    verifier: true,
    parallelization: true,
    brave_search: false,
  };

  try {
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const parsed: Record<string, unknown> = JSON.parse(raw) as Record<string, unknown>;

    const get = (key: string, nested?: { section: string; field: string }): unknown => {
      if (parsed[key] !== undefined) return parsed[key];
      if (nested) {
        const section = parsed[nested.section];
        if (section && typeof section === 'object' && section !== null && nested.field in section) {
          return (section as Record<string, unknown>)[nested.field];
        }
      }
      return undefined;
    };

    const parallelization = ((): boolean => {
      const val = get('parallelization');
      if (typeof val === 'boolean') return val;
      if (typeof val === 'object' && val !== null && 'enabled' in val) {
        return (val as { enabled: boolean }).enabled;
      }
      return defaults.parallelization;
    })();

    const result: AppConfig = {
      model_profile: (get('model_profile') as ModelProfileName | undefined) ?? defaults.model_profile,
      commit_docs: (get('commit_docs', { section: 'planning', field: 'commit_docs' }) as boolean | undefined) ?? defaults.commit_docs,
      search_gitignored: (get('search_gitignored', { section: 'planning', field: 'search_gitignored' }) as boolean | undefined) ?? defaults.search_gitignored,
      branching_strategy: (get('branching_strategy', { section: 'git', field: 'branching_strategy' }) as BranchingStrategy | undefined) ?? defaults.branching_strategy,
      phase_branch_template: (get('phase_branch_template', { section: 'git', field: 'phase_branch_template' }) as string | undefined) ?? defaults.phase_branch_template,
      milestone_branch_template: (get('milestone_branch_template', { section: 'git', field: 'milestone_branch_template' }) as string | undefined) ?? defaults.milestone_branch_template,
      research: (get('research', { section: 'workflow', field: 'research' }) as boolean | undefined) ?? defaults.research,
      plan_checker: ((get('plan_checker', { section: 'workflow', field: 'plan_checker' }) ?? get('plan_checker', { section: 'workflow', field: 'plan_check' })) as boolean | undefined) ?? defaults.plan_checker,
      verifier: (get('verifier', { section: 'workflow', field: 'verifier' }) as boolean | undefined) ?? defaults.verifier,
      parallelization,
      brave_search: (get('brave_search') as boolean | undefined) ?? defaults.brave_search,
      model_overrides: parsed['model_overrides'] as AppConfig['model_overrides'],
    };
    _configCache = { cwd, config: result };
    return result;
  } catch {
    _configCache = { cwd, config: defaults };
    return defaults;
  }
}

// ─── Git utilities ───────────────────────────────────────────────────────────

export async function isGitIgnored(cwd: string, targetPath: string): Promise<boolean> {
  try {
    const git = simpleGit(cwd);
    const result = await git.checkIgnore(targetPath);
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function execGit(cwd: string, args: string[]): Promise<GitResult> {
  try {
    const git = simpleGit(cwd);
    const stdout = await git.raw(args);
    return { exitCode: 0, stdout: (stdout ?? '').trim(), stderr: '' };
  } catch (thrown: unknown) {
    const err = thrown as { message?: string };
    // simple-git throws on non-zero exit — extract what we can
    const message = err.message ?? '';
    return {
      exitCode: 1,
      stdout: '',
      stderr: message,
    };
  }
}

// ─── Phase utilities ─────────────────────────────────────────────────────────

export function normalizePhaseName(phase: string): string {
  const match = phase.match(/^(\d+)([A-Z])?(\.\d+)?/i);
  if (!match) return phase;
  const padded = match[1].padStart(2, '0');
  const letter = match[2] ? match[2].toUpperCase() : '';
  const decimal = match[3] || '';
  return padded + letter + decimal;
}

export function comparePhaseNum(a: string | number, b: string | number): number {
  const pa = String(a).match(/^(\d+)([A-Z])?(\.\d+)?/i);
  const pb = String(b).match(/^(\d+)([A-Z])?(\.\d+)?/i);
  if (!pa || !pb) return String(a).localeCompare(String(b));
  const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
  if (intDiff !== 0) return intDiff;
  const la = (pa[2] || '').toUpperCase();
  const lb = (pb[2] || '').toUpperCase();
  if (la !== lb) {
    if (!la) return -1;
    if (!lb) return 1;
    return la < lb ? -1 : 1;
  }
  const da = pa[3] ? parseFloat(pa[3]) : -1;
  const db = pb[3] ? parseFloat(pb[3]) : -1;
  return da - db;
}

// ─── Phase regex helper ──────────────────────────────────────────────────────

/**
 * Returns the canonical regex for matching Phase heading lines in ROADMAP.md.
 *
 * General form (no escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase number string (e.g. "03", "3A", "2.1")
 *   Group 2: phase name string (e.g. "Name Here")
 *
 * Specific form (with escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase name string only
 *
 * @param escapedPhaseNum - regex-escaped phase number string to match a specific phase
 * @param flags - regex flags (default: 'gi')
 */
export function getPhasePattern(escapedPhaseNum?: string, flags = 'gim'): RegExp {
  if (escapedPhaseNum) {
    return new RegExp(
      `^#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`,
      flags,
    );
  }
  return new RegExp(
    `^#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`,
    flags,
  );
}

function searchPhaseInDir(baseDir: string, relBase: string, normalized: string): PhaseSearchResult | null {
  try {
    const dirs = listSubDirs(baseDir, true);
    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) return null;

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
    const phaseDir = path.join(baseDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);

    const plans = phaseFiles.filter(isPlanFile).sort();
    const summaries = phaseFiles.filter(isSummaryFile).sort();
    const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
    const hasVerification = phaseFiles.some(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');

    const completedPlanIds = new Set(summaries.map(summaryId));
    const incompletePlans = plans.filter(p => !completedPlanIds.has(planId(p)));

    return {
      found: true,
      directory: path.join(relBase, match),
      phase_number: phaseNumber,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans,
      summaries,
      incomplete_plans: incompletePlans,
      has_research: hasResearch,
      has_context: hasContext,
      has_verification: hasVerification,
    };
  } catch {
    return null;
  }
}

export function findPhaseInternal(cwd: string, phase: string): PhaseSearchResult | null {
  if (!phase) return null;

  const pd = phasesPath(cwd);
  const normalized = normalizePhaseName(phase);

  const current = searchPhaseInDir(pd, path.join('.planning', 'phases'), normalized);
  if (current) return current;

  const milestonesDir = planningPath(cwd, 'milestones');

  try {
    fs.statSync(milestonesDir);
  } catch {
    return null;
  }

  try {
    const milestoneEntries = fs.readdirSync(milestonesDir, { withFileTypes: true });
    const archiveDirs = milestoneEntries
      .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
      .map(e => e.name)
      .sort()
      .reverse();

    for (const archiveName of archiveDirs) {
      const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
      if (!versionMatch) continue;
      const version = versionMatch[1];
      const archivePath = path.join(milestonesDir, archiveName);
      const relBase = path.join('.planning', 'milestones', archiveName);
      const result = searchPhaseInDir(archivePath, relBase, normalized);
      if (result) {
        result.archived = version;
        return result;
      }
    }
  } catch (e) {
    debugLog(e);
  }

  return null;
}

export function getArchivedPhaseDirs(cwd: string): ArchivedPhaseDir[] {
  const milestonesDir = planningPath(cwd, 'milestones');
  const results: ArchivedPhaseDir[] = [];

  try {
    const milestoneEntries = fs.readdirSync(milestonesDir, { withFileTypes: true });
    const phaseDirs = milestoneEntries
      .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
      .map(e => e.name)
      .sort()
      .reverse();

    for (const archiveName of phaseDirs) {
      const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
      if (!versionMatch) continue;
      const version = versionMatch[1];
      const archivePath = path.join(milestonesDir, archiveName);
      const dirs = listSubDirs(archivePath, true);

      for (const dir of dirs) {
        results.push({
          name: dir,
          milestone: version,
          basePath: path.join('.planning', 'milestones', archiveName),
          fullPath: path.join(archivePath, dir),
        });
      }
    }
  } catch (e) {
    debugLog(e);
  }

  return results;
}

// ─── Roadmap & model utilities ───────────────────────────────────────────────

export function getRoadmapPhaseInternal(cwd: string, phaseNum: string | number): RoadmapPhaseInfo | null {
  if (!phaseNum) return null;
  const rp = roadmapPath(cwd);

  try {
    const content = fs.readFileSync(rp, 'utf-8');
    const escapedPhase = escapePhaseNum(phaseNum);
    const phasePattern = getPhasePattern(escapedPhase, 'i');
    const headerMatch = content.match(phasePattern);
    if (!headerMatch) return null;

    const phaseName = headerMatch[1].trim();
    const headerIndex = headerMatch.index!;
    const restOfContent = content.slice(headerIndex);
    const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index! : content.length;
    const section = content.slice(headerIndex, sectionEnd).trim();

    const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    return {
      found: true,
      phase_number: phaseNum.toString(),
      phase_name: phaseName,
      goal,
      section,
    };
  } catch {
    return null;
  }
}

export function resolveModelInternal(cwd: string, agentType: AgentType, config?: AppConfig): ModelResolution {
  config = config ?? loadConfig(cwd);

  const override = config.model_overrides?.[agentType];
  if (override) {
    return override === 'opus' ? 'inherit' : override;
  }

  const profile: ModelProfileName = config.model_profile || 'balanced';
  const agentModels = MODEL_PROFILES[agentType];
  if (!agentModels) return 'sonnet';
  const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  return resolved === 'opus' ? 'inherit' : resolved;
}

// ─── Misc utilities ──────────────────────────────────────────────────────────

export function pathExistsInternal(cwd: string, targetPath: string): boolean {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
  try {
    fs.statSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

export function generateSlugInternal(text: string | null | undefined): string | null {
  if (!text) return null;
  return slugify(text, { lower: true, strict: true });
}

export function getMilestoneInfo(cwd: string): MilestoneInfo {
  try {
    const roadmap = fs.readFileSync(roadmapPath(cwd), 'utf-8');
    const versionMatch = roadmap.match(/v(\d+\.\d+)/);
    const nameMatch = roadmap.match(/## .*v\d+\.\d+[:\s]+([^\n(]+)/);
    return {
      version: versionMatch ? versionMatch[0] : 'v1.0',
      name: nameMatch ? nameMatch[1].trim() : 'milestone',
    };
  } catch {
    return { version: 'v1.0', name: 'milestone' };
  }
}
