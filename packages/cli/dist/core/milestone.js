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
const node_fs_2 = require("node:fs");
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
async function cmdMilestoneComplete(cwd, version, options) {
    if (!version) {
        return (0, types_js_1.cmdErr)('version required for milestone complete (e.g., v1.0)');
    }
    const roadmapPath = (0, core_js_1.roadmapPath)(cwd);
    const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
    const statePath = (0, core_js_1.statePath)(cwd);
    const milestonesPath = (0, core_js_1.planningPath)(cwd, 'MILESTONES.md');
    const archiveDir = (0, core_js_1.archivePath)(cwd, version);
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
    const today = (0, core_js_1.todayISO)();
    const milestoneName = options.name || version;
    await node_fs_2.promises.mkdir(archiveDir, { recursive: true });
    let phaseCount = 0;
    let totalPlans = 0;
    let totalTasks = 0;
    const accomplishments = [];
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDir, true);
        for (const dir of dirs) {
            phaseCount++;
            const phaseFiles = await node_fs_2.promises.readdir(node_path_1.default.join(phasesDir, dir));
            const plans = phaseFiles.filter(core_js_1.isPlanFile);
            const summaries = phaseFiles.filter(core_js_1.isSummaryFile);
            totalPlans += plans.length;
            for (const s of summaries) {
                try {
                    const content = await node_fs_2.promises.readFile(node_path_1.default.join(phasesDir, dir, s), 'utf-8');
                    const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
                    if (fm['one-liner']) {
                        accomplishments.push(String(fm['one-liner']));
                    }
                    const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
                    totalTasks += taskMatches.length;
                }
                catch (e) {
                    (0, core_js_1.debugLog)(e);
                }
            }
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)(e);
    }
    // Snapshot STATE.md and ROADMAP.md to archive before any modifications
    const stateExists = await (0, core_js_1.pathExistsAsync)(statePath);
    if (stateExists) {
        const stateContent = await node_fs_2.promises.readFile(statePath, 'utf-8');
        await node_fs_2.promises.writeFile(node_path_1.default.join(archiveDir, 'STATE.md'), stateContent, 'utf-8');
    }
    const roadmapExists = await (0, core_js_1.pathExistsAsync)(roadmapPath);
    if (roadmapExists) {
        const roadmapContent = await node_fs_2.promises.readFile(roadmapPath, 'utf-8');
        await node_fs_2.promises.writeFile(node_path_1.default.join(archiveDir, 'ROADMAP.md'), roadmapContent, 'utf-8');
    }
    // Archive ROADMAP.md (legacy format kept for compatibility)
    if (roadmapExists) {
        const roadmapContent = await node_fs_2.promises.readFile(roadmapPath, 'utf-8');
        await node_fs_2.promises.writeFile(node_path_1.default.join(archiveDir, `${version}-ROADMAP.md`), roadmapContent, 'utf-8');
    }
    // Archive REQUIREMENTS.md
    if (await (0, core_js_1.pathExistsAsync)(reqPath)) {
        const reqContent = await node_fs_2.promises.readFile(reqPath, 'utf-8');
        const archiveHeader = `# Requirements Archive: ${version} ${milestoneName}\n\n**Archived:** ${today}\n**Status:** SHIPPED\n\nFor current requirements, see \`.planning/REQUIREMENTS.md\`.\n\n---\n\n`;
        await node_fs_2.promises.writeFile(node_path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`), archiveHeader + reqContent, 'utf-8');
    }
    // Archive audit file if exists
    const auditFile = node_path_1.default.join(cwd, '.planning', `${version}-MILESTONE-AUDIT.md`);
    if (await (0, core_js_1.pathExistsAsync)(auditFile)) {
        await node_fs_2.promises.rename(auditFile, node_path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`));
    }
    // Create/append MILESTONES.md entry
    const accomplishmentsList = accomplishments.map(a => `- ${a}`).join('\n');
    const milestoneEntry = `## ${version} ${milestoneName} (Shipped: ${today})\n\n**Phases completed:** ${phaseCount} phases, ${totalPlans} plans, ${totalTasks} tasks\n\n**Key accomplishments:**\n${accomplishmentsList || '- (none recorded)'}\n\n---\n\n`;
    if (await (0, core_js_1.pathExistsAsync)(milestonesPath)) {
        const existing = await node_fs_2.promises.readFile(milestonesPath, 'utf-8');
        await node_fs_2.promises.writeFile(milestonesPath, existing + '\n' + milestoneEntry, 'utf-8');
    }
    else {
        await node_fs_2.promises.writeFile(milestonesPath, `# Milestones\n\n${milestoneEntry}`, 'utf-8');
    }
    // Reset STATE.md to clean template
    if (stateExists) {
        const newMilestoneName = options.name || 'Next milestone';
        const cleanState = `# Project State

## Project Reference

See: .planning/PROJECT.md (updated ${today})

## Current Position

Milestone: ${newMilestoneName}
Phase: 0 of ? (not started)
Status: planning
Last activity: ${today}

## Performance Metrics

No plans executed yet in this milestone.

## Accumulated Context

### Decisions

None.

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: ${today}
`;
        await node_fs_2.promises.writeFile(statePath, cleanState, 'utf-8');
    }
    // Archive phase directories if requested
    let phasesArchived = false;
    if (options.archivePhases) {
        try {
            const phaseArchiveDir = node_path_1.default.join(archiveDir, 'phases');
            await node_fs_2.promises.mkdir(phaseArchiveDir, { recursive: true });
            const phaseDirNames = await (0, core_js_1.listSubDirsAsync)(phasesDir);
            for (const dir of phaseDirNames) {
                await node_fs_2.promises.rename(node_path_1.default.join(phasesDir, dir), node_path_1.default.join(phaseArchiveDir, dir));
            }
            phasesArchived = phaseDirNames.length > 0;
        }
        catch (e) {
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
            roadmap: await (0, core_js_1.pathExistsAsync)(node_path_1.default.join(archiveDir, `${version}-ROADMAP.md`)),
            requirements: await (0, core_js_1.pathExistsAsync)(node_path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`)),
            audit: await (0, core_js_1.pathExistsAsync)(node_path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`)),
            phases: phasesArchived,
            state_snapshot: await (0, core_js_1.pathExistsAsync)(node_path_1.default.join(archiveDir, 'STATE.md')),
            roadmap_snapshot: await (0, core_js_1.pathExistsAsync)(node_path_1.default.join(archiveDir, 'ROADMAP.md')),
        },
        milestones_updated: true,
        state_updated: stateExists,
        state_reset: stateExists,
    };
    return (0, types_js_1.cmdOk)(result);
}
//# sourceMappingURL=milestone.js.map