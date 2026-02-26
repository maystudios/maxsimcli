/**
 * Dashboard data parsers — Wrapper functions around @maxsim/core logic
 *
 * CRITICAL: These functions return data objects directly. They do NOT call
 * output() or process.exit() from @maxsim/core. Instead, they re-implement
 * just the data assembly using the exported internal helpers.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  normalizePhaseName,
  comparePhaseNum,
  getPhasePattern,
  extractFrontmatter,
  stateExtractField,
} from '@maxsim/core';

import type {
  RoadmapPhase,
  RoadmapMilestone,
  RoadmapAnalysis,
  PhaseStatus,
  FrontmatterData,
} from '@maxsim/core';

import type {
  DashboardPhase,
  PlanFile,
  PlanTask,
  TodoItem,
} from './types.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Resolve the project CWD from env var or process.cwd() */
export function getProjectCwd(): string {
  return process.env.MAXSIM_PROJECT_CWD || process.cwd();
}

/** Safely check if a path is within the .planning/ directory (path traversal prevention) */
export function isWithinPlanning(cwd: string, targetPath: string): boolean {
  const planningDir = path.resolve(cwd, '.planning');
  const resolved = path.resolve(cwd, targetPath);
  return resolved.startsWith(planningDir);
}

// ─── parseRoadmap ──────────────────────────────────────────────────────────

export function parseRoadmap(cwd: string): RoadmapAnalysis | null {
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');

  if (!fs.existsSync(roadmapPath)) {
    return null;
  }

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const phasesDir = path.join(cwd, '.planning', 'phases');

  const phasePattern = getPhasePattern();
  const phases: RoadmapPhase[] = [];
  let match: RegExpExecArray | null;

  while ((match = phasePattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();

    const sectionStart = match.index;
    const restOfContent = content.slice(sectionStart);
    const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeader ? sectionStart + nextHeader.index! : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    const dependsMatch = section.match(/\*\*Depends on:\*\*\s*([^\n]+)/i);
    const depends_on = dependsMatch ? dependsMatch[1].trim() : null;

    const normalized = normalizePhaseName(phaseNum);
    let diskStatus: PhaseStatus = 'no_directory';
    let planCount = 0;
    let summaryCount = 0;
    let hasContext = false;
    let hasResearch = false;

    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      const dirMatch = dirs.find(d => d.startsWith(normalized + '-') || d === normalized);

      if (dirMatch) {
        const phaseFiles = fs.readdirSync(path.join(phasesDir, dirMatch));
        planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
        summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
        hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
        hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

        if (summaryCount >= planCount && planCount > 0) diskStatus = 'complete';
        else if (summaryCount > 0) diskStatus = 'partial';
        else if (planCount > 0) diskStatus = 'planned';
        else if (hasResearch) diskStatus = 'researched';
        else if (hasContext) diskStatus = 'discussed';
        else diskStatus = 'empty';
      }
    } catch {
      // phases dir may not exist
    }

    const checkboxPattern = new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum.replace('.', '\\.')}`, 'i');
    const checkboxMatch = content.match(checkboxPattern);
    const roadmapComplete = checkboxMatch ? checkboxMatch[1] === 'x' : false;

    phases.push({
      number: phaseNum,
      name: phaseName,
      goal,
      depends_on,
      plan_count: planCount,
      summary_count: summaryCount,
      has_context: hasContext,
      has_research: hasResearch,
      disk_status: diskStatus,
      roadmap_complete: roadmapComplete,
    });
  }

  // Parse milestones
  const milestones: RoadmapMilestone[] = [];
  const milestonePattern = /##\s*(.*v(\d+\.\d+)[^(\n]*)/gi;
  let mMatch: RegExpExecArray | null;
  while ((mMatch = milestonePattern.exec(content)) !== null) {
    milestones.push({
      heading: mMatch[1].trim(),
      version: 'v' + mMatch[2],
    });
  }

  const currentPhase = phases.find(p => p.disk_status === 'planned' || p.disk_status === 'partial') || null;
  const nextPhase = phases.find(p =>
    p.disk_status === 'empty' || p.disk_status === 'no_directory' ||
    p.disk_status === 'discussed' || p.disk_status === 'researched'
  ) || null;

  const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
  const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
  const completedPhases = phases.filter(p => p.disk_status === 'complete').length;

  return {
    milestones,
    phases,
    phase_count: phases.length,
    completed_phases: completedPhases,
    total_plans: totalPlans,
    total_summaries: totalSummaries,
    progress_percent: totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0,
    current_phase: currentPhase ? currentPhase.number : null,
    next_phase: nextPhase ? nextPhase.number : null,
    missing_phase_details: null,
  };
}

// ─── parseState ────────────────────────────────────────────────────────────

export interface ParsedState {
  position: string | null;
  lastActivity: string | null;
  currentPhase: string | null;
  currentPlan: string | null;
  status: string | null;
  progress: string | null;
  decisions: string[];
  blockers: string[];
  content: string;
}

export function parseState(cwd: string): ParsedState | null {
  const statePath = path.join(cwd, '.planning', 'STATE.md');

  if (!fs.existsSync(statePath)) {
    return null;
  }

  const content = fs.readFileSync(statePath, 'utf-8');

  // Extract fields using stateExtractField from @maxsim/core
  const position = stateExtractField(content, 'Current Position') ||
    stateExtractField(content, 'Phase');
  const lastActivity = stateExtractField(content, 'Last activity') ||
    stateExtractField(content, 'Last Activity');
  const currentPhase = stateExtractField(content, 'Current Phase') ||
    stateExtractField(content, 'Phase');
  const currentPlan = stateExtractField(content, 'Current Plan') ||
    stateExtractField(content, 'Plan');
  const status = stateExtractField(content, 'Status');
  const progress = stateExtractField(content, 'Progress');

  // Extract decisions as bullet points
  const decisions: string[] = [];
  const decisionsMatch = content.match(/###?\s*Decisions\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
  if (decisionsMatch) {
    const items = decisionsMatch[1].match(/^-\s+(.+)$/gm) || [];
    for (const item of items) {
      decisions.push(item.replace(/^-\s+/, '').trim());
    }
  }

  // Extract blockers as bullet points
  const blockers: string[] = [];
  const blockersMatch = content.match(/###?\s*(?:Blockers|Blockers\/Concerns)\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
  if (blockersMatch) {
    const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
    for (const item of items) {
      blockers.push(item.replace(/^-\s+/, '').trim());
    }
  }

  return {
    position,
    lastActivity,
    currentPhase,
    currentPlan,
    status,
    progress,
    decisions,
    blockers,
    content,
  };
}

// ─── parsePhases ───────────────────────────────────────────────────────────

export function parsePhases(cwd: string): DashboardPhase[] {
  const phasesDir = path.join(cwd, '.planning', 'phases');

  if (!fs.existsSync(phasesDir)) {
    return [];
  }

  const phases: DashboardPhase[] = [];

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort((a, b) => comparePhaseNum(a, b));

    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
      const phaseNum = dm ? dm[1] : dir;
      const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';

      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
      const summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
      const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      let diskStatus: DashboardPhase['diskStatus'] = 'no_directory';
      if (planCount === 0 && summaryCount === 0) diskStatus = 'empty';
      else if (summaryCount >= planCount && planCount > 0) diskStatus = 'complete';
      else if (summaryCount > 0) diskStatus = 'partial';
      else if (planCount > 0) diskStatus = 'planned';
      else diskStatus = 'empty';

      phases.push({
        number: phaseNum,
        name: phaseName,
        goal: '',
        dependsOn: [],
        planCount,
        summaryCount,
        diskStatus,
        roadmapComplete: diskStatus === 'complete',
        hasContext,
        hasResearch,
      });
    }
  } catch {
    // phases dir may not exist or be empty
  }

  return phases;
}

// ─── parsePhaseDetail ──────────────────────────────────────────────────────

export function parsePhaseDetail(
  cwd: string,
  phaseId: string
): { plans: PlanFile[]; context: string | null; research: string | null } | null {
  const phasesDir = path.join(cwd, '.planning', 'phases');

  if (!fs.existsSync(phasesDir)) {
    return null;
  }

  const normalized = normalizePhaseName(phaseId);

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    const dirMatch = dirs.find(d => d.startsWith(normalized + '-') || d === normalized);

    if (!dirMatch) {
      return null;
    }

    const phaseDir = path.join(phasesDir, dirMatch);
    const phaseFiles = fs.readdirSync(phaseDir);

    // Parse plan files
    const planFileNames = phaseFiles
      .filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md')
      .sort();

    const plans: PlanFile[] = [];

    for (const planFileName of planFileNames) {
      const planPath = path.join(phaseDir, planFileName);
      const content = fs.readFileSync(planPath, 'utf-8');
      const frontmatter = extractFrontmatter(content) as Record<string, unknown>;

      // Parse tasks from XML-like <task> elements
      const tasks: PlanTask[] = [];
      const taskRegex = /<task\s+type="([^"]*)"[^>]*>\s*<name>([^<]+)<\/name>([\s\S]*?)<\/task>/g;
      let taskMatch: RegExpExecArray | null;

      while ((taskMatch = taskRegex.exec(content)) !== null) {
        const taskType = taskMatch[1];
        const taskName = taskMatch[2].trim();
        const taskBody = taskMatch[3];

        const filesMatch = taskBody.match(/<files>([\s\S]*?)<\/files>/);
        const actionMatch = taskBody.match(/<action>([\s\S]*?)<\/action>/);
        const verifyMatch = taskBody.match(/<verify>([\s\S]*?)<\/verify>/);
        const doneMatch = taskBody.match(/<done>([\s\S]*?)<\/done>/);

        const files = filesMatch
          ? filesMatch[1].trim().split('\n').map(f => f.trim()).filter(Boolean)
          : [];

        tasks.push({
          name: taskName,
          type: taskType,
          files,
          action: actionMatch ? actionMatch[1].trim() : '',
          verify: verifyMatch ? verifyMatch[1].trim() : '',
          done: doneMatch ? doneMatch[1].trim() : '',
          completed: false, // determined by SUMMARY existence check downstream
        });
      }

      plans.push({
        path: path.join('.planning', 'phases', dirMatch, planFileName),
        content,
        frontmatter,
        tasks,
      });
    }

    // Read context file
    let context: string | null = null;
    const contextFile = phaseFiles.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
    if (contextFile) {
      context = fs.readFileSync(path.join(phaseDir, contextFile), 'utf-8');
    }

    // Read research file
    let research: string | null = null;
    const researchFile = phaseFiles.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    if (researchFile) {
      research = fs.readFileSync(path.join(phaseDir, researchFile), 'utf-8');
    }

    return { plans, context, research };
  } catch {
    return null;
  }
}

// ─── parseTodos ────────────────────────────────────────────────────────────

export function parseTodos(cwd: string): { pending: TodoItem[]; completed: TodoItem[] } {
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  const completedDir = path.join(cwd, '.planning', 'todos', 'completed');

  const pending: TodoItem[] = [];
  const completed: TodoItem[] = [];

  // Read pending todos
  if (fs.existsSync(pendingDir)) {
    try {
      const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
          const titleMatch = content.match(/^title:\s*(.+)$/m);
          pending.push({
            text: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
            completed: false,
            file,
          });
        } catch {
          // skip unreadable files
        }
      }
    } catch {
      // pending dir may not exist
    }
  }

  // Read completed todos
  if (fs.existsSync(completedDir)) {
    try {
      const files = fs.readdirSync(completedDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(completedDir, file), 'utf-8');
          const titleMatch = content.match(/^title:\s*(.+)$/m);
          completed.push({
            text: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
            completed: true,
            file,
          });
        } catch {
          // skip unreadable files
        }
      }
    } catch {
      // completed dir may not exist
    }
  }

  return { pending, completed };
}

// ─── parseProject ──────────────────────────────────────────────────────────

export function parseProject(cwd: string): { project: string | null; requirements: string | null } {
  const projectPath = path.join(cwd, '.planning', 'PROJECT.md');
  const requirementsPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');

  let project: string | null = null;
  let requirements: string | null = null;

  if (fs.existsSync(projectPath)) {
    project = fs.readFileSync(projectPath, 'utf-8');
  }

  if (fs.existsSync(requirementsPath)) {
    requirements = fs.readFileSync(requirementsPath, 'utf-8');
  }

  return { project, requirements };
}
