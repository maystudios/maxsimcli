/**
 * Commands — Standalone utility commands
 *
 * Ported from maxsim/bin/lib/commands.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import slugify from 'slugify';
import {
  safeReadFile,
  loadConfig,
  isGitIgnored,
  execGit,
  normalizePhaseName,
  getArchivedPhaseDirs,
  generateSlugInternal,
  getMilestoneInfo,
  resolveModelInternal,
  MODEL_PROFILES,
  rethrowCliSignals,
  findPhaseInternal,
  todayISO,
  planningPath,
  phasesPath,
  listSubDirs,
  isPlanFile,
  isSummaryFile,
  debugLog,
} from './core.js';
import { extractFrontmatter } from './frontmatter.js';
import type {
  TodoItem,
  HistoryDigest,
  HistoryPhaseDigest,
  WebSearchOptions,
  WebSearchResult,
  ScaffoldOptions,
  TimestampFormat,
  ModelProfileName,
  AgentType,
  FrontmatterData,
  CmdResult,
} from './types.js';
import { cmdOk, cmdErr } from './types.js';

// ─── Todo frontmatter parsing ────────────────────────────────────────────────

export interface TodoFrontmatter {
  created: string;
  title: string;
  area: string;
  completed?: string;
}

export function parseTodoFrontmatter(content: string): TodoFrontmatter {
  const createdMatch = content.match(/^created:\s*(.+)$/m);
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  const areaMatch = content.match(/^area:\s*(.+)$/m);
  const completedMatch = content.match(/^completed:\s*(.+)$/m);

  return {
    created: createdMatch ? createdMatch[1].trim() : 'unknown',
    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
    area: areaMatch ? areaMatch[1].trim() : 'general',
    ...(completedMatch && { completed: completedMatch[1].trim() }),
  };
}

// ─── Slug generation ────────────────────────────────────────────────────────

export function cmdGenerateSlug(text: string | undefined, raw: boolean): CmdResult {
  if (!text) {
    return cmdErr('text required for slug generation');
  }

  const slug = slugify(text, { lower: true, strict: true });

  const result = { slug };
  return cmdOk(result, raw ? slug : undefined);
}

// ─── Timestamp ──────────────────────────────────────────────────────────────

export function cmdCurrentTimestamp(format: TimestampFormat, raw: boolean): CmdResult {
  const now = new Date();
  let result: string;

  switch (format) {
    case 'date':
      result = todayISO();
      break;
    case 'filename':
      result = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      break;
    case 'full':
    default:
      result = now.toISOString();
      break;
  }

  return cmdOk({ timestamp: result }, raw ? result : undefined);
}

// ─── Todos ──────────────────────────────────────────────────────────────────

export function cmdListTodos(cwd: string, area: string | undefined, raw: boolean): CmdResult {
  const pendingDir = planningPath(cwd, 'todos', 'pending');

  let count = 0;
  const todos: TodoItem[] = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const fm = parseTodoFrontmatter(content);

        // Apply area filter if specified
        if (area && fm.area !== area) continue;

        count++;
        todos.push({
          file,
          created: fm.created,
          title: fm.title,
          area: fm.area,
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch (e) {
        /* optional op, ignore */
        debugLog(e);
      }
    }
  } catch (e) {
    /* optional op, ignore */
    debugLog(e);
  }

  const result = { count, todos };
  return cmdOk(result, raw ? count.toString() : undefined);
}

// ─── Path verification ──────────────────────────────────────────────────────

export function cmdVerifyPathExists(cwd: string, targetPath: string | undefined, raw: boolean): CmdResult {
  if (!targetPath) {
    return cmdErr('path required for verification');
  }

  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);

  try {
    const stats = fs.statSync(fullPath);
    const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
    const result = { exists: true, type };
    return cmdOk(result, raw ? 'true' : undefined);
  } catch (e: unknown) {
    rethrowCliSignals(e);
    const result = { exists: false, type: null };
    return cmdOk(result, raw ? 'false' : undefined);
  }
}

// ─── History digest ─────────────────────────────────────────────────────────

export function cmdHistoryDigest(cwd: string, raw: boolean): CmdResult {
  const phasesDir = phasesPath(cwd);
  const digest: {
    phases: Record<string, { name: string; provides: Set<string>; affects: Set<string>; patterns: Set<string> }>;
    decisions: Array<{ phase: string; decision: string }>;
    tech_stack: Set<string> | string[];
  } = { phases: {}, decisions: [], tech_stack: new Set<string>() };

  // Collect all phase directories: archived + current
  const allPhaseDirs: Array<{ name: string; fullPath: string; milestone: string | null }> = [];

  // Add archived phases first (oldest milestones first)
  const archived = getArchivedPhaseDirs(cwd);
  for (const a of archived) {
    allPhaseDirs.push({ name: a.name, fullPath: a.fullPath, milestone: a.milestone });
  }

  // Add current phases
  if (fs.existsSync(phasesDir)) {
    try {
      const currentDirs = listSubDirs(phasesDir, true);
      for (const dir of currentDirs) {
        allPhaseDirs.push({ name: dir, fullPath: path.join(phasesDir, dir), milestone: null });
      }
    } catch (e) {
      /* optional op, ignore */
      debugLog(e);
    }
  }

  if (allPhaseDirs.length === 0) {
    const emptyDigest: HistoryDigest = { phases: {}, decisions: [], tech_stack: [] };
    return cmdOk(emptyDigest);
  }

  try {
    for (const { name: dir, fullPath: dirPath } of allPhaseDirs) {
      const summaries = fs.readdirSync(dirPath).filter(f => isSummaryFile(f));

      for (const summary of summaries) {
        try {
          const content = fs.readFileSync(path.join(dirPath, summary), 'utf-8');
          const fm = extractFrontmatter(content);

          const phaseNum = (fm.phase as string) || dir.split('-')[0];

          if (!digest.phases[phaseNum]) {
            digest.phases[phaseNum] = {
              name: (fm.name as string) || dir.split('-').slice(1).join(' ') || 'Unknown',
              provides: new Set<string>(),
              affects: new Set<string>(),
              patterns: new Set<string>(),
            };
          }

          // Merge provides
          const depGraph = fm['dependency-graph'] as FrontmatterData | undefined;
          if (depGraph && depGraph.provides) {
            (depGraph.provides as string[]).forEach(p => digest.phases[phaseNum].provides.add(p));
          } else if (fm.provides) {
            (fm.provides as string[]).forEach(p => digest.phases[phaseNum].provides.add(p));
          }

          // Merge affects
          if (depGraph && depGraph.affects) {
            (depGraph.affects as string[]).forEach(a => digest.phases[phaseNum].affects.add(a));
          }

          // Merge patterns
          if (fm['patterns-established']) {
            (fm['patterns-established'] as string[]).forEach(p => digest.phases[phaseNum].patterns.add(p));
          }

          // Merge decisions
          if (fm['key-decisions']) {
            (fm['key-decisions'] as string[]).forEach(d => {
              digest.decisions.push({ phase: phaseNum, decision: d });
            });
          }

          // Merge tech stack
          const techStack = fm['tech-stack'] as FrontmatterData | undefined;
          if (techStack && techStack.added) {
            (techStack.added as Array<string | FrontmatterData>).forEach(t =>
              (digest.tech_stack as Set<string>).add(typeof t === 'string' ? t : (t as FrontmatterData).name as string)
            );
          }
        } catch (e) {
          /* optional op, ignore */
          debugLog(e);
        }
      }
    }

    // Convert Sets to Arrays for JSON output
    const outputDigest: HistoryDigest = {
      phases: {},
      decisions: digest.decisions,
      tech_stack: [...(digest.tech_stack as Set<string>)],
    };
    for (const [p, data] of Object.entries(digest.phases)) {
      outputDigest.phases[p] = {
        name: data.name,
        provides: [...data.provides],
        affects: [...data.affects],
        patterns: [...data.patterns],
      };
    }

    return cmdOk(outputDigest);
  } catch (e: unknown) {
    rethrowCliSignals(e);
    return cmdErr('Failed to generate history digest: ' + (e as Error).message);
  }
}

// ─── Model resolution ───────────────────────────────────────────────────────

export function cmdResolveModel(cwd: string, agentType: string | undefined, raw: boolean): CmdResult {
  if (!agentType) {
    return cmdErr('agent-type required');
  }

  const config = loadConfig(cwd);
  const profile: ModelProfileName = config.model_profile || 'balanced';

  const agentModels = MODEL_PROFILES[agentType as AgentType];
  if (!agentModels) {
    const result = { model: 'sonnet', profile, unknown_agent: true };
    return cmdOk(result, raw ? 'sonnet' : undefined);
  }

  const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  const model = resolved === 'opus' ? 'inherit' : resolved;
  const result = { model, profile };
  return cmdOk(result, raw ? model : undefined);
}

// ─── Commit ─────────────────────────────────────────────────────────────────

export async function cmdCommit(
  cwd: string,
  message: string | undefined,
  files: string[],
  raw: boolean,
  amend: boolean,
): Promise<CmdResult> {
  if (!message && !amend) {
    return cmdErr('commit message required');
  }

  const config = loadConfig(cwd);

  // Check commit_docs config
  if (!config.commit_docs) {
    const result = { committed: false, hash: null, reason: 'skipped_commit_docs_false' };
    return cmdOk(result, raw ? 'skipped' : undefined);
  }

  // Check if .planning is gitignored
  if (await isGitIgnored(cwd, '.planning')) {
    const result = { committed: false, hash: null, reason: 'skipped_gitignored' };
    return cmdOk(result, raw ? 'skipped' : undefined);
  }

  // Stage files
  const filesToStage = files && files.length > 0 ? files : ['.planning/'];
  for (const file of filesToStage) {
    await execGit(cwd, ['add', file]);
  }

  // Commit
  const commitArgs = amend ? ['commit', '--amend', '--no-edit'] : ['commit', '-m', message!];
  const commitResult = await execGit(cwd, commitArgs);
  if (commitResult.exitCode !== 0) {
    if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
      const result = { committed: false, hash: null, reason: 'nothing_to_commit' };
      return cmdOk(result, raw ? 'nothing' : undefined);
    }
    const result = { committed: false, hash: null, reason: 'nothing_to_commit', error: commitResult.stderr };
    return cmdOk(result, raw ? 'nothing' : undefined);
  }

  // Get short hash
  const hashResult = await execGit(cwd, ['rev-parse', '--short', 'HEAD']);
  const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
  const result = { committed: true, hash, reason: 'committed' };
  return cmdOk(result, raw ? (hash || 'committed') : undefined);
}

// ─── Summary extract ────────────────────────────────────────────────────────

export function cmdSummaryExtract(
  cwd: string,
  summaryPath: string | undefined,
  fields: string[] | null,
  raw: boolean,
): CmdResult {
  if (!summaryPath) {
    return cmdErr('summary-path required for summary-extract');
  }

  const fullPath = path.join(cwd, summaryPath);

  if (!fs.existsSync(fullPath)) {
    return cmdOk({ error: 'File not found', path: summaryPath });
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);

  // Parse key-decisions into structured format
  const parseDecisions = (decisionsList: unknown): Array<{ summary: string; rationale: string | null }> => {
    if (!decisionsList || !Array.isArray(decisionsList)) return [];
    return decisionsList.map((d: string) => {
      const colonIdx = d.indexOf(':');
      if (colonIdx > 0) {
        return {
          summary: d.substring(0, colonIdx).trim(),
          rationale: d.substring(colonIdx + 1).trim(),
        };
      }
      return { summary: d, rationale: null };
    });
  };

  const techStack = fm['tech-stack'] as FrontmatterData | undefined;

  // Build full result
  const fullResult: Record<string, unknown> = {
    path: summaryPath,
    one_liner: fm['one-liner'] || null,
    key_files: fm['key-files'] || [],
    tech_added: (techStack && techStack.added) || [],
    patterns: fm['patterns-established'] || [],
    decisions: parseDecisions(fm['key-decisions']),
    requirements_completed: fm['requirements-completed'] || [],
  };

  // If fields specified, filter to only those fields
  if (fields && fields.length > 0) {
    const filtered: Record<string, unknown> = { path: summaryPath };
    for (const field of fields) {
      if (fullResult[field] !== undefined) {
        filtered[field] = fullResult[field];
      }
    }
    return cmdOk(filtered);
  }

  return cmdOk(fullResult);
}

// ─── Web search ─────────────────────────────────────────────────────────────

export async function cmdWebsearch(
  query: string | undefined,
  options: WebSearchOptions,
  raw: boolean,
): Promise<CmdResult> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    return cmdOk({ available: false, reason: 'BRAVE_API_KEY not set' }, raw ? '' : undefined);
  }

  if (!query) {
    return cmdOk({ available: false, error: 'Query required' }, raw ? '' : undefined);
  }

  const params = new URLSearchParams({
    q: query,
    count: String(options.limit || 10),
    country: 'us',
    search_lang: 'en',
    text_decorations: 'false',
  });

  if (options.freshness) {
    params.set('freshness', options.freshness);
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
      },
    );

    if (!response.ok) {
      return cmdOk({ available: false, error: `API error: ${response.status}` }, raw ? '' : undefined);
    }

    const data = (await response.json()) as { web?: { results?: Array<{ title: string; url: string; description: string; age?: string }> } };

    const results: WebSearchResult[] = (data.web?.results || []).map(r => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age || null,
    }));

    return cmdOk(
      {
        available: true,
        query,
        count: results.length,
        results,
      },
      raw ? results.map(r => `${r.title}\n${r.url}\n${r.description}`).join('\n\n') : undefined,
    );
  } catch (err: unknown) {
    rethrowCliSignals(err);
    return cmdOk({ available: false, error: (err as Error).message }, raw ? '' : undefined);
  }
}

// ─── Progress render ────────────────────────────────────────────────────────

export function cmdProgressRender(cwd: string, format: string, raw: boolean): CmdResult {
  const phasesDir = phasesPath(cwd);
  const milestone = getMilestoneInfo(cwd);

  const phases: Array<{ number: string; name: string; plans: number; summaries: number; status: string }> = [];
  let totalPlans = 0;
  let totalSummaries = 0;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort((a, b) => {
        const aNum = parseFloat(a.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0');
        const bNum = parseFloat(b.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0');
        return aNum - bNum;
      });

    for (const dir of dirs) {
      const dm = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
      const phaseNum = dm ? dm[1] : dir;
      const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const planCount = phaseFiles.filter(f => isPlanFile(f)).length;
      const summaryCount = phaseFiles.filter(f => isSummaryFile(f)).length;

      totalPlans += planCount;
      totalSummaries += summaryCount;

      let status: string;
      if (planCount === 0) status = 'Pending';
      else if (summaryCount >= planCount) status = 'Complete';
      else if (summaryCount > 0) status = 'In Progress';
      else status = 'Planned';

      phases.push({ number: phaseNum, name: phaseName, plans: planCount, summaries: summaryCount, status });
    }
  } catch (e) {
    /* optional op, ignore */
    debugLog(e);
  }

  const percent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;

  if (format === 'table') {
    const barWidth = 10;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    let out = `# ${milestone.version} ${milestone.name}\n\n`;
    out += `**Progress:** [${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)\n\n`;
    out += `| Phase | Name | Plans | Status |\n`;
    out += `|-------|------|-------|--------|\n`;
    for (const p of phases) {
      out += `| ${p.number} | ${p.name} | ${p.summaries}/${p.plans} | ${p.status} |\n`;
    }
    return cmdOk({ rendered: out }, raw ? out : undefined);
  } else if (format === 'bar') {
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
    return cmdOk({ bar: text, percent, completed: totalSummaries, total: totalPlans }, raw ? text : undefined);
  } else if (format === 'phase-bars') {
    const doneCount = phases.filter(p => p.status === 'Complete').length;
    const inProgressCount = phases.filter(p => p.status === 'In Progress').length;
    const totalCount = phases.length;
    const header = chalk.bold(
      `Milestone: ${milestone.name} — ${doneCount}/${totalCount} phases complete (${percent}%)`
    );
    const lines: string[] = [header, ''];

    for (const p of phases) {
      const pPercent =
        p.plans > 0 ? Math.min(100, Math.round((p.summaries / p.plans) * 100)) : 0;
      const barWidth = 10;
      const filled = Math.round((pPercent / 100) * barWidth);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
      const phaseLabel = `Phase ${p.number.padStart(2, '0')}`;
      const statusLabel =
        p.status === 'Complete'
          ? 'DONE'
          : p.status === 'In Progress'
          ? 'IN PROGRESS'
          : 'PLANNED';

      let line = `${phaseLabel} [${bar}] ${String(pPercent).padStart(3, ' ')}% — ${statusLabel}`;
      if (p.status === 'Complete') line = chalk.green(line);
      else if (p.status === 'In Progress') line = chalk.yellow(line);
      else line = chalk.dim(line);

      lines.push(line);
    }

    const rendered = lines.join('\n');
    return cmdOk({ rendered, done: doneCount, in_progress: inProgressCount, total: totalCount, percent }, raw ? rendered : undefined);
  } else {
    return cmdOk({
      milestone_version: milestone.version,
      milestone_name: milestone.name,
      phases,
      total_plans: totalPlans,
      total_summaries: totalSummaries,
      percent,
    });
  }
}

// ─── Todo complete ──────────────────────────────────────────────────────────

export function cmdTodoComplete(cwd: string, filename: string | undefined, raw: boolean): CmdResult {
  if (!filename) {
    return cmdErr('filename required for todo complete');
  }

  const pendingDir = planningPath(cwd, 'todos', 'pending');
  const completedDir = planningPath(cwd, 'todos', 'completed');
  const sourcePath = path.join(pendingDir, filename);

  if (!fs.existsSync(sourcePath)) {
    return cmdErr(`Todo not found: ${filename}`);
  }

  // Ensure completed directory exists
  fs.mkdirSync(completedDir, { recursive: true });

  // Read, add completion timestamp, move
  let content = fs.readFileSync(sourcePath, 'utf-8');
  const today = todayISO();
  content = `completed: ${today}\n` + content;

  fs.writeFileSync(path.join(completedDir, filename), content, 'utf-8');
  fs.unlinkSync(sourcePath);

  return cmdOk({ completed: true, file: filename, date: today }, raw ? 'completed' : undefined);
}

// ─── Scaffold ───────────────────────────────────────────────────────────────

export function cmdScaffold(
  cwd: string,
  type: string | undefined,
  options: ScaffoldOptions,
  raw: boolean,
): CmdResult {
  const { phase, name } = options;
  const padded = phase ? normalizePhaseName(phase) : '00';
  const today = todayISO();

  // Find phase directory
  const phaseInfo = phase ? findPhaseInternal(cwd, phase) : null;
  const phaseDir = phaseInfo ? path.join(cwd, phaseInfo.directory) : null;

  if (phase && !phaseDir && type !== 'phase-dir') {
    return cmdErr(`Phase ${phase} directory not found`);
  }

  let filePath: string;
  let content: string;

  switch (type) {
    case 'context': {
      filePath = path.join(phaseDir!, `${padded}-CONTEXT.md`);
      content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Context\n\n## Decisions\n\n_Decisions will be captured during /maxsim:discuss-phase ${phase}_\n\n## Discretion Areas\n\n_Areas where the executor can use judgment_\n\n## Deferred Ideas\n\n_Ideas to consider later_\n`;
      break;
    }
    case 'uat': {
      filePath = path.join(phaseDir!, `${padded}-UAT.md`);
      content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — User Acceptance Testing\n\n## Test Results\n\n| # | Test | Status | Notes |\n|---|------|--------|-------|\n\n## Summary\n\n_Pending UAT_\n`;
      break;
    }
    case 'verification': {
      filePath = path.join(phaseDir!, `${padded}-VERIFICATION.md`);
      content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Verification\n\n## Goal-Backward Verification\n\n**Phase Goal:** [From ROADMAP.md]\n\n## Checks\n\n| # | Requirement | Status | Evidence |\n|---|------------|--------|----------|\n\n## Result\n\n_Pending verification_\n`;
      break;
    }
    case 'phase-dir': {
      if (!phase || !name) {
        return cmdErr('phase and name required for phase-dir scaffold');
      }
      const slug = generateSlugInternal(name);
      const dirName = `${padded}-${slug}`;
      const phasesParent = phasesPath(cwd);
      fs.mkdirSync(phasesParent, { recursive: true });
      const dirPath = path.join(phasesParent, dirName);
      fs.mkdirSync(dirPath, { recursive: true });
      return cmdOk({ created: true, directory: `.planning/phases/${dirName}`, path: dirPath }, raw ? dirPath : undefined);
    }
    default:
      return cmdErr(`Unknown scaffold type: ${type}. Available: context, uat, verification, phase-dir`);
  }

  if (fs.existsSync(filePath)) {
    return cmdOk({ created: false, reason: 'already_exists', path: filePath }, raw ? 'exists' : undefined);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  const relPath = path.relative(cwd, filePath);
  return cmdOk({ created: true, path: relPath }, raw ? relPath : undefined);
}
