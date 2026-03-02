/**
 * MAXSIM Tools — CLI utility for MAXSIM workflow operations
 *
 * Usage: node maxsim-tools.cjs <command> [args] [--raw]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

import type { TimestampFormat, CmdResult } from './core/index.js';

import {
  output,
  error,
  CliOutput,
  CliError,
  writeOutput,
  cmdFrontmatterGet,
  cmdFrontmatterSet,
  cmdFrontmatterMerge,
  cmdFrontmatterValidate,
  cmdConfigEnsureSection,
  cmdConfigSet,
  cmdConfigGet,
  cmdGenerateSlug,
  cmdCurrentTimestamp,
  cmdListTodos,
  cmdVerifyPathExists,
  cmdHistoryDigest,
  cmdResolveModel,
  cmdCommit,
  cmdSummaryExtract,
  cmdWebsearch,
  cmdProgressRender,
  cmdTodoComplete,
  cmdScaffold,
  cmdStateLoad,
  cmdStateGet,
  cmdStatePatch,
  cmdStateUpdate,
  cmdStateAdvancePlan,
  cmdStateRecordMetric,
  cmdStateUpdateProgress,
  cmdStateAddDecision,
  cmdStateAddBlocker,
  cmdStateResolveBlocker,
  cmdStateRecordSession,
  cmdStateSnapshot,
  cmdRoadmapGetPhase,
  cmdRoadmapAnalyze,
  cmdRoadmapUpdatePlanProgress,
  cmdRequirementsMarkComplete,
  cmdMilestoneComplete,
  cmdVerifySummary,
  cmdVerifyPlanStructure,
  cmdVerifyPhaseCompleteness,
  cmdVerifyReferences,
  cmdVerifyCommits,
  cmdVerifyArtifacts,
  cmdVerifyKeyLinks,
  cmdValidateConsistency,
  cmdValidateHealth,
  cmdPhasesList,
  cmdPhaseNextDecimal,
  cmdFindPhase,
  cmdPhasePlanIndex,
  cmdPhaseAdd,
  cmdPhaseInsert,
  cmdPhaseRemove,
  cmdPhaseComplete,
  cmdTemplateSelect,
  cmdTemplateFill,
  cmdInitExecutePhase,
  cmdInitPlanPhase,
  cmdInitNewProject,
  cmdInitNewMilestone,
  cmdInitQuick,
  cmdInitResume,
  cmdInitVerifyWork,
  cmdInitPhaseOp,
  cmdInitTodos,
  cmdInitMilestoneOp,
  cmdInitMapCodebase,
  cmdInitExisting,
  cmdInitProgress,
  cmdArtefakteRead,
  cmdArtefakteWrite,
  cmdArtefakteAppend,
  cmdArtefakteList,
  cmdContextLoad,
  cmdStart,
} from './core/index.js';

// ─── Arg parsing utilities ───────────────────────────────────────────────────

/** Extract a single named flag's value from args */
function getFlag(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

/** Extract multiple named flags at once. Keys are flag names without -- prefix. */
function getFlags(args: string[], ...flags: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const flag of flags) {
    const idx = args.indexOf(`--${flag}`);
    result[flag] = idx !== -1 ? args[idx + 1] ?? null : null;
  }
  return result;
}

/** Check if a boolean flag is present */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

// ─── Result dispatcher ───────────────────────────────────────────────────────

/** Convert a CmdResult into the appropriate output()/error() call. */
function handleResult(r: CmdResult, raw: boolean): never {
  if (r.ok) output(r.result, raw, r.rawValue);
  else error(r.error);
}

// ─── Command handler type ────────────────────────────────────────────────────

type Handler = (args: string[], cwd: string, raw: boolean) => void | Promise<void>;

// ─── Subcommand handlers ─────────────────────────────────────────────────────

const handleState: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => CmdResult | Promise<CmdResult>> = {
    'update': () => cmdStateUpdate(cwd, args[2], args[3]),
    'get': () => cmdStateGet(cwd, args[2], raw),
    'patch': () => {
      const patches: Record<string, string> = {};
      for (let i = 2; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        if (key && value !== undefined) patches[key] = value;
      }
      return cmdStatePatch(cwd, patches, raw);
    },
    'advance-plan': () => cmdStateAdvancePlan(cwd, raw),
    'record-metric': () => {
      const f = getFlags(args, 'phase', 'plan', 'duration', 'tasks', 'files');
      return cmdStateRecordMetric(cwd, {
        phase: f.phase ?? '', plan: f.plan ?? '', duration: f.duration ?? '',
        tasks: f.tasks ?? undefined, files: f.files ?? undefined,
      }, raw);
    },
    'update-progress': () => cmdStateUpdateProgress(cwd, raw),
    'add-decision': () => {
      const f = getFlags(args, 'phase', 'summary', 'summary-file', 'rationale', 'rationale-file');
      return cmdStateAddDecision(cwd, {
        phase: f.phase ?? undefined, summary: f.summary ?? undefined,
        summary_file: f['summary-file'] ?? undefined,
        rationale: f.rationale ?? '', rationale_file: f['rationale-file'] ?? undefined,
      }, raw);
    },
    'add-blocker': () => {
      const f = getFlags(args, 'text', 'text-file');
      return cmdStateAddBlocker(cwd, { text: f.text ?? undefined, text_file: f['text-file'] ?? undefined }, raw);
    },
    'resolve-blocker': () => cmdStateResolveBlocker(cwd, getFlag(args, '--text'), raw),
    'record-session': () => {
      const f = getFlags(args, 'stopped-at', 'resume-file');
      return cmdStateRecordSession(cwd, {
        stopped_at: f['stopped-at'] ?? undefined,
        resume_file: f['resume-file'] ?? 'None',
      }, raw);
    },
  };

  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handleResult(await handler(), raw);
  return handleResult(await cmdStateLoad(cwd, raw), raw);
};

const handleTemplate: Handler = (args, cwd, raw) => {
  const sub = args[1];
  if (sub === 'select') {
    handleResult(cmdTemplateSelect(cwd, args[2]), raw);
  } else if (sub === 'fill') {
    const f = getFlags(args, 'phase', 'plan', 'name', 'type', 'wave', 'fields');
    handleResult(cmdTemplateFill(cwd, args[2], {
      phase: f.phase ?? '', plan: f.plan ?? undefined, name: f.name ?? undefined,
      type: f.type ?? 'execute', wave: f.wave ?? '1',
      fields: f.fields ? JSON.parse(f.fields) : {},
    }), raw);
  } else {
    error('Unknown template subcommand. Available: select, fill');
  }
};

const handleFrontmatter: Handler = (args, cwd, raw) => {
  const sub = args[1];
  const file = args[2];
  const handlers: Record<string, () => void> = {
    'get': () => handleResult(cmdFrontmatterGet(cwd, file, getFlag(args, '--field')), raw),
    'set': () => handleResult(cmdFrontmatterSet(cwd, file, getFlag(args, '--field'), getFlag(args, '--value') ?? undefined), raw),
    'merge': () => handleResult(cmdFrontmatterMerge(cwd, file, getFlag(args, '--data')), raw),
    'validate': () => handleResult(cmdFrontmatterValidate(cwd, file, getFlag(args, '--schema')), raw),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
  error('Unknown frontmatter subcommand. Available: get, set, merge, validate');
};

const handleVerify: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => void | Promise<void>> = {
    'plan-structure': () => handleResult(cmdVerifyPlanStructure(cwd, args[2]), raw),
    'phase-completeness': () => handleResult(cmdVerifyPhaseCompleteness(cwd, args[2]), raw),
    'references': () => handleResult(cmdVerifyReferences(cwd, args[2]), raw),
    'commits': async () => handleResult(await cmdVerifyCommits(cwd, args.slice(2)), raw),
    'artifacts': () => handleResult(cmdVerifyArtifacts(cwd, args[2]), raw),
    'key-links': () => handleResult(cmdVerifyKeyLinks(cwd, args[2]), raw),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
  error('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
};

const handlePhases: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  if (sub === 'list') {
    const f = getFlags(args, 'type', 'phase', 'offset', 'limit');
    handleResult(await cmdPhasesList(cwd, {
      type: f.type,
      phase: f.phase,
      includeArchived: hasFlag(args, 'include-archived'),
      offset: f.offset !== null ? parseInt(f.offset, 10) : undefined,
      limit: f.limit !== null ? parseInt(f.limit, 10) : undefined,
    }), raw);
  } else {
    error('Unknown phases subcommand. Available: list');
  }
};

const handleRoadmap: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => CmdResult | Promise<CmdResult>> = {
    'get-phase': () => cmdRoadmapGetPhase(cwd, args[2]),
    'analyze': () => cmdRoadmapAnalyze(cwd),
    'update-plan-progress': () => cmdRoadmapUpdatePlanProgress(cwd, args[2]),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handleResult(await handler(), raw);
  error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
};

const handlePhase: Handler = (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => CmdResult> = {
    'next-decimal': () => cmdPhaseNextDecimal(cwd, args[2]),
    'add': () => cmdPhaseAdd(cwd, args.slice(2).join(' ')),
    'insert': () => cmdPhaseInsert(cwd, args[2], args.slice(3).join(' ')),
    'remove': () => cmdPhaseRemove(cwd, args[2], { force: hasFlag(args, 'force') }),
    'complete': () => cmdPhaseComplete(cwd, args[2]),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handleResult(handler(), raw);
  error('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
};

const handleMilestone: Handler = (args, cwd, raw) => {
  const sub = args[1];
  if (sub === 'complete') {
    const nameIndex = args.indexOf('--name');
    let milestoneName: string | null = null;
    if (nameIndex !== -1) {
      const nameArgs: string[] = [];
      for (let i = nameIndex + 1; i < args.length; i++) {
        if (args[i].startsWith('--')) break;
        nameArgs.push(args[i]);
      }
      milestoneName = nameArgs.join(' ') || null;
    }
    handleResult(cmdMilestoneComplete(cwd, args[2], {
      name: milestoneName ?? undefined,
      archivePhases: hasFlag(args, 'archive-phases'),
    }), raw);
  } else {
    error('Unknown milestone subcommand. Available: complete');
  }
};

const handleValidate: Handler = (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => void> = {
    'consistency': () => handleResult(cmdValidateConsistency(cwd), raw),
    'health': () => handleResult(cmdValidateHealth(cwd, { repair: hasFlag(args, 'repair') }), raw),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
  error('Unknown validate subcommand. Available: consistency, health');
};

const handleInit: Handler = (args, cwd, raw) => {
  const workflow = args[1];
  const handlers: Record<string, () => CmdResult> = {
    'execute-phase': () => cmdInitExecutePhase(cwd, args[2]),
    'plan-phase': () => cmdInitPlanPhase(cwd, args[2]),
    'new-project': () => cmdInitNewProject(cwd),
    'new-milestone': () => cmdInitNewMilestone(cwd),
    'quick': () => cmdInitQuick(cwd, args.slice(2).join(' ')),
    'resume': () => cmdInitResume(cwd),
    'verify-work': () => cmdInitVerifyWork(cwd, args[2]),
    'phase-op': () => cmdInitPhaseOp(cwd, args[2]),
    'todos': () => cmdInitTodos(cwd, args[2]),
    'milestone-op': () => cmdInitMilestoneOp(cwd),
    'map-codebase': () => cmdInitMapCodebase(cwd),
    'init-existing': () => cmdInitExisting(cwd),
    'progress': () => cmdInitProgress(cwd),
  };
  const handler = workflow ? handlers[workflow] : undefined;
  if (handler) return handleResult(handler(), raw);
  error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, init-existing, progress`);
};

// ─── Command registry ────────────────────────────────────────────────────────

const COMMANDS: Record<string, Handler> = {
  'state': handleState,
  'resolve-model': (args, cwd, raw) => handleResult(cmdResolveModel(cwd, args[1], raw), raw),
  'find-phase': (args, cwd, raw) => handleResult(cmdFindPhase(cwd, args[1]), raw),
  'commit': async (args, cwd, raw) => {
    const files = args.indexOf('--files') !== -1
      ? args.slice(args.indexOf('--files') + 1).filter(a => !a.startsWith('--'))
      : [];
    handleResult(await cmdCommit(cwd, args[1], files, raw, hasFlag(args, 'amend')), raw);
  },
  'verify-summary': async (args, cwd, raw) => {
    const countIndex = args.indexOf('--check-count');
    const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
    handleResult(await cmdVerifySummary(cwd, args[1], checkCount), raw);
  },
  'template': handleTemplate,
  'frontmatter': handleFrontmatter,
  'verify': handleVerify,
  'generate-slug': (args, _cwd, raw) => handleResult(cmdGenerateSlug(args[1], raw), raw),
  'current-timestamp': (args, _cwd, raw) => handleResult(cmdCurrentTimestamp((args[1] || 'full') as TimestampFormat, raw), raw),
  'list-todos': (args, cwd, raw) => handleResult(cmdListTodos(cwd, args[1], raw), raw),
  'verify-path-exists': (args, cwd, raw) => handleResult(cmdVerifyPathExists(cwd, args[1], raw), raw),
  'config-ensure-section': (_args, cwd, raw) => handleResult(cmdConfigEnsureSection(cwd, raw), raw),
  'config-set': (args, cwd, raw) => handleResult(cmdConfigSet(cwd, args[1], args[2], raw), raw),
  'config-get': (args, cwd, raw) => handleResult(cmdConfigGet(cwd, args[1], raw), raw),
  'history-digest': (_args, cwd, raw) => handleResult(cmdHistoryDigest(cwd, raw), raw),
  'phases': handlePhases,
  'roadmap': handleRoadmap,
  'requirements': (args, cwd, raw) => {
    if (args[1] === 'mark-complete') handleResult(cmdRequirementsMarkComplete(cwd, args.slice(2)), raw);
    else error('Unknown requirements subcommand. Available: mark-complete');
  },
  'phase': handlePhase,
  'milestone': handleMilestone,
  'validate': handleValidate,
  'progress': (args, cwd, raw) => handleResult(cmdProgressRender(cwd, args[1] || 'json', raw), raw),
  'todo': (args, cwd, raw) => {
    if (args[1] === 'complete') handleResult(cmdTodoComplete(cwd, args[2], raw), raw);
    else error('Unknown todo subcommand. Available: complete');
  },
  'scaffold': (args, cwd, raw) => {
    const f = getFlags(args, 'phase', 'name');
    handleResult(cmdScaffold(cwd, args[1], { phase: f.phase, name: f.name ? args.slice(args.indexOf('--name') + 1).join(' ') : null }, raw), raw);
  },
  'init': handleInit,
  'phase-plan-index': (args, cwd, raw) => handleResult(cmdPhasePlanIndex(cwd, args[1]), raw),
  'state-snapshot': (_args, cwd, raw) => handleResult(cmdStateSnapshot(cwd, raw), raw),
  'summary-extract': (args, cwd, raw) => {
    const fieldsIndex = args.indexOf('--fields');
    const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
    handleResult(cmdSummaryExtract(cwd, args[1], fields, raw), raw);
  },
  'websearch': async (args, _cwd, raw) => {
    const f = getFlags(args, 'limit', 'freshness');
    handleResult(await cmdWebsearch(args[1], {
      limit: f.limit ? parseInt(f.limit, 10) : 10,
      freshness: f.freshness ?? undefined,
    }, raw), raw);
  },
  'artefakte-read': (args, cwd, raw) => handleResult(cmdArtefakteRead(cwd, args[1], getFlag(args, '--phase') ?? undefined, raw), raw),
  'artefakte-write': (args, cwd, raw) => handleResult(cmdArtefakteWrite(cwd, args[1], getFlag(args, '--content') ?? undefined, getFlag(args, '--phase') ?? undefined, raw), raw),
  'artefakte-append': (args, cwd, raw) => handleResult(cmdArtefakteAppend(cwd, args[1], getFlag(args, '--entry') ?? undefined, getFlag(args, '--phase') ?? undefined, raw), raw),
  'artefakte-list': (args, cwd, raw) => handleResult(cmdArtefakteList(cwd, getFlag(args, '--phase') ?? undefined, raw), raw),
  'context-load': (args, cwd, raw) => handleResult(cmdContextLoad(cwd, getFlag(args, '--phase') ?? undefined, getFlag(args, '--topic') ?? undefined, hasFlag(args, 'include-history')), raw),
  'start': async (args, cwd, raw) => handleResult(await cmdStart(cwd, { noBrowser: hasFlag(args, 'no-browser'), networkMode: hasFlag(args, 'network') }), raw),
  'dashboard': (args) => handleDashboard(args.slice(1)),
  'start-server': async () => {
    const serverPath = path.join(__dirname, 'mcp-server.cjs');
    const child = spawn(process.execPath, [serverPath], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
  },
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const args: string[] = process.argv.slice(2);

    // Optional cwd override for sandboxed subagents running outside project root.
    let cwd: string = process.cwd();
    const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
    const cwdIdx = args.indexOf('--cwd');
    if (cwdEqArg) {
      const value = cwdEqArg.slice('--cwd='.length).trim();
      if (!value) error('Missing value for --cwd');
      args.splice(args.indexOf(cwdEqArg), 1);
      cwd = path.resolve(value);
    } else if (cwdIdx !== -1) {
      const value = args[cwdIdx + 1];
      if (!value || value.startsWith('--')) error('Missing value for --cwd');
      args.splice(cwdIdx, 2);
      cwd = path.resolve(value);
    }

    if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
      error(`Invalid --cwd: ${cwd}`);
    }

    const rawIndex = args.indexOf('--raw');
    const raw: boolean = rawIndex !== -1;
    if (rawIndex !== -1) args.splice(rawIndex, 1);

    const command: string | undefined = args[0];

    if (!command) {
      error(`Usage: maxsim-tools <command> [args] [--raw] [--cwd <path>]\nCommands: ${Object.keys(COMMANDS).join(', ')}`);
    }

    const handler = COMMANDS[command];
    if (!handler) {
      error(`Unknown command: ${command}`);
    }

    await handler(args, cwd, raw);
  } catch (thrown: unknown) {
    if (thrown instanceof CliOutput) {
      writeOutput(thrown);
      process.exit(0);
    }
    if (thrown instanceof CliError) {
      process.stderr.write('Error: ' + thrown.message + '\n');
      process.exit(1);
    }
    // Re-throw unexpected errors
    throw thrown;
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

import {
  checkHealth,
  findRunningDashboard,
  killProcessOnPort,
  resolveDashboardServer,
  readDashboardConfig,
  ensureNodePty,
  spawnDashboard,
  DEFAULT_PORT,
  PORT_RANGE_END,
} from './core/dashboard-launcher.js';

/**
 * Dashboard launch command.
 *
 * Spawns the dashboard as a detached subprocess with MAXSIM_PROJECT_CWD set.
 * If the dashboard is already running (detected via /api/health), prints the URL.
 * Supports --stop to kill a running instance.
 */
async function handleDashboard(args: string[]): Promise<void> {
  const networkMode = args.includes('--network');

  // Handle --stop flag
  if (args.includes('--stop')) {
    for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
      const running = await checkHealth(port);
      if (running) {
        console.log(`Dashboard found on port ${port} — stopping...`);
        killProcessOnPort(port);
        console.log('Dashboard stopped.');
        return;
      }
    }
    console.log('No running dashboard found.');
    return;
  }

  // Check if dashboard is already running
  const runningPort = await findRunningDashboard();
  if (runningPort) {
    console.log(`Dashboard already running at http://localhost:${runningPort}`);
    return;
  }

  // Resolve the dashboard server entry point
  const serverPath = resolveDashboardServer();
  if (!serverPath) {
    console.error('Could not find @maxsim/dashboard server entry point.');
    console.error('Ensure @maxsim/dashboard is installed and built.');
    process.exit(1);
  }

  const serverDir = path.dirname(serverPath);
  const dashConfig = readDashboardConfig(serverPath);

  // Auto-install node-pty if missing
  console.log('Installing node-pty for terminal support...');
  if (!ensureNodePty(serverDir)) {
    console.warn('node-pty installation failed — terminal will be unavailable.');
  }

  console.log('Dashboard starting...');

  const pid = spawnDashboard({
    serverPath,
    projectCwd: dashConfig.projectCwd,
    networkMode,
  });

  // Wait briefly for the server to start, then check health
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const readyPort = await findRunningDashboard();
  if (readyPort) {
    console.log(`Dashboard ready at http://localhost:${readyPort}`);
    return;
  }

  console.log(`Dashboard spawned (PID ${pid}). It may take a moment to start.`);
  console.log(`Check http://localhost:${DEFAULT_PORT} once ready.`);
}

main();
