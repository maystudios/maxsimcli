"use strict";
/**
 * MCP Utilities — Shared helpers for MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProjectRoot = detectProjectRoot;
exports.mcpSuccess = mcpSuccess;
exports.mcpError = mcpError;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
/**
 * Walk up from startDir to find a directory containing `.planning/`.
 * Returns the directory containing `.planning/` or null if not found.
 */
let _cachedRoot;
function detectProjectRoot(startDir) {
    // Only cache when using default startDir (cwd)
    if (startDir === undefined && _cachedRoot !== undefined) {
        return _cachedRoot;
    }
    let dir = startDir || process.cwd();
    // Safety limit to prevent infinite loops
    for (let i = 0; i < 100; i++) {
        const planningDir = node_path_1.default.join(dir, '.planning');
        try {
            const stat = node_fs_1.default.statSync(planningDir);
            if (stat.isDirectory()) {
                if (startDir === undefined)
                    _cachedRoot = dir;
                return dir;
            }
        }
        catch {
            // Not found here, walk up
        }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir) {
            // Reached filesystem root
            if (startDir === undefined)
                _cachedRoot = null;
            return null;
        }
        dir = parent;
    }
    if (startDir === undefined)
        _cachedRoot = null;
    return null;
}
/**
 * Return a structured MCP success response.
 */
function mcpSuccess(data, summary) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, data, summary }, null, 2),
            },
        ],
    };
}
/**
 * Return a structured MCP error response.
 */
function mcpError(error, summary) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: false, error, summary }, null, 2),
            },
        ],
        isError: true,
    };
}
//# sourceMappingURL=utils.js.map