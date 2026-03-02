"use strict";
/**
 * Milestone — Milestone and requirements lifecycle operations
 *
 * Ported from maxsim/bin/lib/milestone.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdRequirementsMarkComplete = cmdRequirementsMarkComplete;
exports.cmdMilestoneComplete = cmdMilestoneComplete;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
const types_js_1 = require("./types.js");
// ─── Requirements commands ───────────────────────────────────────────────────
function cmdRequirementsMarkComplete(cwd, reqIdsRaw) {
    if (!reqIdsRaw || reqIdsRaw.length === 0) {
        return (0, types_js_1.cmdErr)('requirement IDs required. Usage: requirements mark-complete REQ-01,REQ-02 or REQ-01 REQ-02');
    }
    const reqIds = reqIdsRaw
        .join(' ')
        .replace(/[\[\]]/g, '')
        .split(/[,\s]+/)
        .map(r => r.trim())
        .filter(Boolean);
    if (reqIds.length === 0) {
        return (0, types_js_1.cmdErr)('no valid requirement IDs found');
    }
    const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
    if (!node_fs_1.default.existsSync(reqPath)) {
        return (0, types_js_1.cmdOk)({ updated: false, reason: 'REQUIREMENTS.md not found', ids: reqIds }, 'no requirements file');
    }
    let reqContent = node_fs_1.default.readFileSync(reqPath, 'utf-8');
    const updated = [];
    const notFound = [];
    for (const reqId of reqIds) {
        let found = false;
        const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, 'gi');
        if (checkboxPattern.test(reqContent)) {
            reqContent = reqContent.replace(checkboxPattern, '$1x$2');
            found = true;
        }
        const tablePattern = new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi');
        if (tablePattern.test(reqContent)) {
            reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'), '$1 Complete $2');
            found = true;
        }
        if (found) {
            updated.push(reqId);
        }
        else {
            notFound.push(reqId);
        }
    }
    if (updated.length > 0) {
        node_fs_1.default.writeFileSync(reqPath, reqContent, 'utf-8');
    }
    const result = {
        updated: updated.length > 0,
        marked_complete: updated,
        not_found: notFound,
        total: reqIds.length,
    };
    return (0, types_js_1.cmdOk)(result, `${updated.length}/${reqIds.length} requirements marked complete`);
}
// ─── Milestone commands ──────────────────────────────────────────────────────
function cmdMilestoneComplete(cwd, version, options) {
    if (!version) {
        return (0, types_js_1.cmdErr)('version required for milestone complete (e.g., v1.0)');
    }
    const roadmapPath = (0, core_js_1.roadmapPath)(cwd);
    const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
    const statePath = (0, core_js_1.statePath)(cwd);
    const milestonesPath = (0, core_js_1.planningPath)(cwd, 'MILESTONES.md');
    const archiveDir = (0, core_js_1.planningPath)(cwd, 'milestones');
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
    const today = (0, core_js_1.todayISO)();
    const milestoneName = options.name || version;
    node_fs_1.default.mkdirSync(archiveDir, { recursive: true });
    let phaseCount = 0;
    let totalPlans = 0;
    let totalTasks = 0;
    const accomplishments = [];
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDir, true);
        for (const dir of dirs) {
            phaseCount++;
            const phaseFiles = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDir, dir));
            const plans = phaseFiles.filter(core_js_1.isPlanFile);
            const summaries = phaseFiles.filter(core_js_1.isSummaryFile);
            totalPlans += plans.length;
            for (const s of summaries) {
                try {
                    const content = node_fs_1.default.readFileSync(node_path_1.default.join(phasesDir, dir, s), 'utf-8');
                    const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
                    if (fm['one-liner']) {
                        accomplishments.push(String(fm['one-liner']));
                    }
                    const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
                    totalTasks += taskMatches.length;
                }
                catch (e) {
                    /* optional op, ignore */
                    (0, core_js_1.debugLog)(e);
                }
            }
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    // Archive ROADMAP.md
    if (node_fs_1.default.existsSync(roadmapPath)) {
        const roadmapContent = node_fs_1.default.readFileSync(roadmapPath, 'utf-8');
        node_fs_1.default.writeFileSync(node_path_1.default.join(archiveDir, `${version}-ROADMAP.md`), roadmapContent, 'utf-8');
    }
    // Archive REQUIREMENTS.md
    if (node_fs_1.default.existsSync(reqPath)) {
        const reqContent = node_fs_1.default.readFileSync(reqPath, 'utf-8');
        const archiveHeader = `# Requirements Archive: ${version} ${milestoneName}\n\n**Archived:** ${today}\n**Status:** SHIPPED\n\nFor current requirements, see \`.planning/REQUIREMENTS.md\`.\n\n---\n\n`;
        node_fs_1.default.writeFileSync(node_path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`), archiveHeader + reqContent, 'utf-8');
    }
    // Archive audit file if exists
    const auditFile = node_path_1.default.join(cwd, '.planning', `${version}-MILESTONE-AUDIT.md`);
    if (node_fs_1.default.existsSync(auditFile)) {
        node_fs_1.default.renameSync(auditFile, node_path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`));
    }
    // Create/append MILESTONES.md entry
    const accomplishmentsList = accomplishments.map(a => `- ${a}`).join('\n');
    const milestoneEntry = `## ${version} ${milestoneName} (Shipped: ${today})\n\n**Phases completed:** ${phaseCount} phases, ${totalPlans} plans, ${totalTasks} tasks\n\n**Key accomplishments:**\n${accomplishmentsList || '- (none recorded)'}\n\n---\n\n`;
    if (node_fs_1.default.existsSync(milestonesPath)) {
        const existing = node_fs_1.default.readFileSync(milestonesPath, 'utf-8');
        node_fs_1.default.writeFileSync(milestonesPath, existing + '\n' + milestoneEntry, 'utf-8');
    }
    else {
        node_fs_1.default.writeFileSync(milestonesPath, `# Milestones\n\n${milestoneEntry}`, 'utf-8');
    }
    // Update STATE.md
    if (node_fs_1.default.existsSync(statePath)) {
        let stateContent = node_fs_1.default.readFileSync(statePath, 'utf-8');
        stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${version} milestone complete`);
        stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
        stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1${version} milestone completed and archived`);
        node_fs_1.default.writeFileSync(statePath, stateContent, 'utf-8');
    }
    // Archive phase directories if requested
    let phasesArchived = false;
    if (options.archivePhases) {
        try {
            const phaseArchiveDir = node_path_1.default.join(archiveDir, `${version}-phases`);
            node_fs_1.default.mkdirSync(phaseArchiveDir, { recursive: true });
            const phaseDirNames = (0, core_js_1.listSubDirs)(phasesDir);
            for (const dir of phaseDirNames) {
                node_fs_1.default.renameSync(node_path_1.default.join(phasesDir, dir), node_path_1.default.join(phaseArchiveDir, dir));
            }
            phasesArchived = phaseDirNames.length > 0;
        }
        catch (e) {
            /* optional op, ignore */
            (0, core_js_1.debugLog)(e);
        }
    }
    const result = {
        version,
        name: milestoneName,
        date: today,
        phases: phaseCount,
        plans: totalPlans,
        tasks: totalTasks,
        accomplishments,
        archived: {
            roadmap: node_fs_1.default.existsSync(node_path_1.default.join(archiveDir, `${version}-ROADMAP.md`)),
            requirements: node_fs_1.default.existsSync(node_path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`)),
            audit: node_fs_1.default.existsSync(node_path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`)),
            phases: phasesArchived,
        },
        milestones_updated: true,
        state_updated: node_fs_1.default.existsSync(statePath),
    };
    return (0, types_js_1.cmdOk)(result);
}
//# sourceMappingURL=milestone.js.map