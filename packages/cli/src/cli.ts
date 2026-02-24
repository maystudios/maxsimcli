/**
 * MAXSIM Tools — CLI utility for MAXSIM workflow operations
 *
 * Replaces repetitive inline bash patterns across ~50 MAXSIM command/workflow/agent files.
 * Centralizes: config parsing, model resolution, phase lookup, git commits, summary verification.
 *
 * Usage: node maxsim-tools.cjs <command> [args] [--raw]
 *
 * This is a direct TypeScript port of maxsim/bin/maxsim-tools.cjs.
 * All imports resolve through @maxsim/core barrel export.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';

import type { TimestampFormat } from '@maxsim/core';

import {
  // Core
  error,
  // Frontmatter
  extractFrontmatter,
  reconstructFrontmatter,
  spliceFrontmatter,
  parseMustHavesBlock,
  FRONTMATTER_SCHEMAS,
  cmdFrontmatterGet,
  cmdFrontmatterSet,
  cmdFrontmatterMerge,
  cmdFrontmatterValidate,
  // Config
  cmdConfigEnsureSection,
  cmdConfigSet,
  cmdConfigGet,
  // Commands
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
  // State
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
  stateExtractField,
  stateReplaceField,
  // Roadmap
  cmdRoadmapGetPhase,
  cmdRoadmapAnalyze,
  cmdRoadmapUpdatePlanProgress,
  // Milestone
  cmdRequirementsMarkComplete,
  cmdMilestoneComplete,
  // Verify
  cmdVerifySummary,
  cmdVerifyPlanStructure,
  cmdVerifyPhaseCompleteness,
  cmdVerifyReferences,
  cmdVerifyCommits,
  cmdVerifyArtifacts,
  cmdVerifyKeyLinks,
  cmdValidateConsistency,
  cmdValidateHealth,
  // Phase
  cmdPhasesList,
  cmdPhaseNextDecimal,
  cmdFindPhase,
  cmdPhasePlanIndex,
  cmdPhaseAdd,
  cmdPhaseInsert,
  cmdPhaseRemove,
  cmdPhaseComplete,
  // Template
  cmdTemplateSelect,
  cmdTemplateFill,
  // Init
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
  cmdInitProgress,
} from '@maxsim/core';

/** Helper: extract a named flag's value from args, returning null if absent */
function getFlag(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

// Namespace groupings for readability (mirrors original CJS structure)
const state = { cmdStateLoad, cmdStateGet, cmdStatePatch, cmdStateUpdate, cmdStateAdvancePlan, cmdStateRecordMetric, cmdStateUpdateProgress, cmdStateAddDecision, cmdStateAddBlocker, cmdStateResolveBlocker, cmdStateRecordSession, cmdStateSnapshot, stateExtractField, stateReplaceField };
const phase = { cmdPhasesList, cmdPhaseNextDecimal, cmdFindPhase, cmdPhasePlanIndex, cmdPhaseAdd, cmdPhaseInsert, cmdPhaseRemove, cmdPhaseComplete };
const roadmap = { cmdRoadmapGetPhase, cmdRoadmapAnalyze, cmdRoadmapUpdatePlanProgress };
const verify = { cmdVerifySummary, cmdVerifyPlanStructure, cmdVerifyPhaseCompleteness, cmdVerifyReferences, cmdVerifyCommits, cmdVerifyArtifacts, cmdVerifyKeyLinks, cmdValidateConsistency, cmdValidateHealth };
const config = { cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet };
const template = { cmdTemplateSelect, cmdTemplateFill };
const milestone = { cmdRequirementsMarkComplete, cmdMilestoneComplete };
const commands = { cmdGenerateSlug, cmdCurrentTimestamp, cmdListTodos, cmdVerifyPathExists, cmdHistoryDigest, cmdResolveModel, cmdCommit, cmdSummaryExtract, cmdWebsearch, cmdProgressRender, cmdTodoComplete, cmdScaffold };
const init = { cmdInitExecutePhase, cmdInitPlanPhase, cmdInitNewProject, cmdInitNewMilestone, cmdInitQuick, cmdInitResume, cmdInitVerifyWork, cmdInitPhaseOp, cmdInitTodos, cmdInitMilestoneOp, cmdInitMapCodebase, cmdInitProgress };
const frontmatter = { cmdFrontmatterGet, cmdFrontmatterSet, cmdFrontmatterMerge, cmdFrontmatterValidate, extractFrontmatter, reconstructFrontmatter, spliceFrontmatter, parseMustHavesBlock, FRONTMATTER_SCHEMAS };

// ─── CLI Router ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
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
    error('Usage: maxsim-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, init');
  }

  switch (command) {
    case 'state': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      } else if (subcommand === 'get') {
        state.cmdStateGet(cwd, args[2], raw);
      } else if (subcommand === 'patch') {
        const patches: Record<string, string> = {};
        for (let i = 2; i < args.length; i += 2) {
          const key = args[i].replace(/^--/, '');
          const value = args[i + 1];
          if (key && value !== undefined) {
            patches[key] = value;
          }
        }
        state.cmdStatePatch(cwd, patches, raw);
      } else if (subcommand === 'advance-plan') {
        state.cmdStateAdvancePlan(cwd, raw);
      } else if (subcommand === 'record-metric') {
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const durationIdx = args.indexOf('--duration');
        const tasksIdx = args.indexOf('--tasks');
        const filesIdx = args.indexOf('--files');
        state.cmdStateRecordMetric(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : '',
          plan: planIdx !== -1 ? args[planIdx + 1] : '',
          duration: durationIdx !== -1 ? args[durationIdx + 1] : '',
          tasks: tasksIdx !== -1 ? args[tasksIdx + 1] : undefined,
          files: filesIdx !== -1 ? args[filesIdx + 1] : undefined,
        }, raw);
      } else if (subcommand === 'update-progress') {
        state.cmdStateUpdateProgress(cwd, raw);
      } else if (subcommand === 'add-decision') {
        const phaseIdx = args.indexOf('--phase');
        const summaryIdx = args.indexOf('--summary');
        const summaryFileIdx = args.indexOf('--summary-file');
        const rationaleIdx = args.indexOf('--rationale');
        const rationaleFileIdx = args.indexOf('--rationale-file');
        state.cmdStateAddDecision(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : undefined,
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : undefined,
          summary_file: summaryFileIdx !== -1 ? args[summaryFileIdx + 1] : undefined,
          rationale: rationaleIdx !== -1 ? args[rationaleIdx + 1] : '',
          rationale_file: rationaleFileIdx !== -1 ? args[rationaleFileIdx + 1] : undefined,
        }, raw);
      } else if (subcommand === 'add-blocker') {
        const textIdx = args.indexOf('--text');
        const textFileIdx = args.indexOf('--text-file');
        state.cmdStateAddBlocker(cwd, {
          text: textIdx !== -1 ? args[textIdx + 1] : undefined,
          text_file: textFileIdx !== -1 ? args[textFileIdx + 1] : undefined,
        }, raw);
      } else if (subcommand === 'resolve-blocker') {
        const textIdx = args.indexOf('--text');
        state.cmdStateResolveBlocker(cwd, textIdx !== -1 ? args[textIdx + 1] : null, raw);
      } else if (subcommand === 'record-session') {
        const stoppedIdx = args.indexOf('--stopped-at');
        const resumeIdx = args.indexOf('--resume-file');
        state.cmdStateRecordSession(cwd, {
          stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : undefined,
          resume_file: resumeIdx !== -1 ? args[resumeIdx + 1] : 'None',
        }, raw);
      } else {
        state.cmdStateLoad(cwd, raw);
      }
      break;
    }

    case 'resolve-model': {
      commands.cmdResolveModel(cwd, args[1], raw);
      break;
    }

    case 'find-phase': {
      phase.cmdFindPhase(cwd, args[1], raw);
      break;
    }

    case 'commit': {
      const amend: boolean = args.includes('--amend');
      const message: string = args[1];
      // Parse --files flag (collect args after --files, stopping at other flags)
      const filesIndex = args.indexOf('--files');
      const files: string[] = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      commands.cmdCommit(cwd, message, files, raw, amend);
      break;
    }

    case 'verify-summary': {
      const summaryPath: string = args[1];
      const countIndex = args.indexOf('--check-count');
      const checkCount: number = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
      verify.cmdVerifySummary(cwd, summaryPath, checkCount, raw);
      break;
    }

    case 'template': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'select') {
        template.cmdTemplateSelect(cwd, args[2], raw);
      } else if (subcommand === 'fill') {
        const templateType: string = args[2];
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const nameIdx = args.indexOf('--name');
        const typeIdx = args.indexOf('--type');
        const waveIdx = args.indexOf('--wave');
        const fieldsIdx = args.indexOf('--fields');
        template.cmdTemplateFill(cwd, templateType, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : '',
          plan: planIdx !== -1 ? args[planIdx + 1] : undefined,
          name: nameIdx !== -1 ? args[nameIdx + 1] : undefined,
          type: typeIdx !== -1 ? args[typeIdx + 1] : 'execute',
          wave: waveIdx !== -1 ? args[waveIdx + 1] : '1',
          fields: fieldsIdx !== -1 ? JSON.parse(args[fieldsIdx + 1]) : {},
        }, raw);
      } else {
        error('Unknown template subcommand. Available: select, fill');
      }
      break;
    }

    case 'frontmatter': {
      const subcommand: string | undefined = args[1];
      const file: string = args[2];
      if (subcommand === 'get') {
        const fieldIdx = args.indexOf('--field');
        frontmatter.cmdFrontmatterGet(cwd, file, getFlag(args, '--field'), raw);
      } else if (subcommand === 'set') {
        frontmatter.cmdFrontmatterSet(cwd, file, getFlag(args, '--field'), getFlag(args, '--value') ?? undefined, raw);
      } else if (subcommand === 'merge') {
        frontmatter.cmdFrontmatterMerge(cwd, file, getFlag(args, '--data'), raw);
      } else if (subcommand === 'validate') {
        frontmatter.cmdFrontmatterValidate(cwd, file, getFlag(args, '--schema'), raw);
      } else {
        error('Unknown frontmatter subcommand. Available: get, set, merge, validate');
      }
      break;
    }

    case 'verify': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'plan-structure') {
        verify.cmdVerifyPlanStructure(cwd, args[2], raw);
      } else if (subcommand === 'phase-completeness') {
        verify.cmdVerifyPhaseCompleteness(cwd, args[2], raw);
      } else if (subcommand === 'references') {
        verify.cmdVerifyReferences(cwd, args[2], raw);
      } else if (subcommand === 'commits') {
        verify.cmdVerifyCommits(cwd, args.slice(2), raw);
      } else if (subcommand === 'artifacts') {
        verify.cmdVerifyArtifacts(cwd, args[2], raw);
      } else if (subcommand === 'key-links') {
        verify.cmdVerifyKeyLinks(cwd, args[2], raw);
      } else {
        error('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
      }
      break;
    }

    case 'generate-slug': {
      commands.cmdGenerateSlug(args[1], raw);
      break;
    }

    case 'current-timestamp': {
      commands.cmdCurrentTimestamp((args[1] || 'full') as TimestampFormat, raw);
      break;
    }

    case 'list-todos': {
      commands.cmdListTodos(cwd, args[1], raw);
      break;
    }

    case 'verify-path-exists': {
      commands.cmdVerifyPathExists(cwd, args[1], raw);
      break;
    }

    case 'config-ensure-section': {
      config.cmdConfigEnsureSection(cwd, raw);
      break;
    }

    case 'config-set': {
      config.cmdConfigSet(cwd, args[1], args[2], raw);
      break;
    }

    case 'config-get': {
      config.cmdConfigGet(cwd, args[1], raw);
      break;
    }

    case 'history-digest': {
      commands.cmdHistoryDigest(cwd, raw);
      break;
    }

    case 'phases': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'list') {
        const typeIndex = args.indexOf('--type');
        const phaseIndex = args.indexOf('--phase');
        const options = {
          type: typeIndex !== -1 ? args[typeIndex + 1] : null,
          phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
          includeArchived: args.includes('--include-archived'),
        };
        phase.cmdPhasesList(cwd, options, raw);
      } else {
        error('Unknown phases subcommand. Available: list');
      }
      break;
    }

    case 'roadmap': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'get-phase') {
        roadmap.cmdRoadmapGetPhase(cwd, args[2], raw);
      } else if (subcommand === 'analyze') {
        roadmap.cmdRoadmapAnalyze(cwd, raw);
      } else if (subcommand === 'update-plan-progress') {
        roadmap.cmdRoadmapUpdatePlanProgress(cwd, args[2], raw);
      } else {
        error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
      }
      break;
    }

    case 'requirements': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'mark-complete') {
        milestone.cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
      } else {
        error('Unknown requirements subcommand. Available: mark-complete');
      }
      break;
    }

    case 'phase': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'next-decimal') {
        phase.cmdPhaseNextDecimal(cwd, args[2], raw);
      } else if (subcommand === 'add') {
        phase.cmdPhaseAdd(cwd, args.slice(2).join(' '), raw);
      } else if (subcommand === 'insert') {
        phase.cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw);
      } else if (subcommand === 'remove') {
        const forceFlag: boolean = args.includes('--force');
        phase.cmdPhaseRemove(cwd, args[2], { force: forceFlag }, raw);
      } else if (subcommand === 'complete') {
        phase.cmdPhaseComplete(cwd, args[2], raw);
      } else {
        error('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
      }
      break;
    }

    case 'milestone': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'complete') {
        const nameIndex = args.indexOf('--name');
        const archivePhases: boolean = args.includes('--archive-phases');
        // Collect --name value (everything after --name until next flag or end)
        let milestoneName: string | null = null;
        if (nameIndex !== -1) {
          const nameArgs: string[] = [];
          for (let i = nameIndex + 1; i < args.length; i++) {
            if (args[i].startsWith('--')) break;
            nameArgs.push(args[i]);
          }
          milestoneName = nameArgs.join(' ') || null;
        }
        milestone.cmdMilestoneComplete(cwd, args[2], { name: milestoneName ?? undefined, archivePhases }, raw);
      } else {
        error('Unknown milestone subcommand. Available: complete');
      }
      break;
    }

    case 'validate': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'consistency') {
        verify.cmdValidateConsistency(cwd, raw);
      } else if (subcommand === 'health') {
        const repairFlag: boolean = args.includes('--repair');
        verify.cmdValidateHealth(cwd, { repair: repairFlag }, raw);
      } else {
        error('Unknown validate subcommand. Available: consistency, health');
      }
      break;
    }

    case 'progress': {
      const subcommand: string = args[1] || 'json';
      commands.cmdProgressRender(cwd, subcommand, raw);
      break;
    }

    case 'todo': {
      const subcommand: string | undefined = args[1];
      if (subcommand === 'complete') {
        commands.cmdTodoComplete(cwd, args[2], raw);
      } else {
        error('Unknown todo subcommand. Available: complete');
      }
      break;
    }

    case 'scaffold': {
      const scaffoldType: string = args[1];
      const phaseIndex = args.indexOf('--phase');
      const nameIndex = args.indexOf('--name');
      const scaffoldOptions = {
        phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
        name: nameIndex !== -1 ? args.slice(nameIndex + 1).join(' ') : null,
      };
      commands.cmdScaffold(cwd, scaffoldType, scaffoldOptions, raw);
      break;
    }

    case 'init': {
      const workflow: string | undefined = args[1];
      switch (workflow) {
        case 'execute-phase':
          init.cmdInitExecutePhase(cwd, args[2], raw);
          break;
        case 'plan-phase':
          init.cmdInitPlanPhase(cwd, args[2], raw);
          break;
        case 'new-project':
          init.cmdInitNewProject(cwd, raw);
          break;
        case 'new-milestone':
          init.cmdInitNewMilestone(cwd, raw);
          break;
        case 'quick':
          init.cmdInitQuick(cwd, args.slice(2).join(' '), raw);
          break;
        case 'resume':
          init.cmdInitResume(cwd, raw);
          break;
        case 'verify-work':
          init.cmdInitVerifyWork(cwd, args[2], raw);
          break;
        case 'phase-op':
          init.cmdInitPhaseOp(cwd, args[2], raw);
          break;
        case 'todos':
          init.cmdInitTodos(cwd, args[2], raw);
          break;
        case 'milestone-op':
          init.cmdInitMilestoneOp(cwd, raw);
          break;
        case 'map-codebase':
          init.cmdInitMapCodebase(cwd, raw);
          break;
        case 'progress':
          init.cmdInitProgress(cwd, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
      }
      break;
    }

    case 'phase-plan-index': {
      phase.cmdPhasePlanIndex(cwd, args[1], raw);
      break;
    }

    case 'state-snapshot': {
      state.cmdStateSnapshot(cwd, raw);
      break;
    }

    case 'summary-extract': {
      const summaryPath: string = args[1];
      const fieldsIndex = args.indexOf('--fields');
      const fields: string[] | null = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
      commands.cmdSummaryExtract(cwd, summaryPath, fields, raw);
      break;
    }

    case 'websearch': {
      const query: string = args[1];
      const limitIdx = args.indexOf('--limit');
      const freshnessIdx = args.indexOf('--freshness');
      await commands.cmdWebsearch(query, {
        limit: limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10,
        freshness: freshnessIdx !== -1 ? args[freshnessIdx + 1] : undefined,
      }, raw);
      break;
    }

    case 'dashboard': {
      await handleDashboard(args.slice(1));
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

/**
 * Dashboard launch command.
 *
 * Spawns the dashboard as a detached subprocess with MAXSIM_PROJECT_CWD set.
 * If the dashboard is already running (detected via /api/health), prints the URL.
 * Supports --stop to kill a running instance.
 */
async function handleDashboard(args: string[]): Promise<void> {
  const DEFAULT_PORT = 3333;
  const PORT_RANGE_END = 3343;
  const HEALTH_TIMEOUT_MS = 1500;

  // Handle --stop flag
  if (args.includes('--stop')) {
    for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
      const running = await checkHealth(port, HEALTH_TIMEOUT_MS);
      if (running) {
        console.log(`Dashboard found on port ${port} — sending shutdown...`);
        // Try to reach a shutdown endpoint, or just inform user
        console.log(`Dashboard at http://localhost:${port} is running.`);
        console.log(`To stop it, close the browser tab or kill the process on port ${port}.`);
        // On Windows: netstat -ano | findstr :PORT, then taskkill /PID
        // On Unix: lsof -i :PORT | awk 'NR>1 {print $2}' | xargs kill
        try {
          if (process.platform === 'win32') {
            const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' }).trim();
            const lines = result.split('\n');
            const pids = new Set<string>();
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && pid !== '0') pids.add(pid);
            }
            for (const pid of pids) {
              try {
                execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                console.log(`Killed process ${pid}`);
              } catch {
                // Process may have already exited
              }
            }
          } else {
            execSync(`lsof -i :${port} -t | xargs kill -SIGTERM 2>/dev/null`, { stdio: 'ignore' });
          }
          console.log('Dashboard stopped.');
        } catch {
          console.log('Could not automatically stop the dashboard. Kill the process manually.');
        }
        return;
      }
    }
    console.log('No running dashboard found.');
    return;
  }

  // Check if dashboard is already running
  for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
    const running = await checkHealth(port, HEALTH_TIMEOUT_MS);
    if (running) {
      console.log(`Dashboard already running at http://localhost:${port}`);
      return;
    }
  }

  // Resolve the dashboard server entry point
  const serverPath = resolveDashboardServer();
  if (!serverPath) {
    console.error('Could not find @maxsim/dashboard server entry point.');
    console.error('Ensure @maxsim/dashboard is installed and built.');
    process.exit(1);
  }

  // Determine runner: if .ts file, use tsx; if .js file, use node
  const isTsFile = serverPath.endsWith('.ts');
  const runner = isTsFile ? 'node' : 'node';
  const runnerArgs: string[] = isTsFile ? ['--import', 'tsx', serverPath] : [serverPath];

  console.log('Dashboard starting...');

  const child = spawn(runner, runnerArgs, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      MAXSIM_PROJECT_CWD: process.cwd(),
      NODE_ENV: isTsFile ? 'development' : 'production',
    },
    // On Windows, use shell to ensure detached works correctly
    ...(process.platform === 'win32' ? { shell: true } : {}),
  });

  child.unref();

  // Wait briefly for the server to start, then check health
  await new Promise((resolve) => setTimeout(resolve, 3000));

  for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
    const running = await checkHealth(port, HEALTH_TIMEOUT_MS);
    if (running) {
      console.log(`Dashboard ready at http://localhost:${port}`);
      return;
    }
  }

  console.log(`Dashboard spawned (PID ${child.pid}). It may take a moment to start.`);
  console.log(`Check http://localhost:${DEFAULT_PORT} once ready.`);
}

/**
 * Check if a dashboard health endpoint is responding on the given port.
 */
async function checkHealth(port: number, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json() as { status?: string };
      return data.status === 'ok';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve the dashboard server entry point path.
 * Tries: built server.js first, then source server.ts for dev mode.
 */
function resolveDashboardServer(): string | null {
  // Strategy 1: Resolve from @maxsim/dashboard package
  try {
    const require_ = createRequire(import.meta.url);
    const pkgPath = require_.resolve('@maxsim/dashboard/package.json');
    const pkgDir = path.dirname(pkgPath);

    // Prefer built server.js for production
    const serverJs = path.join(pkgDir, 'server.js');
    if (fs.existsSync(serverJs)) return serverJs;

    // Fall back to source server.ts for dev (requires tsx)
    const serverTs = path.join(pkgDir, 'server.ts');
    if (fs.existsSync(serverTs)) return serverTs;
  } catch {
    // @maxsim/dashboard not resolvable
  }

  // Strategy 2: Walk up from this file to find the monorepo root
  try {
    let dir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, remove leading / from /C:/...
    if (process.platform === 'win32' && dir.startsWith('/')) {
      dir = dir.slice(1);
    }
    for (let i = 0; i < 5; i++) {
      const candidate = path.join(dir, 'packages', 'dashboard', 'server.ts');
      if (fs.existsSync(candidate)) return candidate;
      const candidateJs = path.join(dir, 'packages', 'dashboard', 'server.js');
      if (fs.existsSync(candidateJs)) return candidateJs;
      dir = path.dirname(dir);
    }
  } catch {
    // Fallback walk failed
  }

  return null;
}

main();
