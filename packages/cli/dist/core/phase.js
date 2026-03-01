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
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
// ─── Stub scaffolding ───────────────────────────────────────────────────────
function scaffoldPhaseStubs(dirPath, phaseId, name) {
    const today = (0, core_js_1.todayISO)();
    node_fs_1.default.writeFileSync(node_path_1.default.join(dirPath, `${phaseId}-CONTEXT.md`), `# Phase ${phaseId} Context: ${name}\n\n**Created:** ${today}\n**Phase goal:** [To be defined during /maxsim:discuss-phase]\n\n---\n\n_Context will be populated by /maxsim:discuss-phase_\n`);
    node_fs_1.default.writeFileSync(node_path_1.default.join(dirPath, `${phaseId}-RESEARCH.md`), `# Phase ${phaseId}: ${name} - Research\n\n**Researched:** Not yet\n**Domain:** TBD\n**Confidence:** TBD\n\n---\n\n_Research will be populated by /maxsim:research-phase_\n`);
}
// ─── Core functions ─────────────────────────────────────────────────────────
function phaseAddCore(cwd, description, options) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    if (!node_fs_1.default.existsSync(rmPath)) {
        throw new Error('ROADMAP.md not found');
    }
    const content = node_fs_1.default.readFileSync(rmPath, 'utf-8');
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
    node_fs_1.default.mkdirSync(dirPath, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(dirPath, '.gitkeep'), '');
    if (options?.includeStubs) {
        scaffoldPhaseStubs(dirPath, paddedNum, description);
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
    node_fs_1.default.writeFileSync(rmPath, updatedContent, 'utf-8');
    return {
        phase_number: newPhaseNum,
        padded: paddedNum,
        slug,
        directory: `.planning/phases/${dirName}`,
        description,
    };
}
function phaseInsertCore(cwd, afterPhase, description, options) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    if (!node_fs_1.default.existsSync(rmPath)) {
        throw new Error('ROADMAP.md not found');
    }
    const content = node_fs_1.default.readFileSync(rmPath, 'utf-8');
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
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath);
        const decimalPattern = new RegExp(`^${normalizedBase}\\.(\\d+)`);
        for (const dir of dirs) {
            const dm = dir.match(decimalPattern);
            if (dm)
                existingDecimals.push(parseInt(dm[1], 10));
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)(e);
    }
    const nextDecimal = existingDecimals.length === 0 ? 1 : Math.max(...existingDecimals) + 1;
    const decimalPhase = `${normalizedBase}.${nextDecimal}`;
    const dirName = `${decimalPhase}-${slug}`;
    const dirPath = (0, core_js_1.planningPath)(cwd, 'phases', dirName);
    node_fs_1.default.mkdirSync(dirPath, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(dirPath, '.gitkeep'), '');
    if (options?.includeStubs) {
        scaffoldPhaseStubs(dirPath, decimalPhase, description);
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
    node_fs_1.default.writeFileSync(rmPath, updatedContent, 'utf-8');
    return {
        phase_number: decimalPhase,
        after_phase: afterPhase,
        slug,
        directory: `.planning/phases/${dirName}`,
        description,
    };
}
function phaseCompleteCore(cwd, phaseNum) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const stPath = (0, core_js_1.statePath)(cwd);
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const today = (0, core_js_1.todayISO)();
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phaseNum);
    if (!phaseInfo) {
        throw new Error(`Phase ${phaseNum} not found`);
    }
    const planCount = phaseInfo.plans.length;
    const summaryCount = phaseInfo.summaries.length;
    let requirementsUpdated = false;
    if (node_fs_1.default.existsSync(rmPath)) {
        let roadmapContent = node_fs_1.default.readFileSync(rmPath, 'utf-8');
        const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${(0, core_js_1.escapePhaseNum)(phaseNum)}[:\\s][^\\n]*)`, 'i');
        roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
        const phaseEscaped = (0, core_js_1.escapePhaseNum)(phaseNum);
        const tablePattern = new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|[^|]*\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, 'i');
        roadmapContent = roadmapContent.replace(tablePattern, `$1 Complete    $2 ${today} $3`);
        const planCountPattern = new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, 'i');
        roadmapContent = roadmapContent.replace(planCountPattern, `$1${summaryCount}/${planCount} plans complete`);
        node_fs_1.default.writeFileSync(rmPath, roadmapContent, 'utf-8');
        // Update REQUIREMENTS.md
        const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
        if (node_fs_1.default.existsSync(reqPath)) {
            const reqMatch = roadmapContent.match(new RegExp(`Phase\\s+${(0, core_js_1.escapePhaseNum)(phaseNum)}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, 'i'));
            if (reqMatch) {
                const reqIds = reqMatch[1].replace(/[\[\]]/g, '').split(/[,\s]+/).map(r => r.trim()).filter(Boolean);
                let reqContent = node_fs_1.default.readFileSync(reqPath, 'utf-8');
                for (const reqId of reqIds) {
                    reqContent = reqContent.replace(new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, 'gi'), '$1x$2');
                    reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'), '$1 Complete $2');
                }
                node_fs_1.default.writeFileSync(reqPath, reqContent, 'utf-8');
                requirementsUpdated = true;
            }
        }
    }
    // Find next phase
    let nextPhaseNum = null;
    let nextPhaseName = null;
    let isLastPhase = true;
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
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
        (0, core_js_1.debugLog)(e);
    }
    // Update STATE.md
    if (node_fs_1.default.existsSync(stPath)) {
        let stateContent = node_fs_1.default.readFileSync(stPath, 'utf-8');
        stateContent = stateContent.replace(/(\*\*Current Phase:\*\*\s*).*/, `$1${nextPhaseNum || phaseNum}`);
        if (nextPhaseName) {
            stateContent = stateContent.replace(/(\*\*Current Phase Name:\*\*\s*).*/, `$1${nextPhaseName.replace(/-/g, ' ')}`);
        }
        stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${isLastPhase ? 'Milestone complete' : 'Ready to plan'}`);
        stateContent = stateContent.replace(/(\*\*Current Plan:\*\*\s*).*/, `$1Not started`);
        stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
        stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1Phase ${phaseNum} complete${nextPhaseNum ? `, transitioned to Phase ${nextPhaseNum}` : ''}`);
        node_fs_1.default.writeFileSync(stPath, stateContent, 'utf-8');
    }
    return {
        completed_phase: phaseNum,
        phase_name: phaseInfo.phase_name,
        plans_executed: `${summaryCount}/${planCount}`,
        next_phase: nextPhaseNum,
        next_phase_name: nextPhaseName,
        is_last_phase: isLastPhase,
        date: today,
        roadmap_updated: node_fs_1.default.existsSync(rmPath),
        state_updated: node_fs_1.default.existsSync(stPath),
        requirements_updated: requirementsUpdated,
    };
}
// ─── Phase list ─────────────────────────────────────────────────────────────
function cmdPhasesList(cwd, options, raw) {
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const { type, phase, includeArchived } = options;
    if (!node_fs_1.default.existsSync(phasesDirPath)) {
        if (type) {
            (0, core_js_1.output)({ files: [], count: 0 }, raw, '');
        }
        else {
            (0, core_js_1.output)({ directories: [], count: 0 }, raw, '');
        }
        return;
    }
    try {
        let dirs = (0, core_js_1.listSubDirs)(phasesDirPath);
        if (includeArchived) {
            const archived = (0, core_js_1.getArchivedPhaseDirs)(cwd);
            for (const a of archived) {
                dirs.push(`${a.name} [${a.milestone}]`);
            }
        }
        dirs.sort((a, b) => (0, core_js_1.comparePhaseNum)(a, b));
        if (phase) {
            const normalized = (0, core_js_1.normalizePhaseName)(phase);
            const match = dirs.find(d => d.startsWith(normalized));
            if (!match) {
                (0, core_js_1.output)({ files: [], count: 0, phase_dir: null, error: 'Phase not found' }, raw, '');
                return;
            }
            dirs = [match];
        }
        if (type) {
            const files = [];
            for (const dir of dirs) {
                const dirPath = node_path_1.default.join(phasesDirPath, dir);
                const dirFiles = node_fs_1.default.readdirSync(dirPath);
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
                files.push(...filtered.sort());
            }
            const result = {
                files,
                count: files.length,
                phase_dir: phase ? dirs[0].replace(/^\d+(?:\.\d+)?-?/, '') : null,
            };
            (0, core_js_1.output)(result, raw, files.join('\n'));
            return;
        }
        (0, core_js_1.output)({ directories: dirs, count: dirs.length }, raw, dirs.join('\n'));
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)('Failed to list phases: ' + e.message);
    }
}
// ─── Next decimal ───────────────────────────────────────────────────────────
function cmdPhaseNextDecimal(cwd, basePhase, raw) {
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(basePhase);
    if (!node_fs_1.default.existsSync(phasesDirPath)) {
        (0, core_js_1.output)({ found: false, base_phase: normalized, next: `${normalized}.1`, existing: [] }, raw, `${normalized}.1`);
        return;
    }
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath);
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
        (0, core_js_1.output)({ found: baseExists, base_phase: normalized, next: nextDecimal, existing: existingDecimals }, raw, nextDecimal);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)('Failed to calculate next decimal phase: ' + e.message);
    }
}
// ─── Find phase ─────────────────────────────────────────────────────────────
function cmdFindPhase(cwd, phase, raw) {
    if (!phase) {
        (0, core_js_1.error)('phase identifier required');
    }
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(phase);
    const notFound = { found: false, directory: null, phase_number: null, phase_name: null, plans: [], summaries: [] };
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
        const match = dirs.find(d => d.startsWith(normalized));
        if (!match) {
            (0, core_js_1.output)(notFound, raw, '');
            return;
        }
        const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
        const phaseNumber = dirMatch ? dirMatch[1] : normalized;
        const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
        const phaseDir = node_path_1.default.join(phasesDirPath, match);
        const phaseFiles = node_fs_1.default.readdirSync(phaseDir);
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
        (0, core_js_1.output)(result, raw, result.directory);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.output)(notFound, raw, '');
    }
}
// ─── Phase plan index ───────────────────────────────────────────────────────
function cmdPhasePlanIndex(cwd, phase, raw) {
    if (!phase) {
        (0, core_js_1.error)('phase required for phase-plan-index');
    }
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const normalized = (0, core_js_1.normalizePhaseName)(phase);
    let phaseDir = null;
    let phaseDirName = null;
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
        const match = dirs.find(d => d.startsWith(normalized));
        if (match) {
            phaseDir = node_path_1.default.join(phasesDirPath, match);
            phaseDirName = match;
        }
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    if (!phaseDir) {
        (0, core_js_1.output)({ phase: normalized, error: 'Phase not found', plans: [], waves: {}, incomplete: [], has_checkpoints: false }, raw);
        return;
    }
    const phaseFiles = node_fs_1.default.readdirSync(phaseDir);
    const planFiles = phaseFiles.filter(core_js_1.isPlanFile).sort();
    const summaryFiles = phaseFiles.filter(core_js_1.isSummaryFile);
    const completedPlanIds = new Set(summaryFiles.map(core_js_1.summaryId));
    const plans = [];
    const waves = {};
    const incomplete = [];
    let hasCheckpoints = false;
    for (const planFile of planFiles) {
        const id = (0, core_js_1.planId)(planFile);
        const planPath = node_path_1.default.join(phaseDir, planFile);
        const content = node_fs_1.default.readFileSync(planPath, 'utf-8');
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
    (0, core_js_1.output)({ phase: normalized, plans, waves, incomplete, has_checkpoints: hasCheckpoints }, raw);
}
// ─── Phase add ──────────────────────────────────────────────────────────────
function cmdPhaseAdd(cwd, description, raw) {
    if (!description) {
        (0, core_js_1.error)('description required for phase add');
    }
    try {
        const result = phaseAddCore(cwd, description, { includeStubs: false });
        (0, core_js_1.output)({ phase_number: result.phase_number, padded: result.padded, name: result.description, slug: result.slug, directory: result.directory }, raw, result.padded);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)(e.message);
    }
}
// ─── Phase insert ───────────────────────────────────────────────────────────
function cmdPhaseInsert(cwd, afterPhase, description, raw) {
    if (!afterPhase || !description) {
        (0, core_js_1.error)('after-phase and description required for phase insert');
    }
    try {
        const result = phaseInsertCore(cwd, afterPhase, description, { includeStubs: false });
        (0, core_js_1.output)({ phase_number: result.phase_number, after_phase: result.after_phase, name: result.description, slug: result.slug, directory: result.directory }, raw, result.phase_number);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)(e.message);
    }
}
// ─── Phase remove ───────────────────────────────────────────────────────────
function cmdPhaseRemove(cwd, targetPhase, options, raw) {
    if (!targetPhase) {
        (0, core_js_1.error)('phase number required for phase remove');
    }
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const phasesDirPath = (0, core_js_1.phasesPath)(cwd);
    const force = options.force || false;
    if (!node_fs_1.default.existsSync(rmPath)) {
        (0, core_js_1.error)('ROADMAP.md not found');
    }
    const normalized = (0, core_js_1.normalizePhaseName)(targetPhase);
    const isDecimal = targetPhase.includes('.');
    let targetDir = null;
    try {
        const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
        targetDir = dirs.find(d => d.startsWith(normalized + '-') || d === normalized) || null;
    }
    catch (e) {
        /* optional op, ignore */
        (0, core_js_1.debugLog)(e);
    }
    if (targetDir && !force) {
        const targetPath = node_path_1.default.join(phasesDirPath, targetDir);
        const files = node_fs_1.default.readdirSync(targetPath);
        const summaries = files.filter(core_js_1.isSummaryFile);
        if (summaries.length > 0) {
            (0, core_js_1.error)(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
        }
    }
    if (targetDir) {
        node_fs_1.default.rmSync(node_path_1.default.join(phasesDirPath, targetDir), { recursive: true, force: true });
    }
    const renamedDirs = [];
    const renamedFiles = [];
    if (isDecimal) {
        const baseParts = normalized.split('.');
        const baseInt = baseParts[0];
        const removedDecimal = parseInt(baseParts[1], 10);
        try {
            const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
            const decPattern = new RegExp(`^${baseInt}\\.(\\d+)-(.+)$`);
            const toRename = [];
            for (const dir of dirs) {
                const dm = dir.match(decPattern);
                if (dm && parseInt(dm[1], 10) > removedDecimal) {
                    toRename.push({ dir, oldDecimal: parseInt(dm[1], 10), slug: dm[2] });
                }
            }
            toRename.sort((a, b) => b.oldDecimal - a.oldDecimal);
            for (const item of toRename) {
                const newDecimal = item.oldDecimal - 1;
                const oldPhaseId = `${baseInt}.${item.oldDecimal}`;
                const newPhaseId = `${baseInt}.${newDecimal}`;
                const newDirName = `${baseInt}.${newDecimal}-${item.slug}`;
                node_fs_1.default.renameSync(node_path_1.default.join(phasesDirPath, item.dir), node_path_1.default.join(phasesDirPath, newDirName));
                renamedDirs.push({ from: item.dir, to: newDirName });
                const dirFiles = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDirPath, newDirName));
                for (const f of dirFiles) {
                    if (f.includes(oldPhaseId)) {
                        const newFileName = f.replace(oldPhaseId, newPhaseId);
                        node_fs_1.default.renameSync(node_path_1.default.join(phasesDirPath, newDirName, f), node_path_1.default.join(phasesDirPath, newDirName, newFileName));
                        renamedFiles.push({ from: f, to: newFileName });
                    }
                }
            }
        }
        catch (e) {
            /* optional op, ignore */
            (0, core_js_1.debugLog)(e);
        }
    }
    else {
        const removedInt = parseInt(normalized, 10);
        try {
            const dirs = (0, core_js_1.listSubDirs)(phasesDirPath, true);
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
            for (const item of toRename) {
                const newInt = item.oldInt - 1;
                const newPadded = String(newInt).padStart(2, '0');
                const oldPadded = String(item.oldInt).padStart(2, '0');
                const letterSuffix = item.letter || '';
                const decimalSuffix = item.decimal !== null ? `.${item.decimal}` : '';
                const oldPrefix = `${oldPadded}${letterSuffix}${decimalSuffix}`;
                const newPrefix = `${newPadded}${letterSuffix}${decimalSuffix}`;
                const newDirName = `${newPrefix}-${item.slug}`;
                node_fs_1.default.renameSync(node_path_1.default.join(phasesDirPath, item.dir), node_path_1.default.join(phasesDirPath, newDirName));
                renamedDirs.push({ from: item.dir, to: newDirName });
                const dirFiles = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDirPath, newDirName));
                for (const f of dirFiles) {
                    if (f.startsWith(oldPrefix)) {
                        const newFileName = newPrefix + f.slice(oldPrefix.length);
                        node_fs_1.default.renameSync(node_path_1.default.join(phasesDirPath, newDirName, f), node_path_1.default.join(phasesDirPath, newDirName, newFileName));
                        renamedFiles.push({ from: f, to: newFileName });
                    }
                }
            }
        }
        catch (e) {
            /* optional op, ignore */
            (0, core_js_1.debugLog)(e);
        }
    }
    // Update ROADMAP.md
    let roadmapContent = node_fs_1.default.readFileSync(rmPath, 'utf-8');
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
    node_fs_1.default.writeFileSync(rmPath, roadmapContent, 'utf-8');
    // Update STATE.md phase count
    const stPath = (0, core_js_1.statePath)(cwd);
    if (node_fs_1.default.existsSync(stPath)) {
        let stateContent = node_fs_1.default.readFileSync(stPath, 'utf-8');
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
        node_fs_1.default.writeFileSync(stPath, stateContent, 'utf-8');
    }
    (0, core_js_1.output)({
        removed: targetPhase,
        directory_deleted: targetDir || null,
        renamed_directories: renamedDirs,
        renamed_files: renamedFiles,
        roadmap_updated: true,
        state_updated: node_fs_1.default.existsSync(stPath),
    }, raw);
}
// ─── Phase complete ─────────────────────────────────────────────────────────
function cmdPhaseComplete(cwd, phaseNum, raw) {
    if (!phaseNum) {
        (0, core_js_1.error)('phase number required for phase complete');
    }
    try {
        const result = phaseCompleteCore(cwd, phaseNum);
        (0, core_js_1.output)({
            completed_phase: result.completed_phase,
            phase_name: result.phase_name,
            plans_executed: result.plans_executed,
            next_phase: result.next_phase,
            next_phase_name: result.next_phase_name,
            is_last_phase: result.is_last_phase,
            date: result.date,
            roadmap_updated: result.roadmap_updated,
            state_updated: result.state_updated,
        }, raw);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        (0, core_js_1.error)(e.message);
    }
}
//# sourceMappingURL=phase.js.map