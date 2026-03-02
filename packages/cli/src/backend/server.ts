/**
 * MAXSIM Backend Server — Unified persistent backend service
 *
 * Consolidates HTTP API, WebSocket, MCP endpoint, terminal management,
 * and file watching into a single per-project process.
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout directly — stdout may be reserved for protocol use.
 * All logging must go to stderr via console.error().
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

import express, { type Request, type Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import detectPort from 'detect-port';

import {
  normalizePhaseName,
  comparePhaseNum,
  getPhasePattern,
  extractFrontmatter,
  stateExtractField,
  stateReplaceField,
} from '../core/index.js';

import type {
  RoadmapPhase,
  RoadmapMilestone,
  RoadmapAnalysis,
  PhaseStatus,
} from '../core/index.js';

import { registerAllTools } from '../mcp/index.js';
import { PtyManager } from './terminal.js';

import type {
  BackendConfig,
  BackendStatus,
  BackendServer,
  PendingQuestion,
} from './types.js';

// ─── Logging ──────────────────────────────────────────────────────────────

function log(level: 'INFO' | 'WARN' | 'ERROR', tag: string, ...args: unknown[]): void {
  const ts = new Date().toISOString();
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  console.error(`[${ts}] [${level}] [${tag}] ${msg}`);
}

// ─── Path security ─────────────────────────────────────────────────────────

function isWithinPlanning(cwd: string, targetPath: string): boolean {
  const planningDir = path.resolve(cwd, '.planning');
  const resolved = path.resolve(cwd, targetPath);
  return resolved.startsWith(planningDir);
}

// ─── Write-suppression for watcher loop prevention ─────────────────────────

function normalizeFsPath(p: string): string {
  return p.replace(/\\/g, '/');
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface DashboardPhase {
  number: string;
  name: string;
  goal: string;
  dependsOn: string[];
  planCount: number;
  summaryCount: number;
  diskStatus: 'complete' | 'partial' | 'planned' | 'discussed' | 'researched' | 'empty' | 'no_directory';
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

// ─── Parsers ───────────────────────────────────────────────────────────────

function parseRoadmap(cwd: string): RoadmapAnalysis | null {
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return null;

  const content = fs.readFileSync(roadmapPath, 'utf-8').replace(/\r\n/g, '\n');
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

function parseState(cwd: string): ParsedState | null {
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  if (!fs.existsSync(statePath)) return null;

  const content = fs.readFileSync(statePath, 'utf-8').replace(/\r\n/g, '\n');

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
      if (summaryCount >= planCount && planCount > 0) diskStatus = 'complete';
      else if (summaryCount > 0) diskStatus = 'partial';
      else if (planCount > 0) diskStatus = 'planned';
      else if (hasResearch) diskStatus = 'researched';
      else if (hasContext) diskStatus = 'discussed';
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
      const content = fs.readFileSync(planPath, 'utf-8').replace(/\r\n/g, '\n');
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

        const doneText = doneMatch ? doneMatch[1].trim() : '';
        tasks.push({
          name: taskName,
          type: taskType,
          files,
          action: actionMatch ? actionMatch[1].trim() : '',
          verify: verifyMatch ? verifyMatch[1].trim() : '',
          done: doneText,
          completed: /^\[x\]/i.test(doneText),
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

// ─── Server Factory ────────────────────────────────────────────────────────

export function createBackendServer(config: BackendConfig): BackendServer {
  const {
    projectCwd,
    host,
    enableTerminal,
    enableFileWatcher,
    enableMcp,
    logDir,
  } = config;

  let resolvedPort = config.port;
  const startTime = Date.now();
  let serverReady = false;

  // Logging
  fs.mkdirSync(logDir, { recursive: true });

  // ─── Write suppression ─────────────────────────────────────────────────
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

  // Periodic cleanup of stale suppressed paths
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [p, ts] of suppressedPaths.entries()) {
      if (now - ts > SUPPRESS_TTL_MS) suppressedPaths.delete(p);
    }
  }, 60_000);
  cleanupInterval.unref();

  // ─── MCP shared state ──────────────────────────────────────────────────
  const questionQueue: PendingQuestion[] = [];
  const pendingAnswers = new Map<string, (answer: string) => void>();

  // ─── WebSocket ─────────────────────────────────────────────────────────
  let clientCount = 0;

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    clientCount++;
    log('INFO', 'ws', `Client connected (${clientCount} total)`);

    ws.on('close', () => {
      clientCount--;
      log('INFO', 'ws', `Client disconnected (${clientCount} total)`);
    });

    ws.on('error', (err) => {
      log('ERROR', 'ws', `Client error: ${err.message}`);
    });

    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));

    // Send queued questions on reconnect
    if (questionQueue.length > 0) {
      ws.send(JSON.stringify({
        type: 'questions-queued',
        questions: questionQueue,
        count: questionQueue.length,
      }));
    }
  });

  function broadcast(message: Record<string, unknown>): void {
    const data = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // ─── File watcher ──────────────────────────────────────────────────────
  let watcher: { close(): Promise<void> } | null = null;

  async function setupWatcher(): Promise<void> {
    if (!enableFileWatcher) return;

    const planningDir = path.join(projectCwd, '.planning');
    if (!fs.existsSync(planningDir)) {
      log('WARN', 'watcher', `.planning/ directory not found at ${planningDir}`);
      return;
    }

    try {
      const chokidar = await import('chokidar');
      const changedPaths = new Set<string>();
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      function flushChanges(): void {
        if (changedPaths.size > 0) {
          const changes = Array.from(changedPaths);
          changedPaths.clear();
          log('INFO', 'watcher', `Broadcasting ${changes.length} change(s)`);
          broadcast({ type: 'file-changes', changes, timestamp: Date.now() });
        }
      }

      function onFileChange(filePath: string): void {
        const normalized = normalizeFsPath(filePath);
        if (isSuppressed(normalized)) return;
        changedPaths.add(normalized);
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flushChanges, 500);
      }

      const w = chokidar.watch(planningDir, {
        persistent: true,
        ignoreInitial: true,
        depth: 5,
      });

      w.on('add', onFileChange);
      w.on('change', onFileChange);
      w.on('unlink', onFileChange);
      w.on('error', (err: unknown) => {
        log('ERROR', 'watcher', `Error: ${(err as Error).message}`);
      });

      watcher = w;
      log('INFO', 'watcher', `Watching ${planningDir}`);
    } catch (err) {
      log('ERROR', 'watcher', `Failed to start file watcher: ${(err as Error).message}`);
    }
  }

  // ─── Express app ───────────────────────────────────────────────────────
  const app = express();
  app.use(express.json());

  // ── Health ──
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok' as const,
      ready: serverReady,
      port: resolvedPort,
      cwd: projectCwd,
      uptime: (Date.now() - startTime) / 1000,
      pid: process.pid,
      mcpEndpoint: enableMcp ? `http://127.0.0.1:${resolvedPort}/mcp` : null,
      terminalAvailable: enableTerminal && PtyManager.getInstance().isAvailable(),
      connectedClients: clientCount,
    });
  });

  app.get('/api/ready', (_req: Request, res: Response) => {
    if (serverReady) {
      return res.json({ ready: true, port: resolvedPort, cwd: projectCwd });
    }
    return res.status(503).json({ ready: false, message: 'Server is starting up' });
  });

  // ── Roadmap ──
  app.get('/api/roadmap', (_req: Request, res: Response) => {
    try {
      const data = parseRoadmap(projectCwd);
      if (!data) return res.status(404).json({ error: 'ROADMAP.md not found' });
      return res.json(data);
    } catch (err) {
      log('ERROR', 'api', `GET /api/roadmap failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/roadmap', (req: Request, res: Response) => {
    try {
      const roadmapPath = path.join(projectCwd, '.planning', 'ROADMAP.md');
      if (!fs.existsSync(roadmapPath)) return res.status(404).json({ error: 'ROADMAP.md not found' });

      const { phaseNumber, checked } = req.body as { phaseNumber?: string; checked?: boolean };
      if (!phaseNumber || checked === undefined) {
        return res.status(400).json({ error: 'phaseNumber and checked are required' });
      }

      let content = fs.readFileSync(roadmapPath, 'utf-8').replace(/\r\n/g, '\n');
      const escapedNum = phaseNumber.replace('.', '\\.');
      const pattern = new RegExp(`(-\\s*\\[)(x| )(\\]\\s*.*Phase\\s+${escapedNum})`, 'i');
      const match = content.match(pattern);

      if (!match) return res.status(404).json({ error: `Phase ${phaseNumber} checkbox not found` });

      content = content.replace(pattern, `$1${checked ? 'x' : ' '}$3`);
      suppressPath(roadmapPath);
      fs.writeFileSync(roadmapPath, content, 'utf-8');
      return res.json({ updated: true, phaseNumber, checked });
    } catch (err) {
      log('ERROR', 'api', `PATCH /api/roadmap failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── State ──
  app.get('/api/state', (_req: Request, res: Response) => {
    try {
      const data = parseState(projectCwd);
      if (!data) return res.status(404).json({ error: 'STATE.md not found' });
      return res.json(data);
    } catch (err) {
      log('ERROR', 'api', `GET /api/state failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/state', (req: Request, res: Response) => {
    try {
      const statePath = path.join(projectCwd, '.planning', 'STATE.md');
      if (!fs.existsSync(statePath)) return res.status(404).json({ error: 'STATE.md not found' });

      const { field, value } = req.body as { field?: string; value?: string };
      if (!field || value === undefined) {
        return res.status(400).json({ error: 'field and value are required' });
      }

      const content = fs.readFileSync(statePath, 'utf-8').replace(/\r\n/g, '\n');
      const updated = stateReplaceField(content, field, value);
      if (!updated) return res.status(404).json({ error: `Field "${field}" not found in STATE.md` });

      suppressPath(statePath);
      fs.writeFileSync(statePath, updated, 'utf-8');
      return res.json({ updated: true, field });
    } catch (err) {
      log('ERROR', 'api', `PATCH /api/state failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper: ensure STATE.md exists
  function ensureStateMd(statePath: string): void {
    if (fs.existsSync(statePath)) return;
    const planningDir = path.dirname(statePath);
    fs.mkdirSync(planningDir, { recursive: true });
    const template = `# Project State

## Current Position

Phase: 1
Status: In progress
Last activity: ${new Date().toISOString().split('T')[0]} — State file created

## Accumulated Context

### Decisions

None yet.

### Blockers/Concerns

None yet.
`;
    fs.writeFileSync(statePath, template, 'utf-8');
  }

  // Helper: append to a STATE.md section
  function appendToStateSection(
    statePath: string,
    sectionPattern: RegExp,
    entry: string,
    fallbackSection: string,
  ): void {
    let content = fs.readFileSync(statePath, 'utf-8').replace(/\r\n/g, '\n');
    const match = content.match(sectionPattern);

    if (match) {
      let sectionBody = match[2];
      sectionBody = sectionBody
        .replace(/None yet\.?\s*\n?/gi, '')
        .replace(/No decisions yet\.?\s*\n?/gi, '')
        .replace(/None\.?\s*\n?/gi, '');
      sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
      content = content.replace(sectionPattern, (_m, header: string) => `${header}${sectionBody}`);
    } else {
      content = content.trimEnd() + '\n\n' + fallbackSection + '\n' + entry + '\n';
    }

    suppressPath(statePath);
    fs.writeFileSync(statePath, content, 'utf-8');
  }

  // ── Add Decision ──
  app.post('/api/state/decision', (req: Request, res: Response) => {
    try {
      const statePath = path.join(projectCwd, '.planning', 'STATE.md');
      ensureStateMd(statePath);

      const { phase, text } = req.body as { phase?: string; text?: string };
      if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

      const phaseLabel = phase?.trim() || '?';
      const entry = `- [Phase ${phaseLabel}]: ${text.trim()}`;
      const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;

      appendToStateSection(statePath, sectionPattern, entry, '### Decisions');
      return res.json({ added: true, decision: entry });
    } catch (err) {
      log('ERROR', 'api', `POST /api/state/decision failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Add Blocker ──
  app.post('/api/state/blocker', (req: Request, res: Response) => {
    try {
      const statePath = path.join(projectCwd, '.planning', 'STATE.md');
      ensureStateMd(statePath);

      const { text } = req.body as { text?: string };
      if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

      const entry = `- ${text.trim()}`;
      const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;

      appendToStateSection(statePath, sectionPattern, entry, '### Blockers/Concerns');
      return res.json({ added: true, blocker: text.trim() });
    } catch (err) {
      log('ERROR', 'api', `POST /api/state/blocker failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Phases ──
  app.get('/api/phases', (_req: Request, res: Response) => {
    try {
      return res.json(parsePhases(projectCwd));
    } catch (err) {
      log('ERROR', 'api', `GET /api/phases failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/phase/:id', (req: Request, res: Response) => {
    try {
      const data = parsePhaseDetail(projectCwd, req.params.id);
      if (!data) return res.status(404).json({ error: `Phase ${req.params.id} not found` });
      return res.json(data);
    } catch (err) {
      log('ERROR', 'api', `GET /api/phase/:id failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Todos ──
  app.get('/api/todos', (_req: Request, res: Response) => {
    try {
      return res.json(parseTodos(projectCwd));
    } catch (err) {
      log('ERROR', 'api', `GET /api/todos failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/todos', (req: Request, res: Response) => {
    try {
      const pendingDir = path.join(projectCwd, '.planning', 'todos', 'pending');
      const { text } = req.body as { text?: string };
      if (!text) return res.status(400).json({ error: 'text is required' });

      fs.mkdirSync(pendingDir, { recursive: true });

      const timestamp = new Date().toISOString().split('T')[0];
      const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      const filename = `${timestamp}-${slug}.md`;
      const filePath = path.join(pendingDir, filename);
      const content = `title: ${text}\ncreated: ${timestamp}\narea: general\n\n${text}\n`;

      suppressPath(filePath);
      fs.writeFileSync(filePath, content, 'utf-8');

      return res.json({ created: true, file: filename, text });
    } catch (err) {
      log('ERROR', 'api', `POST /api/todos failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/todos', (req: Request, res: Response) => {
    try {
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
    } catch (err) {
      log('ERROR', 'api', `PATCH /api/todos failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Project ──
  app.get('/api/project', (_req: Request, res: Response) => {
    try {
      return res.json(parseProject(projectCwd));
    } catch (err) {
      log('ERROR', 'api', `GET /api/project failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Plan file (read) ──
  app.get('/api/plan/*', (req: Request, res: Response) => {
    try {
      const pathSegments = (req.params as Record<string, string>)['0'].split('/');
      const relativePath = path.join('.planning', ...pathSegments);

      if (!isWithinPlanning(projectCwd, relativePath)) {
        return res.status(403).json({ error: 'Path traversal not allowed' });
      }

      const fullPath = path.join(projectCwd, relativePath);
      if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

      const content = fs.readFileSync(fullPath, 'utf-8');
      return res.json({ path: relativePath, content });
    } catch (err) {
      log('ERROR', 'api', `GET /api/plan/* failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Plan file (write) ──
  app.put('/api/plan/*', (req: Request, res: Response) => {
    try {
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
    } catch (err) {
      log('ERROR', 'api', `PUT /api/plan/* failed: ${(err as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Server info ──
  app.get('/api/server-info', (_req: Request, res: Response) => {
    const localNetworkIp = getLocalNetworkIp();
    return res.json({
      localUrl: `http://127.0.0.1:${resolvedPort}`,
      networkUrl: localNetworkIp ? `http://${localNetworkIp}:${resolvedPort}` : null,
      projectName: path.basename(projectCwd),
      projectCwd,
    });
  });

  // ── Shutdown ──
  let shutdownFn: (() => void) | null = null;

  app.post('/api/shutdown', (_req: Request, res: Response) => {
    res.json({ shutdown: true });
    setTimeout(() => shutdownFn?.(), 100);
  });

  // ── MCP answer ──
  app.post('/api/mcp-answer', (req: Request, res: Response) => {
    const { questionId, answer } = req.body as { questionId: string; answer: string };
    if (!questionId || !answer) return res.status(400).json({ error: 'questionId and answer are required' });
    const resolve = pendingAnswers.get(questionId);
    if (!resolve) return res.status(404).json({ error: 'No pending question with that ID' });
    pendingAnswers.delete(questionId);
    resolve(answer);
    return res.json({ answered: true });
  });

  // ── MCP endpoint ──
  if (enableMcp) {
    app.post('/mcp', async (req: Request, res: Response) => {
      const mcpServer = new McpServer({ name: 'maxsim-backend', version: '1.0.0' });
      registerAllTools(mcpServer);
      try {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
          transport.close();
          mcpServer.close();
        });
      } catch (error) {
        log('ERROR', 'mcp', `Error handling MCP POST request: ${error}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          });
        }
      }
    });

    app.get('/mcp', (_req: Request, res: Response) => {
      res.writeHead(405).end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
      }));
    });

    app.delete('/mcp', (_req: Request, res: Response) => {
      res.status(200).end();
    });
  }

  // ─── Terminal WebSocket ────────────────────────────────────────────────
  const terminalWss = new WebSocketServer({ noServer: true });
  const ptyManager = enableTerminal ? PtyManager.getInstance() : null;

  if (ptyManager && !ptyManager.isAvailable()) {
    log('WARN', 'server', 'node-pty not available — terminal features disabled');
  }

  terminalWss.on('connection', (ws: WebSocket) => {
    if (!ptyManager) return;
    log('INFO', 'terminal-ws', 'Client connected');
    ptyManager.addClient(ws);

    if (!ptyManager.isAvailable()) {
      ws.send(JSON.stringify({ type: 'unavailable', reason: 'node-pty is not installed' }));
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
            try {
              ptyManager.spawn({
                skipPermissions: !!msg.skipPermissions,
                cwd: projectCwd,
                cols: msg.cols,
                rows: msg.rows,
              });
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              ws.send(JSON.stringify({ type: 'output', data: `\r\n\x1b[31mFailed to start terminal: ${errMsg}\x1b[0m\r\n` }));
            }
            break;
          case 'kill':
            ptyManager.kill();
            break;
        }
      } catch (err) {
        log('ERROR', 'terminal-ws', `Message handling error: ${(err as Error).message}`);
      }
    });

    ws.on('close', () => {
      log('INFO', 'terminal-ws', 'Client disconnected');
      ptyManager.removeClient(ws);
    });

    ws.on('error', (err) => {
      log('ERROR', 'terminal-ws', `Client error: ${err.message}`);
    });
  });

  // ─── HTTP Server ───────────────────────────────────────────────────────
  const server = createServer(app);

  // WebSocket upgrade routing
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

  // ─── Lifecycle methods ─────────────────────────────────────────────────

  async function start(): Promise<void> {
    const port = await detectPort(config.port);
    resolvedPort = port;

    await setupWatcher();

    return new Promise<void>((resolve) => {
      server.listen(port, host, () => {
        serverReady = true;
        log('INFO', 'server', `Backend ready on ${host}:${port} for ${projectCwd}`);
        if (enableMcp) {
          log('INFO', 'mcp', `MCP endpoint available at http://127.0.0.1:${port}/mcp`);
        }
        resolve();
      });
    });
  }

  async function stop(): Promise<void> {
    log('INFO', 'server', 'Shutting down...');
    clearInterval(cleanupInterval);

    if (ptyManager) {
      ptyManager.kill();
    }

    if (watcher) {
      await watcher.close().catch(() => {});
    }

    terminalWss.close(() => {});
    wss.close(() => {});

    return new Promise<void>((resolve) => {
      server.close(() => {
        log('INFO', 'server', 'Server closed');
        resolve();
      });
    });
  }

  shutdownFn = () => {
    stop().then(() => process.exit(0)).catch(() => process.exit(1));
  };

  function getStatus(): BackendStatus {
    return {
      status: serverReady ? 'ok' : 'starting',
      ready: serverReady,
      port: resolvedPort,
      cwd: projectCwd,
      uptime: (Date.now() - startTime) / 1000,
      pid: process.pid,
      mcpEndpoint: enableMcp ? `http://127.0.0.1:${resolvedPort}/mcp` : null,
      terminalAvailable: ptyManager?.isAvailable() ?? false,
      connectedClients: clientCount,
    };
  }

  function getPort(): number {
    return resolvedPort;
  }

  return { start, stop, getStatus, getPort };
}

// ─── Utility ────────────────────────────────────────────────────────────────

function getLocalNetworkIp(): string | null {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const info of iface ?? []) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return null;
}
