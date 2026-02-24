"use strict";
/**
 * Commands — Standalone utility commands
 *
 * Ported from maxsim/bin/lib/commands.cjs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdGenerateSlug = cmdGenerateSlug;
exports.cmdCurrentTimestamp = cmdCurrentTimestamp;
exports.cmdListTodos = cmdListTodos;
exports.cmdVerifyPathExists = cmdVerifyPathExists;
exports.cmdHistoryDigest = cmdHistoryDigest;
exports.cmdResolveModel = cmdResolveModel;
exports.cmdCommit = cmdCommit;
exports.cmdSummaryExtract = cmdSummaryExtract;
exports.cmdWebsearch = cmdWebsearch;
exports.cmdProgressRender = cmdProgressRender;
exports.cmdTodoComplete = cmdTodoComplete;
exports.cmdScaffold = cmdScaffold;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
// ─── Slug generation ────────────────────────────────────────────────────────
function cmdGenerateSlug(text, raw) {
    if (!text) {
        (0, core_js_1.error)('text required for slug generation');
    }
    const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const result = { slug };
    (0, core_js_1.output)(result, raw, slug);
}
// ─── Timestamp ──────────────────────────────────────────────────────────────
function cmdCurrentTimestamp(format, raw) {
    const now = new Date();
    let result;
    switch (format) {
        case 'date':
            result = now.toISOString().split('T')[0];
            break;
        case 'filename':
            result = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
            break;
        case 'full':
        default:
            result = now.toISOString();
            break;
    }
    (0, core_js_1.output)({ timestamp: result }, raw, result);
}
// ─── Todos ──────────────────────────────────────────────────────────────────
function cmdListTodos(cwd, area, raw) {
    const pendingDir = node_path_1.default.join(cwd, '.planning', 'todos', 'pending');
    let count = 0;
    const todos = [];
    try {
        const files = node_fs_1.default.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = node_fs_1.default.readFileSync(node_path_1.default.join(pendingDir, file), 'utf-8');
                const createdMatch = content.match(/^created:\s*(.+)$/m);
                const titleMatch = content.match(/^title:\s*(.+)$/m);
                const areaMatch = content.match(/^area:\s*(.+)$/m);
                const todoArea = areaMatch ? areaMatch[1].trim() : 'general';
                // Apply area filter if specified
                if (area && todoArea !== area)
                    continue;
                count++;
                todos.push({
                    file,
                    created: createdMatch ? createdMatch[1].trim() : 'unknown',
                    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
                    area: todoArea,
                    path: node_path_1.default.join('.planning', 'todos', 'pending', file),
                });
            }
            catch { /* skip unreadable files */ }
        }
    }
    catch { /* no pending dir */ }
    const result = { count, todos };
    (0, core_js_1.output)(result, raw, count.toString());
}
// ─── Path verification ──────────────────────────────────────────────────────
function cmdVerifyPathExists(cwd, targetPath, raw) {
    if (!targetPath) {
        (0, core_js_1.error)('path required for verification');
    }
    const fullPath = node_path_1.default.isAbsolute(targetPath) ? targetPath : node_path_1.default.join(cwd, targetPath);
    try {
        const stats = node_fs_1.default.statSync(fullPath);
        const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
        const result = { exists: true, type };
        (0, core_js_1.output)(result, raw, 'true');
    }
    catch {
        const result = { exists: false, type: null };
        (0, core_js_1.output)(result, raw, 'false');
    }
}
// ─── History digest ─────────────────────────────────────────────────────────
function cmdHistoryDigest(cwd, raw) {
    const phasesDir = node_path_1.default.join(cwd, '.planning', 'phases');
    const digest = { phases: {}, decisions: [], tech_stack: new Set() };
    // Collect all phase directories: archived + current
    const allPhaseDirs = [];
    // Add archived phases first (oldest milestones first)
    const archived = (0, core_js_1.getArchivedPhaseDirs)(cwd);
    for (const a of archived) {
        allPhaseDirs.push({ name: a.name, fullPath: a.fullPath, milestone: a.milestone });
    }
    // Add current phases
    if (node_fs_1.default.existsSync(phasesDir)) {
        try {
            const currentDirs = node_fs_1.default.readdirSync(phasesDir, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => e.name)
                .sort();
            for (const dir of currentDirs) {
                allPhaseDirs.push({ name: dir, fullPath: node_path_1.default.join(phasesDir, dir), milestone: null });
            }
        }
        catch { /* ignore */ }
    }
    if (allPhaseDirs.length === 0) {
        const emptyDigest = { phases: {}, decisions: [], tech_stack: [] };
        (0, core_js_1.output)(emptyDigest, raw);
        return;
    }
    try {
        for (const { name: dir, fullPath: dirPath } of allPhaseDirs) {
            const summaries = node_fs_1.default.readdirSync(dirPath).filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
            for (const summary of summaries) {
                try {
                    const content = node_fs_1.default.readFileSync(node_path_1.default.join(dirPath, summary), 'utf-8');
                    const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
                    const phaseNum = fm.phase || dir.split('-')[0];
                    if (!digest.phases[phaseNum]) {
                        digest.phases[phaseNum] = {
                            name: fm.name || dir.split('-').slice(1).join(' ') || 'Unknown',
                            provides: new Set(),
                            affects: new Set(),
                            patterns: new Set(),
                        };
                    }
                    // Merge provides
                    const depGraph = fm['dependency-graph'];
                    if (depGraph && depGraph.provides) {
                        depGraph.provides.forEach(p => digest.phases[phaseNum].provides.add(p));
                    }
                    else if (fm.provides) {
                        fm.provides.forEach(p => digest.phases[phaseNum].provides.add(p));
                    }
                    // Merge affects
                    if (depGraph && depGraph.affects) {
                        depGraph.affects.forEach(a => digest.phases[phaseNum].affects.add(a));
                    }
                    // Merge patterns
                    if (fm['patterns-established']) {
                        fm['patterns-established'].forEach(p => digest.phases[phaseNum].patterns.add(p));
                    }
                    // Merge decisions
                    if (fm['key-decisions']) {
                        fm['key-decisions'].forEach(d => {
                            digest.decisions.push({ phase: phaseNum, decision: d });
                        });
                    }
                    // Merge tech stack
                    const techStack = fm['tech-stack'];
                    if (techStack && techStack.added) {
                        techStack.added.forEach(t => digest.tech_stack.add(typeof t === 'string' ? t : t.name));
                    }
                }
                catch {
                    // Skip malformed summaries
                }
            }
        }
        // Convert Sets to Arrays for JSON output
        const outputDigest = {
            phases: {},
            decisions: digest.decisions,
            tech_stack: [...digest.tech_stack],
        };
        for (const [p, data] of Object.entries(digest.phases)) {
            outputDigest.phases[p] = {
                name: data.name,
                provides: [...data.provides],
                affects: [...data.affects],
                patterns: [...data.patterns],
            };
        }
        (0, core_js_1.output)(outputDigest, raw);
    }
    catch (e) {
        (0, core_js_1.error)('Failed to generate history digest: ' + e.message);
    }
}
// ─── Model resolution ───────────────────────────────────────────────────────
function cmdResolveModel(cwd, agentType, raw) {
    if (!agentType) {
        (0, core_js_1.error)('agent-type required');
    }
    const config = (0, core_js_1.loadConfig)(cwd);
    const profile = config.model_profile || 'balanced';
    const agentModels = core_js_1.MODEL_PROFILES[agentType];
    if (!agentModels) {
        const result = { model: 'sonnet', profile, unknown_agent: true };
        (0, core_js_1.output)(result, raw, 'sonnet');
        return;
    }
    const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
    const model = resolved === 'opus' ? 'inherit' : resolved;
    const result = { model, profile };
    (0, core_js_1.output)(result, raw, model);
}
// ─── Commit ─────────────────────────────────────────────────────────────────
function cmdCommit(cwd, message, files, raw, amend) {
    if (!message && !amend) {
        (0, core_js_1.error)('commit message required');
    }
    const config = (0, core_js_1.loadConfig)(cwd);
    // Check commit_docs config
    if (!config.commit_docs) {
        const result = { committed: false, hash: null, reason: 'skipped_commit_docs_false' };
        (0, core_js_1.output)(result, raw, 'skipped');
        return;
    }
    // Check if .planning is gitignored
    if ((0, core_js_1.isGitIgnored)(cwd, '.planning')) {
        const result = { committed: false, hash: null, reason: 'skipped_gitignored' };
        (0, core_js_1.output)(result, raw, 'skipped');
        return;
    }
    // Stage files
    const filesToStage = files && files.length > 0 ? files : ['.planning/'];
    for (const file of filesToStage) {
        (0, core_js_1.execGit)(cwd, ['add', file]);
    }
    // Commit
    const commitArgs = amend ? ['commit', '--amend', '--no-edit'] : ['commit', '-m', message];
    const commitResult = (0, core_js_1.execGit)(cwd, commitArgs);
    if (commitResult.exitCode !== 0) {
        if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
            const result = { committed: false, hash: null, reason: 'nothing_to_commit' };
            (0, core_js_1.output)(result, raw, 'nothing');
            return;
        }
        const result = { committed: false, hash: null, reason: 'nothing_to_commit', error: commitResult.stderr };
        (0, core_js_1.output)(result, raw, 'nothing');
        return;
    }
    // Get short hash
    const hashResult = (0, core_js_1.execGit)(cwd, ['rev-parse', '--short', 'HEAD']);
    const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
    const result = { committed: true, hash, reason: 'committed' };
    (0, core_js_1.output)(result, raw, hash || 'committed');
}
// ─── Summary extract ────────────────────────────────────────────────────────
function cmdSummaryExtract(cwd, summaryPath, fields, raw) {
    if (!summaryPath) {
        (0, core_js_1.error)('summary-path required for summary-extract');
    }
    const fullPath = node_path_1.default.join(cwd, summaryPath);
    if (!node_fs_1.default.existsSync(fullPath)) {
        (0, core_js_1.output)({ error: 'File not found', path: summaryPath }, raw);
        return;
    }
    const content = node_fs_1.default.readFileSync(fullPath, 'utf-8');
    const fm = (0, frontmatter_js_1.extractFrontmatter)(content);
    // Parse key-decisions into structured format
    const parseDecisions = (decisionsList) => {
        if (!decisionsList || !Array.isArray(decisionsList))
            return [];
        return decisionsList.map((d) => {
            const colonIdx = d.indexOf(':');
            if (colonIdx > 0) {
                return {
                    summary: d.substring(0, colonIdx).trim(),
                    rationale: d.substring(colonIdx + 1).trim(),
                };
            }
            return { summary: d, rationale: null };
        });
    };
    const techStack = fm['tech-stack'];
    // Build full result
    const fullResult = {
        path: summaryPath,
        one_liner: fm['one-liner'] || null,
        key_files: fm['key-files'] || [],
        tech_added: (techStack && techStack.added) || [],
        patterns: fm['patterns-established'] || [],
        decisions: parseDecisions(fm['key-decisions']),
        requirements_completed: fm['requirements-completed'] || [],
    };
    // If fields specified, filter to only those fields
    if (fields && fields.length > 0) {
        const filtered = { path: summaryPath };
        for (const field of fields) {
            if (fullResult[field] !== undefined) {
                filtered[field] = fullResult[field];
            }
        }
        (0, core_js_1.output)(filtered, raw);
        return;
    }
    (0, core_js_1.output)(fullResult, raw);
}
// ─── Web search ─────────────────────────────────────────────────────────────
async function cmdWebsearch(query, options, raw) {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
        (0, core_js_1.output)({ available: false, reason: 'BRAVE_API_KEY not set' }, raw, '');
        return;
    }
    if (!query) {
        (0, core_js_1.output)({ available: false, error: 'Query required' }, raw, '');
        return;
    }
    const params = new URLSearchParams({
        q: query,
        count: String(options.limit || 10),
        country: 'us',
        search_lang: 'en',
        text_decorations: 'false',
    });
    if (options.freshness) {
        params.set('freshness', options.freshness);
    }
    try {
        const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
            headers: {
                Accept: 'application/json',
                'X-Subscription-Token': apiKey,
            },
        });
        if (!response.ok) {
            (0, core_js_1.output)({ available: false, error: `API error: ${response.status}` }, raw, '');
            return;
        }
        const data = (await response.json());
        const results = (data.web?.results || []).map(r => ({
            title: r.title,
            url: r.url,
            description: r.description,
            age: r.age || null,
        }));
        (0, core_js_1.output)({
            available: true,
            query,
            count: results.length,
            results,
        }, raw, results.map(r => `${r.title}\n${r.url}\n${r.description}`).join('\n\n'));
    }
    catch (err) {
        (0, core_js_1.output)({ available: false, error: err.message }, raw, '');
    }
}
// ─── Progress render ────────────────────────────────────────────────────────
function cmdProgressRender(cwd, format, raw) {
    const phasesDir = node_path_1.default.join(cwd, '.planning', 'phases');
    const milestone = (0, core_js_1.getMilestoneInfo)(cwd);
    const phases = [];
    let totalPlans = 0;
    let totalSummaries = 0;
    try {
        const entries = node_fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .sort((a, b) => {
            const aNum = parseFloat(a.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0');
            const bNum = parseFloat(b.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0');
            return aNum - bNum;
        });
        for (const dir of dirs) {
            const dm = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
            const phaseNum = dm ? dm[1] : dir;
            const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';
            const phaseFiles = node_fs_1.default.readdirSync(node_path_1.default.join(phasesDir, dir));
            const planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
            const summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
            totalPlans += planCount;
            totalSummaries += summaryCount;
            let status;
            if (planCount === 0)
                status = 'Pending';
            else if (summaryCount >= planCount)
                status = 'Complete';
            else if (summaryCount > 0)
                status = 'In Progress';
            else
                status = 'Planned';
            phases.push({ number: phaseNum, name: phaseName, plans: planCount, summaries: summaryCount, status });
        }
    }
    catch { /* ignore */ }
    const percent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;
    if (format === 'table') {
        const barWidth = 10;
        const filled = Math.round((percent / 100) * barWidth);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
        let out = `# ${milestone.version} ${milestone.name}\n\n`;
        out += `**Progress:** [${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)\n\n`;
        out += `| Phase | Name | Plans | Status |\n`;
        out += `|-------|------|-------|--------|\n`;
        for (const p of phases) {
            out += `| ${p.number} | ${p.name} | ${p.summaries}/${p.plans} | ${p.status} |\n`;
        }
        (0, core_js_1.output)({ rendered: out }, raw, out);
    }
    else if (format === 'bar') {
        const barWidth = 20;
        const filled = Math.round((percent / 100) * barWidth);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
        const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
        (0, core_js_1.output)({ bar: text, percent, completed: totalSummaries, total: totalPlans }, raw, text);
    }
    else {
        (0, core_js_1.output)({
            milestone_version: milestone.version,
            milestone_name: milestone.name,
            phases,
            total_plans: totalPlans,
            total_summaries: totalSummaries,
            percent,
        }, raw);
    }
}
// ─── Todo complete ──────────────────────────────────────────────────────────
function cmdTodoComplete(cwd, filename, raw) {
    if (!filename) {
        (0, core_js_1.error)('filename required for todo complete');
    }
    const pendingDir = node_path_1.default.join(cwd, '.planning', 'todos', 'pending');
    const completedDir = node_path_1.default.join(cwd, '.planning', 'todos', 'completed');
    const sourcePath = node_path_1.default.join(pendingDir, filename);
    if (!node_fs_1.default.existsSync(sourcePath)) {
        (0, core_js_1.error)(`Todo not found: ${filename}`);
    }
    // Ensure completed directory exists
    node_fs_1.default.mkdirSync(completedDir, { recursive: true });
    // Read, add completion timestamp, move
    let content = node_fs_1.default.readFileSync(sourcePath, 'utf-8');
    const today = new Date().toISOString().split('T')[0];
    content = `completed: ${today}\n` + content;
    node_fs_1.default.writeFileSync(node_path_1.default.join(completedDir, filename), content, 'utf-8');
    node_fs_1.default.unlinkSync(sourcePath);
    (0, core_js_1.output)({ completed: true, file: filename, date: today }, raw, 'completed');
}
// ─── Scaffold ───────────────────────────────────────────────────────────────
function cmdScaffold(cwd, type, options, raw) {
    const { phase, name } = options;
    const padded = phase ? (0, core_js_1.normalizePhaseName)(phase) : '00';
    const today = new Date().toISOString().split('T')[0];
    // Find phase directory
    const phaseInfo = phase ? (0, core_js_1.findPhaseInternal)(cwd, phase) : null;
    const phaseDir = phaseInfo ? node_path_1.default.join(cwd, phaseInfo.directory) : null;
    if (phase && !phaseDir && type !== 'phase-dir') {
        (0, core_js_1.error)(`Phase ${phase} directory not found`);
    }
    let filePath;
    let content;
    switch (type) {
        case 'context': {
            filePath = node_path_1.default.join(phaseDir, `${padded}-CONTEXT.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Context\n\n## Decisions\n\n_Decisions will be captured during /maxsim:discuss-phase ${phase}_\n\n## Discretion Areas\n\n_Areas where the executor can use judgment_\n\n## Deferred Ideas\n\n_Ideas to consider later_\n`;
            break;
        }
        case 'uat': {
            filePath = node_path_1.default.join(phaseDir, `${padded}-UAT.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — User Acceptance Testing\n\n## Test Results\n\n| # | Test | Status | Notes |\n|---|------|--------|-------|\n\n## Summary\n\n_Pending UAT_\n`;
            break;
        }
        case 'verification': {
            filePath = node_path_1.default.join(phaseDir, `${padded}-VERIFICATION.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Verification\n\n## Goal-Backward Verification\n\n**Phase Goal:** [From ROADMAP.md]\n\n## Checks\n\n| # | Requirement | Status | Evidence |\n|---|------------|--------|----------|\n\n## Result\n\n_Pending verification_\n`;
            break;
        }
        case 'phase-dir': {
            if (!phase || !name) {
                (0, core_js_1.error)('phase and name required for phase-dir scaffold');
            }
            const slug = (0, core_js_1.generateSlugInternal)(name);
            const dirName = `${padded}-${slug}`;
            const phasesParent = node_path_1.default.join(cwd, '.planning', 'phases');
            node_fs_1.default.mkdirSync(phasesParent, { recursive: true });
            const dirPath = node_path_1.default.join(phasesParent, dirName);
            node_fs_1.default.mkdirSync(dirPath, { recursive: true });
            (0, core_js_1.output)({ created: true, directory: `.planning/phases/${dirName}`, path: dirPath }, raw, dirPath);
            return;
        }
        default:
            (0, core_js_1.error)(`Unknown scaffold type: ${type}. Available: context, uat, verification, phase-dir`);
            return; // unreachable but satisfies TS
    }
    if (node_fs_1.default.existsSync(filePath)) {
        (0, core_js_1.output)({ created: false, reason: 'already_exists', path: filePath }, raw, 'exists');
        return;
    }
    node_fs_1.default.writeFileSync(filePath, content, 'utf-8');
    const relPath = node_path_1.default.relative(cwd, filePath);
    (0, core_js_1.output)({ created: true, path: relPath }, raw, relPath);
}
//# sourceMappingURL=commands.js.map