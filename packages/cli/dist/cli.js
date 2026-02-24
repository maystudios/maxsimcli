"use strict";
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
const core_1 = require("@maxsim/core");
/** Helper: extract a named flag's value from args, returning null if absent */
function getFlag(args, flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
}
// Namespace groupings for readability (mirrors original CJS structure)
const state = { cmdStateLoad: core_1.cmdStateLoad, cmdStateGet: core_1.cmdStateGet, cmdStatePatch: core_1.cmdStatePatch, cmdStateUpdate: core_1.cmdStateUpdate, cmdStateAdvancePlan: core_1.cmdStateAdvancePlan, cmdStateRecordMetric: core_1.cmdStateRecordMetric, cmdStateUpdateProgress: core_1.cmdStateUpdateProgress, cmdStateAddDecision: core_1.cmdStateAddDecision, cmdStateAddBlocker: core_1.cmdStateAddBlocker, cmdStateResolveBlocker: core_1.cmdStateResolveBlocker, cmdStateRecordSession: core_1.cmdStateRecordSession, cmdStateSnapshot: core_1.cmdStateSnapshot, stateExtractField: core_1.stateExtractField, stateReplaceField: core_1.stateReplaceField };
const phase = { cmdPhasesList: core_1.cmdPhasesList, cmdPhaseNextDecimal: core_1.cmdPhaseNextDecimal, cmdFindPhase: core_1.cmdFindPhase, cmdPhasePlanIndex: core_1.cmdPhasePlanIndex, cmdPhaseAdd: core_1.cmdPhaseAdd, cmdPhaseInsert: core_1.cmdPhaseInsert, cmdPhaseRemove: core_1.cmdPhaseRemove, cmdPhaseComplete: core_1.cmdPhaseComplete };
const roadmap = { cmdRoadmapGetPhase: core_1.cmdRoadmapGetPhase, cmdRoadmapAnalyze: core_1.cmdRoadmapAnalyze, cmdRoadmapUpdatePlanProgress: core_1.cmdRoadmapUpdatePlanProgress };
const verify = { cmdVerifySummary: core_1.cmdVerifySummary, cmdVerifyPlanStructure: core_1.cmdVerifyPlanStructure, cmdVerifyPhaseCompleteness: core_1.cmdVerifyPhaseCompleteness, cmdVerifyReferences: core_1.cmdVerifyReferences, cmdVerifyCommits: core_1.cmdVerifyCommits, cmdVerifyArtifacts: core_1.cmdVerifyArtifacts, cmdVerifyKeyLinks: core_1.cmdVerifyKeyLinks, cmdValidateConsistency: core_1.cmdValidateConsistency, cmdValidateHealth: core_1.cmdValidateHealth };
const config = { cmdConfigEnsureSection: core_1.cmdConfigEnsureSection, cmdConfigSet: core_1.cmdConfigSet, cmdConfigGet: core_1.cmdConfigGet };
const template = { cmdTemplateSelect: core_1.cmdTemplateSelect, cmdTemplateFill: core_1.cmdTemplateFill };
const milestone = { cmdRequirementsMarkComplete: core_1.cmdRequirementsMarkComplete, cmdMilestoneComplete: core_1.cmdMilestoneComplete };
const commands = { cmdGenerateSlug: core_1.cmdGenerateSlug, cmdCurrentTimestamp: core_1.cmdCurrentTimestamp, cmdListTodos: core_1.cmdListTodos, cmdVerifyPathExists: core_1.cmdVerifyPathExists, cmdHistoryDigest: core_1.cmdHistoryDigest, cmdResolveModel: core_1.cmdResolveModel, cmdCommit: core_1.cmdCommit, cmdSummaryExtract: core_1.cmdSummaryExtract, cmdWebsearch: core_1.cmdWebsearch, cmdProgressRender: core_1.cmdProgressRender, cmdTodoComplete: core_1.cmdTodoComplete, cmdScaffold: core_1.cmdScaffold };
const init = { cmdInitExecutePhase: core_1.cmdInitExecutePhase, cmdInitPlanPhase: core_1.cmdInitPlanPhase, cmdInitNewProject: core_1.cmdInitNewProject, cmdInitNewMilestone: core_1.cmdInitNewMilestone, cmdInitQuick: core_1.cmdInitQuick, cmdInitResume: core_1.cmdInitResume, cmdInitVerifyWork: core_1.cmdInitVerifyWork, cmdInitPhaseOp: core_1.cmdInitPhaseOp, cmdInitTodos: core_1.cmdInitTodos, cmdInitMilestoneOp: core_1.cmdInitMilestoneOp, cmdInitMapCodebase: core_1.cmdInitMapCodebase, cmdInitProgress: core_1.cmdInitProgress };
const frontmatter = { cmdFrontmatterGet: core_1.cmdFrontmatterGet, cmdFrontmatterSet: core_1.cmdFrontmatterSet, cmdFrontmatterMerge: core_1.cmdFrontmatterMerge, cmdFrontmatterValidate: core_1.cmdFrontmatterValidate, extractFrontmatter: core_1.extractFrontmatter, reconstructFrontmatter: core_1.reconstructFrontmatter, spliceFrontmatter: core_1.spliceFrontmatter, parseMustHavesBlock: core_1.parseMustHavesBlock, FRONTMATTER_SCHEMAS: core_1.FRONTMATTER_SCHEMAS };
// ─── CLI Router ───────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    // Optional cwd override for sandboxed subagents running outside project root.
    let cwd = process.cwd();
    const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
    const cwdIdx = args.indexOf('--cwd');
    if (cwdEqArg) {
        const value = cwdEqArg.slice('--cwd='.length).trim();
        if (!value)
            (0, core_1.error)('Missing value for --cwd');
        args.splice(args.indexOf(cwdEqArg), 1);
        cwd = path.resolve(value);
    }
    else if (cwdIdx !== -1) {
        const value = args[cwdIdx + 1];
        if (!value || value.startsWith('--'))
            (0, core_1.error)('Missing value for --cwd');
        args.splice(cwdIdx, 2);
        cwd = path.resolve(value);
    }
    if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
        (0, core_1.error)(`Invalid --cwd: ${cwd}`);
    }
    const rawIndex = args.indexOf('--raw');
    const raw = rawIndex !== -1;
    if (rawIndex !== -1)
        args.splice(rawIndex, 1);
    const command = args[0];
    if (!command) {
        (0, core_1.error)('Usage: maxsim-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, init');
    }
    switch (command) {
        case 'state': {
            const subcommand = args[1];
            if (subcommand === 'update') {
                state.cmdStateUpdate(cwd, args[2], args[3]);
            }
            else if (subcommand === 'get') {
                state.cmdStateGet(cwd, args[2], raw);
            }
            else if (subcommand === 'patch') {
                const patches = {};
                for (let i = 2; i < args.length; i += 2) {
                    const key = args[i].replace(/^--/, '');
                    const value = args[i + 1];
                    if (key && value !== undefined) {
                        patches[key] = value;
                    }
                }
                state.cmdStatePatch(cwd, patches, raw);
            }
            else if (subcommand === 'advance-plan') {
                state.cmdStateAdvancePlan(cwd, raw);
            }
            else if (subcommand === 'record-metric') {
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
            }
            else if (subcommand === 'update-progress') {
                state.cmdStateUpdateProgress(cwd, raw);
            }
            else if (subcommand === 'add-decision') {
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
            }
            else if (subcommand === 'add-blocker') {
                const textIdx = args.indexOf('--text');
                const textFileIdx = args.indexOf('--text-file');
                state.cmdStateAddBlocker(cwd, {
                    text: textIdx !== -1 ? args[textIdx + 1] : undefined,
                    text_file: textFileIdx !== -1 ? args[textFileIdx + 1] : undefined,
                }, raw);
            }
            else if (subcommand === 'resolve-blocker') {
                const textIdx = args.indexOf('--text');
                state.cmdStateResolveBlocker(cwd, textIdx !== -1 ? args[textIdx + 1] : null, raw);
            }
            else if (subcommand === 'record-session') {
                const stoppedIdx = args.indexOf('--stopped-at');
                const resumeIdx = args.indexOf('--resume-file');
                state.cmdStateRecordSession(cwd, {
                    stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : undefined,
                    resume_file: resumeIdx !== -1 ? args[resumeIdx + 1] : 'None',
                }, raw);
            }
            else {
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
            const amend = args.includes('--amend');
            const message = args[1];
            // Parse --files flag (collect args after --files, stopping at other flags)
            const filesIndex = args.indexOf('--files');
            const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
            commands.cmdCommit(cwd, message, files, raw, amend);
            break;
        }
        case 'verify-summary': {
            const summaryPath = args[1];
            const countIndex = args.indexOf('--check-count');
            const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
            verify.cmdVerifySummary(cwd, summaryPath, checkCount, raw);
            break;
        }
        case 'template': {
            const subcommand = args[1];
            if (subcommand === 'select') {
                template.cmdTemplateSelect(cwd, args[2], raw);
            }
            else if (subcommand === 'fill') {
                const templateType = args[2];
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
            }
            else {
                (0, core_1.error)('Unknown template subcommand. Available: select, fill');
            }
            break;
        }
        case 'frontmatter': {
            const subcommand = args[1];
            const file = args[2];
            if (subcommand === 'get') {
                const fieldIdx = args.indexOf('--field');
                frontmatter.cmdFrontmatterGet(cwd, file, getFlag(args, '--field'), raw);
            }
            else if (subcommand === 'set') {
                frontmatter.cmdFrontmatterSet(cwd, file, getFlag(args, '--field'), getFlag(args, '--value') ?? undefined, raw);
            }
            else if (subcommand === 'merge') {
                frontmatter.cmdFrontmatterMerge(cwd, file, getFlag(args, '--data'), raw);
            }
            else if (subcommand === 'validate') {
                frontmatter.cmdFrontmatterValidate(cwd, file, getFlag(args, '--schema'), raw);
            }
            else {
                (0, core_1.error)('Unknown frontmatter subcommand. Available: get, set, merge, validate');
            }
            break;
        }
        case 'verify': {
            const subcommand = args[1];
            if (subcommand === 'plan-structure') {
                verify.cmdVerifyPlanStructure(cwd, args[2], raw);
            }
            else if (subcommand === 'phase-completeness') {
                verify.cmdVerifyPhaseCompleteness(cwd, args[2], raw);
            }
            else if (subcommand === 'references') {
                verify.cmdVerifyReferences(cwd, args[2], raw);
            }
            else if (subcommand === 'commits') {
                verify.cmdVerifyCommits(cwd, args.slice(2), raw);
            }
            else if (subcommand === 'artifacts') {
                verify.cmdVerifyArtifacts(cwd, args[2], raw);
            }
            else if (subcommand === 'key-links') {
                verify.cmdVerifyKeyLinks(cwd, args[2], raw);
            }
            else {
                (0, core_1.error)('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
            }
            break;
        }
        case 'generate-slug': {
            commands.cmdGenerateSlug(args[1], raw);
            break;
        }
        case 'current-timestamp': {
            commands.cmdCurrentTimestamp((args[1] || 'full'), raw);
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
            const subcommand = args[1];
            if (subcommand === 'list') {
                const typeIndex = args.indexOf('--type');
                const phaseIndex = args.indexOf('--phase');
                const options = {
                    type: typeIndex !== -1 ? args[typeIndex + 1] : null,
                    phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
                    includeArchived: args.includes('--include-archived'),
                };
                phase.cmdPhasesList(cwd, options, raw);
            }
            else {
                (0, core_1.error)('Unknown phases subcommand. Available: list');
            }
            break;
        }
        case 'roadmap': {
            const subcommand = args[1];
            if (subcommand === 'get-phase') {
                roadmap.cmdRoadmapGetPhase(cwd, args[2], raw);
            }
            else if (subcommand === 'analyze') {
                roadmap.cmdRoadmapAnalyze(cwd, raw);
            }
            else if (subcommand === 'update-plan-progress') {
                roadmap.cmdRoadmapUpdatePlanProgress(cwd, args[2], raw);
            }
            else {
                (0, core_1.error)('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
            }
            break;
        }
        case 'requirements': {
            const subcommand = args[1];
            if (subcommand === 'mark-complete') {
                milestone.cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
            }
            else {
                (0, core_1.error)('Unknown requirements subcommand. Available: mark-complete');
            }
            break;
        }
        case 'phase': {
            const subcommand = args[1];
            if (subcommand === 'next-decimal') {
                phase.cmdPhaseNextDecimal(cwd, args[2], raw);
            }
            else if (subcommand === 'add') {
                phase.cmdPhaseAdd(cwd, args.slice(2).join(' '), raw);
            }
            else if (subcommand === 'insert') {
                phase.cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw);
            }
            else if (subcommand === 'remove') {
                const forceFlag = args.includes('--force');
                phase.cmdPhaseRemove(cwd, args[2], { force: forceFlag }, raw);
            }
            else if (subcommand === 'complete') {
                phase.cmdPhaseComplete(cwd, args[2], raw);
            }
            else {
                (0, core_1.error)('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
            }
            break;
        }
        case 'milestone': {
            const subcommand = args[1];
            if (subcommand === 'complete') {
                const nameIndex = args.indexOf('--name');
                const archivePhases = args.includes('--archive-phases');
                // Collect --name value (everything after --name until next flag or end)
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
                milestone.cmdMilestoneComplete(cwd, args[2], { name: milestoneName ?? undefined, archivePhases }, raw);
            }
            else {
                (0, core_1.error)('Unknown milestone subcommand. Available: complete');
            }
            break;
        }
        case 'validate': {
            const subcommand = args[1];
            if (subcommand === 'consistency') {
                verify.cmdValidateConsistency(cwd, raw);
            }
            else if (subcommand === 'health') {
                const repairFlag = args.includes('--repair');
                verify.cmdValidateHealth(cwd, { repair: repairFlag }, raw);
            }
            else {
                (0, core_1.error)('Unknown validate subcommand. Available: consistency, health');
            }
            break;
        }
        case 'progress': {
            const subcommand = args[1] || 'json';
            commands.cmdProgressRender(cwd, subcommand, raw);
            break;
        }
        case 'todo': {
            const subcommand = args[1];
            if (subcommand === 'complete') {
                commands.cmdTodoComplete(cwd, args[2], raw);
            }
            else {
                (0, core_1.error)('Unknown todo subcommand. Available: complete');
            }
            break;
        }
        case 'scaffold': {
            const scaffoldType = args[1];
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
            const workflow = args[1];
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
                    (0, core_1.error)(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
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
            const summaryPath = args[1];
            const fieldsIndex = args.indexOf('--fields');
            const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
            commands.cmdSummaryExtract(cwd, summaryPath, fields, raw);
            break;
        }
        case 'websearch': {
            const query = args[1];
            const limitIdx = args.indexOf('--limit');
            const freshnessIdx = args.indexOf('--freshness');
            await commands.cmdWebsearch(query, {
                limit: limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10,
                freshness: freshnessIdx !== -1 ? args[freshnessIdx + 1] : undefined,
            }, raw);
            break;
        }
        default:
            (0, core_1.error)(`Unknown command: ${command}`);
    }
}
main();
//# sourceMappingURL=cli.js.map