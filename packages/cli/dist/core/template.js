"use strict";
/**
 * Template — Template selection and fill operations
 *
 * Ported from maxsim/bin/lib/template.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdTemplateSelect = cmdTemplateSelect;
exports.cmdTemplateFill = cmdTemplateFill;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
const types_js_1 = require("./types.js");
// ─── Template Select ─────────────────────────────────────────────────────────
function cmdTemplateSelect(cwd, planPath) {
    if (!planPath) {
        return (0, types_js_1.cmdErr)('plan-path required');
    }
    try {
        const fullPath = node_path_1.default.join(cwd, planPath);
        const content = node_fs_1.default.readFileSync(fullPath, 'utf-8');
        const taskMatch = content.match(/###\s*Task\s*\d+/g) || [];
        const taskCount = taskMatch.length;
        const decisionMatch = content.match(/decision/gi) || [];
        const hasDecisions = decisionMatch.length > 0;
        const fileMentions = new Set();
        const filePattern = /`([^`]+\.[a-zA-Z]+)`/g;
        let m;
        while ((m = filePattern.exec(content)) !== null) {
            if (m[1].includes('/') && !m[1].startsWith('http')) {
                fileMentions.add(m[1]);
            }
        }
        const fileCount = fileMentions.size;
        let template = 'templates/summary-standard.md';
        let type = 'standard';
        if (taskCount <= 2 && fileCount <= 3 && !hasDecisions) {
            template = 'templates/summary-minimal.md';
            type = 'minimal';
        }
        else if (hasDecisions || fileCount > 6 || taskCount > 5) {
            template = 'templates/summary-complex.md';
            type = 'complex';
        }
        const result = { template, type, taskCount, fileCount, hasDecisions };
        return (0, types_js_1.cmdOk)(result, template);
    }
    catch (thrown) {
        const selectErr = thrown;
        return (0, types_js_1.cmdOk)({ template: 'templates/summary-standard.md', type: 'standard', error: selectErr.message }, 'templates/summary-standard.md');
    }
}
// ─── Template Fill ───────────────────────────────────────────────────────────
function cmdTemplateFill(cwd, templateType, options) {
    if (!templateType) {
        return (0, types_js_1.cmdErr)('template type required: summary, plan, or verification');
    }
    if (!options.phase) {
        return (0, types_js_1.cmdErr)('--phase required');
    }
    const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, options.phase);
    if (!phaseInfo) {
        return (0, types_js_1.cmdOk)({ error: 'Phase not found', phase: options.phase });
    }
    const padded = (0, core_js_1.normalizePhaseName)(options.phase);
    const today = (0, core_js_1.todayISO)();
    const phaseName = options.name || phaseInfo.phase_name || 'Unnamed';
    const phaseSlug = phaseInfo.phase_slug || (0, core_js_1.generateSlugInternal)(phaseName);
    const phaseId = `${padded}-${phaseSlug}`;
    const planNum = (options.plan || '01').padStart(2, '0');
    const fields = options.fields || {};
    let frontmatter;
    let body;
    let fileName;
    switch (templateType) {
        case 'summary': {
            frontmatter = {
                phase: phaseId,
                plan: planNum,
                subsystem: '[primary category]',
                tags: [],
                provides: [],
                affects: [],
                'tech-stack': { added: [], patterns: [] },
                'key-files': { created: [], modified: [] },
                'key-decisions': [],
                'patterns-established': [],
                duration: '[X]min',
                completed: today,
                ...fields,
            };
            body = [
                `# Phase ${options.phase}: ${phaseName} Summary`,
                '',
                '**[Substantive one-liner describing outcome]**',
                '',
                '## Performance',
                '- **Duration:** [time]',
                '- **Tasks:** [count completed]',
                '- **Files modified:** [count]',
                '',
                '## Accomplishments',
                '- [Key outcome 1]',
                '- [Key outcome 2]',
                '',
                '## Task Commits',
                '1. **Task 1: [task name]** - `hash`',
                '',
                '## Files Created/Modified',
                '- `path/to/file.ts` - What it does',
                '',
                '## Decisions & Deviations',
                '[Key decisions or "None - followed plan as specified"]',
                '',
                '## Next Phase Readiness',
                '[What\'s ready for next phase]',
            ].join('\n');
            fileName = `${padded}-${planNum}-SUMMARY.md`;
            break;
        }
        case 'plan': {
            const planType = options.type || 'execute';
            const wave = parseInt(options.wave || '1') || 1;
            frontmatter = {
                phase: phaseId,
                plan: planNum,
                type: planType,
                wave,
                depends_on: [],
                files_modified: [],
                autonomous: true,
                user_setup: [],
                must_haves: { truths: [], artifacts: [], key_links: [] },
                ...fields,
            };
            body = [
                `# Phase ${options.phase} Plan ${planNum}: [Title]`,
                '',
                '## Objective',
                '- **What:** [What this plan builds]',
                '- **Why:** [Why it matters for the phase goal]',
                '- **Output:** [Concrete deliverable]',
                '',
                '## Context',
                '@.planning/PROJECT.md',
                '@.planning/ROADMAP.md',
                '@.planning/STATE.md',
                '',
                '## Tasks',
                '',
                '<task type="code">',
                '  <name>[Task name]</name>',
                '  <files>[file paths]</files>',
                '  <action>[What to do]</action>',
                '  <verify>[How to verify]</verify>',
                '  <done>[Definition of done]</done>',
                '</task>',
                '',
                '## Verification',
                '[How to verify this plan achieved its objective]',
                '',
                '## Success Criteria',
                '- [ ] [Criterion 1]',
                '- [ ] [Criterion 2]',
            ].join('\n');
            fileName = `${padded}-${planNum}-PLAN.md`;
            break;
        }
        case 'verification': {
            frontmatter = {
                phase: phaseId,
                verified: new Date().toISOString(),
                status: 'pending',
                score: '0/0 must-haves verified',
                ...fields,
            };
            body = [
                `# Phase ${options.phase}: ${phaseName} — Verification`,
                '',
                '## Observable Truths',
                '| # | Truth | Status | Evidence |',
                '|---|-------|--------|----------|',
                '| 1 | [Truth] | pending | |',
                '',
                '## Required Artifacts',
                '| Artifact | Expected | Status | Details |',
                '|----------|----------|--------|---------|',
                '| [path] | [what] | pending | |',
                '',
                '## Key Link Verification',
                '| From | To | Via | Status | Details |',
                '|------|----|----|--------|---------|',
                '| [source] | [target] | [connection] | pending | |',
                '',
                '## Requirements Coverage',
                '| Requirement | Status | Blocking Issue |',
                '|-------------|--------|----------------|',
                '| [req] | pending | |',
                '',
                '## Result',
                '[Pending verification]',
            ].join('\n');
            fileName = `${padded}-VERIFICATION.md`;
            break;
        }
        default:
            return (0, types_js_1.cmdErr)(`Unknown template type: ${templateType}. Available: summary, plan, verification`);
    }
    const fullContent = `---\n${(0, frontmatter_js_1.reconstructFrontmatter)(frontmatter)}\n---\n\n${body}\n`;
    const outPath = node_path_1.default.join(cwd, phaseInfo.directory, fileName);
    if (node_fs_1.default.existsSync(outPath)) {
        return (0, types_js_1.cmdOk)({ error: 'File already exists', path: node_path_1.default.relative(cwd, outPath) });
    }
    node_fs_1.default.writeFileSync(outPath, fullContent, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, outPath);
    const result = { created: true, path: relPath, template: templateType };
    return (0, types_js_1.cmdOk)(result, relPath);
}
//# sourceMappingURL=template.js.map