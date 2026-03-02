"use strict";
/**
 * Core — Shared utilities, constants, and internal helpers
 *
 * Ported from maxsim/bin/lib/core.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryId = exports.planId = exports.isSummaryFile = exports.isPlanFile = exports.CliError = exports.CliOutput = exports.MODEL_PROFILES = void 0;
exports.output = output;
exports.error = error;
exports.rethrowCliSignals = rethrowCliSignals;
exports.writeOutput = writeOutput;
exports.todayISO = todayISO;
exports.planningPath = planningPath;
exports.statePath = statePath;
exports.roadmapPath = roadmapPath;
exports.configPath = configPath;
exports.phasesPath = phasesPath;
exports.listSubDirs = listSubDirs;
exports.errorMsg = errorMsg;
exports.debugLog = debugLog;
exports.escapePhaseNum = escapePhaseNum;
exports.safeReadFile = safeReadFile;
exports.loadConfig = loadConfig;
exports.isGitIgnored = isGitIgnored;
exports.execGit = execGit;
exports.normalizePhaseName = normalizePhaseName;
exports.comparePhaseNum = comparePhaseNum;
exports.getPhasePattern = getPhasePattern;
exports.findPhaseInternal = findPhaseInternal;
exports.getArchivedPhaseDirs = getArchivedPhaseDirs;
exports.getRoadmapPhaseInternal = getRoadmapPhaseInternal;
exports.resolveModelInternal = resolveModelInternal;
exports.pathExistsInternal = pathExistsInternal;
exports.generateSlugInternal = generateSlugInternal;
exports.getMilestoneInfo = getMilestoneInfo;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const simple_git_1 = require("simple-git");
const slugify_1 = __importDefault(require("slugify"));
// ─── Model Profile Table ─────────────────────────────────────────────────────
exports.MODEL_PROFILES = {
    'maxsim-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet', tokenburner: 'opus' },
    'maxsim-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
    'maxsim-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
    'maxsim-phase-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-project-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet', tokenburner: 'opus' },
    'maxsim-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-plan-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
    'maxsim-integration-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku', tokenburner: 'opus' },
};
// ─── Output helpers ──────────────────────────────────────────────────────────
// These throw CliOutput / CliError instead of calling process.exit() directly.
// The CLI entry point (cli.ts) catches these and calls process.exit() there.
/** Thrown by output() to signal successful command completion. */
class CliOutput {
    result;
    raw;
    rawValue;
    constructor(result, raw, rawValue) {
        this.result = result;
        this.raw = raw ?? false;
        this.rawValue = rawValue;
    }
}
exports.CliOutput = CliOutput;
/** Thrown by error() to signal a command error. */
class CliError {
    message;
    constructor(message) {
        this.message = message;
    }
}
exports.CliError = CliError;
function output(result, raw, rawValue) {
    throw new CliOutput(result, raw, rawValue);
}
function error(message) {
    throw new CliError(message);
}
/** Re-throw CliOutput/CliError signals so catch blocks don't intercept them */
function rethrowCliSignals(e) {
    if (e instanceof CliOutput || e instanceof CliError)
        throw e;
}
/**
 * Handle a CliOutput by writing to stdout. Extracted so cli.ts can use it.
 */
function writeOutput(out) {
    if (out.raw && out.rawValue !== undefined) {
        process.stdout.write(String(out.rawValue));
    }
    else {
        const json = JSON.stringify(out.result, null, 2);
        if (json.length > 50000) {
            const tmpPath = node_path_1.default.join(node_os_1.default.tmpdir(), `maxsim-${Date.now()}.json`);
            node_fs_1.default.writeFileSync(tmpPath, json, 'utf-8');
            process.stdout.write('@file:' + tmpPath);
        }
        else {
            process.stdout.write(json);
        }
    }
}
// ─── Shared micro-utilities ─────────────────────────────────────────────────
/** Today's date as YYYY-MM-DD. */
function todayISO() {
    return new Date().toISOString().split('T')[0];
}
/** Canonical .planning/ sub-paths. */
function planningPath(cwd, ...segments) {
    return node_path_1.default.join(cwd, '.planning', ...segments);
}
function statePath(cwd) { return planningPath(cwd, 'STATE.md'); }
function roadmapPath(cwd) { return planningPath(cwd, 'ROADMAP.md'); }
function configPath(cwd) { return planningPath(cwd, 'config.json'); }
function phasesPath(cwd) { return planningPath(cwd, 'phases'); }
/** Phase-file predicates. */
const isPlanFile = (f) => f.endsWith('-PLAN.md') || f === 'PLAN.md';
exports.isPlanFile = isPlanFile;
const isSummaryFile = (f) => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md';
exports.isSummaryFile = isSummaryFile;
/** Strip suffix to get plan/summary ID. */
const planId = (f) => f.replace('-PLAN.md', '').replace('PLAN.md', '');
exports.planId = planId;
const summaryId = (f) => f.replace('-SUMMARY.md', '').replace('SUMMARY.md', '');
exports.summaryId = summaryId;
/** List subdirectory names, optionally sorted by phase number. */
function listSubDirs(dir, sortByPhase = false) {
    const dirs = node_fs_1.default.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
    return sortByPhase ? dirs.sort((a, b) => comparePhaseNum(a, b)) : dirs;
}
/** Extract a human-readable message from an unknown thrown value. */
function errorMsg(e) {
    return errorMsg(e);
}
/** Log only when MAXSIM_DEBUG is set. Accepts an optional context label. */
function debugLog(contextOrError, error) {
    if (!process.env.MAXSIM_DEBUG)
        return;
    if (error !== undefined) {
        console.error(`[maxsim:${contextOrError}]`, error);
    }
    else {
        console.error(contextOrError);
    }
}
/** Escape a phase number for use in regex. */
function escapePhaseNum(phase) {
    return String(phase).replace(/\./g, '\\.');
}
// ─── File & Config utilities ─────────────────────────────────────────────────
function safeReadFile(filePath) {
    try {
        return node_fs_1.default.readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
let _configCache = null;
function loadConfig(cwd) {
    if (_configCache && _configCache.cwd === cwd)
        return _configCache.config;
    const cfgPath = configPath(cwd);
    const defaults = {
        model_profile: 'balanced',
        commit_docs: true,
        search_gitignored: false,
        branching_strategy: 'none',
        phase_branch_template: 'maxsim/phase-{phase}-{slug}',
        milestone_branch_template: 'maxsim/{milestone}-{slug}',
        research: true,
        plan_checker: true,
        verifier: true,
        parallelization: true,
        brave_search: false,
    };
    try {
        const raw = node_fs_1.default.readFileSync(cfgPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const get = (key, nested) => {
            if (parsed[key] !== undefined)
                return parsed[key];
            if (nested) {
                const section = parsed[nested.section];
                if (section && typeof section === 'object' && section !== null && nested.field in section) {
                    return section[nested.field];
                }
            }
            return undefined;
        };
        const parallelization = (() => {
            const val = get('parallelization');
            if (typeof val === 'boolean')
                return val;
            if (typeof val === 'object' && val !== null && 'enabled' in val) {
                return val.enabled;
            }
            return defaults.parallelization;
        })();
        const result = {
            model_profile: get('model_profile') ?? defaults.model_profile,
            commit_docs: get('commit_docs', { section: 'planning', field: 'commit_docs' }) ?? defaults.commit_docs,
            search_gitignored: get('search_gitignored', { section: 'planning', field: 'search_gitignored' }) ?? defaults.search_gitignored,
            branching_strategy: get('branching_strategy', { section: 'git', field: 'branching_strategy' }) ?? defaults.branching_strategy,
            phase_branch_template: get('phase_branch_template', { section: 'git', field: 'phase_branch_template' }) ?? defaults.phase_branch_template,
            milestone_branch_template: get('milestone_branch_template', { section: 'git', field: 'milestone_branch_template' }) ?? defaults.milestone_branch_template,
            research: get('research', { section: 'workflow', field: 'research' }) ?? defaults.research,
            plan_checker: (get('plan_checker', { section: 'workflow', field: 'plan_checker' }) ?? get('plan_checker', { section: 'workflow', field: 'plan_check' })) ?? defaults.plan_checker,
            verifier: get('verifier', { section: 'workflow', field: 'verifier' }) ?? defaults.verifier,
            parallelization,
            brave_search: get('brave_search') ?? defaults.brave_search,
            model_overrides: parsed['model_overrides'],
        };
        _configCache = { cwd, config: result };
        return result;
    }
    catch (e) {
        // If the file exists but is unparseable, warn the user
        if (node_fs_1.default.existsSync(cfgPath)) {
            console.warn(`[maxsim] Warning: config.json exists but could not be parsed — using defaults.`);
            debugLog('config-load-failed', e);
        }
        _configCache = { cwd, config: defaults };
        return defaults;
    }
}
// ─── Git utilities ───────────────────────────────────────────────────────────
async function isGitIgnored(cwd, targetPath) {
    try {
        const git = (0, simple_git_1.simpleGit)(cwd);
        const result = await git.checkIgnore(targetPath);
        return result.length > 0;
    }
    catch {
        return false;
    }
}
async function execGit(cwd, args) {
    try {
        const git = (0, simple_git_1.simpleGit)(cwd);
        const stdout = await git.raw(args);
        return { exitCode: 0, stdout: (stdout ?? '').trim(), stderr: '' };
    }
    catch (thrown) {
        // simple-git throws on non-zero exit — extract what we can
        const message = thrown instanceof Error ? thrown.message : String(thrown);
        debugLog('exec-git-failed', { args, error: message });
        return {
            exitCode: 1,
            stdout: '',
            stderr: message,
        };
    }
}
// ─── Phase utilities ─────────────────────────────────────────────────────────
function normalizePhaseName(phase) {
    const match = phase.match(/^(\d+)([A-Z])?(\.\d+)?/i);
    if (!match)
        return phase;
    const padded = match[1].padStart(2, '0');
    const letter = match[2] ? match[2].toUpperCase() : '';
    const decimal = match[3] || '';
    return padded + letter + decimal;
}
function comparePhaseNum(a, b) {
    const pa = String(a).match(/^(\d+)([A-Z])?(\.\d+)?/i);
    const pb = String(b).match(/^(\d+)([A-Z])?(\.\d+)?/i);
    if (!pa || !pb)
        return String(a).localeCompare(String(b));
    const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
    if (intDiff !== 0)
        return intDiff;
    const la = (pa[2] || '').toUpperCase();
    const lb = (pb[2] || '').toUpperCase();
    if (la !== lb) {
        if (!la)
            return -1;
        if (!lb)
            return 1;
        return la < lb ? -1 : 1;
    }
    const da = pa[3] ? parseFloat(pa[3]) : -1;
    const db = pb[3] ? parseFloat(pb[3]) : -1;
    return da - db;
}
// ─── Phase regex helper ──────────────────────────────────────────────────────
/**
 * Returns the canonical regex for matching Phase heading lines in ROADMAP.md.
 *
 * General form (no escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase number string (e.g. "03", "3A", "2.1")
 *   Group 2: phase name string (e.g. "Name Here")
 *
 * Specific form (with escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase name string only
 *
 * @param escapedPhaseNum - regex-escaped phase number string to match a specific phase
 * @param flags - regex flags (default: 'gi')
 */
function getPhasePattern(escapedPhaseNum, flags = 'gim') {
    if (escapedPhaseNum) {
        return new RegExp(`^#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`, flags);
    }
    return new RegExp(`^#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`, flags);
}
function searchPhaseInDir(baseDir, relBase, normalized) {
    try {
        const dirs = listSubDirs(baseDir, true);
        const match = dirs.find(d => d.startsWith(normalized));
        if (!match)
            return null;
        const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
        const phaseNumber = dirMatch ? dirMatch[1] : normalized;
        const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
        const phaseDir = node_path_1.default.join(baseDir, match);
        const phaseFiles = node_fs_1.default.readdirSync(phaseDir);
        const plans = phaseFiles.filter(exports.isPlanFile).sort();
        const summaries = phaseFiles.filter(exports.isSummaryFile).sort();
        const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
        const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
        const hasVerification = phaseFiles.some(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
        const completedPlanIds = new Set(summaries.map(exports.summaryId));
        const incompletePlans = plans.filter(p => !completedPlanIds.has((0, exports.planId)(p)));
        return {
            found: true,
            directory: node_path_1.default.join(relBase, match),
            phase_number: phaseNumber,
            phase_name: phaseName,
            phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
            plans,
            summaries,
            incomplete_plans: incompletePlans,
            has_research: hasResearch,
            has_context: hasContext,
            has_verification: hasVerification,
        };
    }
    catch (e) {
        debugLog('search-phase-in-dir-failed', { dir: baseDir, phase: normalized, error: errorMsg(e) });
        return null;
    }
}
function findPhaseInternal(cwd, phase) {
    if (!phase)
        return null;
    const pd = phasesPath(cwd);
    const normalized = normalizePhaseName(phase);
    const current = searchPhaseInDir(pd, node_path_1.default.join('.planning', 'phases'), normalized);
    if (current)
        return current;
    const milestonesDir = planningPath(cwd, 'milestones');
    try {
        node_fs_1.default.statSync(milestonesDir);
    }
    catch {
        return null;
    }
    try {
        const milestoneEntries = node_fs_1.default.readdirSync(milestonesDir, { withFileTypes: true });
        const archiveDirs = milestoneEntries
            .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
            .map(e => e.name)
            .sort()
            .reverse();
        for (const archiveName of archiveDirs) {
            const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
            if (!versionMatch)
                continue;
            const version = versionMatch[1];
            const archivePath = node_path_1.default.join(milestonesDir, archiveName);
            const relBase = node_path_1.default.join('.planning', 'milestones', archiveName);
            const result = searchPhaseInDir(archivePath, relBase, normalized);
            if (result) {
                result.archived = version;
                return result;
            }
        }
    }
    catch (e) {
        debugLog('find-phase-milestone-search-failed', e);
    }
    return null;
}
function getArchivedPhaseDirs(cwd) {
    const milestonesDir = planningPath(cwd, 'milestones');
    const results = [];
    try {
        const milestoneEntries = node_fs_1.default.readdirSync(milestonesDir, { withFileTypes: true });
        const phaseDirs = milestoneEntries
            .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
            .map(e => e.name)
            .sort()
            .reverse();
        for (const archiveName of phaseDirs) {
            const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
            if (!versionMatch)
                continue;
            const version = versionMatch[1];
            const archivePath = node_path_1.default.join(milestonesDir, archiveName);
            const dirs = listSubDirs(archivePath, true);
            for (const dir of dirs) {
                results.push({
                    name: dir,
                    milestone: version,
                    basePath: node_path_1.default.join('.planning', 'milestones', archiveName),
                    fullPath: node_path_1.default.join(archivePath, dir),
                });
            }
        }
    }
    catch (e) {
        debugLog('get-archived-phase-dirs-failed', e);
    }
    return results;
}
// ─── Roadmap & model utilities ───────────────────────────────────────────────
function getRoadmapPhaseInternal(cwd, phaseNum) {
    if (!phaseNum)
        return null;
    const rp = roadmapPath(cwd);
    try {
        const content = node_fs_1.default.readFileSync(rp, 'utf-8');
        const escapedPhase = escapePhaseNum(phaseNum);
        const phasePattern = getPhasePattern(escapedPhase, 'i');
        const headerMatch = content.match(phasePattern);
        if (!headerMatch)
            return null;
        const phaseName = headerMatch[1].trim();
        const headerIndex = headerMatch.index;
        const restOfContent = content.slice(headerIndex);
        const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
        const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
        const section = content.slice(headerIndex, sectionEnd).trim();
        const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
        const goal = goalMatch ? goalMatch[1].trim() : null;
        return {
            found: true,
            phase_number: phaseNum.toString(),
            phase_name: phaseName,
            goal,
            section,
        };
    }
    catch (e) {
        debugLog('get-roadmap-phase-failed', { phase: phaseNum, error: errorMsg(e) });
        return null;
    }
}
function resolveModelInternal(cwd, agentType, config) {
    config = config ?? loadConfig(cwd);
    const override = config.model_overrides?.[agentType];
    if (override) {
        return override === 'opus' ? 'inherit' : override;
    }
    const profile = config.model_profile || 'balanced';
    const agentModels = exports.MODEL_PROFILES[agentType];
    if (!agentModels)
        return 'sonnet';
    const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
    return resolved === 'opus' ? 'inherit' : resolved;
}
// ─── Misc utilities ──────────────────────────────────────────────────────────
function pathExistsInternal(cwd, targetPath) {
    const fullPath = node_path_1.default.isAbsolute(targetPath) ? targetPath : node_path_1.default.join(cwd, targetPath);
    try {
        node_fs_1.default.statSync(fullPath);
        return true;
    }
    catch {
        return false;
    }
}
function generateSlugInternal(text) {
    if (!text)
        return null;
    return (0, slugify_1.default)(text, { lower: true, strict: true });
}
function getMilestoneInfo(cwd) {
    try {
        const roadmap = node_fs_1.default.readFileSync(roadmapPath(cwd), 'utf-8');
        const versionMatch = roadmap.match(/v(\d+\.\d+)/);
        const nameMatch = roadmap.match(/## .*v\d+\.\d+[:\s]+([^\n(]+)/);
        return {
            version: versionMatch ? versionMatch[0] : 'v1.0',
            name: nameMatch ? nameMatch[1].trim() : 'milestone',
        };
    }
    catch {
        return { version: 'v1.0', name: 'milestone' };
    }
}
//# sourceMappingURL=core.js.map