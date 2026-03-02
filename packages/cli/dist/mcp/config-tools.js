"use strict";
/**
 * Config Query MCP Tools — Project configuration exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigTools = registerConfigTools;
const zod_1 = require("zod");
const core_js_1 = require("../core/core.js");
const config_js_1 = require("../core/config.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all config query tools on the MCP server.
 */
function registerConfigTools(server) {
    // ── mcp_get_config ──────────────────────────────────────────────────────────
    server.tool('mcp_get_config', 'Get project configuration. Optionally provide a key path to get a specific value.', {
        key: zod_1.z
            .string()
            .optional()
            .describe('Optional dot-separated key path (e.g. "model_profile", "branching.strategy")'),
    }, async ({ key }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            if (key) {
                const result = (0, config_js_1.cmdConfigGet)(cwd, key, true);
                if (!result.ok) {
                    return (0, utils_js_1.mcpError)(result.error, 'Config get failed');
                }
                return (0, utils_js_1.mcpSuccess)({ key, value: result.rawValue ?? result.result }, `Config value for "${key}"`);
            }
            const config = (0, core_js_1.loadConfig)(cwd);
            return (0, utils_js_1.mcpSuccess)({ config }, 'Full configuration loaded');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
    // ── mcp_update_config ───────────────────────────────────────────────────────
    server.tool('mcp_update_config', 'Update a project configuration value by key path.', {
        key: zod_1.z.string().describe('Dot-separated key path (e.g. "model_profile", "branching.strategy")'),
        value: zod_1.z.string().describe('New value to set'),
    }, async ({ key, value }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const result = (0, config_js_1.cmdConfigSet)(cwd, key, value, true);
            if (!result.ok) {
                return (0, utils_js_1.mcpError)(result.error, 'Config update failed');
            }
            return (0, utils_js_1.mcpSuccess)({ updated: true, key, value }, `Config "${key}" updated to "${value}"`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)('Failed: ' + e.message, 'Error occurred');
        }
    });
}
//# sourceMappingURL=config-tools.js.map