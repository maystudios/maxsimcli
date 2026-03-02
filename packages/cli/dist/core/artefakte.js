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
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const types_js_1 = require("./types.js");
const ARTEFAKT_FILES = {
    'decisions': 'DECISIONS.md',
    'acceptance-criteria': 'ACCEPTANCE-CRITERIA.md',
    'no-gos': 'NO-GOS.md',
};
// ─── Internal helpers ────────────────────────────────────────────────────────
function isValidType(type) {
    return !!type && type in ARTEFAKT_FILES;
}
function resolveArtefaktPath(cwd, type, phase) {
    const filename = ARTEFAKT_FILES[type];
    if (phase) {
        const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
        if (!phaseInfo?.directory)
            return null;
        return node_path_1.default.join(cwd, phaseInfo.directory, filename);
    }
    return (0, core_js_1.planningPath)(cwd, filename);
}
const TEMPLATE_FILES = {
    'decisions': 'decisions.md',
    'acceptance-criteria': 'acceptance-criteria.md',
    'no-gos': 'no-gos.md',
};
function getTemplate(type) {
    // Try loading from installed template files first
    const templatePath = node_path_1.default.join(node_os_1.default.homedir(), '.claude', 'maxsim', 'templates', TEMPLATE_FILES[type]);
    const content = (0, core_js_1.safeReadFile)(templatePath);
    if (content) {
        return content.replace(/\{\{date\}\}/g, (0, core_js_1.todayISO)());
    }
    // Fallback to hardcoded templates
    return getHardcodedTemplate(type);
}
function getHardcodedTemplate(type) {
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
    if (!isValidType(type)) {
        return (0, types_js_1.cmdErr)(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
    }
    const filePath = resolveArtefaktPath(cwd, type, phase);
    if (!filePath)
        return (0, types_js_1.cmdErr)(`Phase ${phase} not found`);
    const content = (0, core_js_1.safeReadFile)(filePath);
    if (content === null) {
        return (0, types_js_1.cmdOk)({ exists: false, type, phase: phase ?? null, content: null }, raw ? '' : undefined);
    }
    return (0, types_js_1.cmdOk)({ exists: true, type, phase: phase ?? null, content }, raw ? content : undefined);
}
function cmdArtefakteWrite(cwd, type, content, phase, raw) {
    if (!isValidType(type)) {
        return (0, types_js_1.cmdErr)(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
    }
    const fileContent = content ?? getTemplate(type);
    const filePath = resolveArtefaktPath(cwd, type, phase);
    if (!filePath)
        return (0, types_js_1.cmdErr)(`Phase ${phase} not found`);
    // Ensure parent directory exists
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(filePath), { recursive: true });
    node_fs_1.default.writeFileSync(filePath, fileContent, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, filePath);
    return (0, types_js_1.cmdOk)({ written: true, type, phase: phase ?? null, path: relPath }, raw ? relPath : undefined);
}
function cmdArtefakteAppend(cwd, type, entry, phase, raw) {
    if (!entry) {
        return (0, types_js_1.cmdErr)('entry required for artefakte append');
    }
    if (!isValidType(type)) {
        return (0, types_js_1.cmdErr)(`Invalid artefakt type: ${type}. Available: ${Object.keys(ARTEFAKT_FILES).join(', ')}`);
    }
    const filePath = resolveArtefaktPath(cwd, type, phase);
    if (!filePath)
        return (0, types_js_1.cmdErr)(`Phase ${phase} not found`);
    let fileContent = (0, core_js_1.safeReadFile)(filePath);
    if (fileContent === null) {
        // Auto-create from template
        fileContent = getTemplate(type);
    }
    // Remove placeholder lines like "- _No entries yet._"
    fileContent = fileContent.replace(/^-\s*_No entries yet\._\s*$/m, '');
    // Append the entry
    const today = (0, core_js_1.todayISO)();
    let appendLine;
    if (type === 'decisions') {
        const rowCount = (fileContent.match(/^\|\s*\d+/gm) || []).length;
        appendLine = `| ${rowCount + 1} | ${entry} | - | ${today} | - |`;
    }
    else if (type === 'acceptance-criteria') {
        const rowCount = (fileContent.match(/^\|\s*\d+/gm) || []).length;
        appendLine = `| ${rowCount + 1} | ${entry} | pending | - |`;
    }
    else {
        appendLine = `- ${entry}`;
    }
    fileContent = fileContent.trimEnd() + '\n' + appendLine + '\n';
    node_fs_1.default.writeFileSync(filePath, fileContent, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, filePath);
    return (0, types_js_1.cmdOk)({ appended: true, type, phase: phase ?? null, entry: appendLine, path: relPath }, raw ? 'true' : undefined);
}
function cmdArtefakteList(cwd, phase, raw) {
    const results = [];
    for (const [type, filename] of Object.entries(ARTEFAKT_FILES)) {
        let filePath;
        if (phase) {
            const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
            if (!phaseInfo?.directory) {
                return (0, types_js_1.cmdOk)({ error: `Phase ${phase} not found` });
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
    return (0, types_js_1.cmdOk)({ phase: phase ?? null, artefakte: results });
}
//# sourceMappingURL=artefakte.js.map