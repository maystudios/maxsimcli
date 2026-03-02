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
const node_child_process_1 = require("node:child_process");
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
        'init-existing': () => (0, index_js_1.cmdInitExisting)(cwd, raw),
        'progress': () => (0, index_js_1.cmdInitProgress)(cwd, raw),
    };
    const handler = workflow ? handlers[workflow] : undefined;
    if (handler)
        return handler();
    (0, index_js_1.error)(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, init-existing, progress`);
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
    'skill-context': (args, cwd, raw) => (0, index_js_1.cmdSkillContext)(cwd, args[1] || 'unknown', raw),
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
    'start-server': async () => {
        const serverPath = path.join(__dirname, 'mcp-server.cjs');
        const child = (0, node_child_process_1.spawn)(process.execPath, [serverPath], { stdio: 'inherit' });
        child.on('exit', (code) => process.exit(code ?? 0));
    },
};
// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
    try {
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
    catch (thrown) {
        if (thrown instanceof index_js_1.CliOutput) {
            (0, index_js_1.writeOutput)(thrown);
            process.exit(0);
        }
        if (thrown instanceof index_js_1.CliError) {
            process.stderr.write('Error: ' + thrown.message + '\n');
            process.exit(1);
        }
        // Re-throw unexpected errors
        throw thrown;
    }
}
// ─── Dashboard ───────────────────────────────────────────────────────────────
const dashboard_launcher_js_1 = require("./core/dashboard-launcher.js");
/**
 * Dashboard launch command.
 *
 * Spawns the dashboard as a detached subprocess with MAXSIM_PROJECT_CWD set.
 * If the dashboard is already running (detected via /api/health), prints the URL.
 * Supports --stop to kill a running instance.
 */
async function handleDashboard(args) {
    const networkMode = args.includes('--network');
    // Handle --stop flag
    if (args.includes('--stop')) {
        for (let port = dashboard_launcher_js_1.DEFAULT_PORT; port <= dashboard_launcher_js_1.PORT_RANGE_END; port++) {
            const running = await (0, dashboard_launcher_js_1.checkHealth)(port);
            if (running) {
                console.log(`Dashboard found on port ${port} — stopping...`);
                (0, dashboard_launcher_js_1.killProcessOnPort)(port);
                console.log('Dashboard stopped.');
                return;
            }
        }
        console.log('No running dashboard found.');
        return;
    }
    // Check if dashboard is already running
    const runningPort = await (0, dashboard_launcher_js_1.findRunningDashboard)();
    if (runningPort) {
        console.log(`Dashboard already running at http://localhost:${runningPort}`);
        return;
    }
    // Resolve the dashboard server entry point
    const serverPath = (0, dashboard_launcher_js_1.resolveDashboardServer)();
    if (!serverPath) {
        console.error('Could not find @maxsim/dashboard server entry point.');
        console.error('Ensure @maxsim/dashboard is installed and built.');
        process.exit(1);
    }
    const serverDir = path.dirname(serverPath);
    const dashConfig = (0, dashboard_launcher_js_1.readDashboardConfig)(serverPath);
    // Auto-install node-pty if missing
    console.log('Installing node-pty for terminal support...');
    if (!(0, dashboard_launcher_js_1.ensureNodePty)(serverDir)) {
        console.warn('node-pty installation failed — terminal will be unavailable.');
    }
    console.log('Dashboard starting...');
    const pid = (0, dashboard_launcher_js_1.spawnDashboard)({
        serverPath,
        projectCwd: dashConfig.projectCwd,
        networkMode,
    });
    // Wait briefly for the server to start, then check health
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const readyPort = await (0, dashboard_launcher_js_1.findRunningDashboard)();
    if (readyPort) {
        console.log(`Dashboard ready at http://localhost:${readyPort}`);
        return;
    }
    console.log(`Dashboard spawned (PID ${pid}). It may take a moment to start.`);
    console.log(`Check http://localhost:${dashboard_launcher_js_1.DEFAULT_PORT} once ready.`);
}
main();
//# sourceMappingURL=cli.js.map