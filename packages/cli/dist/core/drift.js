"use strict";
/**
 * Drift — Drift report CRUD, requirement extraction, and spec extraction
 *
 * Provides CLI tool commands for the drift-checker agent and realign workflow.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdDriftReadReport = cmdDriftReadReport;
exports.cmdDriftWriteReport = cmdDriftWriteReport;
exports.cmdDriftExtractRequirements = cmdDriftExtractRequirements;
exports.cmdDriftExtractNoGos = cmdDriftExtractNoGos;
exports.cmdDriftExtractConventions = cmdDriftExtractConventions;
exports.cmdDriftPreviousHash = cmdDriftPreviousHash;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const core_js_1 = require("./core.js");
const frontmatter_js_1 = require("./frontmatter.js");
const types_js_1 = require("./types.js");
// ─── Constants ───────────────────────────────────────────────────────────────
const DRIFT_REPORT_NAME = 'DRIFT-REPORT.md';
// ─── Drift Report CRUD ──────────────────────────────────────────────────────
/**
 * Read the drift report from .planning/DRIFT-REPORT.md.
 * Returns parsed frontmatter and body content, or structured error if not found.
 */
function cmdDriftReadReport(cwd) {
    const reportPath = (0, core_js_1.planningPath)(cwd, DRIFT_REPORT_NAME);
    const content = (0, core_js_1.safeReadFile)(reportPath);
    if (!content) {
        return (0, types_js_1.cmdOk)({
            found: false,
            path: `.planning/${DRIFT_REPORT_NAME}`,
            error: 'Drift report not found',
        });
    }
    const frontmatter = (0, frontmatter_js_1.extractFrontmatter)(content);
    // Extract body (content after frontmatter)
    const bodyMatch = content.match(/^---\n[\s\S]+?\n---\n?([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1].trim() : content;
    return (0, types_js_1.cmdOk)({
        found: true,
        path: `.planning/${DRIFT_REPORT_NAME}`,
        frontmatter,
        body,
    });
}
/**
 * Write content to .planning/DRIFT-REPORT.md.
 * Supports direct content or reading from a file (tmpfile pattern for large reports).
 */
function cmdDriftWriteReport(cwd, content, contentFile) {
    let reportContent;
    if (contentFile) {
        // Read from file (supports tmpfile pattern)
        const filePath = node_path_1.default.isAbsolute(contentFile) ? contentFile : node_path_1.default.join(cwd, contentFile);
        const fileContent = (0, core_js_1.safeReadFile)(filePath);
        if (!fileContent) {
            return (0, types_js_1.cmdErr)(`Content file not found: ${contentFile}`);
        }
        reportContent = fileContent;
    }
    else if (content) {
        reportContent = content;
    }
    else {
        return (0, types_js_1.cmdErr)('Either --content or --content-file is required');
    }
    const reportPath = (0, core_js_1.planningPath)(cwd, DRIFT_REPORT_NAME);
    // Ensure .planning/ directory exists
    const planningDir = (0, core_js_1.planningPath)(cwd);
    if (!node_fs_1.default.existsSync(planningDir)) {
        return (0, types_js_1.cmdErr)('.planning/ directory does not exist');
    }
    try {
        node_fs_1.default.writeFileSync(reportPath, reportContent, 'utf-8');
        return (0, types_js_1.cmdOk)({
            written: true,
            path: `.planning/${DRIFT_REPORT_NAME}`,
        });
    }
    catch (e) {
        (0, core_js_1.debugLog)('drift-write-report-failed', e);
        return (0, types_js_1.cmdErr)(`Failed to write drift report: ${e instanceof Error ? e.message : String(e)}`);
    }
}
// ─── Spec Extraction Commands ────────────────────────────────────────────────
/**
 * Extract all requirements from .planning/REQUIREMENTS.md.
 * Parses requirement lines matching `- [ ] **ID**: description` or `- [x] **ID**: description`.
 */
function cmdDriftExtractRequirements(cwd) {
    const reqPath = (0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md');
    const content = (0, core_js_1.safeReadFile)(reqPath);
    if (!content) {
        return (0, types_js_1.cmdOk)({
            found: false,
            path: '.planning/REQUIREMENTS.md',
            requirements: [],
        });
    }
    const requirements = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match: - [ ] **ID**: description  OR  - [x] **ID**: description
        const match = line.match(/^-\s+\[([ xX])\]\s+\*\*([^*]+)\*\*[:\s]+(.+)/);
        if (match) {
            requirements.push({
                id: match[2].trim(),
                description: match[3].trim(),
                complete: match[1].toLowerCase() === 'x',
                line_number: i + 1,
            });
        }
    }
    return (0, types_js_1.cmdOk)({
        found: true,
        path: '.planning/REQUIREMENTS.md',
        count: requirements.length,
        requirements,
    });
}
/**
 * Extract no-go rules from .planning/NO-GOS.md.
 * Returns array of no-go items with section context, or empty if file missing.
 */
function cmdDriftExtractNoGos(cwd) {
    const nogosPath = (0, core_js_1.planningPath)(cwd, 'NO-GOS.md');
    const content = (0, core_js_1.safeReadFile)(nogosPath);
    if (!content) {
        return (0, types_js_1.cmdOk)({
            found: false,
            path: '.planning/NO-GOS.md',
            nogos: [],
        });
    }
    const nogos = [];
    const lines = content.split('\n');
    let currentSection = 'General';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Track sections (## or ### headings)
        const headingMatch = line.match(/^#{2,3}\s+(.+)/);
        if (headingMatch) {
            currentSection = headingMatch[1].trim();
            continue;
        }
        // Match bullet points (-, *, or numbered items) that contain substantive text
        const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
        if (bulletMatch) {
            const ruleText = bulletMatch[1].trim();
            // Skip empty or very short items
            if (ruleText.length > 5) {
                nogos.push({
                    rule: ruleText,
                    section: currentSection,
                    line_number: i + 1,
                });
            }
        }
    }
    return (0, types_js_1.cmdOk)({
        found: true,
        path: '.planning/NO-GOS.md',
        count: nogos.length,
        nogos,
    });
}
/**
 * Read .planning/CONVENTIONS.md and return its full content.
 * Returns the raw content for agent analysis, or null if missing.
 */
function cmdDriftExtractConventions(cwd) {
    const convPath = (0, core_js_1.planningPath)(cwd, 'CONVENTIONS.md');
    const content = (0, core_js_1.safeReadFile)(convPath);
    if (!content) {
        return (0, types_js_1.cmdOk)({
            found: false,
            path: '.planning/CONVENTIONS.md',
            content: null,
        });
    }
    return (0, types_js_1.cmdOk)({
        found: true,
        path: '.planning/CONVENTIONS.md',
        content,
    });
}
/**
 * Read existing DRIFT-REPORT.md frontmatter for diff tracking.
 * Returns previous_hash and checked date, or null if no report exists.
 */
function cmdDriftPreviousHash(cwd) {
    const reportPath = (0, core_js_1.planningPath)(cwd, DRIFT_REPORT_NAME);
    const content = (0, core_js_1.safeReadFile)(reportPath);
    if (!content) {
        return (0, types_js_1.cmdOk)({
            found: false,
            hash: null,
            checked_date: null,
        });
    }
    const frontmatter = (0, frontmatter_js_1.extractFrontmatter)(content);
    return (0, types_js_1.cmdOk)({
        found: true,
        hash: frontmatter.previous_hash ?? null,
        checked_date: frontmatter.checked ?? null,
    });
}
//# sourceMappingURL=drift.js.map