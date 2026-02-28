import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
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
import debounce from 'lodash.debounce';
import slugify from 'slugify';
import { PtyManager } from './terminal/pty-manager';

// ─── Logging ──────────────────────────────────────────────────────────────

const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, `dashboard-${new Date().toISOString().slice(0, 10)}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(level: 'INFO' | 'WARN' | 'ERROR', tag: string, ...args: unknown[]): void {
  const ts = new Date().toISOString();
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  const line = `[${ts}] [${level}] [${tag}] ${msg}\n`;
  logStream.write(line);
  if (level === 'ERROR') {
    console.error(`[${tag}]`, ...args);
  }
}

// ─── Config ────────────────────────────────────────────────────────────────

const projectCwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();
const networkMode = process.env.MAXSIM_NETWORK_MODE === '1';
// Port is resolved in main() and set here so /api/server-info can read it before listen completes
let resolvedPort = 3333;

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

function getTailscaleIp(): string | null {
  const ifaces = os.networkInterfaces();
  for (const [name, iface] of Object.entries(ifaces)) {
    const isTailscaleIface =
      name === 'Tailscale' ||
      name === 'tailscale0' ||
      name.toLowerCase().includes('tailscale');
    for (const info of iface ?? []) {
      if (info.family !== 'IPv4') continue;
      const parts = info.address.split('.').map(Number);
      // Tailscale CGNAT range: 100.64.0.0/10 → 100.64.x.x – 100.127.x.x
      const isTailscaleRange = parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
      if (isTailscaleIface || isTailscaleRange) return info.address;
    }
  }
  return null;
}

// Always detect both IPs — binding decision and server-info depend on them
const tailscaleIp = getTailscaleIp();
// Exclude Tailscale range from LAN IP so both show independently
function getLanIp(): string | null {
  const ifaces = os.networkInterfaces();
  for (const [name, iface] of Object.entries(ifaces)) {
    const isTailscaleIface =
      name === 'Tailscale' ||
      name === 'tailscale0' ||
      name.toLowerCase().includes('tailscale');
    for (const info of iface ?? []) {
      if (info.family !== 'IPv4' || info.internal || isTailscaleIface) continue;
      const parts = info.address.split('.').map(Number);
      const isTailscaleRange = parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
      if (!isTailscaleRange) return info.address;
    }
  }
  return null;
}
// LAN IP is shown whenever the server is network-accessible (networkMode OR tailscale active)
const localNetworkIp = (networkMode || tailscaleIp !== null) ? getLanIp() : null;

log('INFO', 'server', `Starting dashboard server, projectCwd=${projectCwd}, networkMode=${networkMode}`);

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

function createWSS(onClientCountChange?: (count: number) => void): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    clientCount++;
    console.error(`[ws] Client connected (${clientCount} total)`);
    onClientCountChange?.(clientCount);

    ws.on('close', () => {
      clientCount--;
      console.error(`[ws] Client disconnected (${clientCount} total)`);
      onClientCountChange?.(clientCount);
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

  const changedPaths = new Set<string>();

  const flushChanges = debounce(() => {
    if (changedPaths.size > 0) {
      const changes = Array.from(changedPaths);
      changedPaths.clear();
      console.error(`[watcher] Broadcasting ${changes.length} change(s)`);
      broadcast(wss, { type: 'file-changes', changes, timestamp: Date.now() });
    }
  }, 200);

  function onFileChange(filePath: string): void {
    const normalized = normalizeFsPath(filePath);
    if (isSuppressed(normalized)) {
      console.error(`[watcher] Suppressed: ${normalized}`);
      return;
    }
    changedPaths.add(normalized);
    flushChanges();
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

// ── Roadmap toggle ──
app.patch('/api/roadmap', (req: Request, res: Response) => {
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

  if (!match) return res.status(404).json({ error: `Phase ${phaseNumber} checkbox not found in ROADMAP.md` });

  content = content.replace(pattern, `$1${checked ? 'x' : ' '}$3`);
  suppressPath(roadmapPath);
  fs.writeFileSync(roadmapPath, content, 'utf-8');
  return res.json({ updated: true, phaseNumber, checked });
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

  const content = fs.readFileSync(statePath, 'utf-8').replace(/\r\n/g, '\n');
  const updated = stateReplaceField(content, field, value);
  if (!updated) return res.status(404).json({ error: `Field "${field}" not found in STATE.md` });

  suppressPath(statePath);
  fs.writeFileSync(statePath, updated, 'utf-8');
  return res.json({ updated: true, field });
});

// Helper: ensure STATE.md exists, creating a minimal one if missing
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

// Helper: append an entry to a section in STATE.md
function appendToStateSection(
  statePath: string,
  sectionPattern: RegExp,
  entry: string,
  fallbackSection: string,
): { success: boolean; reason?: string } {
  // Normalize line endings to LF for consistent regex matching
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
    // Section not found — append it to the end of the file
    content = content.trimEnd() + '\n\n' + fallbackSection + '\n' + entry + '\n';
  }

  suppressPath(statePath);
  fs.writeFileSync(statePath, content, 'utf-8');
  return { success: true };
}

// ── Add Decision ──
app.post('/api/state/decision', (req: Request, res: Response) => {
  const statePath = path.join(projectCwd, '.planning', 'STATE.md');
  ensureStateMd(statePath);

  const { phase, text } = req.body as { phase?: string; text?: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const phaseLabel = phase?.trim() || '?';
  const entry = `- [Phase ${phaseLabel}]: ${text.trim()}`;
  const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;

  const result = appendToStateSection(statePath, sectionPattern, entry, '### Decisions');
  return res.json({ added: true, decision: entry });
});

// ── Add Blocker ──
app.post('/api/state/blocker', (req: Request, res: Response) => {
  const statePath = path.join(projectCwd, '.planning', 'STATE.md');
  ensureStateMd(statePath);

  const { text } = req.body as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const entry = `- ${text.trim()}`;
  const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;

  const result = appendToStateSection(statePath, sectionPattern, entry, '### Blockers/Concerns');
  return res.json({ added: true, blocker: text.trim() });
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
  const slug = slugify(text, { lower: true, strict: true }).slice(0, 40);
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

// ── Server info (network mode / QR code / Tailscale) ──
app.get('/api/server-info', (_req: Request, res: Response) => {
  return res.json({
    networkEnabled: networkMode,
    localUrl: `http://localhost:${resolvedPort}`,
    networkUrl: localNetworkIp ? `http://${localNetworkIp}:${resolvedPort}` : null,
    tailscaleUrl: tailscaleIp ? `http://${tailscaleIp}:${resolvedPort}` : null,
  });
});

// ── Shutdown ──
// Resolved in main() and exposed here so the endpoint can call it
let shutdownFn: (() => void) | null = null;

app.post('/api/shutdown', (_req: Request, res: Response) => {
  res.json({ shutdown: true });
  setTimeout(() => shutdownFn?.(), 100);
});

// ─── Simple Mode Config ───────────────────────────────────────────────────

const simpleModeConfigPath = path.join(__dirname, 'simple-mode-config.json');

app.get('/api/simple-mode-config', (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(simpleModeConfigPath)) {
      return res.json({});
    }
    const data = JSON.parse(fs.readFileSync(simpleModeConfigPath, 'utf-8'));
    return res.json(data);
  } catch {
    return res.json({});
  }
});

app.post('/api/simple-mode-config', (req: Request, res: Response) => {
  const { default_mode } = req.body as { default_mode?: string };
  if (default_mode !== 'simple' && default_mode !== 'advanced') {
    return res.status(400).json({ error: 'default_mode must be "simple" or "advanced"' });
  }
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(simpleModeConfigPath)) {
    try { existing = JSON.parse(fs.readFileSync(simpleModeConfigPath, 'utf-8')); } catch { /* ignore */ }
  }
  existing.default_mode = default_mode;
  fs.writeFileSync(simpleModeConfigPath, JSON.stringify(existing, null, 2), 'utf-8');
  log('INFO', 'simple-mode-config', `default_mode set to ${default_mode}`);
  return res.json({ written: true, default_mode });
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

const AUTO_SHUTDOWN_DELAY_MS = 60_000; // 60 seconds

async function main(): Promise<void> {
  let autoShutdownTimer: NodeJS.Timeout | null = null;

  const wss = createWSS((count) => {
    if (count > 0) {
      if (autoShutdownTimer) {
        clearTimeout(autoShutdownTimer);
        autoShutdownTimer = null;
        log('INFO', 'server', 'Auto-shutdown cancelled — client connected');
      }
    } else {
      autoShutdownTimer = setTimeout(() => {
        if (wss.clients.size === 0) {
          log('INFO', 'server', 'Auto-shutdown: no clients for 60s — shutting down');
          shutdown();
        }
      }, AUTO_SHUTDOWN_DELAY_MS);
      log('INFO', 'server', `Auto-shutdown scheduled in ${AUTO_SHUTDOWN_DELAY_MS / 1000}s (no clients)`);
    }
  });
  const terminalWss = new WebSocketServer({ noServer: true });
  const ptyManager = PtyManager.getInstance();

  if (!ptyManager.isAvailable()) {
    log('WARN', 'server', 'node-pty not available — terminal features disabled');
  } else {
    log('INFO', 'server', 'node-pty available — terminal features enabled');
  }

  // Terminal WebSocket connections
  terminalWss.on('connection', (ws: WebSocket) => {
    log('INFO', 'terminal-ws', 'Client connected');
    ptyManager.addClient(ws);

    if (!ptyManager.isAvailable()) {
      ws.send(JSON.stringify({ type: 'unavailable', reason: 'node-pty is not installed — terminal features disabled' }));
      log('WARN', 'terminal-ws', 'Sent unavailable to client — node-pty missing');
    }

    ws.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
        switch (msg.type) {
          case 'input':
            ptyManager.write(msg.data);
            break;
          case 'resize':
            log('INFO', 'terminal-ws', `Resize: ${msg.cols}x${msg.rows}`);
            ptyManager.resize(msg.cols, msg.rows);
            break;
          case 'spawn':
            log('INFO', 'terminal-ws', `Spawn requested: skipPermissions=${!!msg.skipPermissions}, cwd=${projectCwd}`);
            try {
              ptyManager.spawn({
                skipPermissions: !!msg.skipPermissions,
                cwd: projectCwd,
                cols: msg.cols,
                rows: msg.rows,
              });
              log('INFO', 'terminal-ws', `Spawn succeeded, pid=${ptyManager.getStatus()?.pid}`);
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              log('ERROR', 'terminal-ws', `Spawn failed: ${errMsg}`);
              ws.send(JSON.stringify({ type: 'output', data: `\r\n\x1b[31mFailed to start terminal: ${errMsg}\x1b[0m\r\n` }));
            }
            break;
          case 'kill':
            log('INFO', 'terminal-ws', 'Kill requested');
            ptyManager.kill();
            break;
          default:
            log('WARN', 'terminal-ws', `Unknown message type: ${msg.type}`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        log('ERROR', 'terminal-ws', `Message handling error: ${errMsg}`);
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
  resolvedPort = port;
  const localUrl = `http://localhost:${port}`;
  // Bind to all interfaces when network mode or Tailscale is active
  const bindHost = (networkMode || tailscaleIp !== null) ? '0.0.0.0' : '127.0.0.1';

  server.listen(port, bindHost, () => {
    log('INFO', 'server', `Dashboard ready at ${localUrl}, log file: ${logFile}`);
    console.error(`Dashboard ready at ${localUrl}`);
    if (localNetworkIp) {
      console.error(`LAN URL:          http://${localNetworkIp}:${port}`);
    }
    if (tailscaleIp) {
      console.error(`Tailscale URL:    http://${tailscaleIp}:${port}`);
      console.error(`                  → open on any Tailscale device`);
    }
    // On Windows, the firewall blocks incoming LAN connections by default.
    // Tailscale bypasses this via its own virtual adapter — plain LAN does not.
    if (bindHost === '0.0.0.0' && localNetworkIp && process.platform === 'win32') {
      console.error('');
      console.error(`[firewall] Windows may block LAN connections on port ${port}.`);
      console.error(`[firewall] Run once as Administrator to allow it:`);
      console.error(`[firewall]   netsh advfirewall firewall add rule name="MAXSIM Dashboard" dir=in action=allow protocol=TCP localport=${port}`);
    }
    console.error(`Logs: ${logFile}`);
    open(localUrl).catch(() => {});
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

  shutdownFn = shutdown;

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
