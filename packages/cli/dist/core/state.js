"use strict";
/**
 * State — STATE.md operations and progression engine
 *
 * Ported from maxsim/bin/lib/state.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateExtractField = stateExtractField;
exports.stateReplaceField = stateReplaceField;
exports.appendToStateSection = appendToStateSection;
exports.cmdStateLoad = cmdStateLoad;
exports.cmdStateGet = cmdStateGet;
exports.cmdStatePatch = cmdStatePatch;
exports.cmdStateUpdate = cmdStateUpdate;
exports.cmdStateAdvancePlan = cmdStateAdvancePlan;
exports.cmdStateRecordMetric = cmdStateRecordMetric;
exports.cmdStateUpdateProgress = cmdStateUpdateProgress;
exports.cmdStateAddDecision = cmdStateAddDecision;
exports.cmdStateAddBlocker = cmdStateAddBlocker;
exports.cmdStateResolveBlocker = cmdStateResolveBlocker;
exports.cmdStateRecordSession = cmdStateRecordSession;
exports.cmdStateSnapshot = cmdStateSnapshot;
exports.cmdDetectStaleContext = cmdDetectStaleContext;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const core_js_1 = require("./core.js");
const types_js_1 = require("./types.js");
// ─── Internal helpers ────────────────────────────────────────────────────────
/**
 * Parse a markdown table row into cells, handling escaped pipes (`\|`) within cell content.
 * Strips leading/trailing pipe characters and trims each cell.
 */
function parseTableRow(row) {
    // Replace escaped pipes with a placeholder, split, then restore
    const placeholder = '\x00PIPE\x00';
    const safe = row.replace(/\\\|/g, placeholder);
    return safe.split('|').map(c => c.replaceAll(placeholder, '|').trim()).filter(Boolean);
}
function stateExtractField(content, fieldName) {
    const escaped = (0, escape_string_regexp_1.default)(fieldName);
    // Match **fieldName:** with optional extra whitespace around the name and colon
    const boldPattern = new RegExp(`\\*\\*\\s*${escaped}\\s*:\\s*\\*\\*\\s*(.+)`, 'i');
    const boldMatch = content.match(boldPattern);
    if (boldMatch)
        return boldMatch[1].trim();
    // Fallback: match plain "fieldName: value" (no bold markers)
    const plainPattern = new RegExp(`^\\s*${escaped}\\s*:\\s*(.+)`, 'im');
    const plainMatch = content.match(plainPattern);
    return plainMatch ? plainMatch[1].trim() : null;
}
function stateReplaceField(content, fieldName, newValue) {
    const escaped = (0, escape_string_regexp_1.default)(fieldName);
    // Match **fieldName:** with optional extra whitespace
    const boldPattern = new RegExp(`(\\*\\*\\s*${escaped}\\s*:\\s*\\*\\*\\s*)(.*)`, 'i');
    let replaced = content.replace(boldPattern, (_match, prefix) => `${prefix}${newValue}`);
    if (replaced !== content)
        return replaced;
    // Fallback: plain "fieldName: value"
    const plainPattern = new RegExp(`(^[ \\t]*${escaped}\\s*:\\s*)(.*)`, 'im');
    replaced = content.replace(plainPattern, (_match, prefix) => `${prefix}${newValue}`);
    return replaced !== content ? replaced : null;
}
async function readTextArgOrFile(cwd, value, filePath, label) {
    if (!filePath)
        return value;
    const resolvedPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    try {
        return (await node_fs_1.promises.readFile(resolvedPath, 'utf-8')).trimEnd();
    }
    catch {
        throw new Error(`${label} file not found: ${filePath}`);
    }
}
/**
 * Append an entry to a section in STATE.md content, removing placeholder text.
 * Returns updated content or null if section not found.
 */
function appendToStateSection(content, sectionPattern, entry, placeholderPatterns) {
    const match = content.match(sectionPattern);
    if (!match)
        return null;
    let sectionBody = match[2];
    const defaults = [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi, /None\.?\s*\n?/gi];
    for (const pat of placeholderPatterns || defaults) {
        sectionBody = sectionBody.replace(pat, '');
    }
    sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
    return content.replace(sectionPattern, (_m, header) => `${header}${sectionBody}`);
}
// ─── State commands ──────────────────────────────────────────────────────────
async function cmdStateLoad(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const [stateContent, configExists, roadmapExists] = await Promise.all([
        (0, core_js_1.safeReadFileAsync)((0, core_js_1.statePath)(cwd)),
        (0, core_js_1.pathExistsAsync)((0, core_js_1.configPath)(cwd)),
        (0, core_js_1.pathExistsAsync)((0, core_js_1.roadmapPath)(cwd)),
    ]);
    const stateRaw = stateContent ?? '';
    const stateExists = stateRaw.length > 0;
    const result = {
        config,
        state_raw: stateRaw,
        state_exists: stateExists,
        roadmap_exists: roadmapExists,
        config_exists: configExists,
    };
    if (raw) {
        const c = config;
        const lines = [
            `model_profile=${c.model_profile}`,
            `commit_docs=${c.commit_docs}`,
            `branching_strategy=${c.branching_strategy}`,
            `phase_branch_template=${c.phase_branch_template}`,
            `milestone_branch_template=${c.milestone_branch_template}`,
            `parallelization=${c.parallelization}`,
            `research=${c.research}`,
            `plan_checker=${c.plan_checker}`,
            `verifier=${c.verifier}`,
            `config_exists=${configExists}`,
            `roadmap_exists=${roadmapExists}`,
            `state_exists=${stateExists}`,
        ];
        return (0, types_js_1.cmdOk)(result, lines.join('\n'));
    }
    return (0, types_js_1.cmdOk)(result);
}
async function cmdStateGet(cwd, section, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    try {
        const content = await node_fs_1.promises.readFile(statePath, 'utf-8');
        if (!section) {
            return (0, types_js_1.cmdOk)({ content }, raw ? content : undefined);
        }
        // Check for **field:** value (reuse stateExtractField for format tolerance)
        const fieldValue = stateExtractField(content, section);
        if (fieldValue !== null) {
            return (0, types_js_1.cmdOk)({ [section]: fieldValue }, raw ? fieldValue : undefined);
        }
        // Check for ## or ### Section, tolerating extra blank lines after header
        const fieldEscaped = (0, escape_string_regexp_1.default)(section);
        const sectionPattern = new RegExp(`#{2,3}\\s*${fieldEscaped}\\s*\\n\\s*\\n?([\\s\\S]*?)(?=\\n#{2,3}\\s|$)`, 'i');
        const sectionMatch = content.match(sectionPattern);
        if (sectionMatch) {
            return (0, types_js_1.cmdOk)({ [section]: sectionMatch[1].trim() }, raw ? sectionMatch[1].trim() : undefined);
        }
        return (0, types_js_1.cmdOk)({ error: `Section or field "${section}" not found` }, raw ? '' : undefined);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        return (0, types_js_1.cmdErr)('STATE.md not found');
    }
}
async function cmdStatePatch(cwd, patches, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    try {
        let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
        const results = { updated: [], failed: [] };
        for (const [field, value] of Object.entries(patches)) {
            const result = stateReplaceField(content, field, value);
            if (result) {
                content = result;
                results.updated.push(field);
            }
            else {
                results.failed.push(field);
            }
        }
        if (results.updated.length > 0) {
            await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        }
        return (0, types_js_1.cmdOk)(results, raw ? (results.updated.length > 0 ? 'true' : 'false') : undefined);
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        return (0, types_js_1.cmdErr)('STATE.md not found');
    }
}
async function cmdStateUpdate(cwd, field, value) {
    if (!field || value === undefined) {
        return (0, types_js_1.cmdErr)('field and value required for state update');
    }
    const statePath = (0, core_js_1.statePath)(cwd);
    try {
        const content = await node_fs_1.promises.readFile(statePath, 'utf-8');
        const result = stateReplaceField(content, field, value);
        if (result) {
            await node_fs_1.promises.writeFile(statePath, result, 'utf-8');
            return (0, types_js_1.cmdOk)({ updated: true });
        }
        else {
            return (0, types_js_1.cmdOk)({ updated: false, reason: `Field "${field}" not found in STATE.md` });
        }
    }
    catch (e) {
        (0, core_js_1.rethrowCliSignals)(e);
        return (0, types_js_1.cmdOk)({ updated: false, reason: 'STATE.md not found' });
    }
}
// ─── State Progression Engine ────────────────────────────────────────────────
async function cmdStateAdvancePlan(cwd, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const currentPlan = parseInt(stateExtractField(content, 'Current Plan') ?? '', 10);
    const totalPlans = parseInt(stateExtractField(content, 'Total Plans in Phase') ?? '', 10);
    const today = (0, core_js_1.todayISO)();
    if (isNaN(currentPlan) || isNaN(totalPlans)) {
        return (0, types_js_1.cmdOk)({ error: 'Cannot parse Current Plan or Total Plans in Phase from STATE.md' });
    }
    if (currentPlan >= totalPlans) {
        content = stateReplaceField(content, 'Status', 'Phase complete — ready for verification') || content;
        content = stateReplaceField(content, 'Last Activity', today) || content;
        await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        return (0, types_js_1.cmdOk)({ advanced: false, reason: 'last_plan', current_plan: currentPlan, total_plans: totalPlans, status: 'ready_for_verification' }, raw ? 'false' : undefined);
    }
    else {
        const newPlan = currentPlan + 1;
        content = stateReplaceField(content, 'Current Plan', String(newPlan)) || content;
        content = stateReplaceField(content, 'Status', 'Ready to execute') || content;
        content = stateReplaceField(content, 'Last Activity', today) || content;
        await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        return (0, types_js_1.cmdOk)({ advanced: true, previous_plan: currentPlan, current_plan: newPlan, total_plans: totalPlans }, raw ? 'true' : undefined);
    }
}
async function cmdStateRecordMetric(cwd, options, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const { phase, plan, duration, tasks, files } = options;
    if (!phase || !plan || !duration) {
        return (0, types_js_1.cmdOk)({ error: 'phase, plan, and duration required' });
    }
    // Flexible: tolerate varying heading levels (##/###), flexible separator lines (|---|, | --- |, |:---|)
    const metricsPattern = /(#{2,3}\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n)([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i;
    const metricsMatch = content.match(metricsPattern);
    if (metricsMatch) {
        let tableBody = metricsMatch[2].trimEnd();
        const newRow = `| Phase ${phase} P${plan} | ${duration} | ${tasks || '-'} tasks | ${files || '-'} files |`;
        if (tableBody.trim() === '' || tableBody.includes('None yet')) {
            tableBody = newRow;
        }
        else {
            tableBody = tableBody + '\n' + newRow;
        }
        content = content.replace(metricsPattern, (_match, header) => `${header}${tableBody}\n`);
        await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        return (0, types_js_1.cmdOk)({ recorded: true, phase, plan, duration }, raw ? 'true' : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ recorded: false, reason: 'Performance Metrics section not found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateUpdateProgress(cwd, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const phasesDir = (0, core_js_1.phasesPath)(cwd);
    let totalPlans = 0;
    let totalSummaries = 0;
    if (await (0, core_js_1.pathExistsAsync)(phasesDir)) {
        const phaseDirs = (await node_fs_1.promises.readdir(phasesDir, { withFileTypes: true }))
            .filter(e => e.isDirectory()).map(e => e.name);
        const counts = await Promise.all(phaseDirs.map(async (dir) => {
            const files = await node_fs_1.promises.readdir(node_path_1.default.join(phasesDir, dir));
            return {
                plans: files.filter(f => (0, core_js_1.isPlanFile)(f)).length,
                summaries: files.filter(f => (0, core_js_1.isSummaryFile)(f)).length,
            };
        }));
        for (const c of counts) {
            totalPlans += c.plans;
            totalSummaries += c.summaries;
        }
    }
    const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
    const barWidth = 10;
    const filled = Math.round(percent / 100 * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const progressStr = `[${bar}] ${percent}%`;
    const result = stateReplaceField(content, 'Progress', progressStr);
    if (result) {
        await node_fs_1.promises.writeFile(statePath, result, 'utf-8');
        return (0, types_js_1.cmdOk)({ updated: true, percent, completed: totalSummaries, total: totalPlans, bar: progressStr }, raw ? progressStr : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ updated: false, reason: 'Progress field not found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateAddDecision(cwd, options, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    const { phase, summary, summary_file, rationale, rationale_file } = options;
    let summaryText;
    let rationaleText = '';
    try {
        summaryText = await readTextArgOrFile(cwd, summary, summary_file, 'summary');
        rationaleText = (await readTextArgOrFile(cwd, rationale || '', rationale_file, 'rationale')) || '';
    }
    catch (thrown) {
        const e = thrown;
        return (0, types_js_1.cmdOk)({ added: false, reason: e.message }, raw ? 'false' : undefined);
    }
    if (!summaryText) {
        return (0, types_js_1.cmdOk)({ error: 'summary required' });
    }
    const content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const entry = `- [Phase ${phase || '?'}]: ${summaryText}${rationaleText ? ` — ${rationaleText}` : ''}`;
    const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const updated = appendToStateSection(content, sectionPattern, entry, [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi]);
    if (updated) {
        await node_fs_1.promises.writeFile(statePath, updated, 'utf-8');
        return (0, types_js_1.cmdOk)({ added: true, decision: entry }, raw ? 'true' : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ added: false, reason: 'Decisions section not found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateAddBlocker(cwd, text, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    const blockerOptions = typeof text === 'object' && text !== null ? text : { text: text };
    let blockerText;
    try {
        blockerText = await readTextArgOrFile(cwd, blockerOptions.text, blockerOptions.text_file, 'blocker');
    }
    catch (thrown) {
        const e = thrown;
        return (0, types_js_1.cmdOk)({ added: false, reason: e.message }, raw ? 'false' : undefined);
    }
    if (!blockerText) {
        return (0, types_js_1.cmdOk)({ error: 'text required' });
    }
    const content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const entry = `- ${blockerText}`;
    const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const updated = appendToStateSection(content, sectionPattern, entry, [/None\.?\s*\n?/gi, /None yet\.?\s*\n?/gi]);
    if (updated) {
        await node_fs_1.promises.writeFile(statePath, updated, 'utf-8');
        return (0, types_js_1.cmdOk)({ added: true, blocker: blockerText }, raw ? 'true' : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ added: false, reason: 'Blockers section not found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateResolveBlocker(cwd, text, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    if (!text) {
        return (0, types_js_1.cmdOk)({ error: 'text required' });
    }
    let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const sectionPattern = /(#{2,3}\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n\s*\n?)([\s\S]*?)(?=\n#{2,3}\s|$)/i;
    const match = content.match(sectionPattern);
    if (match) {
        const sectionBody = match[2];
        const lines = sectionBody.split('\n');
        const filtered = lines.filter(line => {
            // Match - or * bullets, optionally indented
            if (!/^\s*[-*]\s+/.test(line))
                return true;
            return !line.toLowerCase().includes(text.toLowerCase());
        });
        let newBody = filtered.join('\n');
        if (!newBody.trim() || !/^\s*[-*]\s+/m.test(newBody)) {
            newBody = 'None\n';
        }
        content = content.replace(sectionPattern, (_match, header) => `${header}${newBody}`);
        await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        return (0, types_js_1.cmdOk)({ resolved: true, blocker: text }, raw ? 'true' : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ resolved: false, reason: 'Blockers section not found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateRecordSession(cwd, options, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    let content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const now = new Date().toISOString();
    const updated = [];
    let result = stateReplaceField(content, 'Last session', now);
    if (result) {
        content = result;
        updated.push('Last session');
    }
    result = stateReplaceField(content, 'Last Date', now);
    if (result) {
        content = result;
        updated.push('Last Date');
    }
    if (options.stopped_at) {
        result = stateReplaceField(content, 'Stopped At', options.stopped_at);
        if (!result)
            result = stateReplaceField(content, 'Stopped at', options.stopped_at);
        if (result) {
            content = result;
            updated.push('Stopped At');
        }
    }
    const resumeFile = options.resume_file || 'None';
    result = stateReplaceField(content, 'Resume File', resumeFile);
    if (!result)
        result = stateReplaceField(content, 'Resume file', resumeFile);
    if (result) {
        content = result;
        updated.push('Resume File');
    }
    if (updated.length > 0) {
        await node_fs_1.promises.writeFile(statePath, content, 'utf-8');
        return (0, types_js_1.cmdOk)({ recorded: true, updated }, raw ? 'true' : undefined);
    }
    else {
        return (0, types_js_1.cmdOk)({ recorded: false, reason: 'No session fields found in STATE.md' }, raw ? 'false' : undefined);
    }
}
async function cmdStateSnapshot(cwd, raw) {
    const statePath = (0, core_js_1.statePath)(cwd);
    if (!(await (0, core_js_1.pathExistsAsync)(statePath))) {
        return (0, types_js_1.cmdOk)({ error: 'STATE.md not found' });
    }
    const content = await node_fs_1.promises.readFile(statePath, 'utf-8');
    const extractField = (fieldName) => stateExtractField(content, fieldName);
    const currentPhase = extractField('Current Phase');
    const currentPhaseName = extractField('Current Phase Name');
    const totalPhasesRaw = extractField('Total Phases');
    const currentPlan = extractField('Current Plan');
    const totalPlansRaw = extractField('Total Plans in Phase');
    const status = extractField('Status');
    const progressRaw = extractField('Progress');
    const lastActivity = extractField('Last Activity');
    const lastActivityDesc = extractField('Last Activity Description');
    const pausedAt = extractField('Paused At');
    const totalPhases = totalPhasesRaw ? parseInt(totalPhasesRaw, 10) : null;
    const totalPlansInPhase = totalPlansRaw ? parseInt(totalPlansRaw, 10) : null;
    const progressPercent = progressRaw ? parseInt(progressRaw.replace('%', ''), 10) : null;
    const decisions = [];
    // Tolerate ##/### heading levels and flexible separator lines (|---|, | --- |, |:---|)
    const decisionsMatch = content.match(/#{2,3}\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[\s:|\-]+\n([\s\S]*?)(?=\n#{2,3}\s|\n$|$)/i);
    if (decisionsMatch) {
        const tableBody = decisionsMatch[1];
        const rows = tableBody.trim().split('\n').filter(r => r.includes('|') && !r.match(/^\s*$/));
        for (const row of rows) {
            // Skip separator lines that snuck through
            if (/^\s*\|[\s:\-|]+\|\s*$/.test(row))
                continue;
            const cells = parseTableRow(row);
            if (cells.length >= 3) {
                decisions.push({
                    phase: cells[0],
                    summary: cells[1],
                    rationale: cells[2],
                });
            }
        }
    }
    const blockers = [];
    // Tolerate ##/### heading levels
    const blockersMatch = content.match(/#{2,3}\s*Blockers\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/i);
    if (blockersMatch) {
        const blockersSection = blockersMatch[1];
        // Match - or * bullets, optionally indented
        const items = blockersSection.match(/^\s*[-*]\s+(.+)$/gm) || [];
        for (const item of items) {
            blockers.push(item.replace(/^\s*[-*]\s+/, '').trim());
        }
    }
    const session = {
        last_date: null,
        stopped_at: null,
        resume_file: null,
    };
    const sessionMatch = content.match(/#{2,3}\s*Session\s*\n\s*\n?([\s\S]*?)(?=\n#{2,3}\s|$)/i);
    if (sessionMatch) {
        const sessionSection = sessionMatch[1];
        session.last_date = stateExtractField(sessionSection, 'Last Date');
        session.stopped_at = stateExtractField(sessionSection, 'Stopped At') || stateExtractField(sessionSection, 'Stopped at');
        session.resume_file = stateExtractField(sessionSection, 'Resume File') || stateExtractField(sessionSection, 'Resume file');
    }
    const snapshot = {
        current_phase: currentPhase,
        current_phase_name: currentPhaseName,
        total_phases: totalPhases,
        current_plan: currentPlan,
        total_plans_in_phase: totalPlansInPhase,
        status,
        progress_percent: progressPercent,
        last_activity: lastActivity,
        last_activity_desc: lastActivityDesc,
        decisions,
        blockers,
        paused_at: pausedAt,
        session,
    };
    return (0, types_js_1.cmdOk)(snapshot);
}
async function cmdDetectStaleContext(cwd) {
    const rmPath = (0, core_js_1.roadmapPath)(cwd);
    const stPath = (0, core_js_1.statePath)(cwd);
    const [roadmapContent, stateContent] = await Promise.all([
        (0, core_js_1.safeReadFileAsync)(rmPath),
        (0, core_js_1.safeReadFileAsync)(stPath),
    ]);
    if (!roadmapContent) {
        return (0, types_js_1.cmdErr)('ROADMAP.md not found');
    }
    if (!stateContent) {
        return (0, types_js_1.cmdErr)('STATE.md not found');
    }
    // Identify completed phases from ROADMAP.md (lines matching `- [x]` with Phase N)
    const completedPhases = [];
    const checkboxPattern = /^-\s*\[x\]\s*.*Phase\s+(\d+[A-Z]?(?:\.\d+)?)/gim;
    let match;
    while ((match = checkboxPattern.exec(roadmapContent)) !== null) {
        completedPhases.push(match[1]);
    }
    if (completedPhases.length === 0) {
        return (0, types_js_1.cmdOk)({
            stale_references: [],
            completed_phases: [],
            clean: true,
            message: 'No completed phases found in ROADMAP.md',
        });
    }
    // Scan STATE.md decisions and blockers sections for references to completed phases
    const staleReferences = [];
    const decisionsPattern = /(#{2,3}\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n#{2,3}\s|\n##[^#]|$)/i;
    const blockersPattern = /(#{2,3}\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n\s*\n?)([\s\S]*?)(?=\n#{2,3}\s|$)/i;
    const sections = [
        { name: 'Decisions', pattern: decisionsPattern },
        { name: 'Blockers', pattern: blockersPattern },
    ];
    for (const section of sections) {
        const sectionMatch = stateContent.match(section.pattern);
        if (!sectionMatch || !sectionMatch[2])
            continue;
        const lines = sectionMatch[2].split('\n');
        for (const line of lines) {
            if (!line.trim())
                continue;
            for (const phase of completedPhases) {
                const escaped = (0, core_js_1.escapePhaseNum)(phase);
                // Match `- [Phase N]:` tagged lines or free-text `Phase N` mentions
                const tagPattern = new RegExp(`\\bPhase\\s+${escaped}\\b`, 'i');
                if (tagPattern.test(line)) {
                    staleReferences.push({
                        section: section.name,
                        line: line.trim(),
                        phase,
                    });
                    break; // Don't double-count same line for multiple phases
                }
            }
        }
    }
    return (0, types_js_1.cmdOk)({
        stale_references: staleReferences,
        completed_phases: completedPhases,
        clean: staleReferences.length === 0,
        message: staleReferences.length === 0
            ? 'No stale references found — STATE.md is clean'
            : `Found ${staleReferences.length} stale reference(s) to completed phases`,
    });
}
//# sourceMappingURL=state.js.map