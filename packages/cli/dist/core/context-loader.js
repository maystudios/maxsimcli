"use strict";
/**
 * Context Loader — Intelligent file selection for workflow context assembly
 *
 * Selects relevant planning files based on the current task/phase domain,
 * preventing context overload by loading only what matters.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdContextLoad = cmdContextLoad;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const types_js_1 = require("./types.js");
// ─── Internal helpers ────────────────────────────────────────────────────────
function fileEntry(cwd, relPath, role) {
    const fullPath = node_path_1.default.join(cwd, relPath);
    try {
        const stats = node_fs_1.default.statSync(fullPath);
        return { path: relPath, role, size: stats.size };
    }
    catch {
        return null;
    }
}
function addIfExists(files, cwd, relPath, role) {
    const entry = fileEntry(cwd, relPath, role);
    if (entry)
        files.push(entry);
}
// ─── Context loading strategies ──────────────────────────────────────────────
function loadProjectContext(cwd) {
    const files = [];
    addIfExists(files, cwd, '.planning/PROJECT.md', 'project-vision');
    addIfExists(files, cwd, '.planning/REQUIREMENTS.md', 'requirements');
    addIfExists(files, cwd, '.planning/STATE.md', 'state');
    addIfExists(files, cwd, '.planning/config.json', 'config');
    return files;
}
function loadRoadmapContext(cwd) {
    const files = [];
    addIfExists(files, cwd, '.planning/ROADMAP.md', 'roadmap');
    return files;
}
function loadPhaseContext(cwd, phase) {
    const files = [];
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
    if (!phaseInfo?.directory)
        return files;
    const phaseDir = phaseInfo.directory;
    // Add phase-specific files
    try {
        const phaseFiles = node_fs_1.default.readdirSync(node_path_1.default.join(cwd, phaseDir));
        for (const f of phaseFiles) {
            const relPath = node_path_1.default.join(phaseDir, f);
            if (f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md') {
                addIfExists(files, cwd, relPath, 'phase-context');
            }
            else if (f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md') {
                addIfExists(files, cwd, relPath, 'phase-research');
            }
            else if (f.endsWith('-PLAN.md')) {
                addIfExists(files, cwd, relPath, 'phase-plan');
            }
            else if (f.endsWith('-SUMMARY.md')) {
                addIfExists(files, cwd, relPath, 'phase-summary');
            }
            else if (f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md') {
                addIfExists(files, cwd, relPath, 'phase-verification');
            }
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('context-loader-phase-files-failed', e);
    }
    return files;
}
function loadArtefakteContext(cwd, phase) {
    const files = [];
    const artefakte = ['DECISIONS.md', 'ACCEPTANCE-CRITERIA.md', 'NO-GOS.md'];
    for (const filename of artefakte) {
        if (phase) {
            const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
            if (phaseInfo?.directory) {
                addIfExists(files, cwd, node_path_1.default.join(phaseInfo.directory, filename), `artefakt-${filename.toLowerCase()}`);
            }
        }
        // Always include project-level artefakte
        addIfExists(files, cwd, `.planning/${filename}`, `artefakt-${filename.toLowerCase()}`);
    }
    return files;
}
function loadHistoryContext(cwd, currentPhase) {
    const files = [];
    const pd = (0, core_js_1.phasesPath)(cwd);
    try {
        const dirs = (0, core_js_1.listSubDirs)(pd, true);
        for (const dir of dirs) {
            // Skip current phase — it's loaded separately
            if (currentPhase) {
                const dirPhase = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)/i)?.[1];
                if (dirPhase === currentPhase)
                    continue;
            }
            const dirPath = node_path_1.default.join(pd, dir);
            const phaseFiles = node_fs_1.default.readdirSync(dirPath);
            // Only load summaries from completed phases (lightweight history)
            const summaries = phaseFiles.filter(f => (0, core_js_1.isSummaryFile)(f));
            for (const s of summaries) {
                addIfExists(files, cwd, node_path_1.default.join('.planning', 'phases', dir, s), 'history-summary');
            }
        }
    }
    catch (e) {
        (0, core_js_1.debugLog)('context-loader-history-failed', e);
    }
    return files;
}
// ─── Commands ────────────────────────────────────────────────────────────────
function cmdContextLoad(cwd, phase, topic, includeHistory) {
    const allFiles = [];
    // Always load core project context
    allFiles.push(...loadProjectContext(cwd));
    allFiles.push(...loadRoadmapContext(cwd));
    // Load artefakte
    allFiles.push(...loadArtefakteContext(cwd, phase));
    // Phase-specific context
    if (phase) {
        allFiles.push(...loadPhaseContext(cwd, phase));
    }
    // History from completed phases
    if (includeHistory) {
        allFiles.push(...loadHistoryContext(cwd, phase));
    }
    // Deduplicate by path
    const seen = new Set();
    const deduped = allFiles.filter(f => {
        if (seen.has(f.path))
            return false;
        seen.add(f.path);
        return true;
    });
    const totalSize = deduped.reduce((sum, f) => sum + f.size, 0);
    const result = {
        files: deduped,
        total_size: totalSize,
        phase: phase ?? null,
        topic: topic ?? null,
    };
    return (0, types_js_1.cmdOk)(result);
}
//# sourceMappingURL=context-loader.js.map