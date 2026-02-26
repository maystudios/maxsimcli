"use strict";
/**
 * MAXSIM Tools — CLI utility for MAXSIM workflow operations
 *
 * Usage: node maxsim-tools.cjs <command> [args] [--raw]
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const node_child_process_1 = require("node:child_process");
const node_module_1 = require("node:module");
const index_js_1 = require("./core/index.js");
// ─── Arg parsing utilities ───────────────────────────────────────────────────
/** Extract a single named flag's value from args */
function getFlag(args, flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] ?? null : null;
}
/** Extract multiple named flags at once. Keys are flag names without -- prefix. */
function getFlags(args, ...flags) {
    const result = {};
    for (const flag of flags) {
        const idx = args.indexOf(`--${flag}`);
        result[flag] = idx !== -1 ? args[idx + 1] ?? null : null;
    }
    return result;
}
/** Check if a boolean flag is present */
function hasFlag(args, flag) {
    return args.includes(`--${flag}`);
}
// ─── Subcommand handlers ─────────────────────────────────────────────────────
const handleState = (args, cwd, raw) => {
    const sub = args[1];
    const handlers = {
        'update': () => (0, index_js_1.cmdStateUpdate)(cwd, args[2], args[3]),
        'get': () => (0, index_js_1.cmdStateGet)(cwd, args[2], raw),
        'patch': () => {
            const patches = {};
            for (let i = 2; i < args.length; i += 2) {
                const key = args[i].replace(/^--/, '');
                const value = args[i + 1];
                if (key && value !== undefined)
                    patches[key] = value;
            }
            (0, index_js_1.cmdStatePatch)(cwd, patches, raw);
        },
        'advance-plan': () => (0, index_js_1.cmdStateAdvancePlan)(cwd, raw),
        'record-metric': () => {
            const f = getFlags(args, 'phase', 'plan', 'duration', 'tasks', 'files');
            (0, index_js_1.cmdStateRecordMetric)(cwd, {
                phase: f.phase ?? '', plan: f.plan ?? '', duration: f.duration ?? '',
                tasks: f.tasks ?? undefined, files: f.files ?? undefined,
            }, raw);
        },
        'update-progress': () => (0, index_js_1.cmdStateUpdateProgress)(cwd, raw),
        'add-decision': () => {
            const f = getFlags(args, 'phase', 'summary', 'summary-file', 'rationale', 'rationale-file');
            (0, index_js_1.cmdStateAddDecision)(cwd, {
                phase: f.phase ?? undefined, summary: f.summary ?? undefined,
                summary_file: f['summary-file'] ?? undefined,
                rationale: f.rationale ?? '', rationale_file: f['rationale-file'] ?? undefined,
            }, raw);
        },
        'add-blocker': () => {
            const f = getFlags(args, 'text', 'text-file');
            (0, index_js_1.cmdStateAddBlocker)(cwd, { text: f.text ?? undefined, text_file: f['text-file'] ?? undefined }, raw);
        },
        'resolve-blocker': () => (0, index_js_1.cmdStateResolveBlocker)(cwd, getFlag(args, '--text'), raw),
        'record-session': () => {
            const f = getFlags(args, 'stopped-at', 'resume-file');
            (0, index_js_1.cmdStateRecordSession)(cwd, {
                stopped_at: f['stopped-at'] ?? undefined,
                resume_file: f['resume-file'] ?? 'None',
            }, raw);
        },
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.cmdStateLoad)(cwd, raw);
};
const handleTemplate = (args, cwd, raw) => {
    const sub = args[1];
    if (sub === 'select') {
        (0, index_js_1.cmdTemplateSelect)(cwd, args[2], raw);
    }
    else if (sub === 'fill') {
        const f = getFlags(args, 'phase', 'plan', 'name', 'type', 'wave', 'fields');
        (0, index_js_1.cmdTemplateFill)(cwd, args[2], {
            phase: f.phase ?? '', plan: f.plan ?? undefined, name: f.name ?? undefined,
            type: f.type ?? 'execute', wave: f.wave ?? '1',
            fields: f.fields ? JSON.parse(f.fields) : {},
        }, raw);
    }
    else {
        (0, index_js_1.error)('Unknown template subcommand. Available: select, fill');
    }
};
const handleFrontmatter = (args, cwd, raw) => {
    const sub = args[1];
    const file = args[2];
    const handlers = {
        'get': () => (0, index_js_1.cmdFrontmatterGet)(cwd, file, getFlag(args, '--field'), raw),
        'set': () => (0, index_js_1.cmdFrontmatterSet)(cwd, file, getFlag(args, '--field'), getFlag(args, '--value') ?? undefined, raw),
        'merge': () => (0, index_js_1.cmdFrontmatterMerge)(cwd, file, getFlag(args, '--data'), raw),
        'validate': () => (0, index_js_1.cmdFrontmatterValidate)(cwd, file, getFlag(args, '--schema'), raw),
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)('Unknown frontmatter subcommand. Available: get, set, merge, validate');
};
const handleVerify = async (args, cwd, raw) => {
    const sub = args[1];
    const handlers = {
        'plan-structure': () => (0, index_js_1.cmdVerifyPlanStructure)(cwd, args[2], raw),
        'phase-completeness': () => (0, index_js_1.cmdVerifyPhaseCompleteness)(cwd, args[2], raw),
        'references': () => (0, index_js_1.cmdVerifyReferences)(cwd, args[2], raw),
        'commits': () => (0, index_js_1.cmdVerifyCommits)(cwd, args.slice(2), raw),
        'artifacts': () => (0, index_js_1.cmdVerifyArtifacts)(cwd, args[2], raw),
        'key-links': () => (0, index_js_1.cmdVerifyKeyLinks)(cwd, args[2], raw),
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
};
const handlePhases = (args, cwd, raw) => {
    const sub = args[1];
    if (sub === 'list') {
        const f = getFlags(args, 'type', 'phase');
        (0, index_js_1.cmdPhasesList)(cwd, { type: f.type, phase: f.phase, includeArchived: hasFlag(args, 'include-archived') }, raw);
    }
    else {
        (0, index_js_1.error)('Unknown phases subcommand. Available: list');
    }
};
const handleRoadmap = (args, cwd, raw) => {
    const sub = args[1];
    const handlers = {
        'get-phase': () => (0, index_js_1.cmdRoadmapGetPhase)(cwd, args[2], raw),
        'analyze': () => (0, index_js_1.cmdRoadmapAnalyze)(cwd, raw),
        'update-plan-progress': () => (0, index_js_1.cmdRoadmapUpdatePlanProgress)(cwd, args[2], raw),
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
};
const handlePhase = (args, cwd, raw) => {
    const sub = args[1];
    const handlers = {
        'next-decimal': () => (0, index_js_1.cmdPhaseNextDecimal)(cwd, args[2], raw),
        'add': () => (0, index_js_1.cmdPhaseAdd)(cwd, args.slice(2).join(' '), raw),
        'insert': () => (0, index_js_1.cmdPhaseInsert)(cwd, args[2], args.slice(3).join(' '), raw),
        'remove': () => (0, index_js_1.cmdPhaseRemove)(cwd, args[2], { force: hasFlag(args, 'force') }, raw),
        'complete': () => (0, index_js_1.cmdPhaseComplete)(cwd, args[2], raw),
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
};
const handleMilestone = (args, cwd, raw) => {
    const sub = args[1];
    if (sub === 'complete') {
        const nameIndex = args.indexOf('--name');
        let milestoneName = null;
        if (nameIndex !== -1) {
            const nameArgs = [];
            for (let i = nameIndex + 1; i < args.length; i++) {
                if (args[i].startsWith('--'))
                    break;
                nameArgs.push(args[i]);
            }
            milestoneName = nameArgs.join(' ') || null;
        }
        (0, index_js_1.cmdMilestoneComplete)(cwd, args[2], {
            name: milestoneName ?? undefined,
            archivePhases: hasFlag(args, 'archive-phases'),
        }, raw);
    }
    else {
        (0, index_js_1.error)('Unknown milestone subcommand. Available: complete');
    }
};
const handleValidate = (args, cwd, raw) => {
    const sub = args[1];
    const handlers = {
        'consistency': () => (0, index_js_1.cmdValidateConsistency)(cwd, raw),
        'health': () => (0, index_js_1.cmdValidateHealth)(cwd, { repair: hasFlag(args, 'repair') }, raw),
    };
    const handler = sub ? handlers[sub] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)('Unknown validate subcommand. Available: consistency, health');
};
const handleInit = (args, cwd, raw) => {
    const workflow = args[1];
    const handlers = {
        'execute-phase': () => (0, index_js_1.cmdInitExecutePhase)(cwd, args[2], raw),
        'plan-phase': () => (0, index_js_1.cmdInitPlanPhase)(cwd, args[2], raw),
        'new-project': () => (0, index_js_1.cmdInitNewProject)(cwd, raw),
        'new-milestone': () => (0, index_js_1.cmdInitNewMilestone)(cwd, raw),
        'quick': () => (0, index_js_1.cmdInitQuick)(cwd, args.slice(2).join(' '), raw),
        'resume': () => (0, index_js_1.cmdInitResume)(cwd, raw),
        'verify-work': () => (0, index_js_1.cmdInitVerifyWork)(cwd, args[2], raw),
        'phase-op': () => (0, index_js_1.cmdInitPhaseOp)(cwd, args[2], raw),
        'todos': () => (0, index_js_1.cmdInitTodos)(cwd, args[2], raw),
        'milestone-op': () => (0, index_js_1.cmdInitMilestoneOp)(cwd, raw),
        'map-codebase': () => (0, index_js_1.cmdInitMapCodebase)(cwd, raw),
        'progress': () => (0, index_js_1.cmdInitProgress)(cwd, raw),
    };
    const handler = workflow ? handlers[workflow] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
};
// ─── Command registry ────────────────────────────────────────────────────────
const COMMANDS = {
    'state': handleState,
    'resolve-model': (args, cwd, raw) => (0, index_js_1.cmdResolveModel)(cwd, args[1], raw),
    'find-phase': (args, cwd, raw) => (0, index_js_1.cmdFindPhase)(cwd, args[1], raw),
    'commit': async (args, cwd, raw) => {
        const files = args.indexOf('--files') !== -1
            ? args.slice(args.indexOf('--files') + 1).filter(a => !a.startsWith('--'))
            : [];
        await (0, index_js_1.cmdCommit)(cwd, args[1], files, raw, hasFlag(args, 'amend'));
    },
    'verify-summary': async (args, cwd, raw) => {
        const countIndex = args.indexOf('--check-count');
        const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
        await (0, index_js_1.cmdVerifySummary)(cwd, args[1], checkCount, raw);
    },
    'template': handleTemplate,
    'frontmatter': handleFrontmatter,
    'verify': handleVerify,
    'generate-slug': (args, _cwd, raw) => (0, index_js_1.cmdGenerateSlug)(args[1], raw),
    'current-timestamp': (args, _cwd, raw) => (0, index_js_1.cmdCurrentTimestamp)((args[1] || 'full'), raw),
    'list-todos': (args, cwd, raw) => (0, index_js_1.cmdListTodos)(cwd, args[1], raw),
    'verify-path-exists': (args, cwd, raw) => (0, index_js_1.cmdVerifyPathExists)(cwd, args[1], raw),
    'config-ensure-section': (_args, cwd, raw) => (0, index_js_1.cmdConfigEnsureSection)(cwd, raw),
    'config-set': (args, cwd, raw) => (0, index_js_1.cmdConfigSet)(cwd, args[1], args[2], raw),
    'config-get': (args, cwd, raw) => (0, index_js_1.cmdConfigGet)(cwd, args[1], raw),
    'history-digest': (_args, cwd, raw) => (0, index_js_1.cmdHistoryDigest)(cwd, raw),
    'phases': handlePhases,
    'roadmap': handleRoadmap,
    'requirements': (args, cwd, raw) => {
        if (args[1] === 'mark-complete')
            (0, index_js_1.cmdRequirementsMarkComplete)(cwd, args.slice(2), raw);
        else
            (0, index_js_1.error)('Unknown requirements subcommand. Available: mark-complete');
    },
    'phase': handlePhase,
    'milestone': handleMilestone,
    'validate': handleValidate,
    'progress': (args, cwd, raw) => (0, index_js_1.cmdProgressRender)(cwd, args[1] || 'json', raw),
    'todo': (args, cwd, raw) => {
        if (args[1] === 'complete')
            (0, index_js_1.cmdTodoComplete)(cwd, args[2], raw);
        else
            (0, index_js_1.error)('Unknown todo subcommand. Available: complete');
    },
    'scaffold': (args, cwd, raw) => {
        const f = getFlags(args, 'phase', 'name');
        (0, index_js_1.cmdScaffold)(cwd, args[1], { phase: f.phase, name: f.name ? args.slice(args.indexOf('--name') + 1).join(' ') : null }, raw);
    },
    'init': handleInit,
    'phase-plan-index': (args, cwd, raw) => (0, index_js_1.cmdPhasePlanIndex)(cwd, args[1], raw),
    'state-snapshot': (_args, cwd, raw) => (0, index_js_1.cmdStateSnapshot)(cwd, raw),
    'summary-extract': (args, cwd, raw) => {
        const fieldsIndex = args.indexOf('--fields');
        const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
        (0, index_js_1.cmdSummaryExtract)(cwd, args[1], fields, raw);
    },
    'websearch': async (args, _cwd, raw) => {
        const f = getFlags(args, 'limit', 'freshness');
        await (0, index_js_1.cmdWebsearch)(args[1], {
            limit: f.limit ? parseInt(f.limit, 10) : 10,
            freshness: f.freshness ?? undefined,
        }, raw);
    },
    'dashboard': (args) => handleDashboard(args.slice(1)),
};
// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    // Optional cwd override for sandboxed subagents running outside project root.
    let cwd = process.cwd();
    const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
    const cwdIdx = args.indexOf('--cwd');
    if (cwdEqArg) {
        const value = cwdEqArg.slice('--cwd='.length).trim();
        if (!value)
            (0, index_js_1.error)('Missing value for --cwd');
        args.splice(args.indexOf(cwdEqArg), 1);
        cwd = path.resolve(value);
    }
    else if (cwdIdx !== -1) {
        const value = args[cwdIdx + 1];
        if (!value || value.startsWith('--'))
            (0, index_js_1.error)('Missing value for --cwd');
        args.splice(cwdIdx, 2);
        cwd = path.resolve(value);
    }
    if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
        (0, index_js_1.error)(`Invalid --cwd: ${cwd}`);
    }
    const rawIndex = args.indexOf('--raw');
    const raw = rawIndex !== -1;
    if (rawIndex !== -1)
        args.splice(rawIndex, 1);
    const command = args[0];
    if (!command) {
        (0, index_js_1.error)(`Usage: maxsim-tools <command> [args] [--raw] [--cwd <path>]\nCommands: ${Object.keys(COMMANDS).join(', ')}`);
    }
    const handler = COMMANDS[command];
    if (!handler) {
        (0, index_js_1.error)(`Unknown command: ${command}`);
    }
    await handler(args, cwd, raw);
}
// ─── Dashboard ───────────────────────────────────────────────────────────────
/**
 * Dashboard launch command.
 *
 * Spawns the dashboard as a detached subprocess with MAXSIM_PROJECT_CWD set.
 * If the dashboard is already running (detected via /api/health), prints the URL.
 * Supports --stop to kill a running instance.
 */
async function handleDashboard(args) {
    const DEFAULT_PORT = 3333;
    const PORT_RANGE_END = 3343;
    const HEALTH_TIMEOUT_MS = 1500;
    const networkMode = args.includes('--network');
    // Handle --stop flag
    if (args.includes('--stop')) {
        for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) {
            const running = await checkHealth(port, HEALTH_TIMEOUT_MS);
            if (running) {
                console.log(`Dashboard found on port ${port} — sending shutdown...`);
                console.log(`Dashboard at http://localhost:${port} is running.`);
                console.log(`To stop it, close the browser tab or kill the process on port ${port}.`);
                try {
                    if (process.platform === 'win32') {
                        const result = (0, node_child_process_1.execSync)(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' }).trim();
                        const lines = result.split('\n');
                        const pids = new Set();
                        for (const line of lines) {
                            const parts = line.trim().split(/\s+/);
                            const pid = parts[parts.length - 1];
                            if (pid && pid !== '0')
                                pids.add(pid);
                        }
                        for (const pid of pids) {
                            try {
                                (0, node_child_process_1.execSync)(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                                console.log(`Killed process ${pid}`);
                            }
                            catch {
                                // Process may have already exited
                            }
                        }
                    }
                    else {
                        (0, node_child_process_1.execSync)(`lsof -i :${port} -t | xargs kill -SIGTERM 2>/dev/null`, { stdio: 'ignore' });
                    }
                    console.log('Dashboard stopped.');
                }
                catch {
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
    const runner = 'node';
    const runnerArgs = isTsFile ? ['--import', 'tsx', serverPath] : [serverPath];
    // Standalone server must run from its own directory to find .next/
    const serverDir = path.dirname(serverPath);
    // Read dashboard.json for projectCwd (one level up from dashboard/ dir)
    let projectCwd = process.cwd();
    const dashboardConfigPath = path.join(path.dirname(serverDir), 'dashboard.json');
    if (fs.existsSync(dashboardConfigPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(dashboardConfigPath, 'utf8'));
            if (config.projectCwd) {
                projectCwd = config.projectCwd;
            }
        }
        catch {
            // Use default cwd
        }
    }
    // node-pty is a native addon that must be installed in the dashboard directory.
    // Auto-install it if missing so the terminal works out of the box.
    const ptyModulePath = path.join(serverDir, 'node_modules', 'node-pty');
    if (!fs.existsSync(ptyModulePath)) {
        console.log('Installing node-pty for terminal support...');
        try {
            (0, node_child_process_1.execSync)('npm install node-pty --save-optional --no-audit --no-fund --loglevel=error', {
                cwd: serverDir,
                stdio: 'inherit',
                timeout: 120_000,
            });
        }
        catch {
            console.warn('node-pty installation failed — terminal will be unavailable.');
        }
    }
    console.log('Dashboard starting...');
    const child = (0, node_child_process_1.spawn)(runner, runnerArgs, {
        cwd: serverDir,
        detached: true,
        stdio: 'ignore',
        env: {
            ...process.env,
            MAXSIM_PROJECT_CWD: projectCwd,
            NODE_ENV: isTsFile ? 'development' : 'production',
            ...(networkMode ? { MAXSIM_NETWORK_MODE: '1' } : {}),
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
async function checkHealth(port, timeoutMs) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`http://localhost:${port}/api/health`, {
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            return data.status === 'ok';
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Resolve the dashboard server entry point path.
 * Tries: built server.js first, then source server.ts for dev mode.
 */
function resolveDashboardServer() {
    // Strategy 0: Installed standalone build (production path)
    const localDashboard = path.join(process.cwd(), '.claude', 'dashboard', 'server.js');
    if (fs.existsSync(localDashboard))
        return localDashboard;
    const globalDashboard = path.join(os.homedir(), '.claude', 'dashboard', 'server.js');
    if (fs.existsSync(globalDashboard))
        return globalDashboard;
    // Strategy 1: Resolve from @maxsim/dashboard package
    try {
        const require_ = (0, node_module_1.createRequire)(import.meta.url);
        const pkgPath = require_.resolve('@maxsim/dashboard/package.json');
        const pkgDir = path.dirname(pkgPath);
        const serverJs = path.join(pkgDir, 'server.js');
        if (fs.existsSync(serverJs))
            return serverJs;
        const serverTs = path.join(pkgDir, 'server.ts');
        if (fs.existsSync(serverTs))
            return serverTs;
    }
    catch {
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
            if (fs.existsSync(candidate))
                return candidate;
            const candidateJs = path.join(dir, 'packages', 'dashboard', 'server.js');
            if (fs.existsSync(candidateJs))
                return candidateJs;
            dir = path.dirname(dir);
        }
    }
    catch {
        // Fallback walk failed
    }
    return null;
}
main();
//# sourceMappingURL=cli.js.map