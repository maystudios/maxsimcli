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
exports.MODEL_PROFILES = void 0;
exports.output = output;
exports.error = error;
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
const node_child_process_1 = require("node:child_process");
// ─── Model Profile Table ─────────────────────────────────────────────────────
exports.MODEL_PROFILES = {
    'maxsim-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet' },
    'maxsim-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'maxsim-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'maxsim-phase-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
    'maxsim-project-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
    'maxsim-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'maxsim-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'maxsim-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
    'maxsim-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'maxsim-plan-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'maxsim-integration-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
};
// ─── Output helpers ──────────────────────────────────────────────────────────
// DEPRECATION: output() and error() call process.exit() and belong in the CLI
// layer. They are kept here for backward compatibility during the port. Future
// plans should move these to @maxsim/cli.
function output(result, raw, rawValue) {
    if (raw && rawValue !== undefined) {
        process.stdout.write(String(rawValue));
    }
    else {
        const json = JSON.stringify(result, null, 2);
        if (json.length > 50000) {
            const tmpPath = node_path_1.default.join(node_os_1.default.tmpdir(), `maxsim-${Date.now()}.json`);
            node_fs_1.default.writeFileSync(tmpPath, json, 'utf-8');
            process.stdout.write('@file:' + tmpPath);
        }
        else {
            process.stdout.write(json);
        }
    }
    process.exit(0);
}
function error(message) {
    process.stderr.write('Error: ' + message + '\n');
    process.exit(1);
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
function loadConfig(cwd) {
    const configPath = node_path_1.default.join(cwd, '.planning', 'config.json');
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
        const raw = node_fs_1.default.readFileSync(configPath, 'utf-8');
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
        return {
            model_profile: get('model_profile') ?? defaults.model_profile,
            commit_docs: get('commit_docs', { section: 'planning', field: 'commit_docs' }) ?? defaults.commit_docs,
            search_gitignored: get('search_gitignored', { section: 'planning', field: 'search_gitignored' }) ?? defaults.search_gitignored,
            branching_strategy: get('branching_strategy', { section: 'git', field: 'branching_strategy' }) ?? defaults.branching_strategy,
            phase_branch_template: get('phase_branch_template', { section: 'git', field: 'phase_branch_template' }) ?? defaults.phase_branch_template,
            milestone_branch_template: get('milestone_branch_template', { section: 'git', field: 'milestone_branch_template' }) ?? defaults.milestone_branch_template,
            research: get('research', { section: 'workflow', field: 'research' }) ?? defaults.research,
            plan_checker: get('plan_checker', { section: 'workflow', field: 'plan_check' }) ?? defaults.plan_checker,
            verifier: get('verifier', { section: 'workflow', field: 'verifier' }) ?? defaults.verifier,
            parallelization,
            brave_search: get('brave_search') ?? defaults.brave_search,
            model_overrides: parsed['model_overrides'],
        };
    }
    catch {
        return defaults;
    }
}
// ─── Git utilities ───────────────────────────────────────────────────────────
function isGitIgnored(cwd, targetPath) {
    try {
        (0, node_child_process_1.execSync)('git check-ignore -q -- ' + targetPath.replace(/[^a-zA-Z0-9._\-/]/g, ''), {
            cwd,
            stdio: 'pipe',
        });
        return true;
    }
    catch {
        return false;
    }
}
function execGit(cwd, args) {
    try {
        const escaped = args.map(a => {
            if (/^[a-zA-Z0-9._\-/=:@]+$/.test(a))
                return a;
            return "'" + a.replace(/'/g, "'\\''") + "'";
        });
        const stdout = (0, node_child_process_1.execSync)('git ' + escaped.join(' '), {
            cwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
    }
    catch (thrown) {
        const err = thrown;
        return {
            exitCode: err.status ?? 1,
            stdout: (err.stdout ?? '').toString().trim(),
            stderr: (err.stderr ?? '').toString().trim(),
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
function getPhasePattern(escapedPhaseNum, flags = 'gi') {
    if (escapedPhaseNum) {
        return new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`, flags);
    }
    return new RegExp(`#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`, flags);
}
function searchPhaseInDir(baseDir, relBase, normalized) {
    try {
        const entries = node_fs_1.default.readdirSync(baseDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
        const match = dirs.find(d => d.startsWith(normalized));
        if (!match)
            return null;
        const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
        const phaseNumber = dirMatch ? dirMatch[1] : normalized;
        const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
        const phaseDir = node_path_1.default.join(baseDir, match);
        const phaseFiles = node_fs_1.default.readdirSync(phaseDir);
        const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
        const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
        const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
        const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
        const hasVerification = phaseFiles.some(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
        const completedPlanIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));
        const incompletePlans = plans.filter(p => {
            const planId = p.replace('-PLAN.md', '').replace('PLAN.md', '');
            return !completedPlanIds.has(planId);
        });
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
    catch {
        return null;
    }
}
function findPhaseInternal(cwd, phase) {
    if (!phase)
        return null;
    const phasesDir = node_path_1.default.join(cwd, '.planning', 'phases');
    const normalized = normalizePhaseName(phase);
    const current = searchPhaseInDir(phasesDir, node_path_1.default.join('.planning', 'phases'), normalized);
    if (current)
        return current;
    const milestonesDir = node_path_1.default.join(cwd, '.planning', 'milestones');
    if (!node_fs_1.default.existsSync(milestonesDir))
        return null;
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
        /* optional op, ignore */
        if (process.env.MAXSIM_DEBUG)
            console.error(e);
    }
    return null;
}
function getArchivedPhaseDirs(cwd) {
    const milestonesDir = node_path_1.default.join(cwd, '.planning', 'milestones');
    const results = [];
    if (!node_fs_1.default.existsSync(milestonesDir))
        return results;
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
            const entries = node_fs_1.default.readdirSync(archivePath, { withFileTypes: true });
            const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
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
        /* optional op, ignore */
        if (process.env.MAXSIM_DEBUG)
            console.error(e);
    }
    return results;
}
// ─── Roadmap & model utilities ───────────────────────────────────────────────
function getRoadmapPhaseInternal(cwd, phaseNum) {
    if (!phaseNum)
        return null;
    const roadmapPath = node_path_1.default.join(cwd, '.planning', 'ROADMAP.md');
    if (!node_fs_1.default.existsSync(roadmapPath))
        return null;
    try {
        const content = node_fs_1.default.readFileSync(roadmapPath, 'utf-8');
        const escapedPhase = phaseNum.toString().replace(/\./g, '\\.');
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
        const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
        const goal = goalMatch ? goalMatch[1].trim() : null;
        return {
            found: true,
            phase_number: phaseNum.toString(),
            phase_name: phaseName,
            goal,
            section,
        };
    }
    catch {
        return null;
    }
}
function resolveModelInternal(cwd, agentType) {
    const config = loadConfig(cwd);
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
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function getMilestoneInfo(cwd) {
    try {
        const roadmap = node_fs_1.default.readFileSync(node_path_1.default.join(cwd, '.planning', 'ROADMAP.md'), 'utf-8');
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