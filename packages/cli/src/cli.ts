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

// ─── Result handler ──────────────────────────────────────────────────────────

/** Convert a CmdResult into the output()/error() signal expected by main(). */
function handleResult(r: CmdResult, raw: boolean): never {
  if (r.ok) {
    // Re-use the existing CliOutput signal mechanism
    throw new CliOutput(r.result, raw, r.rawValue);
  }
  throw new CliError(r.error);
}

/** Async variant for promise-returning commands. */
async function handleResultAsync(p: Promise<CmdResult>, raw: boolean): Promise<never> {
  return handleResult(await p, raw);
}

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

// ─── Command handler type ────────────────────────────────────────────────────

type Handler = (args: string[], cwd: string, raw: boolean) => void | Promise<void>;

// ─── Subcommand handlers ─────────────────────────────────────────────────────

const handleState: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => void | Promise<void>> = {
    'update': () => cmdStateUpdate(cwd, args[2], args[3]),
    'get': () => cmdStateGet(cwd, args[2], raw),
    'patch': () => {
      const patches: Record<string, string> = {};
      for (let i = 2; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        if (key && value !== undefined) patches[key] = value;
      }
      cmdStatePatch(cwd, patches, raw);
    },
    'advance-plan': () => cmdStateAdvancePlan(cwd, raw),
    'record-metric': () => {
      const f = getFlags(args, 'phase', 'plan', 'duration', 'tasks', 'files');
      cmdStateRecordMetric(cwd, {
        phase: f.phase ?? '', plan: f.plan ?? '', duration: f.duration ?? '',
        tasks: f.tasks ?? undefined, files: f.files ?? undefined,
      }, raw);
    },
    'update-progress': () => cmdStateUpdateProgress(cwd, raw),
    'add-decision': () => {
      const f = getFlags(args, 'phase', 'summary', 'summary-file', 'rationale', 'rationale-file');
      cmdStateAddDecision(cwd, {
        phase: f.phase ?? undefined, summary: f.summary ?? undefined,
        summary_file: f['summary-file'] ?? undefined,
        rationale: f.rationale ?? '', rationale_file: f['rationale-file'] ?? undefined,
      }, raw);
    },
    'add-blocker': () => {
      const f = getFlags(args, 'text', 'text-file');
      cmdStateAddBlocker(cwd, { text: f.text ?? undefined, text_file: f['text-file'] ?? undefined }, raw);
    },
    'resolve-blocker': () => cmdStateResolveBlocker(cwd, getFlag(args, '--text'), raw),
    'record-session': () => {
      const f = getFlags(args, 'stopped-at', 'resume-file');
      cmdStateRecordSession(cwd, {
        stopped_at: f['stopped-at'] ?? undefined,
        resume_file: f['resume-file'] ?? 'None',
      }, raw);
    },
  };

  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
  return cmdStateLoad(cwd, raw);
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
    'commits': async () => handleResultAsync(cmdVerifyCommits(cwd, args.slice(2)), raw),
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
    await cmdPhasesList(cwd, {
      type: f.type,
      phase: f.phase,
      includeArchived: hasFlag(args, 'include-archived'),
      offset: f.offset !== null ? parseInt(f.offset, 10) : undefined,
      limit: f.limit !== null ? parseInt(f.limit, 10) : undefined,
    }, raw);
  } else {
    error('Unknown phases subcommand. Available: list');
  }
};

const handleRoadmap: Handler = async (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => void | Promise<void>> = {
    'get-phase': () => cmdRoadmapGetPhase(cwd, args[2], raw),
    'analyze': () => cmdRoadmapAnalyze(cwd, raw),
    'update-plan-progress': () => cmdRoadmapUpdatePlanProgress(cwd, args[2], raw),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
  error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
};

const handlePhase: Handler = (args, cwd, raw) => {
  const sub = args[1];
  const handlers: Record<string, () => void> = {
    'next-decimal': () => cmdPhaseNextDecimal(cwd, args[2], raw),
    'add': () => cmdPhaseAdd(cwd, args.slice(2).join(' '), raw),
    'insert': () => cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw),
    'remove': () => cmdPhaseRemove(cwd, args[2], { force: hasFlag(args, 'force') }, raw),
    'complete': () => cmdPhaseComplete(cwd, args[2], raw),
  };
  const handler = sub ? handlers[sub] : undefined;
  if (handler) return handler();
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
  const handlers: Record<string, () => void> = {
    'execute-phase': () => cmdInitExecutePhase(cwd, args[2], raw),
    'plan-phase': () => cmdInitPlanPhase(cwd, args[2], raw),
    'new-project': () => cmdInitNewProject(cwd, raw),
    'new-milestone': () => cmdInitNewMilestone(cwd, raw),
    'quick': () => cmdInitQuick(cwd, args.slice(2).join(' '), raw),
    'resume': () => cmdInitResume(cwd, raw),
    'verify-work': () => cmdInitVerifyWork(cwd, args[2], raw),
    'phase-op': () => cmdInitPhaseOp(cwd, args[2], raw),
    'todos': () => cmdInitTodos(cwd, args[2], raw),
    'milestone-op': () => cmdInitMilestoneOp(cwd, raw),
    'map-codebase': () => cmdInitMapCodebase(cwd, raw),
    'init-existing': () => cmdInitExisting(cwd, raw),
    'progress': () => cmdInitProgress(cwd, raw),
  };
  const handler = workflow ? handlers[workflow] : undefined;
  if (handler) return handler();
  error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, init-existing, progress`);
};

// ─── Command registry ────────────────────────────────────────────────────────

const COMMANDS: Record<string, Handler> = {
  'state': handleState,
  'resolve-model': (args, cwd, raw) => cmdResolveModel(cwd, args[1], raw),
  'find-phase': (args, cwd, raw) => cmdFindPhase(cwd, args[1], raw),
  'commit': async (args, cwd, raw) => {
    const files = args.indexOf('--files') !== -1
      ? args.slice(args.indexOf('--files') + 1).filter(a => !a.startsWith('--'))
      : [];
    await cmdCommit(cwd, args[1], files, raw, hasFlag(args, 'amend'));
  },
  'verify-summary': async (args, cwd, raw) => {
    const countIndex = args.indexOf('--check-count');
    const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
    await handleResultAsync(cmdVerifySummary(cwd, args[1], checkCount), raw);
  },
  'template': handleTemplate,
  'frontmatter': handleFrontmatter,
  'verify': handleVerify,
  'generate-slug': (args, _cwd, raw) => cmdGenerateSlug(args[1], raw),
  'current-timestamp': (args, _cwd, raw) => cmdCurrentTimestamp((args[1] || 'full') as TimestampFormat, raw),
  'list-todos': (args, cwd, raw) => cmdListTodos(cwd, args[1], raw),
  'verify-path-exists': (args, cwd, raw) => cmdVerifyPathExists(cwd, args[1], raw),
  'config-ensure-section': (_args, cwd, raw) => cmdConfigEnsureSection(cwd, raw),
  'config-set': (args, cwd, raw) => cmdConfigSet(cwd, args[1], args[2], raw),
  'config-get': (args, cwd, raw) => cmdConfigGet(cwd, args[1], raw),
  'history-digest': (_args, cwd, raw) => cmdHistoryDigest(cwd, raw),
  'phases': handlePhases,
  'roadmap': handleRoadmap,
  'requirements': (args, cwd, raw) => {
    if (args[1] === 'mark-complete') handleResult(cmdRequirementsMarkComplete(cwd, args.slice(2)), raw);
    else error('Unknown requirements subcommand. Available: mark-complete');
  },
  'phase': handlePhase,
  'milestone': handleMilestone,
  'validate': handleValidate,
  'progress': (args, cwd, raw) => cmdProgressRender(cwd, args[1] || 'json', raw),
  'todo': (args, cwd, raw) => {
    if (args[1] === 'complete') cmdTodoComplete(cwd, args[2], raw);
    else error('Unknown todo subcommand. Available: complete');
  },
  'scaffold': (args, cwd, raw) => {
    const f = getFlags(args, 'phase', 'name');
    cmdScaffold(cwd, args[1], { phase: f.phase, name: f.name ? args.slice(args.indexOf('--name') + 1).join(' ') : null }, raw);
  },
  'init': handleInit,
  'phase-plan-index': (args, cwd, raw) => cmdPhasePlanIndex(cwd, args[1], raw),
  'state-snapshot': (_args, cwd, raw) => cmdStateSnapshot(cwd, raw),
  'summary-extract': (args, cwd, raw) => {
    const fieldsIndex = args.indexOf('--fields');
    const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
    cmdSummaryExtract(cwd, args[1], fields, raw);
  },
  'websearch': async (args, _cwd, raw) => {
    const f = getFlags(args, 'limit', 'freshness');
    await cmdWebsearch(args[1], {
      limit: f.limit ? parseInt(f.limit, 10) : 10,
      freshness: f.freshness ?? undefined,
    }, raw);
  },
  'artefakte-read': (args, cwd, raw) => cmdArtefakteRead(cwd, args[1], getFlag(args, '--phase') ?? undefined, raw),
  'artefakte-write': (args, cwd, raw) => cmdArtefakteWrite(cwd, args[1], getFlag(args, '--content') ?? undefined, getFlag(args, '--phase') ?? undefined, raw),
  'artefakte-append': (args, cwd, raw) => cmdArtefakteAppend(cwd, args[1], getFlag(args, '--entry') ?? undefined, getFlag(args, '--phase') ?? undefined, raw),
  'artefakte-list': (args, cwd, raw) => cmdArtefakteList(cwd, getFlag(args, '--phase') ?? undefined, raw),
  'context-load': (args, cwd, raw) => handleResult(cmdContextLoad(cwd, getFlag(args, '--phase') ?? undefined, getFlag(args, '--topic') ?? undefined, hasFlag(args, 'include-history')), raw),
  'start': async (args, cwd, raw) => cmdStart(cwd, { noBrowser: hasFlag(args, 'no-browser'), networkMode: hasFlag(args, 'network') }, raw),
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
