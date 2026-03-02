"use strict";
/**
 * Context Query MCP Tools — Project context exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerContextTools = registerContextTools;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const core_js_1 = require("../core/core.js");
const roadmap_js_1 = require("../core/roadmap.js");
const state_js_1 = require("../core/state.js");
const context_loader_js_1 = require("../core/context-loader.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all context query tools on the MCP server.
 */
function registerContextTools(server) {
    // ── mcp_get_active_phase ────────────────────────────────────────────────────
    server.tool('mcp_get_active_phase', 'Get the currently active phase and next phase from roadmap analysis and STATE.md.', {}, async () => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const roadmapResult = await (0, roadmap_js_1.cmdRoadmapAnalyze)(cwd);
            let current_phase = null;
            let next_phase = null;
            let phase_name = null;
            let status = null;
            if (roadmapResult.ok) {
                const data = roadmapResult.result;
                current_phase = data.current_phase ?? null;
                next_phase = data.next_phase ?? null;
            }
            // Also read STATE.md for current phase field
            const stateContent = (0, core_js_1.safeReadFile)((0, core_js_1.planningPath)(cwd, 'STATE.md'));
            if (stateContent) {
                const statePhase = (0, state_js_1.stateExtractField)(stateContent, 'Current Phase');
                if (statePhase)
                    phase_name = statePhase;
                const stateStatus = (0, state_js_1.stateExtractField)(stateContent, 'Status');
                if (stateStatus)
                    status = stateStatus;
            }
            return (0, utils_js_1.mcpSuccess)({ current_phase, next_phase, phase_name, status }, `Active phase: ${phase_name ?? current_phase ?? 'unknown'}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_get_guidelines ──────────────────────────────────────────────────────
    server.tool('mcp_get_guidelines', 'Get project guidelines: PROJECT.md vision, config, and optionally phase-specific context.', {
        phase: zod_1.z
            .string()
            .optional()
            .describe('Optional phase number to include phase-specific context'),
    }, async ({ phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const project_vision = (0, core_js_1.safeReadFile)((0, core_js_1.planningPath)(cwd, 'PROJECT.md'));
            const config = (0, core_js_1.loadConfig)(cwd);
            let phase_context = null;
            if (phase) {
                const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
                if (phaseInfo) {
                    const contextPath = node_path_1.default.join(phaseInfo.directory, `${phaseInfo.phase_number}-CONTEXT.md`);
                    phase_context = (0, core_js_1.safeReadFile)(contextPath);
                }
            }
            return (0, utils_js_1.mcpSuccess)({ project_vision, config, phase_context }, `Guidelines loaded${phase ? ` with phase ${phase} context` : ''}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_get_context_for_task ────────────────────────────────────────────────
    server.tool('mcp_get_context_for_task', 'Load context files for a task. Includes project context, roadmap, artefakte, and codebase docs filtered by topic. ' +
        'Topic keywords select relevant codebase docs: "ui/frontend" loads CONVENTIONS+STRUCTURE, ' +
        '"api/backend" loads ARCHITECTURE+CONVENTIONS, "testing" loads TESTING+CONVENTIONS, ' +
        '"database" loads ARCHITECTURE+STACK, "refactor" loads CONCERNS+ARCHITECTURE. ' +
        'Without topic, defaults to STACK+ARCHITECTURE.', {
        phase: zod_1.z
            .string()
            .optional()
            .describe('Phase number to scope context to'),
        topic: zod_1.z
            .string()
            .optional()
            .describe('Topic keywords to filter codebase docs (e.g. "frontend", "api", "testing", "database", "refactor")'),
    }, async ({ phase, topic }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = (0, context_loader_js_1.cmdContextLoad)(cwd, phase, topic, true);
            if (!result.ok) {
                return (0, utils_js_1.mcpError)(result.error, 'Context load failed');
            }
            return (0, utils_js_1.mcpSuccess)({ context: result.result }, `Context loaded${phase ? ` for phase ${phase}` : ''}${topic ? ` topic "${topic}"` : ''}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_get_project_overview ────────────────────────────────────────────────
    server.tool('mcp_get_project_overview', 'Get a high-level project overview: PROJECT.md, REQUIREMENTS.md, and STATE.md contents.', {}, async () => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const project = (0, core_js_1.safeReadFile)((0, core_js_1.planningPath)(cwd, 'PROJECT.md'));
            const requirements = (0, core_js_1.safeReadFile)((0, core_js_1.planningPath)(cwd, 'REQUIREMENTS.md'));
            const state = (0, core_js_1.safeReadFile)((0, core_js_1.planningPath)(cwd, 'STATE.md'));
            return (0, utils_js_1.mcpSuccess)({ project, requirements, state }, 'Project overview loaded');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_get_phase_detail ────────────────────────────────────────────────────
    server.tool('mcp_get_phase_detail', 'Get detailed information about a specific phase including all its files (plans, summaries, context, research, verification).', {
        phase: zod_1.z.string().describe('Phase number or name (e.g. "01", "1", "01A")'),
    }, async ({ phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const phaseInfo = (0, core_js_1.findPhaseInternal)(cwd, phase);
            if (!phaseInfo) {
                return (0, utils_js_1.mcpError)(`Phase ${phase} not found`, 'Phase not found');
            }
            // Read all files in the phase directory
            const files = [];
            try {
                const entries = node_fs_1.default.readdirSync(phaseInfo.directory);
                for (const entry of entries) {
                    const fullPath = node_path_1.default.join(phaseInfo.directory, entry);
                    const stat = node_fs_1.default.statSync(fullPath);
                    if (stat.isFile()) {
                        files.push({
                            name: entry,
                            content: (0, core_js_1.safeReadFile)(fullPath),
                        });
                    }
                }
            }
            catch {
                // Directory may not exist or be empty
            }
            return (0, utils_js_1.mcpSuccess)({
                phase_number: phaseInfo.phase_number,
                phase_name: phaseInfo.phase_name,
                directory: phaseInfo.directory,
                files,
            }, `Phase ${phaseInfo.phase_number} detail: ${files.length} file(s)`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
}
//# sourceMappingURL=context-tools.js.map