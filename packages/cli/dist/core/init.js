"use strict";
/**
 * Init — Compound init commands for workflow bootstrapping
 *
 * Ported from maxsim/bin/lib/init.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdInitExecutePhase = cmdInitExecutePhase;
exports.cmdInitPlanPhase = cmdInitPlanPhase;
exports.cmdInitNewProject = cmdInitNewProject;
exports.cmdInitNewMilestone = cmdInitNewMilestone;
exports.cmdInitQuick = cmdInitQuick;
exports.cmdInitResume = cmdInitResume;
exports.cmdInitVerifyWork = cmdInitVerifyWork;
exports.cmdInitPhaseOp = cmdInitPhaseOp;
exports.cmdInitTodos = cmdInitTodos;
exports.cmdInitMilestoneOp = cmdInitMilestoneOp;
exports.cmdInitMapCodebase = cmdInitMapCodebase;
exports.cmdInitExisting = cmdInitExisting;
exports.cmdInitProgress = cmdInitProgress;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const node_child_process_1 = require("node:child_process");
const core_js_1 = require("./core.js");
// ─── Helper: extract requirement IDs from roadmap phase section ─────────────
function extractReqIds(cwd, phase) {
    const roadmapPhase = (0, core_js_1.getRoadmapPhaseInternal)(cwd, phase);
    const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
    const reqExtracted = reqMatch
        ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean).join(', ')
        : null;
    return (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;
}
function scanPhaseArtifacts(cwd, phaseDirectory) {
    const result = {};
    const phaseDirFull = node_path_1.default.join(cwd, phaseDirectory);
    try {
        const files = node_fs_1.default.readdirSync(phaseDirFull);
        const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
        if (contextFile) {
            result.context_path = node_path_1.default.join(phaseDirectory, contextFile);
        }
        const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
        if (researchFile) {
            result.research_path = node_path_1.default.join(phaseDirectory, researchFile);
        }
        const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
        if (verificationFile) {
            result.verification_path = node_path_1.default.join(phaseDirectory, verificationFile);
        }
        const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
        if (uatFile) {
            result.uat_path = node_path_1.default.join(phaseDirectory, uatFile);
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    return result;
}
// ─── Init commands ──────────────────────────────────────────────────────────
function cmdInitExecutePhase(cwd, phase, raw) {
    if (!phase) {
        (0, core_js_1.error)('phase required for init execute-phase');
    }
    const config = (0, core_js_1.loadConfig)(cwd);
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
    const milestone = (0, core_js_1.getMilestoneInfo)(cwd);
    const phase_req_ids = extractReqIds(cwd, phase);
    const result = {
        executor_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-executor'),
        verifier_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-verifier'),
        commit_docs: config.commit_docs,
        parallelization: config.parallelization,
        branching_strategy: config.branching_strategy,
        phase_branch_template: config.phase_branch_template,
        milestone_branch_template: config.milestone_branch_template,
        verifier_enabled: config.verifier,
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory ?? null,
        phase_number: phaseInfo?.phase_number ?? null,
        phase_name: phaseInfo?.phase_name ?? null,
        phase_slug: phaseInfo?.phase_slug ?? null,
        phase_req_ids,
        plans: phaseInfo?.plans ?? [],
        summaries: phaseInfo?.summaries ?? [],
        incomplete_plans: phaseInfo?.incomplete_plans ?? [],
        plan_count: phaseInfo?.plans?.length ?? 0,
        incomplete_count: phaseInfo?.incomplete_plans?.length ?? 0,
        branch_name: config.branching_strategy === 'phase' && phaseInfo
            ? config.phase_branch_template
                .replace('{phase}', phaseInfo.phase_number)
                .replace('{slug}', phaseInfo.phase_slug || 'phase')
            : config.branching_strategy === 'milestone'
                ? config.milestone_branch_template
                    .replace('{milestone}', milestone.version)
                    .replace('{slug}', (0, core_js_1.generateSlugInternal)(milestone.name) || 'milestone')
                : null,
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        milestone_slug: (0, core_js_1.generateSlugInternal)(milestone.name),
        state_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        config_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/config.json'),
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        config_path: '.planning/config.json',
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitPlanPhase(cwd, phase, raw) {
    if (!phase) {
        (0, core_js_1.error)('phase required for init plan-phase');
    }
    const config = (0, core_js_1.loadConfig)(cwd);
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
    const phase_req_ids = extractReqIds(cwd, phase);
    const result = {
        researcher_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-phase-researcher'),
        planner_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-planner'),
        checker_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-plan-checker'),
        research_enabled: config.research,
        plan_checker_enabled: config.plan_checker,
        commit_docs: config.commit_docs,
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory ?? null,
        phase_number: phaseInfo?.phase_number ?? null,
        phase_name: phaseInfo?.phase_name ?? null,
        phase_slug: phaseInfo?.phase_slug ?? null,
        padded_phase: phaseInfo?.phase_number?.padStart(2, '0') ?? null,
        phase_req_ids,
        has_research: phaseInfo?.has_research ?? false,
        has_context: phaseInfo?.has_context ?? false,
        has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
        plan_count: phaseInfo?.plans?.length ?? 0,
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        requirements_path: '.planning/REQUIREMENTS.md',
    };
    if (phaseInfo?.directory) {
        const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
        if (artifacts.context_path)
            result.context_path = artifacts.context_path;
        if (artifacts.research_path)
            result.research_path = artifacts.research_path;
        if (artifacts.verification_path)
            result.verification_path = artifacts.verification_path;
        if (artifacts.uat_path)
            result.uat_path = artifacts.uat_path;
    }
    (0, core_js_1.output)(result, raw);
}
function cmdInitNewProject(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const homedir = node_os_1.default.homedir();
    const braveKeyFile = node_path_1.default.join(homedir, '.maxsim', 'brave_api_key');
    const hasBraveSearch = !!(process.env.BRAVE_API_KEY || node_fs_1.default.existsSync(braveKeyFile));
    let hasCode = false;
    let hasPackageFile = false;
    try {
        const files = (0, node_child_process_1.execSync)('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        hasCode = files.trim().length > 0;
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    hasPackageFile = (0, core_js_1.pathExistsInternal)(cwd, 'package.json') ||
        (0, core_js_1.pathExistsInternal)(cwd, 'requirements.txt') ||
        (0, core_js_1.pathExistsInternal)(cwd, 'Cargo.toml') ||
        (0, core_js_1.pathExistsInternal)(cwd, 'go.mod') ||
        (0, core_js_1.pathExistsInternal)(cwd, 'Package.swift');
    const result = {
        researcher_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-project-researcher'),
        synthesizer_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-research-synthesizer'),
        roadmapper_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-roadmapper'),
        commit_docs: config.commit_docs,
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        has_codebase_map: (0, core_js_1.pathExistsInternal)(cwd, '.planning/codebase'),
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        has_existing_code: hasCode,
        has_package_file: hasPackageFile,
        is_brownfield: hasCode || hasPackageFile,
        needs_codebase_map: (hasCode || hasPackageFile) && !(0, core_js_1.pathExistsInternal)(cwd, '.planning/codebase'),
        has_git: (0, core_js_1.pathExistsInternal)(cwd, '.git'),
        brave_search_available: hasBraveSearch,
        project_path: '.planning/PROJECT.md',
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitNewMilestone(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const milestone = (0, core_js_1.getMilestoneInfo)(cwd);
    const result = {
        researcher_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-project-researcher'),
        synthesizer_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-research-synthesizer'),
        roadmapper_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-roadmapper'),
        commit_docs: config.commit_docs,
        research_enabled: config.research,
        current_milestone: milestone.version,
        current_milestone_name: milestone.name,
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        project_path: '.planning/PROJECT.md',
        roadmap_path: '.planning/ROADMAP.md',
        state_path: '.planning/STATE.md',
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitQuick(cwd, description, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const now = new Date();
    const slug = description ? (0, core_js_1.generateSlugInternal)(description)?.substring(0, 40) ?? null : null;
    const quickDir = (0, core_js_1.planningPath)(cwd, 'quick');
    let nextNum = 1;
    try {
        const existing = node_fs_1.default.readdirSync(quickDir)
            .filter(f => /^\d+-/.test(f))
            .map(f => parseInt(f.split('-')[0], 10))
            .filter(n => !isNaN(n));
        if (existing.length > 0) {
            nextNum = Math.max(...existing) + 1;
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        planner_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-planner'),
        executor_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-executor'),
        checker_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-plan-checker'),
        verifier_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-verifier'),
        commit_docs: config.commit_docs,
        next_num: nextNum,
        slug,
        description: description ?? null,
        date: (0, core_js_1.todayISO)(),
        timestamp: now.toISOString(),
        quick_dir: '.planning/quick',
        task_dir: slug ? `.planning/quick/${nextNum}-${slug}` : null,
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitResume(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    let interruptedAgentId = null;
    try {
        interruptedAgentId = node_fs_1.default.readFileSync((0, core_js_1.planningPath)(cwd, 'current-agent-id.txt'), 'utf-8').trim();
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        state_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        project_path: '.planning/PROJECT.md',
        has_interrupted_agent: !!interruptedAgentId,
        interrupted_agent_id: interruptedAgentId,
        commit_docs: config.commit_docs,
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitVerifyWork(cwd, phase, raw) {
    if (!phase) {
        (0, core_js_1.error)('phase required for init verify-work');
    }
    const config = (0, core_js_1.loadConfig)(cwd);
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
    const result = {
        planner_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-planner'),
        checker_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-plan-checker'),
        commit_docs: config.commit_docs,
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory ?? null,
        phase_number: phaseInfo?.phase_number ?? null,
        phase_name: phaseInfo?.phase_name ?? null,
        has_verification: phaseInfo?.has_verification ?? false,
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitPhaseOp(cwd, phase, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    let phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase ?? '');
    if (!phaseInfo) {
        const roadmapPhase = (0, core_js_1.getRoadmapPhaseInternal)(cwd, phase ?? '');
        if (roadmapPhase?.found) {
            const phaseName = roadmapPhase.phase_name;
            phaseInfo = {
                found: true,
                directory: '', // no directory yet
                phase_number: roadmapPhase.phase_number,
                phase_name: phaseName,
                phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
                plans: [],
                summaries: [],
                incomplete_plans: [],
                has_research: false,
                has_context: false,
                has_verification: false,
            };
        }
    }
    const result = {
        commit_docs: config.commit_docs,
        brave_search: config.brave_search,
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory || null,
        phase_number: phaseInfo?.phase_number ?? null,
        phase_name: phaseInfo?.phase_name ?? null,
        phase_slug: phaseInfo?.phase_slug ?? null,
        padded_phase: phaseInfo?.phase_number?.padStart(2, '0') ?? null,
        has_research: phaseInfo?.has_research ?? false,
        has_context: phaseInfo?.has_context ?? false,
        has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
        has_verification: phaseInfo?.has_verification ?? false,
        plan_count: phaseInfo?.plans?.length ?? 0,
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        requirements_path: '.planning/REQUIREMENTS.md',
    };
    if (phaseInfo?.directory) {
        const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
        if (artifacts.context_path)
            result.context_path = artifacts.context_path;
        if (artifacts.research_path)
            result.research_path = artifacts.research_path;
        if (artifacts.verification_path)
            result.verification_path = artifacts.verification_path;
        if (artifacts.uat_path)
            result.uat_path = artifacts.uat_path;
    }
    (0, core_js_1.output)(result, raw);
}
function cmdInitTodos(cwd, area, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const now = new Date();
    const pendingDir = (0, core_js_1.planningPath)(cwd, 'todos', 'pending');
    let count = 0;
    const todos = [];
    try {
        const files = node_fs_1.default.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = node_fs_1.default.readFileSync(node_path_1.default.join(pendingDir, file), 'utf-8');
                const createdMatch = content.match(/^created:\s*(.+)$/m);
                const titleMatch = content.match(/^title:\s*(.+)$/m);
                const areaMatch = content.match(/^area:\s*(.+)$/m);
                const todoArea = areaMatch ? areaMatch[1].trim() : 'general';
                if (area && todoArea !== area)
                    continue;
                count++;
                todos.push({
                    file,
                    created: createdMatch ? createdMatch[1].trim() : 'unknown',
                    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
                    area: todoArea,
                    path: node_path_1.default.join('.planning', 'todos', 'pending', file),
                });
            }
            catch (e) {
                /* optional op, ignore */
                (0, core_js_1.debugLog)(e);
            }
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        commit_docs: config.commit_docs,
        date: (0, core_js_1.todayISO)(),
        timestamp: now.toISOString(),
        todo_count: count,
        todos,
        area_filter: area ?? null,
        pending_dir: '.planning/todos/pending',
        completed_dir: '.planning/todos/completed',
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        todos_dir_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/todos'),
        pending_dir_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/todos/pending'),
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitMilestoneOp(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const milestone = (0, core_js_1.getMilestoneInfo)(cwd);
    let phaseCount = 0;
    let completedPhases = 0;
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDir);
        phaseCount = dirs.length;
        for (const dir of dirs) {
            try {
                const phaseFiles = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDir, dir));
                const hasSummary = phaseFiles.some(f => (0, core_js_1.isSummaryFile)(f));
                if (hasSummary)
                    completedPhases++;
            }
            catch (e) {
                /* optional op, ignore */
                (0, core_js_1.debugLog)(e);
            }
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const archiveDir = (0, core_js_1.planningPath)(cwd, 'archive');
    let archivedMilestones = [];
    try {
        archivedMilestones = (0, core_js_1.listSubDirs)(archiveDir);
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        commit_docs: config.commit_docs,
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        milestone_slug: (0, core_js_1.generateSlugInternal)(milestone.name),
        phase_count: phaseCount,
        completed_phases: completedPhases,
        all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,
        archived_milestones: archivedMilestones,
        archive_count: archivedMilestones.length,
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        archive_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/archive'),
        phases_dir_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/phases'),
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitMapCodebase(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const codebaseDir = (0, core_js_1.planningPath)(cwd, 'codebase');
    let existingMaps = [];
    try {
        existingMaps = node_fs_1.default.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        mapper_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-codebase-mapper'),
        commit_docs: config.commit_docs,
        search_gitignored: config.search_gitignored,
        parallelization: config.parallelization,
        codebase_dir: '.planning/codebase',
        existing_maps: existingMaps,
        has_maps: existingMaps.length > 0,
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        codebase_dir_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/codebase'),
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitExisting(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const homedir = node_os_1.default.homedir();
    const braveKeyFile = node_path_1.default.join(homedir, '.maxsim', 'brave_api_key');
    const hasBraveSearch = !!(process.env.BRAVE_API_KEY || node_fs_1.default.existsSync(braveKeyFile));
    // Detect existing code (same logic as cmdInitNewProject)
    let hasCode = false;
    let hasPackageFile = false;
    try {
        const files = (0, node_child_process_1.execSync)('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        hasCode = files.trim().length > 0;
    }
    catch (e) {
        (0, core_js_1.debugLog)(e);
    }
    hasPackageFile =
        (0, core_js_1.pathExistsInternal)(cwd, 'package.json') ||
            (0, core_js_1.pathExistsInternal)(cwd, 'requirements.txt') ||
            (0, core_js_1.pathExistsInternal)(cwd, 'Cargo.toml') ||
            (0, core_js_1.pathExistsInternal)(cwd, 'go.mod') ||
            (0, core_js_1.pathExistsInternal)(cwd, 'Package.swift');
    // Detect existing .planning/ content for conflict dialog
    let planningFiles = [];
    try {
        const planDir = (0, core_js_1.planningPath)(cwd);
        if (node_fs_1.default.existsSync(planDir)) {
            planningFiles = node_fs_1.default
                .readdirSync(planDir, { recursive: true })
                .map((f) => String(f))
                .filter((f) => !f.startsWith('.'));
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        researcher_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-project-researcher'),
        synthesizer_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-research-synthesizer'),
        roadmapper_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-roadmapper'),
        mapper_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-codebase-mapper'),
        commit_docs: config.commit_docs,
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        planning_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning'),
        planning_files: planningFiles,
        has_codebase_map: (0, core_js_1.pathExistsInternal)(cwd, '.planning/codebase'),
        has_existing_code: hasCode,
        has_package_file: hasPackageFile,
        has_git: (0, core_js_1.pathExistsInternal)(cwd, '.git'),
        has_readme: (0, core_js_1.pathExistsInternal)(cwd, 'README.md'),
        conflict_detected: planningFiles.length > 0,
        existing_file_count: planningFiles.length,
        brave_search_available: hasBraveSearch,
        parallelization: config.parallelization,
        project_path: '.planning/PROJECT.md',
        codebase_dir: '.planning/codebase',
    };
    (0, core_js_1.output)(result, raw);
}
function cmdInitProgress(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const milestone = (0, core_js_1.getMilestoneInfo)(cwd);
    const progressPhasesDir = (0, core_js_1.phasesPath)(cwd);
    const phases = [];
    let currentPhase = null;
    let nextPhase = null;
    try {
        const dirs = (0, core_js_1.listSubDirs)(progressPhasesDir, true);
        for (const dir of dirs) {
            const match = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
            const phaseNumber = match ? match[1] : dir;
            const phaseName = match && match[2] ? match[2] : null;
            const phaseDirPath = node_path_1.default.join(progressPhasesDir, dir);
            const phaseFiles = node_fs_1.default.readdirSync(phaseDirPath);
            const plans = phaseFiles.filter(f => (0, core_js_1.isPlanFile)(f));
            const summaries = phaseFiles.filter(f => (0, core_js_1.isSummaryFile)(f));
            const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
            const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                plans.length > 0 ? 'in_progress' :
                    hasResearch ? 'researched' : 'pending';
            const phaseInfo = {
                number: phaseNumber,
                name: phaseName,
                directory: node_path_1.default.join('.planning', 'phases', dir),
                status,
                plan_count: plans.length,
                summary_count: summaries.length,
                has_research: hasResearch,
            };
            phases.push(phaseInfo);
            if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
                currentPhase = phaseInfo;
            }
            if (!nextPhase && status === 'pending') {
                nextPhase = phaseInfo;
            }
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    let pausedAt = null;
    try {
        const state = node_fs_1.default.readFileSync((0, core_js_1.planningPath)(cwd, 'STATE.md'), 'utf-8');
        const pauseMatch = state.match(/\*\*Paused At:\*\*\s*(.+)/);
        if (pauseMatch)
            pausedAt = pauseMatch[1].trim();
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    const result = {
        executor_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-executor'),
        planner_model: (0, core_js_1.resolveModelInternal)(cwd, 'maxsim-planner'),
        commit_docs: config.commit_docs,
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        phases,
        phase_count: phases.length,
        completed_count: phases.filter(p => p.status === 'complete').length,
        in_progress_count: phases.filter(p => p.status === 'in_progress').length,
        current_phase: currentPhase,
        next_phase: nextPhase,
        paused_at: pausedAt,
        has_work_in_progress: !!currentPhase,
        project_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_js_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        project_path: '.planning/PROJECT.md',
        config_path: '.planning/config.json',
    };
    (0, core_js_1.output)(result, raw);
}
//# sourceMappingURL=init.js.map