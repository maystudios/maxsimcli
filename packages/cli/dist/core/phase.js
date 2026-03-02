"use strict";
/**
 * Phase — Phase CRUD, query, and lifecycle operations
 *
 * Ported from maxsim/bin/lib/phase.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaffoldPhaseStubs = scaffoldPhaseStubs;
exports.phaseAddCore = phaseAddCore;
exports.phaseInsertCore = phaseInsertCore;
exports.phaseCompleteCore = phaseCompleteCore;
exports.cmdPhasesList = cmdPhasesList;
exports.cmdPhaseNextDecimal = cmdPhaseNextDecimal;
exports.cmdFindPhase = cmdFindPhase;
exports.cmdPhasePlanIndex = cmdPhasePlanIndex;
exports.cmdPhaseAdd = cmdPhaseAdd;
exports.cmdPhaseInsert = cmdPhaseInsert;
exports.cmdPhaseRemove = cmdPhaseRemove;
exports.cmdPhaseComplete = cmdPhaseComplete;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
const types_js_1 = require("./types.js");
// ─── Stub scaffolding ───────────────────────────────────────────────────────
async function scaffoldPhaseStubs(dirPath, phaseId, name) {
    const today = (0, core_js_1.todayISO)();
    await Promise.all([
        node_fs_1.promises.writeFile(node_path_1.default.join(dirPath, `${phaseId}-CONTEXT.md`), `# Phase ${phaseId} Context: ${name}\n\n**Created:** ${today}\n**Phase goal:** [To be defined during /maxsim:discuss-phase]\n\n---\n\n_Context will be populated by /maxsim:discuss-phase_\n`),
        node_fs_1.promises.writeFile(node_path_1.default.join(dirPath, `${phaseId}-RESEARCH.md`), `# Phase ${phaseId}: ${name} - Research\n\n**Researched:** Not yet\n**Domain:** TBD\n**Confidence:** TBD\n\n---\n\n_Research will be populated by /maxsim:research-phase_\n`),
    ]);
}
// ─── Core functions ─────────────────────────────────────────────────────────
async function phaseAddCore(cwd, description, options) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    let content;
    try {
        content = await node_fs_1.promises.readFile(rmPath, 'utf-8');
    }
    catch {
        throw new Error('ROADMAP.md not found');
    }
    const slug = (0, core_js_1.generateSlugInternal)(description);
    const phasePattern = (0, core_js_1.getPhasePattern)();
    let maxPhase = 0;
    let m;
    while ((m = phasePattern.exec(content)) !== null) {
        const num = parseInt(m[1], 10);
        if (num > maxPhase)
            maxPhase = num;
    }
    const newPhaseNum = maxPhase + 1;
    const paddedNum = String(newPhaseNum).padStart(2, '0');
    const dirName = `${paddedNum}-${slug}`;
    const dirPath = (0, core_js_1.planningPath)(cwd, 'phases', dirName);
    await node_fs_1.promises.mkdir(dirPath, { recursive: true });
    await node_fs_1.promises.writeFile(node_path_1.default.join(dirPath, '.gitkeep'), '');
    if (options?.includeStubs) {
        await scaffoldPhaseStubs(dirPath, paddedNum, description);
    }
    const phaseEntry = `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${newPhaseNum} to break down)\n`;
    let updatedContent;
    const lastSeparator = content.lastIndexOf('\n---');
    if (lastSeparator > 0) {
        updatedContent = content.slice(0, lastSeparator) + phaseEntry + content.slice(lastSeparator);
    }
    else {
        updatedContent = content + phaseEntry;
    }
    await node_fs_1.promises.writeFile(rmPath, updatedContent, 'utf-8');
    return {
        phase_number: newPhaseNum,
        padded: paddedNum,
        slug,
        directory: `.planning/phases/${dirName}`,
        description,
    };
}
async function phaseInsertCore(cwd, afterPhase, description, options) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    let content;
    try {
        content = await node_fs_1.promises.readFile(rmPath, 'utf-8');
    }
    catch {
        throw new Error('ROADMAP.md not found');
    }
    const slug = (0, core_js_1.generateSlugInternal)(description);
    const normalizedAfter = (0, core_js_1.normalizePhaseName)(afterPhase);
    const unpadded = normalizedAfter.replace(/^0+/, '');
    const afterPhaseEscaped = '0*' + unpadded.replace(/\./g, '\\.');
    const targetPattern = (0, core_js_1.getPhasePattern)(afterPhaseEscaped, 'i');
    if (!targetPattern.test(content)) {
        throw new Error(`Phase ${afterPhase} not found in ROADMAP.md`);
    }
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalizedBase = (0, core_js_1.normalizePhaseName)(afterPhase);
    const existingDecimals = [];
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath);
        const decimalPattern = new RegExp(`^${normalizedBase}\\.(\\d+)`);
        for (const dir of dirs) {
            const dm = dir.match(decimalPattern);
            if (dm)
                existingDecimals.push(parseInt(dm[1], 10));
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('phase-insert-decimal-scan-failed', e);
    }
    const nextDecimal = existingDecimals.length === 0 ? 1 : Math.max(...existingDecimals) + 1;
    const decimalPhase = `${normalizedBase}.${nextDecimal}`;
    const dirName = `${decimalPhase}-${slug}`;
    const dirPath = (0, core_js_1.planningPath)(cwd, 'phases', dirName);
    await node_fs_1.promises.mkdir(dirPath, { recursive: true });
    await node_fs_1.promises.writeFile(node_path_1.default.join(dirPath, '.gitkeep'), '');
    if (options?.includeStubs) {
        await scaffoldPhaseStubs(dirPath, decimalPhase, description);
    }
    const phaseEntry = `\n### Phase ${decimalPhase}: ${description} (INSERTED)\n\n**Goal:** [Urgent work - to be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${afterPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${decimalPhase} to break down)\n`;
    const headerPattern = new RegExp(`(#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:[^\\n]*\\n)`, 'i');
    const headerMatch = content.match(headerPattern);
    if (!headerMatch) {
        throw new Error(`Could not find Phase ${afterPhase} header`);
    }
    const headerIdx = content.indexOf(headerMatch[0]);
    const afterHeader = content.slice(headerIdx + headerMatch[0].length);
    const nextPhaseMatch = afterHeader.match(/\n#{2,4}\s+Phase\s+\d/i);
    let insertIdx;
    if (nextPhaseMatch) {
        insertIdx = headerIdx + headerMatch[0].length + nextPhaseMatch.index;
    }
    else {
        insertIdx = content.length;
    }
    const updatedContent = content.slice(0, insertIdx) + phaseEntry + content.slice(insertIdx);
    await node_fs_1.promises.writeFile(rmPath, updatedContent, 'utf-8');
    return {
        phase_number: decimalPhase,
        after_phase: afterPhase,
        slug,
        directory: `.planning/phases/${dirName}`,
        description,
    };
}
async function phaseCompleteCore(cwd, phaseNum) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const stPath = (0, core_js_1.statePath)(cwd);
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const today = (0, core_js_1.todayISO)();
    const phaseInfo = await (0, core_js_1.findPhaseInternalAsync)(cwd, phaseNum);
    if (!phaseInfo) {
        throw new Error(`Phase ${phaseNum} not found`);
    }
    const planCount = phaseInfo.plans.length;
    const summaryCount = phaseInfo.summaries.length;
    let requirementsUpdated = false;
    const rmExists = await (0, core_js_1.pathExistsAsync)(rmPath);
    if (rmExists) {
        let roadmapContent = await node_fs_1.promises.readFile(rmPath, 'utf-8');
        const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${(0, core_js_1.escapePhaseNum)(phaseNum)}[:\\s][^\\n]*)`, 'i');
        roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
        const phaseEscaped = (0, core_js_1.escapePhaseNum)(phaseNum);
        const tablePattern = new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|[^|]*\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, 'i');
        roadmapContent = roadmapContent.replace(tablePattern, `$1 Complete    $2 ${today} $3`);
        const planCountPattern = new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, 'i');
        roadmapContent = roadmapContent.replace(planCountPattern, `$1${summaryCount}/${planCount} plans complete`);
        (0, core_js_1.debugLog)('phase-complete-write', `writing ROADMAP.md for phase ${phaseNum}`);
        await node_fs_1.promises.writeFile(rmPath, roadmapContent, 'utf-8');
        (0, core_js_1.debugLog)('phase-complete-write', `ROADMAP.md updated for phase ${phaseNum}`);
        // Update REQUIREMENTS.md
        const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
        if (await (0, core_js_1.pathExistsAsync)(reqPath)) {
            const reqMatch = roadmapContent.match(new RegExp(`Phase\\s+${(0, core_js_1.escapePhaseNum)(phaseNum)}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, 'i'));
            if (reqMatch) {
                const reqIds = reqMatch[1].replace(/[\[\]]/g, '').split(/[,\s]+/).map(r => r.trim()).filter(Boolean);
                let reqContent = await node_fs_1.promises.readFile(reqPath, 'utf-8');
                for (const reqId of reqIds) {
                    reqContent = reqContent.replace(new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, 'gi'), '$1x$2');
                    reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'), '$1 Complete $2');
                }
                (0, core_js_1.debugLog)('phase-complete-write', `writing REQUIREMENTS.md for phase ${phaseNum}`);
                await node_fs_1.promises.writeFile(reqPath, reqContent, 'utf-8');
                (0, core_js_1.debugLog)('phase-complete-write', `REQUIREMENTS.md updated for phase ${phaseNum}`);
                requirementsUpdated = true;
            }
        }
    }
    // Find next phase
    let nextPhaseNum = null;
    let nextPhaseName = null;
    let isLastPhase = true;
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
        for (const dir of dirs) {
            const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
            if (dm) {
                if ((0, core_js_1.comparePhaseNum)(dm[1], phaseNum) > 0) {
                    nextPhaseNum = dm[1];
                    nextPhaseName = dm[2] || null;
                    isLastPhase = false;
                    break;
                }
            }
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('phase-complete-next-phase-scan-failed', e);
    }
    // Update STATE.md
    const stExists = await (0, core_js_1.pathExistsAsync)(stPath);
    if (stExists) {
        let stateContent = await node_fs_1.promises.readFile(stPath, 'utf-8');
        stateContent = stateContent.replace(/(\*\*Current Phase:\*\*\s*).*/, `$1${nextPhaseNum || phaseNum}`);
        if (nextPhaseName) {
            stateContent = stateContent.replace(/(\*\*Current Phase Name:\*\*\s*).*/, `$1${nextPhaseName.replace(/-/g, ' ')}`);
        }
        stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${isLastPhase ? 'Milestone complete' : 'Ready to plan'}`);
        stateContent = stateContent.replace(/(\*\*Current Plan:\*\*\s*).*/, `$1Not started`);
        stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
        stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1Phase ${phaseNum} complete${nextPhaseNum ? `, transitioned to Phase ${nextPhaseNum}` : ''}`);
        (0, core_js_1.debugLog)('phase-complete-write', `writing STATE.md for phase ${phaseNum}`);
        await node_fs_1.promises.writeFile(stPath, stateContent, 'utf-8');
        (0, core_js_1.debugLog)('phase-complete-write', `STATE.md updated for phase ${phaseNum}`);
    }
    return {
        completed_phase: phaseNum,
        phase_name: phaseInfo.phase_name,
        plans_executed: `${summaryCount}/${planCount}`,
        next_phase: nextPhaseNum,
        next_phase_name: nextPhaseName,
        is_last_phase: isLastPhase,
        date: today,
        roadmap_updated: rmExists,
        state_updated: stExists,
        requirements_updated: requirementsUpdated,
    };
}
// ─── Phase list ─────────────────────────────────────────────────────────────
async function cmdPhasesList(cwd, options) {
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const { type, phase, includeArchived, offset, limit } = options;
    if (!(await (0, core_js_1.pathExistsAsync)(phasesDirPath))) {
        if (type) {
            return (0, types_js_1.cmdOk)({ files: [], count: 0, total: 0 }, '');
        }
        else {
            return (0, types_js_1.cmdOk)({ directories: [], count: 0, total: 0 }, '');
        }
    }
    try {
        let dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath);
        if (includeArchived) {
            const archived = await (0, core_js_1.getArchivedPhaseDirsAsync)(cwd);
            for (const a of archived) {
                dirs.push(`${a.name} [${a.milestone}]`);
            }
        }
        dirs.sort((a, b) => (0, core_js_1.comparePhaseNum)(a, b));
        if (phase) {
            const normalized = (0, core_js_1.normalizePhaseName)(phase);
            const match = dirs.find(d => d.startsWith(normalized));
            if (!match) {
                return (0, types_js_1.cmdOk)({ files: [], count: 0, total: 0, phase_dir: null, error: 'Phase not found' }, '');
            }
            dirs = [match];
        }
        if (type) {
            const fileResults = await Promise.all(dirs.map(async (dir) => {
                const dirPath = node_path_1.default.join(phasesDirPath, dir);
                const dirFiles = await node_fs_1.promises.readdir(dirPath);
                let filtered;
                if (type === 'plans') {
                    filtered = dirFiles.filter(core_js_1.isPlanFile);
                }
                else if (type === 'summaries') {
                    filtered = dirFiles.filter(core_js_1.isSummaryFile);
                }
                else {
                    filtered = dirFiles;
                }
                return filtered.sort();
            }));
            const files = fileResults.flat();
            const result = {
                files,
                count: files.length,
                total: files.length,
                phase_dir: phase ? dirs[0].replace(/^\d+(?:\.\d+)?-?/, '') : null,
            };
            return (0, types_js_1.cmdOk)(result, files.join('\n'));
        }
        // Apply pagination
        const total = dirs.length;
        const start = offset ?? 0;
        const paginated = limit !== undefined ? dirs.slice(start, start + limit) : dirs.slice(start);
        return (0, types_js_1.cmdOk)({ directories: paginated, count: paginated.length, total }, paginated.join('\n'));
    }
    catch (e) {
        return (0, types_js_1.cmdErr)('Failed to list phases: ' + e.message);
    }
}
// ─── Next decimal ───────────────────────────────────────────────────────────
async function cmdPhaseNextDecimal(cwd, basePhase) {
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(basePhase);
    if (!(await (0, core_js_1.pathExistsAsync)(phasesDirPath))) {
        return (0, types_js_1.cmdOk)({ found: false, base_phase: normalized, next: `${normalized}.1`, existing: [] }, `${normalized}.1`);
    }
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath);
        const baseExists = dirs.some(d => d.startsWith(normalized + '-') || d === normalized);
        const decimalPattern = new RegExp(`^${normalized}\\.(\\d+)`);
        const existingDecimals = [];
        for (const dir of dirs) {
            const match = dir.match(decimalPattern);
            if (match) {
                existingDecimals.push(`${normalized}.${match[1]}`);
            }
        }
        existingDecimals.sort((a, b) => {
            const aNum = parseFloat(a);
            const bNum = parseFloat(b);
            return aNum - bNum;
        });
        let nextDecimal;
        if (existingDecimals.length === 0) {
            nextDecimal = `${normalized}.1`;
        }
        else {
            const lastDecimal = existingDecimals[existingDecimals.length - 1];
            const lastNum = parseInt(lastDecimal.split('.')[1], 10);
            nextDecimal = `${normalized}.${lastNum + 1}`;
        }
        return (0, types_js_1.cmdOk)({ found: baseExists, base_phase: normalized, next: nextDecimal, existing: existingDecimals }, nextDecimal);
    }
    catch (e) {
        return (0, types_js_1.cmdErr)('Failed to calculate next decimal phase: ' + e.message);
    }
}
// ─── Find phase ─────────────────────────────────────────────────────────────
async function cmdFindPhase(cwd, phase) {
    if (!phase) {
        return (0, types_js_1.cmdErr)('phase identifier required');
    }
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(phase);
    const notFound = { found: false, directory: null, phase_number: null, phase_name: null, plans: [], summaries: [] };
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
        const match = dirs.find(d => d.startsWith(normalized));
        if (!match) {
            return (0, types_js_1.cmdOk)(notFound, '');
        }
        const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
        const phaseNumber = dirMatch ? dirMatch[1] : normalized;
        const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
        const phaseDir = node_path_1.default.join(phasesDirPath, match);
        const phaseFiles = await node_fs_1.promises.readdir(phaseDir);
        const plans = phaseFiles.filter(core_js_1.isPlanFile).sort();
        const summaries = phaseFiles.filter(core_js_1.isSummaryFile).sort();
        const result = {
            found: true,
            directory: node_path_1.default.join('.planning', 'phases', match),
            phase_number: phaseNumber,
            phase_name: phaseName,
            plans,
            summaries,
        };
        return (0, types_js_1.cmdOk)(result, result.directory);
    }
    catch (e) {
        return (0, types_js_1.cmdOk)(notFound, '');
    }
}
// ─── Phase plan index ───────────────────────────────────────────────────────
async function cmdPhasePlanIndex(cwd, phase) {
    if (!phase) {
        return (0, types_js_1.cmdErr)('phase required for phase-plan-index');
    }
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(phase);
    let phaseDir = null;
    let phaseDirName = null;
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
        const match = dirs.find(d => d.startsWith(normalized));
        if (match) {
            phaseDir = node_path_1.default.join(phasesDirPath, match);
            phaseDirName = match;
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('phase-plan-index-failed', e);
    }
    if (!phaseDir) {
        return (0, types_js_1.cmdOk)({ phase: normalized, error: 'Phase not found', plans: [], waves: {}, incomplete: [], has_checkpoints: false });
    }
    const phaseFiles = await node_fs_1.promises.readdir(phaseDir);
    const planFiles = phaseFiles.filter(core_js_1.isPlanFile).sort();
    const summaryFiles = phaseFiles.filter(core_js_1.isSummaryFile);
    const completedPlanIds = new Set(summaryFiles.map(core_js_1.summaryId));
    const plans = [];
    const waves = {};
    const incomplete = [];
    let hasCheckpoints = false;
    // Read all plan files in parallel since each read is independent
    const planContents = await Promise.all(planFiles.map(planFile => node_fs_1.promises.readFile(node_path_1.default.join(phaseDir, planFile), 'utf-8')));
    for (let i = 0; i < planFiles.length; i++) {
        const planFile = planFiles[i];
        const id = (0, core_js_1.planId)(planFile);
        const content = planContents[i];
        const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
        const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
        const taskCount = taskMatches.length;
        const wave = parseInt(fm.wave, 10) || 1;
        let autonomous = true;
        if (fm.autonomous !== undefined) {
            autonomous = fm.autonomous === 'true' || fm.autonomous === true;
        }
        if (!autonomous) {
            hasCheckpoints = true;
        }
        let filesModified = [];
        if (fm['files-modified']) {
            filesModified = Array.isArray(fm['files-modified']) ? fm['files-modified'] : [fm['files-modified']];
        }
        const hasSummary = completedPlanIds.has(id);
        if (!hasSummary) {
            incomplete.push(id);
        }
        const plan = {
            id,
            wave,
            autonomous,
            objective: fm.objective || null,
            files_modified: filesModified,
            task_count: taskCount,
            has_summary: hasSummary,
        };
        plans.push(plan);
        const waveKey = String(wave);
        if (!waves[waveKey]) {
            waves[waveKey] = [];
        }
        waves[waveKey].push(id);
    }
    return (0, types_js_1.cmdOk)({ phase: normalized, plans, waves, incomplete, has_checkpoints: hasCheckpoints });
}
// ─── Phase add ──────────────────────────────────────────────────────────────
async function cmdPhaseAdd(cwd, description) {
    if (!description) {
        return (0, types_js_1.cmdErr)('description required for phase add');
    }
    try {
        const result = await phaseAddCore(cwd, description, { includeStubs: false });
        return (0, types_js_1.cmdOk)({ phase_number: result.phase_number, padded: result.padded, name: result.description, slug: result.slug, directory: result.directory }, result.padded);
    }
    catch (e) {
        return (0, types_js_1.cmdErr)(e.message);
    }
}
// ─── Phase insert ───────────────────────────────────────────────────────────
async function cmdPhaseInsert(cwd, afterPhase, description) {
    if (!afterPhase || !description) {
        return (0, types_js_1.cmdErr)('after-phase and description required for phase insert');
    }
    try {
        const result = await phaseInsertCore(cwd, afterPhase, description, { includeStubs: false });
        return (0, types_js_1.cmdOk)({ phase_number: result.phase_number, after_phase: result.after_phase, name: result.description, slug: result.slug, directory: result.directory }, result.phase_number);
    }
    catch (e) {
        return (0, types_js_1.cmdErr)(e.message);
    }
}
// ─── Phase remove ───────────────────────────────────────────────────────────
async function cmdPhaseRemove(cwd, targetPhase, options) {
    if (!targetPhase) {
        return (0, types_js_1.cmdErr)('phase number required for phase remove');
    }
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const force = options.force || false;
    if (!(await (0, core_js_1.pathExistsAsync)(rmPath))) {
        return (0, types_js_1.cmdErr)('ROADMAP.md not found');
    }
    const normalized = (0, core_js_1.normalizePhaseName)(targetPhase);
    const isDecimal = targetPhase.includes('.');
    let targetDir = null;
    try {
        const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
        targetDir = dirs.find(d => d.startsWith(normalized + '-') || d === normalized) || null;
    }
    catch (e) {
        (0, core_js_1.debugLog)('phase-remove-find-target-failed', e);
    }
    if (targetDir && !force) {
        const targetPath = node_path_1.default.join(phasesDirPath, targetDir);
        const files = await node_fs_1.promises.readdir(targetPath);
        const summaries = files.filter(core_js_1.isSummaryFile);
        if (summaries.length > 0) {
            return (0, types_js_1.cmdErr)(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
        }
    }
    if (targetDir) {
        await node_fs_1.promises.rm(node_path_1.default.join(phasesDirPath, targetDir), { recursive: true, force: true });
    }
    const renamedDirs = [];
    const renamedFiles = [];
    if (isDecimal) {
        const baseParts = normalized.split('.');
        const baseInt = baseParts[0];
        const removedDecimal = parseInt(baseParts[1], 10);
        try {
            const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
            const decPattern = new RegExp(`^${baseInt}\\.(\\d+)-(.+)$`);
            const toRename = [];
            for (const dir of dirs) {
                const dm = dir.match(decPattern);
                if (dm && parseInt(dm[1], 10) > removedDecimal) {
                    toRename.push({ dir, oldDecimal: parseInt(dm[1], 10), slug: dm[2] });
                }
            }
            toRename.sort((a, b) => b.oldDecimal - a.oldDecimal);
            // Sequential renames — order matters
            for (const item of toRename) {
                const newDecimal = item.oldDecimal - 1;
                const oldPhaseId = `${baseInt}.${item.oldDecimal}`;
                const newPhaseId = `${baseInt}.${newDecimal}`;
                const newDirName = `${baseInt}.${newDecimal}-${item.slug}`;
                await node_fs_1.promises.rename(node_path_1.default.join(phasesDirPath, item.dir), node_path_1.default.join(phasesDirPath, newDirName));
                renamedDirs.push({ from: item.dir, to: newDirName });
                const dirFiles = await node_fs_1.promises.readdir(node_path_1.default.join(phasesDirPath, newDirName));
                for (const f of dirFiles) {
                    if (f.includes(oldPhaseId)) {
                        const newFileName = f.replace(oldPhaseId, newPhaseId);
                        await node_fs_1.promises.rename(node_path_1.default.join(phasesDirPath, newDirName, f), node_path_1.default.join(phasesDirPath, newDirName, newFileName));
                        renamedFiles.push({ from: f, to: newFileName });
                    }
                }
            }
        }
        catch (e) {
            (0, core_js_1.debugLog)('phase-remove-decimal-rename-failed', { phase: targetPhase, error: (0, core_js_1.errorMsg)(e) });
        }
    }
    else {
        const removedInt = parseInt(normalized, 10);
        try {
            const dirs = await (0, core_js_1.listSubDirsAsync)(phasesDirPath, true);
            const toRename = [];
            for (const dir of dirs) {
                const dm = dir.match(/^(\d+)([A-Z])?(?:\.(\d+))?-(.+)$/i);
                if (!dm)
                    continue;
                const dirInt = parseInt(dm[1], 10);
                if (dirInt > removedInt) {
                    toRename.push({
                        dir,
                        oldInt: dirInt,
                        letter: dm[2] ? dm[2].toUpperCase() : '',
                        decimal: dm[3] ? parseInt(dm[3], 10) : null,
                        slug: dm[4],
                    });
                }
            }
            toRename.sort((a, b) => {
                if (a.oldInt !== b.oldInt)
                    return b.oldInt - a.oldInt;
                return (b.decimal || 0) - (a.decimal || 0);
            });
            // Sequential renames — order matters
            for (const item of toRename) {
                const newInt = item.oldInt - 1;
                const newPadded = String(newInt).padStart(2, '0');
                const oldPadded = String(item.oldInt).padStart(2, '0');
                const letterSuffix = item.letter || '';
                const decimalSuffix = item.decimal !== null ? `.${item.decimal}` : '';
                const oldPrefix = `${oldPadded}${letterSuffix}${decimalSuffix}`;
                const newPrefix = `${newPadded}${letterSuffix}${decimalSuffix}`;
                const newDirName = `${newPrefix}-${item.slug}`;
                await node_fs_1.promises.rename(node_path_1.default.join(phasesDirPath, item.dir), node_path_1.default.join(phasesDirPath, newDirName));
                renamedDirs.push({ from: item.dir, to: newDirName });
                const dirFiles = await node_fs_1.promises.readdir(node_path_1.default.join(phasesDirPath, newDirName));
                for (const f of dirFiles) {
                    if (f.startsWith(oldPrefix)) {
                        const newFileName = newPrefix + f.slice(oldPrefix.length);
                        await node_fs_1.promises.rename(node_path_1.default.join(phasesDirPath, newDirName, f), node_path_1.default.join(phasesDirPath, newDirName, newFileName));
                        renamedFiles.push({ from: f, to: newFileName });
                    }
                }
            }
        }
        catch (e) {
            (0, core_js_1.debugLog)('phase-remove-int-rename-failed', { phase: targetPhase, error: (0, core_js_1.errorMsg)(e) });
        }
    }
    // Update ROADMAP.md
    let roadmapContent = await node_fs_1.promises.readFile(rmPath, 'utf-8');
    const targetEscaped = (0, core_js_1.escapePhaseNum)(targetPhase);
    const sectionPattern = new RegExp(`\\n?#{2,4}\\s*Phase\\s+${targetEscaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+Phase\\s+\\d|$)`, 'i');
    roadmapContent = roadmapContent.replace(sectionPattern, '');
    const checkboxPattern = new RegExp(`\\n?-\\s*\\[[ x]\\]\\s*.*Phase\\s+${targetEscaped}[:\\s][^\\n]*`, 'gi');
    roadmapContent = roadmapContent.replace(checkboxPattern, '');
    const tableRowPattern = new RegExp(`\\n?\\|\\s*${targetEscaped}\\.?\\s[^|]*\\|[^\\n]*`, 'gi');
    roadmapContent = roadmapContent.replace(tableRowPattern, '');
    if (!isDecimal) {
        const removedInt = parseInt(normalized, 10);
        const maxPhase = 99;
        for (let oldNum = maxPhase; oldNum > removedInt; oldNum--) {
            const newNum = oldNum - 1;
            const oldStr = String(oldNum);
            const newStr = String(newNum);
            const oldPad = oldStr.padStart(2, '0');
            const newPad = newStr.padStart(2, '0');
            roadmapContent = roadmapContent.replace(new RegExp(`(#{2,4}\\s*Phase\\s+)${oldStr}(\\s*:)`, 'gi'), `$1${newStr}$2`);
            roadmapContent = roadmapContent.replace(new RegExp(`(Phase\\s+)${oldStr}([:\\s])`, 'g'), `$1${newStr}$2`);
            roadmapContent = roadmapContent.replace(new RegExp(`${oldPad}-(\\d{2})`, 'g'), `${newPad}-$1`);
            roadmapContent = roadmapContent.replace(new RegExp(`(\\|\\s*)${oldStr}\\.\\s`, 'g'), `$1${newStr}. `);
            roadmapContent = roadmapContent.replace(new RegExp(`(Depends on:\\*\\*\\s*Phase\\s+)${oldStr}\\b`, 'gi'), `$1${newStr}`);
        }
    }
    await node_fs_1.promises.writeFile(rmPath, roadmapContent, 'utf-8');
    // Update STATE.md phase count
    const stPath = (0, core_js_1.statePath)(cwd);
    const stExists = await (0, core_js_1.pathExistsAsync)(stPath);
    if (stExists) {
        let stateContent = await node_fs_1.promises.readFile(stPath, 'utf-8');
        const totalPattern = /(\*\*Total Phases:\*\*\s*)(\d+)/;
        const totalMatch = stateContent.match(totalPattern);
        if (totalMatch) {
            const oldTotal = parseInt(totalMatch[2], 10);
            stateContent = stateContent.replace(totalPattern, `$1${oldTotal - 1}`);
        }
        const ofPattern = /(\bof\s+)(\d+)(\s*(?:\(|phases?))/i;
        const ofMatch = stateContent.match(ofPattern);
        if (ofMatch) {
            const oldTotal = parseInt(ofMatch[2], 10);
            stateContent = stateContent.replace(ofPattern, `$1${oldTotal - 1}$3`);
        }
        await node_fs_1.promises.writeFile(stPath, stateContent, 'utf-8');
    }
    return (0, types_js_1.cmdOk)({
        removed: targetPhase,
        directory_deleted: targetDir || null,
        renamed_directories: renamedDirs,
        renamed_files: renamedFiles,
        roadmap_updated: true,
        state_updated: stExists,
    });
}
// ─── Phase complete ─────────────────────────────────────────────────────────
async function cmdPhaseComplete(cwd, phaseNum) {
    if (!phaseNum) {
        return (0, types_js_1.cmdErr)('phase number required for phase complete');
    }
    try {
        const result = await phaseCompleteCore(cwd, phaseNum);
        return (0, types_js_1.cmdOk)({
            completed_phase: result.completed_phase,
            phase_name: result.phase_name,
            plans_executed: result.plans_executed,
            next_phase: result.next_phase,
            next_phase_name: result.next_phase_name,
            is_last_phase: result.is_last_phase,
            date: result.date,
            roadmap_updated: result.roadmap_updated,
            state_updated: result.state_updated,
        });
    }
    catch (e) {
        return (0, types_js_1.cmdErr)(e.message);
    }
}
//# sourceMappingURL=phase.js.map