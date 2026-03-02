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
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const types_js_1 = require("./types.js");
// ─── Roadmap commands ────────────────────────────────────────────────────────
async function cmdRoadmapGetPhase(cwd, phaseNum) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const content = await (0, core_js_1.safeReadFileAsync)(rmPath);
    if (!content)
        return (0, types_js_1.cmdOk)({ found: false, error: 'ROADMAP.md not found' }, '');
    try {
        const escapedPhase = phaseNum.replace(/\./g, '\\.');
        const phasePattern = (0, core_js_1.getPhasePattern)(escapedPhase, 'i');
        const headerMatch = content.match(phasePattern);
        if (!headerMatch) {
            const checklistPattern = new RegExp(`-\\s*\\[[ x]\\]\\s*\\*\\*Phase\\s+${escapedPhase}:\\s*([^*]+)\\*\\*`, 'i');
            const checklistMatch = content.match(checklistPattern);
            if (checklistMatch) {
                return (0, types_js_1.cmdOk)({ found: false, phase_number: phaseNum, phase_name: checklistMatch[1].trim(), error: 'malformed_roadmap', message: `Phase ${phaseNum} exists in summary list but missing "### Phase ${phaseNum}:" detail section. ROADMAP.md needs both formats.` }, '');
            }
            return (0, types_js_1.cmdOk)({ found: false, phase_number: phaseNum }, '');
        }
        const phaseName = headerMatch[1].trim();
        const headerIndex = headerMatch.index;
        const restOfContent = content.slice(headerIndex);
        const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
        const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
        const section = content.slice(headerIndex, sectionEnd).trim();
        const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
        const goal = goalMatch ? goalMatch[1].trim() : null;
        const criteriaMatch = section.match(/\*\*Success Criteria\*\*[^\n]*:\s*\n((?:\s*\d+\.\s*[^\n]+\n?)+)/i);
        const success_criteria = criteriaMatch ? criteriaMatch[1].trim().split('\n').map(line => line.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean) : [];
        return (0, types_js_1.cmdOk)({ found: true, phase_number: phaseNum, phase_name: phaseName, goal, success_criteria, section }, section);
    }
    catch (e) {
        return (0, types_js_1.cmdErr)('Failed to read ROADMAP.md: ' + e.message);
    }
}
async function cmdRoadmapAnalyze(cwd) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const content = await (0, core_js_1.safeReadFileAsync)(rmPath);
    if (!content)
        return (0, types_js_1.cmdOk)({ error: 'ROADMAP.md not found', milestones: [], phases: [], current_phase: null });
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
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
        parsedPhases.push({ phaseNum, phaseName, goal, depends_on, normalized: (0, core_js_1.normalizePhaseName)(phaseNum), checkboxPattern: new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum.replace('.', '\\.')}`, 'i') });
    }
    let allDirs = [];
    try {
        allDirs = await (0, core_js_1.listSubDirsAsync)(phasesDir);
    }
    catch { /* phases dir may not exist */ }
    const phases = await Promise.all(parsedPhases.map(async (p) => {
        let diskStatus = 'no_directory';
        let planCount = 0;
        let summaryCount = 0;
        let hasContext = false;
        let hasResearch = false;
        try {
            const dirMatch = allDirs.find(d => d.startsWith(p.normalized + '-') || d === p.normalized);
            if (dirMatch) {
                const phaseFiles = await node_fs_1.promises.readdir(node_path_1.default.join(phasesDir, dirMatch));
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
        return { number: p.phaseNum, name: p.phaseName, goal: p.goal, depends_on: p.depends_on, plan_count: planCount, summary_count: summaryCount, has_context: hasContext, has_research: hasResearch, disk_status: diskStatus, roadmap_complete: roadmapComplete };
    }));
    const milestones = [];
    const milestonePattern = /##\s*(.*v(\d+\.\d+)[^(\n]*)/gi;
    let mMatch;
    while ((mMatch = milestonePattern.exec(content)) !== null) {
        milestones.push({ heading: mMatch[1].trim(), version: 'v' + mMatch[2] });
    }
    const currentPhase = phases.find(p => p.disk_status === 'planned' || p.disk_status === 'partial') || null;
    const nextPhase = phases.find(p => p.disk_status === 'empty' || p.disk_status === 'no_directory' || p.disk_status === 'discussed' || p.disk_status === 'researched') || null;
    const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
    const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
    const completedPhases = phases.filter(p => p.disk_status === 'complete').length;
    const checklistPattern = /-\s*\[[ x]\]\s*\*\*Phase\s+(\d+[A-Z]?(?:\.\d+)?)/gi;
    const checklistPhases = new Set();
    let checklistMatch;
    while ((checklistMatch = checklistPattern.exec(content)) !== null)
        checklistPhases.add(checklistMatch[1]);
    const detailPhases = new Set(phases.map(p => p.number));
    const missingDetails = [...checklistPhases].filter(p => !detailPhases.has(p));
    const result = { milestones, phases, phase_count: phases.length, completed_phases: completedPhases, total_plans: totalPlans, total_summaries: totalSummaries, progress_percent: totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0, current_phase: currentPhase ? currentPhase.number : null, next_phase: nextPhase ? nextPhase.number : null, missing_phase_details: missingDetails.length > 0 ? missingDetails : null };
    return (0, types_js_1.cmdOk)(result);
}
async function cmdRoadmapUpdatePlanProgress(cwd, phaseNum) {
    if (!phaseNum)
        return (0, types_js_1.cmdErr)('phase number required for roadmap update-plan-progress');
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const phaseInfo = await (0, core_js_1.findPhaseInternalAsync)(cwd, phaseNum);
    if (!phaseInfo)
        return (0, types_js_1.cmdErr)(`Phase ${phaseNum} not found`);
    const planCount = phaseInfo.plans.length;
    const summaryCount = phaseInfo.summaries.length;
    if (planCount === 0)
        return (0, types_js_1.cmdOk)({ updated: false, reason: 'No plans found', plan_count: 0, summary_count: 0 }, 'no plans');
    const isComplete = summaryCount >= planCount;
    const status = isComplete ? 'Complete' : summaryCount > 0 ? 'In Progress' : 'Planned';
    const today = (0, core_js_1.todayISO)();
    const rawContent = await (0, core_js_1.safeReadFileAsync)(rmPath);
    if (!rawContent)
        return (0, types_js_1.cmdOk)({ updated: false, reason: 'ROADMAP.md not found', plan_count: planCount, summary_count: summaryCount }, 'no roadmap');
    let roadmapContent = rawContent;
    const phaseEscaped = phaseNum.replace('.', '\\.');
    const dateField = isComplete ? ` ${today} ` : '  ';
    roadmapContent = roadmapContent.replace(new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|)[^|]*(\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, 'i'), `$1 ${summaryCount}/${planCount} $2 ${status.padEnd(11)}$3${dateField}$4`);
    const planCountText = isComplete ? `${summaryCount}/${planCount} plans complete` : `${summaryCount}/${planCount} plans executed`;
    roadmapContent = roadmapContent.replace(new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, 'i'), `$1${planCountText}`);
    if (isComplete) {
        roadmapContent = roadmapContent.replace(new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)`, 'i'), `$1x$2 (completed ${today})`);
    }
    await node_fs_1.promises.writeFile(rmPath, roadmapContent, 'utf-8');
    return (0, types_js_1.cmdOk)({ updated: true, phase: phaseNum, plan_count: planCount, summary_count: summaryCount, status, complete: isComplete }, `${summaryCount}/${planCount} ${status}`);
}
//# sourceMappingURL=roadmap.js.map