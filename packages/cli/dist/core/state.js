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
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const core_js_1 = require("./core.js");
// ─── Internal helpers ────────────────────────────────────────────────────────
function stateExtractField(content, fieldName) {
    const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i');
    const match = content.match(pattern);
    return match ? match[1].trim() : null;
}
function stateReplaceField(content, fieldName, newValue) {
    const escaped = (0, escape_string_regexp_1.default)(fieldName);
    const pattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, 'i');
    if (pattern.test(content)) {
        return content.replace(pattern, (_match, prefix) => `${prefix}${newValue}`);
    }
    return null;
}
function readTextArgOrFile(cwd, value, filePath, label) {
    if (!filePath)
        return value;
    const resolvedPath = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(cwd, filePath);
    try {
        return node_fs_1.default.readFileSync(resolvedPath, 'utf-8').trimEnd();
    }
    catch {
        throw new Error(`${label} file not found: ${filePath}`);
    }
}
// ─── State commands ──────────────────────────────────────────────────────────
function cmdStateLoad(cwd, raw) {
    const config = (0, core_js_1.loadConfig)(cwd);
    const planningDir = node_path_1.default.join(cwd, '.planning');
    let stateRaw = '';
    try {
        stateRaw = node_fs_1.default.readFileSync(node_path_1.default.join(planningDir, 'STATE.md'), 'utf-8');
    }
    catch (e) {
        /* optional op, ignore */
        if (process.env.MAXSIM_DEBUG)
            console.error(e);
    }
    const configExists = node_fs_1.default.existsSync(node_path_1.default.join(planningDir, 'config.json'));
    const roadmapExists = node_fs_1.default.existsSync(node_path_1.default.join(planningDir, 'ROADMAP.md'));
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
        process.stdout.write(lines.join('\n'));
        process.exit(0);
    }
    (0, core_js_1.output)(result);
}
function cmdStateGet(cwd, section, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    try {
        const content = node_fs_1.default.readFileSync(statePath, 'utf-8');
        if (!section) {
            (0, core_js_1.output)({ content }, raw, content);
            return;
        }
        const fieldEscaped = (0, escape_string_regexp_1.default)(section);
        // Check for **field:** value
        const fieldPattern = new RegExp(`\\*\\*${fieldEscaped}:\\*\\*\\s*(.*)`, 'i');
        const fieldMatch = content.match(fieldPattern);
        if (fieldMatch) {
            (0, core_js_1.output)({ [section]: fieldMatch[1].trim() }, raw, fieldMatch[1].trim());
            return;
        }
        // Check for ## Section
        const sectionPattern = new RegExp(`##\\s*${fieldEscaped}\\s*\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
        const sectionMatch = content.match(sectionPattern);
        if (sectionMatch) {
            (0, core_js_1.output)({ [section]: sectionMatch[1].trim() }, raw, sectionMatch[1].trim());
            return;
        }
        (0, core_js_1.output)({ error: `Section or field "${section}" not found` }, raw, '');
    }
    catch {
        (0, core_js_1.error)('STATE.md not found');
    }
}
function cmdStatePatch(cwd, patches, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    try {
        let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
        const results = { updated: [], failed: [] };
        for (const [field, value] of Object.entries(patches)) {
            const fieldEscaped = (0, escape_string_regexp_1.default)(field);
            const pattern = new RegExp(`(\\*\\*${fieldEscaped}:\\*\\*\\s*)(.*)`, 'i');
            if (pattern.test(content)) {
                content = content.replace(pattern, (_match, prefix) => `${prefix}${value}`);
                results.updated.push(field);
            }
            else {
                results.failed.push(field);
            }
        }
        if (results.updated.length > 0) {
            node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        }
        (0, core_js_1.output)(results, raw, results.updated.length > 0 ? 'true' : 'false');
    }
    catch {
        (0, core_js_1.error)('STATE.md not found');
    }
}
function cmdStateUpdate(cwd, field, value) {
    if (!field || value === undefined) {
        (0, core_js_1.error)('field and value required for state update');
    }
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    try {
        let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
        const fieldEscaped = (0, escape_string_regexp_1.default)(field);
        const pattern = new RegExp(`(\\*\\*${fieldEscaped}:\\*\\*\\s*)(.*)`, 'i');
        if (pattern.test(content)) {
            content = content.replace(pattern, (_match, prefix) => `${prefix}${value}`);
            node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
            (0, core_js_1.output)({ updated: true });
        }
        else {
            (0, core_js_1.output)({ updated: false, reason: `Field "${field}" not found in STATE.md` });
        }
    }
    catch {
        (0, core_js_1.output)({ updated: false, reason: 'STATE.md not found' });
    }
}
// ─── State Progression Engine ────────────────────────────────────────────────
function cmdStateAdvancePlan(cwd, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const currentPlan = parseInt(stateExtractField(content, 'Current Plan') ?? '', 10);
    const totalPlans = parseInt(stateExtractField(content, 'Total Plans in Phase') ?? '', 10);
    const today = new Date().toISOString().split('T')[0];
    if (isNaN(currentPlan) || isNaN(totalPlans)) {
        (0, core_js_1.output)({ error: 'Cannot parse Current Plan or Total Plans in Phase from STATE.md' }, raw);
        return;
    }
    if (currentPlan >= totalPlans) {
        content = stateReplaceField(content, 'Status', 'Phase complete — ready for verification') || content;
        content = stateReplaceField(content, 'Last Activity', today) || content;
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ advanced: false, reason: 'last_plan', current_plan: currentPlan, total_plans: totalPlans, status: 'ready_for_verification' }, raw, 'false');
    }
    else {
        const newPlan = currentPlan + 1;
        content = stateReplaceField(content, 'Current Plan', String(newPlan)) || content;
        content = stateReplaceField(content, 'Status', 'Ready to execute') || content;
        content = stateReplaceField(content, 'Last Activity', today) || content;
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ advanced: true, previous_plan: currentPlan, current_plan: newPlan, total_plans: totalPlans }, raw, 'true');
    }
}
function cmdStateRecordMetric(cwd, options, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const { phase, plan, duration, tasks, files } = options;
    if (!phase || !plan || !duration) {
        (0, core_js_1.output)({ error: 'phase, plan, and duration required' }, raw);
        return;
    }
    const metricsPattern = /(##\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n)([\s\S]*?)(?=\n##|\n$|$)/i;
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
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ recorded: true, phase, plan, duration }, raw, 'true');
    }
    else {
        (0, core_js_1.output)({ recorded: false, reason: 'Performance Metrics section not found in STATE.md' }, raw, 'false');
    }
}
function cmdStateUpdateProgress(cwd, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const phasesDir = node_path_1.default.join(cwd, '.planning', 'phases');
    let totalPlans = 0;
    let totalSummaries = 0;
    if (node_fs_1.default.existsSync(phasesDir)) {
        const phaseDirs = node_fs_1.default.readdirSync(phasesDir, { withFileTypes: true })
            .filter(e => e.isDirectory()).map(e => e.name);
        for (const dir of phaseDirs) {
            const files = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDir, dir));
            totalPlans += files.filter(f => f.match(/-PLAN\.md$/i)).length;
            totalSummaries += files.filter(f => f.match(/-SUMMARY\.md$/i)).length;
        }
    }
    const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
    const barWidth = 10;
    const filled = Math.round(percent / 100 * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const progressStr = `[${bar}] ${percent}%`;
    const progressPattern = /(\*\*Progress:\*\*\s*).*/i;
    if (progressPattern.test(content)) {
        content = content.replace(progressPattern, (_match, prefix) => `${prefix}${progressStr}`);
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ updated: true, percent, completed: totalSummaries, total: totalPlans, bar: progressStr }, raw, progressStr);
    }
    else {
        (0, core_js_1.output)({ updated: false, reason: 'Progress field not found in STATE.md' }, raw, 'false');
    }
}
function cmdStateAddDecision(cwd, options, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    const { phase, summary, summary_file, rationale, rationale_file } = options;
    let summaryText;
    let rationaleText = '';
    try {
        summaryText = readTextArgOrFile(cwd, summary, summary_file, 'summary');
        rationaleText = readTextArgOrFile(cwd, rationale || '', rationale_file, 'rationale') || '';
    }
    catch (thrown) {
        const e = thrown;
        (0, core_js_1.output)({ added: false, reason: e.message }, raw, 'false');
        return;
    }
    if (!summaryText) {
        (0, core_js_1.output)({ error: 'summary required' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const entry = `- [Phase ${phase || '?'}]: ${summaryText}${rationaleText ? ` — ${rationaleText}` : ''}`;
    const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const match = content.match(sectionPattern);
    if (match) {
        let sectionBody = match[2];
        sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, '').replace(/No decisions yet\.?\s*\n?/gi, '');
        sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
        content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ added: true, decision: entry }, raw, 'true');
    }
    else {
        (0, core_js_1.output)({ added: false, reason: 'Decisions section not found in STATE.md' }, raw, 'false');
    }
}
function cmdStateAddBlocker(cwd, text, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    const blockerOptions = typeof text === 'object' && text !== null ? text : { text: text };
    let blockerText;
    try {
        blockerText = readTextArgOrFile(cwd, blockerOptions.text, blockerOptions.text_file, 'blocker');
    }
    catch (thrown) {
        const e = thrown;
        (0, core_js_1.output)({ added: false, reason: e.message }, raw, 'false');
        return;
    }
    if (!blockerText) {
        (0, core_js_1.output)({ error: 'text required' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const entry = `- ${blockerText}`;
    const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const match = content.match(sectionPattern);
    if (match) {
        let sectionBody = match[2];
        sectionBody = sectionBody.replace(/None\.?\s*\n?/gi, '').replace(/None yet\.?\s*\n?/gi, '');
        sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
        content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ added: true, blocker: blockerText }, raw, 'true');
    }
    else {
        (0, core_js_1.output)({ added: false, reason: 'Blockers section not found in STATE.md' }, raw, 'false');
    }
}
function cmdStateResolveBlocker(cwd, text, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    if (!text) {
        (0, core_js_1.output)({ error: 'text required' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const match = content.match(sectionPattern);
    if (match) {
        const sectionBody = match[2];
        const lines = sectionBody.split('\n');
        const filtered = lines.filter(line => {
            if (!line.startsWith('- '))
                return true;
            return !line.toLowerCase().includes(text.toLowerCase());
        });
        let newBody = filtered.join('\n');
        if (!newBody.trim() || !newBody.includes('- ')) {
            newBody = 'None\n';
        }
        content = content.replace(sectionPattern, (_match, header) => `${header}${newBody}`);
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ resolved: true, blocker: text }, raw, 'true');
    }
    else {
        (0, core_js_1.output)({ resolved: false, reason: 'Blockers section not found in STATE.md' }, raw, 'false');
    }
}
function cmdStateRecordSession(cwd, options, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    let content = node_fs_1.default.readFileSync(statePath, 'utf-8');
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
        node_fs_1.default.writeFileSync(statePath, content, 'utf-8');
        (0, core_js_1.output)({ recorded: true, updated }, raw, 'true');
    }
    else {
        (0, core_js_1.output)({ recorded: false, reason: 'No session fields found in STATE.md' }, raw, 'false');
    }
}
function cmdStateSnapshot(cwd, raw) {
    const statePath = node_path_1.default.join(cwd, '.planning', 'STATE.md');
    if (!node_fs_1.default.existsSync(statePath)) {
        (0, core_js_1.output)({ error: 'STATE.md not found' }, raw);
        return;
    }
    const content = node_fs_1.default.readFileSync(statePath, 'utf-8');
    const extractField = (fieldName) => {
        const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i');
        const match = content.match(pattern);
        return match ? match[1].trim() : null;
    };
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
    const decisionsMatch = content.match(/##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i);
    if (decisionsMatch) {
        const tableBody = decisionsMatch[1];
        const rows = tableBody.trim().split('\n').filter(r => r.includes('|'));
        for (const row of rows) {
            const cells = row.split('|').map(c => c.trim()).filter(Boolean);
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
    const blockersMatch = content.match(/##\s*Blockers\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (blockersMatch) {
        const blockersSection = blockersMatch[1];
        const items = blockersSection.match(/^-\s+(.+)$/gm) || [];
        for (const item of items) {
            blockers.push(item.replace(/^-\s+/, '').trim());
        }
    }
    const session = {
        last_date: null,
        stopped_at: null,
        resume_file: null,
    };
    const sessionMatch = content.match(/##\s*Session\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (sessionMatch) {
        const sessionSection = sessionMatch[1];
        const lastDateMatch = sessionSection.match(/\*\*Last Date:\*\*\s*(.+)/i);
        const stoppedAtMatch = sessionSection.match(/\*\*Stopped At:\*\*\s*(.+)/i);
        const resumeFileMatch = sessionSection.match(/\*\*Resume File:\*\*\s*(.+)/i);
        if (lastDateMatch)
            session.last_date = lastDateMatch[1].trim();
        if (stoppedAtMatch)
            session.stopped_at = stoppedAtMatch[1].trim();
        if (resumeFileMatch)
            session.resume_file = resumeFileMatch[1].trim();
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
    (0, core_js_1.output)(snapshot, raw);
}
//# sourceMappingURL=state.js.map