"use strict";
/**
 * Roadmap Query MCP Tools — Roadmap analysis exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoadmapTools = registerRoadmapTools;
const roadmap_js_1 = require("../core/roadmap.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all roadmap query tools on the MCP server.
 */
function registerRoadmapTools(server) {
    // ── mcp_get_roadmap ─────────────────────────────────────────────────────────
    server.tool('mcp_get_roadmap', 'Get the full roadmap analysis including all phases, their status, and progress.', {}, async () => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = await (0, roadmap_js_1.cmdRoadmapAnalyze)(cwd);
            if (!result.ok) {
                return (0, utils_js_1.mcpError)(result.error, 'Roadmap analysis failed');
            }
            return (0, utils_js_1.mcpSuccess)({ roadmap: result.result }, 'Roadmap analysis complete');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_get_roadmap_progress ────────────────────────────────────────────────
    server.tool('mcp_get_roadmap_progress', 'Get a focused progress summary: total phases, completed, in-progress, not started, and progress percentage.', {}, async () => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = await (0, roadmap_js_1.cmdRoadmapAnalyze)(cwd);
            if (!result.ok) {
                return (0, utils_js_1.mcpError)(result.error, 'Roadmap analysis failed');
            }
            const data = result.result;
            const phases = (data.phases ?? []);
            const total_phases = phases.length;
            let completed = 0;
            let in_progress = 0;
            let not_started = 0;
            for (const p of phases) {
                const status = String(p.status ?? '').toLowerCase();
                if (status === 'completed' || status === 'done') {
                    completed++;
                }
                else if (status === 'in-progress' || status === 'in_progress' || status === 'active') {
                    in_progress++;
                }
                else {
                    not_started++;
                }
            }
            const progress_percent = total_phases > 0 ? Math.round((completed / total_phases) * 100) : 0;
            return (0, utils_js_1.mcpSuccess)({
                total_phases,
                completed,
                in_progress,
                not_started,
                progress_percent,
                current_phase: data.current_phase ?? null,
                next_phase: data.next_phase ?? null,
            }, `Progress: ${completed}/${total_phases} phases complete (${progress_percent}%)`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
}
//# sourceMappingURL=roadmap-tools.js.map