"use strict";
/**
 * Phase CRUD MCP Tools — Phase operations exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhaseTools = registerPhaseTools;
const node_fs_1 = __importDefault(require("node:fs"));
const zod_1 = require("zod");
const core_js_1 = require("../core/core.js");
const phase_js_1 = require("../core/phase.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all phase CRUD tools on the MCP server.
 */
function registerPhaseTools(server) {
    // ── mcp_find_phase ──────────────────────────────────────────────────────────
    server.tool('mcp_find_phase', 'Find a phase directory by number or name. Returns phase details including plans, summaries, and status.', {
        phase: zod_1.z.string().describe('Phase number or name (e.g. "01", "1", "01A", "1.1")'),
    }, async ({ phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = (0, core_js_1.findPhaseInternal)(cwd, phase);
            if (!result) {
                return (0, utils_js_1.mcpError)(`Phase ${phase} not found`, 'Phase not found');
            }
            return (0, utils_js_1.mcpSuccess)({
                found: result.found,
                directory: result.directory,
                phase_number: result.phase_number,
                phase_name: result.phase_name,
                phase_slug: result.phase_slug,
                plans: result.plans,
                summaries: result.summaries,
                incomplete_plans: result.incomplete_plans,
                has_research: result.has_research,
                has_context: result.has_context,
                has_verification: result.has_verification,
                archived: result.archived ?? null,
            }, `Found phase ${result.phase_number}: ${result.phase_name ?? 'unnamed'}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_list_phases ─────────────────────────────────────────────────────────
    server.tool('mcp_list_phases', 'List all phase directories, sorted correctly. Optionally include archived phases from milestones.', {
        include_archived: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Include archived phases from completed milestones'),
    }, async ({ include_archived }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const phasesDir = (0, core_js_1.phasesPath)(cwd);
            if (!node_fs_1.default.existsSync(phasesDir)) {
                return (0, utils_js_1.mcpSuccess)({ directories: [], count: 0 }, 'No phases directory found');
            }
            let dirs = (0, core_js_1.listSubDirs)(phasesDir);
            if (include_archived) {
                const archived = (0, core_js_1.getArchivedPhaseDirs)(cwd);
                for (const a of archived) {
                    dirs.push(`${a.name} [${a.milestone}]`);
                }
            }
            dirs.sort((a, b) => (0, core_js_1.comparePhaseNum)(a, b));
            return (0, utils_js_1.mcpSuccess)({ directories: dirs, count: dirs.length }, `Found ${dirs.length} phase(s)`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_create_phase ────────────────────────────────────────────────────────
    server.tool('mcp_create_phase', 'Create a new phase. Adds the next sequential phase directory and appends to ROADMAP.md.', {
        name: zod_1.z.string().describe('Phase description/name (e.g. "Authentication System")'),
    }, async ({ name }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            if (!name || !name.trim()) {
                return (0, utils_js_1.mcpError)('Phase name must not be empty', 'Validation failed');
            }
            const result = (0, phase_js_1.phaseAddCore)(cwd, name, { includeStubs: true });
            return (0, utils_js_1.mcpSuccess)({
                phase_number: result.phase_number,
                padded: result.padded,
                name: result.description,
                slug: result.slug,
                directory: result.directory,
            }, `Created Phase ${result.phase_number}: ${result.description}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_insert_phase ────────────────────────────────────────────────────────
    server.tool('mcp_insert_phase', 'Insert a decimal phase after a specified phase (e.g. 01.1 after 01). Creates directory and updates ROADMAP.md.', {
        name: zod_1.z.string().describe('Phase description/name'),
        after: zod_1.z.string().describe('Phase number to insert after (e.g. "01", "1")'),
    }, async ({ name, after }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            if (!name || !name.trim()) {
                return (0, utils_js_1.mcpError)('Phase name must not be empty', 'Validation failed');
            }
            const result = (0, phase_js_1.phaseInsertCore)(cwd, after, name, { includeStubs: true });
            return (0, utils_js_1.mcpSuccess)({
                phase_number: result.phase_number,
                after_phase: result.after_phase,
                name: result.description,
                slug: result.slug,
                directory: result.directory,
            }, `Inserted Phase ${result.phase_number}: ${result.description} after Phase ${result.after_phase}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_complete_phase ──────────────────────────────────────────────────────
    server.tool('mcp_complete_phase', 'Mark a phase as complete. Updates ROADMAP.md checkbox, progress table, plan count, STATE.md, and REQUIREMENTS.md.', {
        phase: zod_1.z.string().describe('Phase number to complete (e.g. "01", "1", "1.1")'),
    }, async ({ phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = (0, phase_js_1.phaseCompleteCore)(cwd, phase);
            return (0, utils_js_1.mcpSuccess)({
                completed_phase: result.completed_phase,
                phase_name: result.phase_name,
                plans_executed: result.plans_executed,
                next_phase: result.next_phase,
                next_phase_name: result.next_phase_name,
                is_last_phase: result.is_last_phase,
                date: result.date,
                roadmap_updated: result.roadmap_updated,
                state_updated: result.state_updated,
            }, `Phase ${phase} marked as complete${result.next_phase ? `, next: Phase ${result.next_phase}` : ''}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
}
//# sourceMappingURL=phase-tools.js.map