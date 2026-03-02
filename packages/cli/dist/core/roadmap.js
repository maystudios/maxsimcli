"use strict";
/**
 * Roadmap — Roadmap parsing and update operations
 *
 * Ported from maxsim/bin/lib/roadmap.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdRoadmapGetPhase = cmdRoadmapGetPhase;
exports.cmdRoadmapAnalyze = cmdRoadmapAnalyze;
exports.cmdRoadmapUpdatePlanProgress = cmdRoadmapUpdatePlanProgress;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
// ─── Roadmap commands ────────────────────────────────────────────────────────
function cmdRoadmapGetPhase(cwd, phaseNum, raw) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    if (!node_fs_1.default.existsSync(rmPath)) {
        (0, core_js_1.output)({ found: false, error: 'ROADMAP.md not found' }, raw, '');
        return;
    }
    try {
        const content = node_fs_1.default.readFileSync(rmPath, 'utf-8');
        const escapedPhase = phaseNum.replace(/\./g, '\\.');
        const phasePattern = (0, core_js_1.getPhasePattern)(escapedPhase, 'i');
        const headerMatch = content.match(phasePattern);
        if (!headerMatch) {
            const checklistPattern = new RegExp(`-\\s*\\[[ x]\\]\\s*\\*\\*Phase\\s+${escapedPhase}:\\s*([^*]+)\\*\\*`, 'i');
            const checklistMatch = content.match(checklistPattern);
            if (checklistMatch) {
                (0, core_js_1.output)({
                    found: false,
                    phase_number: phaseNum,
                    phase_name: checklistMatch[1].trim(),
                    error: 'malformed_roadmap',
                    message: `Phase ${phaseNum} exists in summary list but missing "### Phase ${phaseNum}:" detail section. ROADMAP.md needs both formats.`
                }, raw, '');
                return;
            }
            (0, core_js_1.output)({ found: false, phase_number: phaseNum }, raw, '');
            return;
        }
        const phaseName = headerMatch[1].trim();
        const headerIndex = headerMatch.index;
        const restOfContent = content.slice(headerIndex);
        const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
        const sectionEnd = nextHeaderMatch
            ? headerIndex + nextHeaderMatch.index
            : content.length;
        const section = content.slice(headerIndex, sectionEnd).trim();
        const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
        const goal = goalMatch ? goalMatch[1].trim() : null;
        const criteriaMatch = section.match(/\*\*Success Criteria\*\*[^\n]*:\s*\n((?:\s*\d+\.\s*[^\n]+\n?)+)/i);
        const success_criteria = criteriaMatch
            ? criteriaMatch[1].trim().split('\n').map(line => line.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean)
            : [];
        (0, core_js_1.output)({
            found: true,
            phase_number: phaseNum,
            phase_name: phaseName,
            goal,
            success_criteria,
            section,
        }, raw, section);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)('Failed to read ROADMAP.md: ' + e.message);
    }
}
async function cmdRoadmapAnalyze(cwd, raw) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const content = await (0, core_js_1.safeReadFileAsync)(rmPath);
    if (!content) {
        (0, core_js_1.output)({ error: 'ROADMAP.md not found', milestones: [], phases: [], current_phase: null }, raw);
        return;
    }
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
    // Parse all phase headers from roadmap
    const phasePattern = (0, core_js_1.getPhasePattern)();
    const parsedPhases = [];
    let match;
    while ((match = phasePattern.exec(content)) !== null) {
        const phaseNum = match[1];
        const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();
        const sectionStart = match.index;
        const restOfContent = content.slice(sectionStart);
        const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
        const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
        const section = content.slice(sectionStart, sectionEnd);
        const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
        const goal = goalMatch ? goalMatch[1].trim() : null;
        const dependsMatch = section.match(/\*\*Depends on:\*\*\s*([^\n]+)/i);
        const depends_on = dependsMatch ? dependsMatch[1].trim() : null;
        parsedPhases.push({
            phaseNum,
            phaseName,
            goal,
            depends_on,
            normalized: (0, core_js_1.normalizePhaseName)(phaseNum),
            checkboxPattern: new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum.replace('.', '\\.')}`, 'i'),
        });
    }
    // Read all phase directories in parallel
    let allDirs = [];
    try {
        allDirs = await (0, core_js_1.listSubDirsAsync)(phasesDir);
    }
    catch {
        // phases dir may not exist
    }
    // Scan each phase's disk status in parallel
    const phases = await Promise.all(parsedPhases.map(async (p) => {
        let diskStatus = 'no_directory';
        let planCount = 0;
        let summaryCount = 0;
        let hasContext = false;
        let hasResearch = false;
        try {
            const dirMatch = allDirs.find(d => d.startsWith(p.normalized + '-') || d === p.normalized);
            if (dirMatch) {
                const phaseFiles = await node_fs_1.default.promises.readdir(node_path_1.default.join(phasesDir, dirMatch));
                planCount = phaseFiles.filter(f => (0, core_js_1.isPlanFile)(f)).length;
                summaryCount = phaseFiles.filter(f => (0, core_js_1.isSummaryFile)(f)).length;
                hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
                hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
                if (summaryCount >= planCount && planCount > 0)
                    diskStatus = 'complete';
                else if (summaryCount > 0)
                    diskStatus = 'partial';
                else if (planCount > 0)
                    diskStatus = 'planned';
                else if (hasResearch)
                    diskStatus = 'researched';
                else if (hasContext)
                    diskStatus = 'discussed';
                else
                    diskStatus = 'empty';
            }
        }
        catch (e) {
            (0, core_js_1.debugLog)(e);
        }
        const checkboxMatch = content.match(p.checkboxPattern);
        const roadmapComplete = checkboxMatch ? checkboxMatch[1] === 'x' : false;
        return {
            number: p.phaseNum,
            name: p.phaseName,
            goal: p.goal,
            depends_on: p.depends_on,
            plan_count: planCount,
            summary_count: summaryCount,
            has_context: hasContext,
            has_research: hasResearch,
            disk_status: diskStatus,
            roadmap_complete: roadmapComplete,
        };
    }));
    const milestones = [];
    const milestonePattern = /##\s*(.*v(\d+\.\d+)[^(\n]*)/gi;
    let mMatch;
    while ((mMatch = milestonePattern.exec(content)) !== null) {
        milestones.push({
            heading: mMatch[1].trim(),
            version: 'v' + mMatch[2],
        });
    }
    const currentPhase = phases.find(p => p.disk_status === 'planned' || p.disk_status === 'partial') || null;
    const nextPhase = phases.find(p => p.disk_status === 'empty' || p.disk_status === 'no_directory' || p.disk_status === 'discussed' || p.disk_status === 'researched') || null;
    const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
    const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
    const completedPhases = phases.filter(p => p.disk_status === 'complete').length;
    const checklistPattern = /-\s*\[[ x]\]\s*\*\*Phase\s+(\d+[A-Z]?(?:\.\d+)?)/gi;
    const checklistPhases = new Set();
    let checklistMatch;
    while ((checklistMatch = checklistPattern.exec(content)) !== null) {
        checklistPhases.add(checklistMatch[1]);
    }
    const detailPhases = new Set(phases.map(p => p.number));
    const missingDetails = [...checklistPhases].filter(p => !detailPhases.has(p));
    const result = {
        milestones,
        phases,
        phase_count: phases.length,
        completed_phases: completedPhases,
        total_plans: totalPlans,
        total_summaries: totalSummaries,
        progress_percent: totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0,
        current_phase: currentPhase ? currentPhase.number : null,
        next_phase: nextPhase ? nextPhase.number : null,
        missing_phase_details: missingDetails.length > 0 ? missingDetails : null,
    };
    (0, core_js_1.output)(result, raw);
}
function cmdRoadmapUpdatePlanProgress(cwd, phaseNum, raw) {
    if (!phaseNum) {
        (0, core_js_1.error)('phase number required for roadmap update-plan-progress');
    }
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phaseNum);
    if (!phaseInfo) {
        (0, core_js_1.error)(`Phase ${phaseNum} not found`);
    }
    const planCount = phaseInfo.plans.length;
    const summaryCount = phaseInfo.summaries.length;
    if (planCount === 0) {
        (0, core_js_1.output)({ updated: false, reason: 'No plans found', plan_count: 0, summary_count: 0 }, raw, 'no plans');
        return;
    }
    const isComplete = summaryCount >= planCount;
    const status = isComplete ? 'Complete' : summaryCount > 0 ? 'In Progress' : 'Planned';
    const today = (0, core_js_1.todayISO)();
    if (!node_fs_1.default.existsSync(rmPath)) {
        (0, core_js_1.output)({ updated: false, reason: 'ROADMAP.md not found', plan_count: planCount, summary_count: summaryCount }, raw, 'no roadmap');
        return;
    }
    let roadmapContent = node_fs_1.default.readFileSync(rmPath, 'utf-8');
    const phaseEscaped = phaseNum.replace('.', '\\.');
    const tablePattern = new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|)[^|]*(\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, 'i');
    const dateField = isComplete ? ` ${today} ` : '  ';
    roadmapContent = roadmapContent.replace(tablePattern, `$1 ${summaryCount}/${planCount} $2 ${status.padEnd(11)}$3${dateField}$4`);
    const planCountPattern = new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, 'i');
    const planCountText = isComplete
        ? `${summaryCount}/${planCount} plans complete`
        : `${summaryCount}/${planCount} plans executed`;
    roadmapContent = roadmapContent.replace(planCountPattern, `$1${planCountText}`);
    if (isComplete) {
        const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)`, 'i');
        roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
    }
    node_fs_1.default.writeFileSync(rmPath, roadmapContent, 'utf-8');
    (0, core_js_1.output)({
        updated: true,
        phase: phaseNum,
        plan_count: planCount,
        summary_count: summaryCount,
        status,
        complete: isComplete,
    }, raw, `${summaryCount}/${planCount} ${status}`);
}
//# sourceMappingURL=roadmap.js.map