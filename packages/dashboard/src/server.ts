import * as path from 'node:path';
import * as fs from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

import express, { type Request, type Response, type NextFunction } from 'express';
import sirv from 'sirv';
import { WebSocketServer, WebSocket } from 'ws';
import detectPort from 'detect-port';
import open from 'open';

import {
  normalizePhaseName,
  comparePhaseNum,
  getPhasePattern,
  extractFrontmatter,
  stateExtractField,
  stateReplaceField,
} from '@maxsim/core';

import type {
  RoadmapPhase,
  RoadmapMilestone,
  RoadmapAnalysis,
  PhaseStatus,
} from '@maxsim/core';

import { watch, type FSWatcher } from 'chokidar';
import { PtyManager } from './terminal/pty-manager';

// ─── Config ────────────────────────────────────────────────────────────────

const projectCwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();

// client/ folder is co-located with server.js in dist/
const clientDir = path.join(__dirname, 'client');

// ─── Types ─────────────────────────────────────────────────────────────────

interface DashboardPhase {
  number: string;
  name: string;
  goal: string;
  dependsOn: string[];
  planCount: number;
  summaryCount: number;
  diskStatus: 'complete' | 'partial' | 'planned' | 'empty' | 'no_directory';
  roadmapComplete: boolean;
  hasContext: boolean;
  hasResearch: boolean;
}

interface PlanTask {
  name: string;
  type: string;
  files: string[];
  action: string;
  verify: string;
  done: string;
  completed: boolean;
}

interface PlanFile {
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  tasks: PlanTask[];
}

interface TodoItem {
  text: string;
  completed: boolean;
  file: string;
}

// ─── Path security ─────────────────────────────────────────────────────────

function isWithinPlanning(cwd: string, targetPath: string): boolean {
  const planningDir = path.resolve(cwd, '.planning');
  const resolved = path.resolve(cwd, targetPath);
  return resolved.startsWith(planningDir);
}

// ─── Write-suppression for watcher loop prevention ─────────────────────────

const suppressedPaths = new Map<string, number>();
const SUPPRESS_TTL_MS = 500;

function suppressPath(filePath: string): void {
  suppressedPaths.set(normalizeFsPath(filePath), Date.now());
}

function isSuppressed(filePath: string): boolean {
  const normalized = normalizeFsPath(filePath);
  const timestamp = suppressedPaths.get(normalized);
  if (timestamp === undefined) return false;
  if (Date.now() - timestamp > SUPPRESS_TTL_MS) {
    suppressedPaths.delete(normalized);
    return false;
  }
  return true;
}

function normalizeFsPath(p: string): string {
  return p.replace(/\\/g, '/');
}

// ─── WebSocket ─────────────────────────────────────────────────────────────

let clientCount = 0;

function createWSS(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    clientCount++;
    console.error(`[ws] Client connected (${clientCount} total)`);

    ws.on('close', () => {
      clientCount--;
      console.error(`[ws] Client disconnected (${clientCount} total)`);
    });

    ws.on('error', (err) => {
      console.error('[ws] Client error:', err.message);
    });

    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  });

  return wss;
}

function broadcast(wss: WebSocketServer, message: Record<string, unknown>): void {
  const data = JSON.stringify(message);
  let sent = 0;
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent++;
    }
  }
  if (sent > 0) {
    console.error(`[ws] Broadcast to ${sent} client(s)`);
  }
}

// ─── Chokidar Watcher ──────────────────────────────────────────────────────

function setupWatcher(cwd: string, wss: WebSocketServer): FSWatcher {
  const planningDir = normalizeFsPath(`${cwd}/.planning`);
  console.error(`[watcher] Watching ${planningDir}`);

  const watcher = watch(planningDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    depth: 5,
  });

  let changedPaths = new Set<string>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onFileChange(filePath: string): void {
    const normalized = normalizeFsPath(filePath);
    if (isSuppressed(normalized)) {
      console.error(`[watcher] Suppressed: ${normalized}`);
      return;
    }
    changedPaths.add(normalized);
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (changedPaths.size > 0) {
        const changes = Array.from(changedPaths);
        changedPaths = new Set();
        console.error(`[watcher] Broadcasting ${changes.length} change(s)`);
        broadcast(wss, { type: 'file-changes', changes, timestamp: Date.now() });
      }
      debounceTimer = null;
    }, 200);
  }

  watcher.on('add', onFileChange);
  watcher.on('change', onFileChange);
  watcher.on('unlink', onFileChange);
  watcher.on('error', (err: unknown) => {
    console.error('[watcher] Error:', (err as Error).message);
  });

  return watcher;
}

// ─── Parsers ───────────────────────────────────────────────────────────────

function parseRoadmap(cwd: string): RoadmapAnalysis | null {
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return null;

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

    const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
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

  const milestones: RoadmapMilestone[] = [];
  const milestonePattern = /##\s*(.*v(\d+\.\d+)[^(\n]*)/gi;
  let mMatch: RegExpExecArray | null;
  while ((mMatch = milestonePattern.exec(content)) !== null) {
    milestones.push({ heading: mMatch[1].trim(), version: 'v' + mMatch[2] });
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

interface ParsedState {
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

function parseState(cwd: string): ParsedState | null {
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  if (!fs.existsSync(statePath)) return null;

  const content = fs.readFileSync(statePath, 'utf-8');

  const position = stateExtractField(content, 'Current Position') || stateExtractField(content, 'Phase');
  const lastActivity = stateExtractField(content, 'Last activity') || stateExtractField(content, 'Last Activity');
  const currentPhase = stateExtractField(content, 'Current Phase') || stateExtractField(content, 'Phase');
  const currentPlan = stateExtractField(content, 'Current Plan') || stateExtractField(content, 'Plan');
  const status = stateExtractField(content, 'Status');
  const progress = stateExtractField(content, 'Progress');

  const decisions: string[] = [];
  const decisionsMatch = content.match(/###?\s*Decisions\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
  if (decisionsMatch) {
    const items = decisionsMatch[1].match(/^-\s+(.+)$/gm) || [];
    for (const item of items) decisions.push(item.replace(/^-\s+/, '').trim());
  }

  const blockers: string[] = [];
  const blockersMatch = content.match(/###?\s*(?:Blockers|Blockers\/Concerns)\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
  if (blockersMatch) {
    const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
    for (const item of items) blockers.push(item.replace(/^-\s+/, '').trim());
  }

  return { position, lastActivity, currentPhase, currentPlan, status, progress, decisions, blockers, content };
}

function parsePhases(cwd: string): DashboardPhase[] {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) return [];

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

function parsePhaseDetail(
  cwd: string,
  phaseId: string
): { plans: PlanFile[]; context: string | null; research: string | null } | null {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) return null;

  const normalized = normalizePhaseName(phaseId);
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    const dirMatch = dirs.find(d => d.startsWith(normalized + '-') || d === normalized);
    if (!dirMatch) return null;

    const phaseDir = path.join(phasesDir, dirMatch);
    const phaseFiles = fs.readdirSync(phaseDir);

    const planFileNames = phaseFiles
      .filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md')
      .sort();

    const plans: PlanFile[] = [];
    for (const planFileName of planFileNames) {
      const planPath = path.join(phaseDir, planFileName);
      const content = fs.readFileSync(planPath, 'utf-8');
      const frontmatter = extractFrontmatter(content) as Record<string, unknown>;

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
          completed: false,
        });
      }

      plans.push({
        path: path.join('.planning', 'phases', dirMatch, planFileName),
        content,
        frontmatter,
        tasks,
      });
    }

    let context: string | null = null;
    const contextFile = phaseFiles.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
    if (contextFile) context = fs.readFileSync(path.join(phaseDir, contextFile), 'utf-8');

    let research: string | null = null;
    const researchFile = phaseFiles.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    if (researchFile) research = fs.readFileSync(path.join(phaseDir, researchFile), 'utf-8');

    return { plans, context, research };
  } catch {
    return null;
  }
}

function parseTodos(cwd: string): { pending: TodoItem[]; completed: TodoItem[] } {
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  const completedDir = path.join(cwd, '.planning', 'todos', 'completed');

  const pending: TodoItem[] = [];
  const completed: TodoItem[] = [];

  if (fs.existsSync(pendingDir)) {
    try {
      const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
          const titleMatch = content.match(/^title:\s*(.+)$/m);
          pending.push({ text: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''), completed: false, file });
        } catch { /* skip unreadable */ }
      }
    } catch { /* pending dir may not exist */ }
  }

  if (fs.existsSync(completedDir)) {
    try {
      const files = fs.readdirSync(completedDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(completedDir, file), 'utf-8');
          const titleMatch = content.match(/^title:\s*(.+)$/m);
          completed.push({ text: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''), completed: true, file });
        } catch { /* skip unreadable */ }
      }
    } catch { /* completed dir may not exist */ }
  }

  return { pending, completed };
}

function parseProject(cwd: string): { project: string | null; requirements: string | null } {
  const projectPath = path.join(cwd, '.planning', 'PROJECT.md');
  const requirementsPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');
  const project = fs.existsSync(projectPath) ? fs.readFileSync(projectPath, 'utf-8') : null;
  const requirements = fs.existsSync(requirementsPath) ? fs.readFileSync(requirementsPath, 'utf-8') : null;
  return { project, requirements };
}

// ─── Express App ───────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// ── Health ──
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    port: process.env.PORT || 3333,
    cwd: projectCwd,
    uptime: process.uptime(),
  });
});

// ── Roadmap ──
app.get('/api/roadmap', (_req: Request, res: Response) => {
  const data = parseRoadmap(projectCwd);
  if (!data) return res.status(404).json({ error: 'ROADMAP.md not found' });
  return res.json(data);
});

// ── State ──
app.get('/api/state', (_req: Request, res: Response) => {
  const data = parseState(projectCwd);
  if (!data) return res.status(404).json({ error: 'STATE.md not found' });
  return res.json(data);
});

app.patch('/api/state', (req: Request, res: Response) => {
  const statePath = path.join(projectCwd, '.planning', 'STATE.md');
  if (!fs.existsSync(statePath)) return res.status(404).json({ error: 'STATE.md not found' });

  if (!isWithinPlanning(projectCwd, '.planning/STATE.md')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const { field, value } = req.body as { field?: string; value?: string };
  if (!field || value === undefined) {
    return res.status(400).json({ error: 'field and value are required' });
  }

  const content = fs.readFileSync(statePath, 'utf-8');
  const updated = stateReplaceField(content, field, value);
  if (!updated) return res.status(404).json({ error: `Field "${field}" not found in STATE.md` });

  suppressPath(statePath);
  fs.writeFileSync(statePath, updated, 'utf-8');
  return res.json({ updated: true, field });
});

// ── Phases ──
app.get('/api/phases', (_req: Request, res: Response) => {
  const phases = parsePhases(projectCwd);
  return res.json(phases);
});

// ── Phase detail ──
app.get('/api/phase/:id', (req: Request, res: Response) => {
  const phaseId = req.params.id;
  const data = parsePhaseDetail(projectCwd, phaseId);
  if (!data) return res.status(404).json({ error: `Phase ${phaseId} not found` });
  return res.json(data);
});

// ── Todos ──
app.get('/api/todos', (_req: Request, res: Response) => {
  const data = parseTodos(projectCwd);
  return res.json(data);
});

app.post('/api/todos', (req: Request, res: Response) => {
  const pendingDir = path.join(projectCwd, '.planning', 'todos', 'pending');
  const { text } = req.body as { text?: string };

  if (!text) return res.status(400).json({ error: 'text is required' });

  fs.mkdirSync(pendingDir, { recursive: true });

  const timestamp = new Date().toISOString().split('T')[0];
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const filename = `${timestamp}-${slug}.md`;
  const filePath = path.join(pendingDir, filename);
  const content = `title: ${text}\ncreated: ${timestamp}\narea: general\n\n${text}\n`;

  suppressPath(filePath);
  fs.writeFileSync(filePath, content, 'utf-8');

  return res.json({ created: true, file: filename, text });
});

app.patch('/api/todos', (req: Request, res: Response) => {
  const pendingDir = path.join(projectCwd, '.planning', 'todos', 'pending');
  const completedDir = path.join(projectCwd, '.planning', 'todos', 'completed');
  const { file, completed } = req.body as { file?: string; completed?: boolean };

  if (!file) return res.status(400).json({ error: 'file is required' });
  if (file.includes('/') || file.includes('\\') || file.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (completed) {
    const sourcePath = path.join(pendingDir, file);
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Todo not found in pending' });
    if (!isWithinPlanning(projectCwd, path.relative(projectCwd, sourcePath))) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    fs.mkdirSync(completedDir, { recursive: true });
    const today = new Date().toISOString().split('T')[0];
    let content = fs.readFileSync(sourcePath, 'utf-8');
    content = `completed: ${today}\n` + content;
    const destPath = path.join(completedDir, file);

    suppressPath(sourcePath);
    suppressPath(destPath);
    fs.writeFileSync(destPath, content, 'utf-8');
    fs.unlinkSync(sourcePath);

    return res.json({ completed: true, file, date: today });
  } else {
    const sourcePath = path.join(completedDir, file);
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Todo not found in completed' });
    if (!isWithinPlanning(projectCwd, path.relative(projectCwd, sourcePath))) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    fs.mkdirSync(pendingDir, { recursive: true });
    let content = fs.readFileSync(sourcePath, 'utf-8');
    content = content.replace(/^completed:\s*.+\n/m, '');
    const destPath = path.join(pendingDir, file);

    suppressPath(sourcePath);
    suppressPath(destPath);
    fs.writeFileSync(destPath, content, 'utf-8');
    fs.unlinkSync(sourcePath);

    return res.json({ completed: false, file });
  }
});

// ── Project ──
app.get('/api/project', (_req: Request, res: Response) => {
  const data = parseProject(projectCwd);
  return res.json(data);
});

// ── Plan file ──
app.get('/api/plan/*', (req: Request, res: Response) => {
  const pathSegments = (req.params as Record<string, string>)['0'].split('/');
  const relativePath = path.join('.planning', ...pathSegments);

  if (!isWithinPlanning(projectCwd, relativePath)) {
    return res.status(403).json({ error: 'Path traversal not allowed' });
  }

  const fullPath = path.join(projectCwd, relativePath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return res.json({ path: relativePath, content });
  } catch {
    return res.status(500).json({ error: 'Failed to read file' });
  }
});

app.put('/api/plan/*', (req: Request, res: Response) => {
  const pathSegments = (req.params as Record<string, string>)['0'].split('/');
  const relativePath = path.join('.planning', ...pathSegments);

  if (!isWithinPlanning(projectCwd, relativePath)) {
    return res.status(403).json({ error: 'Path traversal not allowed' });
  }

  const { content } = req.body as { content?: string };
  if (content === undefined) return res.status(400).json({ error: 'content is required' });

  const fullPath = path.join(projectCwd, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  suppressPath(fullPath);
  fs.writeFileSync(fullPath, content, 'utf-8');

  return res.json({ written: true, path: relativePath });
});

// ── Static client (Vite build) ──
if (fs.existsSync(clientDir)) {
  app.use(sirv(clientDir, { single: true }));
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send('<html><body><p>Dashboard client not found. Run <code>pnpm run build</code> first.</p></body></html>');
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const wss = createWSS();
  const terminalWss = new WebSocketServer({ noServer: true });
  const ptyManager = PtyManager.getInstance();

  if (!ptyManager.isAvailable()) {
    console.error('[server] node-pty not available — terminal features disabled');
  }

  // Terminal WebSocket connections
  terminalWss.on('connection', (ws: WebSocket) => {
    ptyManager.addClient(ws);

    if (!ptyManager.isAvailable()) {
      ws.send(JSON.stringify({ type: 'unavailable', reason: 'node-pty is not installed — terminal features disabled' }));
    }

    ws.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
        switch (msg.type) {
          case 'input':
            ptyManager.write(msg.data);
            break;
          case 'resize':
            ptyManager.resize(msg.cols, msg.rows);
            break;
          case 'spawn':
            ptyManager.spawn({
              skipPermissions: !!msg.skipPermissions,
              cwd: projectCwd,
              cols: msg.cols,
              rows: msg.rows,
            });
            break;
          case 'kill':
            ptyManager.kill();
            break;
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      ptyManager.removeClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[terminal-ws] Client error:', err.message);
    });
  });

  const server = createServer(app);

  // WebSocket upgrade routing: /api/ws for dashboard, /ws/terminal for PTY
  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = req.url || '/';
    if (url === '/ws/terminal' || url.startsWith('/ws/terminal?')) {
      terminalWss.handleUpgrade(req, socket, head, (ws) => {
        terminalWss.emit('connection', ws, req);
      });
    } else if (url === '/api/ws' || url.startsWith('/api/ws?')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  // Start file watcher
  let watcher: FSWatcher | undefined;
  try {
    watcher = setupWatcher(projectCwd, wss);
  } catch (err) {
    console.error('[server] Failed to start file watcher:', (err as Error).message);
  }

  const port = await detectPort(3333);
  const url = `http://localhost:${port}`;

  server.listen(port, () => {
    console.error(`Dashboard ready at ${url}`);
    open(url).catch(() => {});
  });

  function shutdown(): void {
    console.error('\n[server] Shutting down...');
    ptyManager.kill();
    if (watcher) watcher.close().catch(() => {});
    terminalWss.close(() => {});
    wss.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });
    setTimeout(() => {
      console.error('[server] Forced exit after timeout');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', () => {
    ptyManager.kill();
  });
}

main().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
