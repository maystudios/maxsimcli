/**
 * Init — Compound init commands for workflow bootstrapping
 *
 * Ported from maxsim/bin/lib/init.cjs
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import {
  loadConfig,
  resolveModelInternal,
  findPhaseInternal,
  getRoadmapPhaseInternal,
  pathExistsInternal,
  generateSlugInternal,
  getMilestoneInfo,
  output,
  error,
} from './core.js';

import type {
  AgentType,
  ModelResolution,
  PhaseSearchResult,
  MilestoneInfo,
  AppConfig,
} from './types.js';

// ─── Init result types ──────────────────────────────────────────────────────

export type WorkflowType =
  | 'execute-phase'
  | 'plan-phase'
  | 'new-project'
  | 'new-milestone'
  | 'quick'
  | 'resume'
  | 'verify-work'
  | 'phase-op'
  | 'todos'
  | 'milestone-op'
  | 'map-codebase'
  | 'progress';

export interface ExecutePhaseContext {
  executor_model: ModelResolution;
  verifier_model: ModelResolution;
  commit_docs: boolean;
  parallelization: boolean;
  branching_strategy: string;
  phase_branch_template: string;
  milestone_branch_template: string;
  verifier_enabled: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  phase_req_ids: string | null;
  plans: string[];
  summaries: string[];
  incomplete_plans: string[];
  plan_count: number;
  incomplete_count: number;
  branch_name: string | null;
  milestone_version: string;
  milestone_name: string;
  milestone_slug: string | null;
  state_exists: boolean;
  roadmap_exists: boolean;
  config_exists: boolean;
  state_path: string;
  roadmap_path: string;
  config_path: string;
}

export interface PlanPhaseContext {
  researcher_model: ModelResolution;
  planner_model: ModelResolution;
  checker_model: ModelResolution;
  research_enabled: boolean;
  plan_checker_enabled: boolean;
  nyquist_validation_enabled: boolean;
  commit_docs: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  padded_phase: string | null;
  phase_req_ids: string | null;
  has_research: boolean;
  has_context: boolean;
  has_plans: boolean;
  plan_count: number;
  planning_exists: boolean;
  roadmap_exists: boolean;
  state_path: string;
  roadmap_path: string;
  requirements_path: string;
  context_path?: string;
  research_path?: string;
  verification_path?: string;
  uat_path?: string;
}

export interface NewProjectContext {
  researcher_model: ModelResolution;
  synthesizer_model: ModelResolution;
  roadmapper_model: ModelResolution;
  commit_docs: boolean;
  project_exists: boolean;
  has_codebase_map: boolean;
  planning_exists: boolean;
  has_existing_code: boolean;
  has_package_file: boolean;
  is_brownfield: boolean;
  needs_codebase_map: boolean;
  has_git: boolean;
  brave_search_available: boolean;
  project_path: string;
}

export interface NewMilestoneContext {
  researcher_model: ModelResolution;
  synthesizer_model: ModelResolution;
  roadmapper_model: ModelResolution;
  commit_docs: boolean;
  research_enabled: boolean;
  current_milestone: string;
  current_milestone_name: string;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  project_path: string;
  roadmap_path: string;
  state_path: string;
}

export interface QuickContext {
  planner_model: ModelResolution;
  executor_model: ModelResolution;
  checker_model: ModelResolution;
  verifier_model: ModelResolution;
  commit_docs: boolean;
  next_num: number;
  slug: string | null;
  description: string | null;
  date: string;
  timestamp: string;
  quick_dir: string;
  task_dir: string | null;
  roadmap_exists: boolean;
  planning_exists: boolean;
}

export interface ResumeContext {
  state_exists: boolean;
  roadmap_exists: boolean;
  project_exists: boolean;
  planning_exists: boolean;
  state_path: string;
  roadmap_path: string;
  project_path: string;
  has_interrupted_agent: boolean;
  interrupted_agent_id: string | null;
  commit_docs: boolean;
}

export interface VerifyWorkContext {
  planner_model: ModelResolution;
  checker_model: ModelResolution;
  commit_docs: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  has_verification: boolean;
}

export interface PhaseOpContext {
  commit_docs: boolean;
  brave_search: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  padded_phase: string | null;
  has_research: boolean;
  has_context: boolean;
  has_plans: boolean;
  has_verification: boolean;
  plan_count: number;
  roadmap_exists: boolean;
  planning_exists: boolean;
  state_path: string;
  roadmap_path: string;
  requirements_path: string;
  context_path?: string;
  research_path?: string;
  verification_path?: string;
  uat_path?: string;
}

export interface TodosContext {
  commit_docs: boolean;
  date: string;
  timestamp: string;
  todo_count: number;
  todos: Array<{
    file: string;
    created: string;
    title: string;
    area: string;
    path: string;
  }>;
  area_filter: string | null;
  pending_dir: string;
  completed_dir: string;
  planning_exists: boolean;
  todos_dir_exists: boolean;
  pending_dir_exists: boolean;
}

export interface MilestoneOpContext {
  commit_docs: boolean;
  milestone_version: string;
  milestone_name: string;
  milestone_slug: string | null;
  phase_count: number;
  completed_phases: number;
  all_phases_complete: boolean;
  archived_milestones: string[];
  archive_count: number;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  archive_exists: boolean;
  phases_dir_exists: boolean;
}

export interface MapCodebaseContext {
  mapper_model: ModelResolution;
  commit_docs: boolean;
  search_gitignored: boolean;
  parallelization: boolean;
  codebase_dir: string;
  existing_maps: string[];
  has_maps: boolean;
  planning_exists: boolean;
  codebase_dir_exists: boolean;
}

interface ProgressPhaseInfo {
  number: string;
  name: string | null;
  directory: string;
  status: string;
  plan_count: number;
  summary_count: number;
  has_research: boolean;
}

export interface ProgressContext {
  executor_model: ModelResolution;
  planner_model: ModelResolution;
  commit_docs: boolean;
  milestone_version: string;
  milestone_name: string;
  phases: ProgressPhaseInfo[];
  phase_count: number;
  completed_count: number;
  in_progress_count: number;
  current_phase: ProgressPhaseInfo | null;
  next_phase: ProgressPhaseInfo | null;
  paused_at: string | null;
  has_work_in_progress: boolean;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  state_path: string;
  roadmap_path: string;
  project_path: string;
  config_path: string;
}

export type InitContext =
  | ExecutePhaseContext
  | PlanPhaseContext
  | NewProjectContext
  | NewMilestoneContext
  | QuickContext
  | ResumeContext
  | VerifyWorkContext
  | PhaseOpContext
  | TodosContext
  | MilestoneOpContext
  | MapCodebaseContext
  | ProgressContext;

// ─── Helper: extract requirement IDs from roadmap phase section ─────────────

function extractReqIds(cwd: string, phase: string): string | null {
  const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);
  const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
  const reqExtracted = reqMatch
    ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
    : null;
  return (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;
}

// ─── Helper: scan phase dir for artifact files ──────────────────────────────

interface PhaseArtifacts {
  context_path?: string;
  research_path?: string;
  verification_path?: string;
  uat_path?: string;
}

function scanPhaseArtifacts(cwd: string, phaseDirectory: string): PhaseArtifacts {
  const result: PhaseArtifacts = {};
  const phaseDirFull = path.join(cwd, phaseDirectory);
  try {
    const files = fs.readdirSync(phaseDirFull);
    const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
    if (contextFile) {
      result.context_path = path.join(phaseDirectory, contextFile);
    }
    const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    if (researchFile) {
      result.research_path = path.join(phaseDirectory, researchFile);
    }
    const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
    if (verificationFile) {
      result.verification_path = path.join(phaseDirectory, verificationFile);
    }
    const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
    if (uatFile) {
      result.uat_path = path.join(phaseDirectory, uatFile);
    }
  } catch { /* ignore */ }
  return result;
}

// ─── Init commands ──────────────────────────────────────────────────────────

export function cmdInitExecutePhase(cwd: string, phase: string | undefined, raw: boolean): void {
  if (!phase) {
    error('phase required for init execute-phase');
  }

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase!);
  const milestone = getMilestoneInfo(cwd);
  const phase_req_ids = extractReqIds(cwd, phase!);

  const result: ExecutePhaseContext = {
    executor_model: resolveModelInternal(cwd, 'maxsim-executor'),
    verifier_model: resolveModelInternal(cwd, 'maxsim-verifier'),
    commit_docs: config.commit_docs,
    parallelization: config.parallelization,
    branching_strategy: config.branching_strategy,
    phase_branch_template: config.phase_branch_template,
    milestone_branch_template: config.milestone_branch_template,
    verifier_enabled: config.verifier,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory ?? null,
    phase_number: phaseInfo?.phase_number ?? null,
    phase_name: phaseInfo?.phase_name ?? null,
    phase_slug: phaseInfo?.phase_slug ?? null,
    phase_req_ids,
    plans: phaseInfo?.plans ?? [],
    summaries: phaseInfo?.summaries ?? [],
    incomplete_plans: phaseInfo?.incomplete_plans ?? [],
    plan_count: phaseInfo?.plans?.length ?? 0,
    incomplete_count: phaseInfo?.incomplete_plans?.length ?? 0,
    branch_name: config.branching_strategy === 'phase' && phaseInfo
      ? config.phase_branch_template
          .replace('{phase}', phaseInfo.phase_number)
          .replace('{slug}', phaseInfo.phase_slug || 'phase')
      : config.branching_strategy === 'milestone'
        ? config.milestone_branch_template
            .replace('{milestone}', milestone.version)
            .replace('{slug}', generateSlugInternal(milestone.name) || 'milestone')
        : null,
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    milestone_slug: generateSlugInternal(milestone.name),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    config_exists: pathExistsInternal(cwd, '.planning/config.json'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    config_path: '.planning/config.json',
  };

  output(result, raw);
}

export function cmdInitPlanPhase(cwd: string, phase: string | undefined, raw: boolean): void {
  if (!phase) {
    error('phase required for init plan-phase');
  }

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase!);
  const phase_req_ids = extractReqIds(cwd, phase!);

  const result: PlanPhaseContext = {
    researcher_model: resolveModelInternal(cwd, 'maxsim-phase-researcher'),
    planner_model: resolveModelInternal(cwd, 'maxsim-planner'),
    checker_model: resolveModelInternal(cwd, 'maxsim-plan-checker'),
    research_enabled: config.research,
    plan_checker_enabled: config.plan_checker,
    nyquist_validation_enabled: false, // config doesn't have nyquist_validation directly
    commit_docs: config.commit_docs,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory ?? null,
    phase_number: phaseInfo?.phase_number ?? null,
    phase_name: phaseInfo?.phase_name ?? null,
    phase_slug: phaseInfo?.phase_slug ?? null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') ?? null,
    phase_req_ids,
    has_research: phaseInfo?.has_research ?? false,
    has_context: phaseInfo?.has_context ?? false,
    has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
    plan_count: phaseInfo?.plans?.length ?? 0,
    planning_exists: pathExistsInternal(cwd, '.planning'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    requirements_path: '.planning/REQUIREMENTS.md',
  };

  if (phaseInfo?.directory) {
    const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
    if (artifacts.context_path) result.context_path = artifacts.context_path;
    if (artifacts.research_path) result.research_path = artifacts.research_path;
    if (artifacts.verification_path) result.verification_path = artifacts.verification_path;
    if (artifacts.uat_path) result.uat_path = artifacts.uat_path;
  }

  output(result, raw);
}

export function cmdInitNewProject(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);

  const homedir = os.homedir();
  const braveKeyFile = path.join(homedir, '.maxsim', 'brave_api_key');
  const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs.existsSync(braveKeyFile));

  let hasCode = false;
  let hasPackageFile = false;
  try {
    const files = execSync('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    hasCode = files.trim().length > 0;
  } catch { /* ignore */ }

  hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                   pathExistsInternal(cwd, 'requirements.txt') ||
                   pathExistsInternal(cwd, 'Cargo.toml') ||
                   pathExistsInternal(cwd, 'go.mod') ||
                   pathExistsInternal(cwd, 'Package.swift');

  const result: NewProjectContext = {
    researcher_model: resolveModelInternal(cwd, 'maxsim-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'maxsim-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'maxsim-roadmapper'),
    commit_docs: config.commit_docs,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    has_codebase_map: pathExistsInternal(cwd, '.planning/codebase'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
    has_existing_code: hasCode,
    has_package_file: hasPackageFile,
    is_brownfield: hasCode || hasPackageFile,
    needs_codebase_map: (hasCode || hasPackageFile) && !pathExistsInternal(cwd, '.planning/codebase'),
    has_git: pathExistsInternal(cwd, '.git'),
    brave_search_available: hasBraveSearch,
    project_path: '.planning/PROJECT.md',
  };

  output(result, raw);
}

export function cmdInitNewMilestone(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  const result: NewMilestoneContext = {
    researcher_model: resolveModelInternal(cwd, 'maxsim-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'maxsim-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'maxsim-roadmapper'),
    commit_docs: config.commit_docs,
    research_enabled: config.research,
    current_milestone: milestone.version,
    current_milestone_name: milestone.name,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    project_path: '.planning/PROJECT.md',
    roadmap_path: '.planning/ROADMAP.md',
    state_path: '.planning/STATE.md',
  };

  output(result, raw);
}

export function cmdInitQuick(cwd: string, description: string | undefined, raw: boolean): void {
  const config = loadConfig(cwd);
  const now = new Date();
  const slug = description ? generateSlugInternal(description)?.substring(0, 40) ?? null : null;

  const quickDir = path.join(cwd, '.planning', 'quick');
  let nextNum = 1;
  try {
    const existing = fs.readdirSync(quickDir)
      .filter(f => /^\d+-/.test(f))
      .map(f => parseInt(f.split('-')[0], 10))
      .filter(n => !isNaN(n));
    if (existing.length > 0) {
      nextNum = Math.max(...existing) + 1;
    }
  } catch { /* ignore */ }

  const result: QuickContext = {
    planner_model: resolveModelInternal(cwd, 'maxsim-planner'),
    executor_model: resolveModelInternal(cwd, 'maxsim-executor'),
    checker_model: resolveModelInternal(cwd, 'maxsim-plan-checker'),
    verifier_model: resolveModelInternal(cwd, 'maxsim-verifier'),
    commit_docs: config.commit_docs,
    next_num: nextNum,
    slug,
    description: description ?? null,
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    quick_dir: '.planning/quick',
    task_dir: slug ? `.planning/quick/${nextNum}-${slug}` : null,
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
  };

  output(result, raw);
}

export function cmdInitResume(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);

  let interruptedAgentId: string | null = null;
  try {
    interruptedAgentId = fs.readFileSync(path.join(cwd, '.planning', 'current-agent-id.txt'), 'utf-8').trim();
  } catch { /* ignore */ }

  const result: ResumeContext = {
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',
    has_interrupted_agent: !!interruptedAgentId,
    interrupted_agent_id: interruptedAgentId,
    commit_docs: config.commit_docs,
  };

  output(result, raw);
}

export function cmdInitVerifyWork(cwd: string, phase: string | undefined, raw: boolean): void {
  if (!phase) {
    error('phase required for init verify-work');
  }

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase!);

  const result: VerifyWorkContext = {
    planner_model: resolveModelInternal(cwd, 'maxsim-planner'),
    checker_model: resolveModelInternal(cwd, 'maxsim-plan-checker'),
    commit_docs: config.commit_docs,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory ?? null,
    phase_number: phaseInfo?.phase_number ?? null,
    phase_name: phaseInfo?.phase_name ?? null,
    has_verification: phaseInfo?.has_verification ?? false,
  };

  output(result, raw);
}

export function cmdInitPhaseOp(cwd: string, phase: string | undefined, raw: boolean): void {
  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase ?? '');

  if (!phaseInfo) {
    const roadmapPhase = getRoadmapPhaseInternal(cwd, phase ?? '');
    if (roadmapPhase?.found) {
      const phaseName = roadmapPhase.phase_name;
      phaseInfo = {
        found: true,
        directory: '',  // no directory yet
        phase_number: roadmapPhase.phase_number,
        phase_name: phaseName,
        phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
        plans: [],
        summaries: [],
        incomplete_plans: [],
        has_research: false,
        has_context: false,
        has_verification: false,
      };
    }
  }

  const result: PhaseOpContext = {
    commit_docs: config.commit_docs,
    brave_search: config.brave_search,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number ?? null,
    phase_name: phaseInfo?.phase_name ?? null,
    phase_slug: phaseInfo?.phase_slug ?? null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') ?? null,
    has_research: phaseInfo?.has_research ?? false,
    has_context: phaseInfo?.has_context ?? false,
    has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
    has_verification: phaseInfo?.has_verification ?? false,
    plan_count: phaseInfo?.plans?.length ?? 0,
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    requirements_path: '.planning/REQUIREMENTS.md',
  };

  if (phaseInfo?.directory) {
    const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
    if (artifacts.context_path) result.context_path = artifacts.context_path;
    if (artifacts.research_path) result.research_path = artifacts.research_path;
    if (artifacts.verification_path) result.verification_path = artifacts.verification_path;
    if (artifacts.uat_path) result.uat_path = artifacts.uat_path;
  }

  output(result, raw);
}

export function cmdInitTodos(cwd: string, area: string | undefined, raw: boolean): void {
  const config = loadConfig(cwd);
  const now = new Date();

  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  let count = 0;
  const todos: Array<{ file: string; created: string; title: string; area: string; path: string }> = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);
        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  const result: TodosContext = {
    commit_docs: config.commit_docs,
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    todo_count: count,
    todos,
    area_filter: area ?? null,
    pending_dir: '.planning/todos/pending',
    completed_dir: '.planning/todos/completed',
    planning_exists: pathExistsInternal(cwd, '.planning'),
    todos_dir_exists: pathExistsInternal(cwd, '.planning/todos'),
    pending_dir_exists: pathExistsInternal(cwd, '.planning/todos/pending'),
  };

  output(result, raw);
}

export function cmdInitMilestoneOp(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  let phaseCount = 0;
  let completedPhases = 0;
  const phasesDir = path.join(cwd, '.planning', 'phases');
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    phaseCount = dirs.length;

    for (const dir of dirs) {
      try {
        const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
        const hasSummary = phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
        if (hasSummary) completedPhases++;
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  const archiveDir = path.join(cwd, '.planning', 'archive');
  let archivedMilestones: string[] = [];
  try {
    archivedMilestones = fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch { /* ignore */ }

  const result: MilestoneOpContext = {
    commit_docs: config.commit_docs,
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    milestone_slug: generateSlugInternal(milestone.name),
    phase_count: phaseCount,
    completed_phases: completedPhases,
    all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,
    archived_milestones: archivedMilestones,
    archive_count: archivedMilestones.length,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    archive_exists: pathExistsInternal(cwd, '.planning/archive'),
    phases_dir_exists: pathExistsInternal(cwd, '.planning/phases'),
  };

  output(result, raw);
}

export function cmdInitMapCodebase(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);

  const codebaseDir = path.join(cwd, '.planning', 'codebase');
  let existingMaps: string[] = [];
  try {
    existingMaps = fs.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
  } catch { /* ignore */ }

  const result: MapCodebaseContext = {
    mapper_model: resolveModelInternal(cwd, 'maxsim-codebase-mapper'),
    commit_docs: config.commit_docs,
    search_gitignored: config.search_gitignored,
    parallelization: config.parallelization,
    codebase_dir: '.planning/codebase',
    existing_maps: existingMaps,
    has_maps: existingMaps.length > 0,
    planning_exists: pathExistsInternal(cwd, '.planning'),
    codebase_dir_exists: pathExistsInternal(cwd, '.planning/codebase'),
  };

  output(result, raw);
}

export function cmdInitProgress(cwd: string, raw: boolean): void {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  const phasesDir = path.join(cwd, '.planning', 'phases');
  const phases: ProgressPhaseInfo[] = [];
  let currentPhase: ProgressPhaseInfo | null = null;
  let nextPhase: ProgressPhaseInfo | null = null;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const match = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
      const phaseNumber = match ? match[1] : dir;
      const phaseName = match && match[2] ? match[2] : null;

      const phasePath = path.join(phasesDir, dir);
      const phaseFiles = fs.readdirSync(phasePath);

      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' :
                     hasResearch ? 'researched' : 'pending';

      const phaseInfo: ProgressPhaseInfo = {
        number: phaseNumber,
        name: phaseName,
        directory: path.join('.planning', 'phases', dir),
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
        has_research: hasResearch,
      };

      phases.push(phaseInfo);

      if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
        currentPhase = phaseInfo;
      }
      if (!nextPhase && status === 'pending') {
        nextPhase = phaseInfo;
      }
    }
  } catch { /* ignore */ }

  let pausedAt: string | null = null;
  try {
    const state = fs.readFileSync(path.join(cwd, '.planning', 'STATE.md'), 'utf-8');
    const pauseMatch = state.match(/\*\*Paused At:\*\*\s*(.+)/);
    if (pauseMatch) pausedAt = pauseMatch[1].trim();
  } catch { /* ignore */ }

  const result: ProgressContext = {
    executor_model: resolveModelInternal(cwd, 'maxsim-executor'),
    planner_model: resolveModelInternal(cwd, 'maxsim-planner'),
    commit_docs: config.commit_docs,
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    phases,
    phase_count: phases.length,
    completed_count: phases.filter(p => p.status === 'complete').length,
    in_progress_count: phases.filter(p => p.status === 'in_progress').length,
    current_phase: currentPhase,
    next_phase: nextPhase,
    paused_at: pausedAt,
    has_work_in_progress: !!currentPhase,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',
    config_path: '.planning/config.json',
  };

  output(result, raw);
}
