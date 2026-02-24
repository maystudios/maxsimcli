/**
 * Commands — Standalone utility commands
 *
 * Ported from maxsim/bin/lib/commands.cjs
 */

import fs from 'node:fs';
import path from 'node:path';

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
  output,
  error,
  findPhaseInternal,
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
} from './types.js';

// ─── Slug generation ────────────────────────────────────────────────────────

export function cmdGenerateSlug(text: string | undefined, raw: boolean): void {
  if (!text) {
    error('text required for slug generation');
  }

  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const result = { slug };
  output(result, raw, slug);
}

// ─── Timestamp ──────────────────────────────────────────────────────────────

export function cmdCurrentTimestamp(format: TimestampFormat, raw: boolean): void {
  const now = new Date();
  let result: string;

  switch (format) {
    case 'date':
      result = now.toISOString().split('T')[0];
      break;
    case 'filename':
      result = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      break;
    case 'full':
    default:
      result = now.toISOString();
      break;
  }

  output({ timestamp: result }, raw, result);
}

// ─── Todos ──────────────────────────────────────────────────────────────────

export function cmdListTodos(cwd: string, area: string | undefined, raw: boolean): void {
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');

  let count = 0;
  const todos: TodoItem[] = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);

        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        // Apply area filter if specified
        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch (e) {
        /* optional op, ignore */
        if (process.env.MAXSIM_DEBUG) console.error(e);
      }
    }
  } catch (e) {
    /* optional op, ignore */
    if (process.env.MAXSIM_DEBUG) console.error(e);
  }

  const result = { count, todos };
  output(result, raw, count.toString());
}

// ─── Path verification ──────────────────────────────────────────────────────

export function cmdVerifyPathExists(cwd: string, targetPath: string | undefined, raw: boolean): void {
  if (!targetPath) {
    error('path required for verification');
  }

  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);

  try {
    const stats = fs.statSync(fullPath);
    const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
    const result = { exists: true, type };
    output(result, raw, 'true');
  } catch {
    const result = { exists: false, type: null };
    output(result, raw, 'false');
  }
}

// ─── History digest ─────────────────────────────────────────────────────────

export function cmdHistoryDigest(cwd: string, raw: boolean): void {
  const phasesDir = path.join(cwd, '.planning', 'phases');
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
      const currentDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort();
      for (const dir of currentDirs) {
        allPhaseDirs.push({ name: dir, fullPath: path.join(phasesDir, dir), milestone: null });
      }
    } catch (e) {
      /* optional op, ignore */
      if (process.env.MAXSIM_DEBUG) console.error(e);
    }
  }

  if (allPhaseDirs.length === 0) {
    const emptyDigest: HistoryDigest = { phases: {}, decisions: [], tech_stack: [] };
    output(emptyDigest, raw);
    return;
  }

  try {
    for (const { name: dir, fullPath: dirPath } of allPhaseDirs) {
      const summaries = fs.readdirSync(dirPath).filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');

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
          if (process.env.MAXSIM_DEBUG) console.error(e);
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

    output(outputDigest, raw);
  } catch (e: unknown) {
    error('Failed to generate history digest: ' + (e as Error).message);
  }
}

// ─── Model resolution ───────────────────────────────────────────────────────

export function cmdResolveModel(cwd: string, agentType: string | undefined, raw: boolean): void {
  if (!agentType) {
    error('agent-type required');
  }

  const config = loadConfig(cwd);
  const profile: ModelProfileName = config.model_profile || 'balanced';

  const agentModels = MODEL_PROFILES[agentType as AgentType];
  if (!agentModels) {
    const result = { model: 'sonnet', profile, unknown_agent: true };
    output(result, raw, 'sonnet');
    return;
  }

  const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  const model = resolved === 'opus' ? 'inherit' : resolved;
  const result = { model, profile };
  output(result, raw, model);
}

// ─── Commit ─────────────────────────────────────────────────────────────────

export function cmdCommit(
  cwd: string,
  message: string | undefined,
  files: string[],
  raw: boolean,
  amend: boolean,
): void {
  if (!message && !amend) {
    error('commit message required');
  }

  const config = loadConfig(cwd);

  // Check commit_docs config
  if (!config.commit_docs) {
    const result = { committed: false, hash: null, reason: 'skipped_commit_docs_false' };
    output(result, raw, 'skipped');
    return;
  }

  // Check if .planning is gitignored
  if (isGitIgnored(cwd, '.planning')) {
    const result = { committed: false, hash: null, reason: 'skipped_gitignored' };
    output(result, raw, 'skipped');
    return;
  }

  // Stage files
  const filesToStage = files && files.length > 0 ? files : ['.planning/'];
  for (const file of filesToStage) {
    execGit(cwd, ['add', file]);
  }

  // Commit
  const commitArgs = amend ? ['commit', '--amend', '--no-edit'] : ['commit', '-m', message!];
  const commitResult = execGit(cwd, commitArgs);
  if (commitResult.exitCode !== 0) {
    if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
      const result = { committed: false, hash: null, reason: 'nothing_to_commit' };
      output(result, raw, 'nothing');
      return;
    }
    const result = { committed: false, hash: null, reason: 'nothing_to_commit', error: commitResult.stderr };
    output(result, raw, 'nothing');
    return;
  }

  // Get short hash
  const hashResult = execGit(cwd, ['rev-parse', '--short', 'HEAD']);
  const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
  const result = { committed: true, hash, reason: 'committed' };
  output(result, raw, hash || 'committed');
}

// ─── Summary extract ────────────────────────────────────────────────────────

export function cmdSummaryExtract(
  cwd: string,
  summaryPath: string | undefined,
  fields: string[] | null,
  raw: boolean,
): void {
  if (!summaryPath) {
    error('summary-path required for summary-extract');
  }

  const fullPath = path.join(cwd, summaryPath);

  if (!fs.existsSync(fullPath)) {
    output({ error: 'File not found', path: summaryPath }, raw);
    return;
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
    output(filtered, raw);
    return;
  }

  output(fullResult, raw);
}

// ─── Web search ─────────────────────────────────────────────────────────────

export async function cmdWebsearch(
  query: string | undefined,
  options: WebSearchOptions,
  raw: boolean,
): Promise<void> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    output({ available: false, reason: 'BRAVE_API_KEY not set' }, raw, '');
    return;
  }

  if (!query) {
    output({ available: false, error: 'Query required' }, raw, '');
    return;
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
      output({ available: false, error: `API error: ${response.status}` }, raw, '');
      return;
    }

    const data = (await response.json()) as { web?: { results?: Array<{ title: string; url: string; description: string; age?: string }> } };

    const results: WebSearchResult[] = (data.web?.results || []).map(r => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age || null,
    }));

    output(
      {
        available: true,
        query,
        count: results.length,
        results,
      },
      raw,
      results.map(r => `${r.title}\n${r.url}\n${r.description}`).join('\n\n'),
    );
  } catch (err: unknown) {
    output({ available: false, error: (err as Error).message }, raw, '');
  }
}

// ─── Progress render ────────────────────────────────────────────────────────

export function cmdProgressRender(cwd: string, format: string, raw: boolean): void {
  const phasesDir = path.join(cwd, '.planning', 'phases');
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
      const planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
      const summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;

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
    if (process.env.MAXSIM_DEBUG) console.error(e);
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
    output({ rendered: out }, raw, out);
  } else if (format === 'bar') {
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
    output({ bar: text, percent, completed: totalSummaries, total: totalPlans }, raw, text);
  } else {
    output({
      milestone_version: milestone.version,
      milestone_name: milestone.name,
      phases,
      total_plans: totalPlans,
      total_summaries: totalSummaries,
      percent,
    }, raw);
  }
}

// ─── Todo complete ──────────────────────────────────────────────────────────

export function cmdTodoComplete(cwd: string, filename: string | undefined, raw: boolean): void {
  if (!filename) {
    error('filename required for todo complete');
  }

  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  const completedDir = path.join(cwd, '.planning', 'todos', 'completed');
  const sourcePath = path.join(pendingDir, filename);

  if (!fs.existsSync(sourcePath)) {
    error(`Todo not found: ${filename}`);
  }

  // Ensure completed directory exists
  fs.mkdirSync(completedDir, { recursive: true });

  // Read, add completion timestamp, move
  let content = fs.readFileSync(sourcePath, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  content = `completed: ${today}\n` + content;

  fs.writeFileSync(path.join(completedDir, filename), content, 'utf-8');
  fs.unlinkSync(sourcePath);

  output({ completed: true, file: filename, date: today }, raw, 'completed');
}

// ─── Scaffold ───────────────────────────────────────────────────────────────

export function cmdScaffold(
  cwd: string,
  type: string | undefined,
  options: ScaffoldOptions,
  raw: boolean,
): void {
  const { phase, name } = options;
  const padded = phase ? normalizePhaseName(phase) : '00';
  const today = new Date().toISOString().split('T')[0];

  // Find phase directory
  const phaseInfo = phase ? findPhaseInternal(cwd, phase) : null;
  const phaseDir = phaseInfo ? path.join(cwd, phaseInfo.directory) : null;

  if (phase && !phaseDir && type !== 'phase-dir') {
    error(`Phase ${phase} directory not found`);
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
        error('phase and name required for phase-dir scaffold');
      }
      const slug = generateSlugInternal(name);
      const dirName = `${padded}-${slug}`;
      const phasesParent = path.join(cwd, '.planning', 'phases');
      fs.mkdirSync(phasesParent, { recursive: true });
      const dirPath = path.join(phasesParent, dirName);
      fs.mkdirSync(dirPath, { recursive: true });
      output({ created: true, directory: `.planning/phases/${dirName}`, path: dirPath }, raw, dirPath);
      return;
    }
    default:
      error(`Unknown scaffold type: ${type}. Available: context, uat, verification, phase-dir`);
      return; // unreachable but satisfies TS
  }

  if (fs.existsSync(filePath)) {
    output({ created: false, reason: 'already_exists', path: filePath }, raw, 'exists');
    return;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  const relPath = path.relative(cwd, filePath);
  output({ created: true, path: relPath }, raw, relPath);
}
