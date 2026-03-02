"use strict";
/**
 * Skill Context — Provides MAXSIM state to skills via a single CLI call
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdSkillContext = cmdSkillContext;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const state_js_1 = require("./state.js");
// ─── Command ─────────────────────────────────────────────────────────────────
function cmdSkillContext(cwd, skillName, raw) {
    const planningExists = (0, core_js_1.pathExistsInternal)(cwd, '.planning');
    if (!planningExists) {
        const result = {
            skill_name: skillName,
            planning_dir: null,
            phase: { number: null, name: null, directory: null },
            state: { current_focus: null, position: null, status: null },
            blockers: [],
            decisions: [],
            artifacts: { plan: null, summary: null, research: null, context: null, verification: null },
            config: { model_profile: 'balanced', commit_docs: true, branching_strategy: 'none' },
        };
        (0, core_js_1.output)(result, raw);
        return;
    }
    // Load config
    const config = (0, core_js_1.loadConfig)(cwd);
    // Read STATE.md
    const stateContent = (0, core_js_1.safeReadFile)((0, core_js_1.statePath)(cwd));
    let currentPhase = null;
    let currentPhaseName = null;
    let currentPlan = null;
    let status = null;
    const blockers = [];
    const decisions = [];
    if (stateContent) {
        currentPhase = (0, state_js_1.stateExtractField)(stateContent, 'Current Phase');
        currentPhaseName = (0, state_js_1.stateExtractField)(stateContent, 'Current Phase Name');
        currentPlan = (0, state_js_1.stateExtractField)(stateContent, 'Current Plan');
        status = (0, state_js_1.stateExtractField)(stateContent, 'Status');
        // Extract blockers
        const blockersMatch = stateContent.match(/##\s*Blockers\s*\n([\s\S]*?)(?=\n##|$)/i);
        if (blockersMatch) {
            const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
            for (const item of items) {
                blockers.push(item.replace(/^-\s+/, '').trim());
            }
        }
        // Extract decisions
        const decisionsMatch = stateContent.match(/##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i);
        if (decisionsMatch) {
            const rows = decisionsMatch[1].trim().split('\n').filter(r => r.includes('|'));
            for (const row of rows) {
                const cells = row.split('|').map(c => c.trim()).filter(Boolean);
                if (cells.length >= 3) {
                    decisions.push({ phase: cells[0], summary: cells[1], rationale: cells[2] });
                }
            }
        }
    }
    // Find phase directory and artifacts
    const phaseInfo = currentPhase
        ? (0, core_js_1.findPhaseInternal)(cwd, currentPhase)
        : null;
    const phaseDir = phaseInfo?.directory ?? null;
    const phaseNumber = phaseInfo?.phase_number ?? currentPhase;
    const phaseName = phaseInfo?.phase_name ?? currentPhaseName;
    // Resolve artifact paths within the phase directory
    const artifacts = {
        plan: null,
        summary: null,
        research: null,
        context: null,
        verification: null,
    };
    if (phaseDir) {
        const absPhaseDir = node_path_1.default.isAbsolute(phaseDir) ? phaseDir : node_path_1.default.join(cwd, phaseDir);
        try {
            const files = node_fs_1.default.readdirSync(absPhaseDir);
            for (const f of files) {
                if ((0, core_js_1.isPlanFile)(f)) {
                    artifacts.plan = node_path_1.default.join(phaseDir, f);
                }
                else if ((0, core_js_1.isSummaryFile)(f)) {
                    artifacts.summary = node_path_1.default.join(phaseDir, f);
                }
                else if (f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md') {
                    artifacts.research = node_path_1.default.join(phaseDir, f);
                }
                else if (f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md') {
                    artifacts.context = node_path_1.default.join(phaseDir, f);
                }
                else if (f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md') {
                    artifacts.verification = node_path_1.default.join(phaseDir, f);
                }
            }
        }
        catch {
            // Phase directory unreadable — leave artifacts as null
        }
    }
    // Build position string
    const totalPlans = stateContent ? (0, state_js_1.stateExtractField)(stateContent, 'Total Plans in Phase') : null;
    const position = currentPlan && totalPlans
        ? `Plan ${currentPlan} of ${totalPlans}`
        : currentPlan
            ? `Plan ${currentPlan}`
            : null;
    const result = {
        skill_name: skillName,
        planning_dir: '.planning',
        phase: {
            number: phaseNumber ?? null,
            name: phaseName ?? null,
            directory: phaseDir,
        },
        state: {
            current_focus: currentPhaseName ?? null,
            position,
            status,
        },
        blockers,
        decisions,
        artifacts,
        config: {
            model_profile: config.model_profile,
            commit_docs: config.commit_docs,
            branching_strategy: config.branching_strategy,
        },
    };
    (0, core_js_1.output)(result, raw);
}
//# sourceMappingURL=skill-context.js.map