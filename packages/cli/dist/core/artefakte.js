"use strict";
/**
 * Artefakte — CRUD operations for project-level artefakte files
 *
 * Manages DECISIONS.md, ACCEPTANCE-CRITERIA.md, and NO-GOS.md
 * at both project level (.planning/) and phase level (.planning/phases/<phase>/).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdArtefakteRead = cmdArtefakteRead;
exports.cmdArtefakteWrite = cmdArtefakteWrite;
exports.cmdArtefakteAppend = cmdArtefakteAppend;
exports.cmdArtefakteList = cmdArtefakteList;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const ARTEFAKT_FILES = {
    'decisions': 'DECISIONS.md',
    'acceptance-criteria': 'ACCEPTANCE-CRITERIA.md',
    'no-gos': 'NO-GOS.md',
};
// ─── Internal helpers ────────────────────────────────────────────────────────
function resolveArtefaktPath(cwd, type, phase) {
    const filename = ARTEFAKT_FILES[type];
    if (phase) {
        const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
        if (!phaseInfo?.directory) {
            (0, core_js_1.error)(`Phase ${phase} not found`);
        }
        return node_path_1.default.join(cwd, phaseInfo.directory, filename);
    }
    return (0, core_js_1.planningPath)(cwd, filename);
}
function validateType(type) {
    if (!type || !(type in ARTEFAKT_FILES)) {
        (0, core_js_1.error)(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
    }
    return type;
}
function getTemplate(type) {
    const today = (0, core_js_1.todayISO)();
    switch (type) {
        case 'decisions':
            return `# Decisions\n\n> Architectural and design decisions for this project.\n\n**Created:** ${today}\n\n## Decision Log\n\n| # | Decision | Rationale | Date | Phase |\n|---|----------|-----------|------|-------|\n`;
        case 'acceptance-criteria':
            return `# Acceptance Criteria\n\n> Conditions that must be met for deliverables to be accepted.\n\n**Created:** ${today}\n\n## Criteria\n\n| # | Criterion | Status | Verified |\n|---|-----------|--------|----------|\n`;
        case 'no-gos':
            return `# No-Gos\n\n> Things explicitly out of scope or forbidden.\n\n**Created:** ${today}\n\n## Boundaries\n\n- _No entries yet._\n`;
    }
}
// ─── Commands ────────────────────────────────────────────────────────────────
function cmdArtefakteRead(cwd, type, phase, raw) {
    const artefaktType = validateType(type);
    const filePath = resolveArtefaktPath(cwd, artefaktType, phase);
    const content = (0, core_js_1.safeReadFile)(filePath);
    if (content === null) {
        (0, core_js_1.output)({ exists: false, type: artefaktType, phase: phase ?? null, content: null }, raw, '');
        return;
    }
    (0, core_js_1.output)({ exists: true, type: artefaktType, phase: phase ?? null, content }, raw, content);
}
function cmdArtefakteWrite(cwd, type, content, phase, raw) {
    const artefaktType = validateType(type);
    // If no content provided, use the template
    const fileContent = content ?? getTemplate(artefaktType);
    const filePath = resolveArtefaktPath(cwd, artefaktType, phase);
    // Ensure parent directory exists
    const dir = node_path_1.default.dirname(filePath);
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    node_fs_1.default.writeFileSync(filePath, fileContent, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, filePath);
    (0, core_js_1.output)({ written: true, type: artefaktType, phase: phase ?? null, path: relPath }, raw, relPath);
}
function cmdArtefakteAppend(cwd, type, entry, phase, raw) {
    if (!entry) {
        (0, core_js_1.error)('entry required for artefakte append');
    }
    const artefaktType = validateType(type);
    const filePath = resolveArtefaktPath(cwd, artefaktType, phase);
    let content = (0, core_js_1.safeReadFile)(filePath);
    if (content === null) {
        // Auto-create from template
        content = getTemplate(artefaktType);
    }
    // Remove placeholder lines like "- _No entries yet._"
    content = content.replace(/^-\s*_No entries yet\._\s*$/m, '');
    // Append the entry
    const today = (0, core_js_1.todayISO)();
    let appendLine;
    if (artefaktType === 'decisions') {
        // Count existing rows to get next number
        const rowCount = (content.match(/^\|\s*\d+/gm) || []).length;
        appendLine = `| ${rowCount + 1} | ${entry} | - | ${today} | - |`;
    }
    else if (artefaktType === 'acceptance-criteria') {
        const rowCount = (content.match(/^\|\s*\d+/gm) || []).length;
        appendLine = `| ${rowCount + 1} | ${entry} | pending | - |`;
    }
    else {
        appendLine = `- ${entry}`;
    }
    content = content.trimEnd() + '\n' + appendLine + '\n';
    node_fs_1.default.writeFileSync(filePath, content, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, filePath);
    (0, core_js_1.output)({ appended: true, type: artefaktType, phase: phase ?? null, entry: appendLine, path: relPath }, raw, 'true');
}
function cmdArtefakteList(cwd, phase, raw) {
    const results = [];
    for (const [type, filename] of Object.entries(ARTEFAKT_FILES)) {
        let filePath;
        if (phase) {
            const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
            if (!phaseInfo?.directory) {
                (0, core_js_1.output)({ error: `Phase ${phase} not found` }, raw);
                return;
            }
            filePath = node_path_1.default.join(cwd, phaseInfo.directory, filename);
        }
        else {
            filePath = (0, core_js_1.planningPath)(cwd, filename);
        }
        results.push({
            type: type,
            exists: node_fs_1.default.existsSync(filePath),
            path: node_path_1.default.relative(cwd, filePath),
        });
    }
    (0, core_js_1.output)({ phase: phase ?? null, artefakte: results }, raw);
}
//# sourceMappingURL=artefakte.js.map