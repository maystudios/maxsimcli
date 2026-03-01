"use strict";
/**
 * State Management MCP Tools — STATE.md operations exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStateTools = registerStateTools;
const node_fs_1 = __importDefault(require("node:fs"));
const zod_1 = require("zod");
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const core_js_1 = require("../core/core.js");
const state_js_1 = require("../core/state.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all state management tools on the MCP server.
 */
function registerStateTools(server) {
    // ── mcp_get_state ───────────────────────────────────────────────────────────
    server.tool('mcp_get_state', 'Read STATE.md content — full file, a specific **field:** value, or a ## section.', {
        field: zod_1.z
            .string()
            .optional()
            .describe('Specific field or section name, or omit for full STATE.md'),
    }, async ({ field }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const stPath = (0, core_js_1.statePath)(cwd);
            if (!node_fs_1.default.existsSync(stPath)) {
                return (0, utils_js_1.mcpError)('STATE.md not found', 'STATE.md missing');
            }
            const content = node_fs_1.default.readFileSync(stPath, 'utf-8');
            if (!field) {
                return (0, utils_js_1.mcpSuccess)({ content }, 'Full STATE.md retrieved');
            }
            // Try **field:** value pattern first
            const fieldValue = (0, state_js_1.stateExtractField)(content, field);
            if (fieldValue) {
                return (0, utils_js_1.mcpSuccess)({ content: fieldValue, field }, `State field retrieved: ${field}`);
            }
            // Try ## Section pattern
            const fieldEscaped = (0, escape_string_regexp_1.default)(field);
            const sectionPattern = new RegExp(`##\\s*${fieldEscaped}\\s*\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
            const sectionMatch = content.match(sectionPattern);
            if (sectionMatch) {
                return (0, utils_js_1.mcpSuccess)({ content: sectionMatch[1].trim(), field }, `State section retrieved: ${field}`);
            }
            return (0, utils_js_1.mcpError)(`Section or field "${field}" not found in STATE.md`, 'Field not found');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_update_state ────────────────────────────────────────────────────────
    server.tool('mcp_update_state', 'Update a **field:** value in STATE.md (e.g., "Status", "Current focus").', {
        field: zod_1.z.string().describe('Field name (e.g., "Status", "Current focus")'),
        value: zod_1.z.string().describe('New value for the field'),
    }, async ({ field, value }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const stPath = (0, core_js_1.statePath)(cwd);
            if (!node_fs_1.default.existsSync(stPath)) {
                return (0, utils_js_1.mcpError)('STATE.md not found', 'STATE.md missing');
            }
            const content = node_fs_1.default.readFileSync(stPath, 'utf-8');
            const updated = (0, state_js_1.stateReplaceField)(content, field, value);
            if (!updated) {
                return (0, utils_js_1.mcpError)(`Field "${field}" not found in STATE.md`, 'Field not found');
            }
            node_fs_1.default.writeFileSync(stPath, updated, 'utf-8');
            return (0, utils_js_1.mcpSuccess)({ updated: true, field, value }, `State updated: ${field}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_add_decision ────────────────────────────────────────────────────────
    server.tool('mcp_add_decision', 'Record a decision in the Decisions section of STATE.md.', {
        summary: zod_1.z.string().describe('Decision summary'),
        rationale: zod_1.z.string().optional().describe('Optional rationale'),
        phase: zod_1.z.string().optional().describe('Associated phase number'),
    }, async ({ summary, rationale, phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const stPath = (0, core_js_1.statePath)(cwd);
            if (!node_fs_1.default.existsSync(stPath)) {
                return (0, utils_js_1.mcpError)('STATE.md not found', 'STATE.md missing');
            }
            const content = node_fs_1.default.readFileSync(stPath, 'utf-8');
            const entry = `- [Phase ${phase || '?'}]: ${summary}${rationale ? ` -- ${rationale}` : ''}`;
            const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
            const updated = (0, state_js_1.appendToStateSection)(content, sectionPattern, entry, [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi]);
            if (!updated) {
                return (0, utils_js_1.mcpError)('Decisions section not found in STATE.md', 'Section not found');
            }
            node_fs_1.default.writeFileSync(stPath, updated, 'utf-8');
            return (0, utils_js_1.mcpSuccess)({ added: true, decision: entry }, 'Decision recorded');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_add_blocker ─────────────────────────────────────────────────────────
    server.tool('mcp_add_blocker', 'Add a blocker entry to the Blockers section of STATE.md.', {
        text: zod_1.z.string().describe('Blocker description'),
    }, async ({ text }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const stPath = (0, core_js_1.statePath)(cwd);
            if (!node_fs_1.default.existsSync(stPath)) {
                return (0, utils_js_1.mcpError)('STATE.md not found', 'STATE.md missing');
            }
            const content = node_fs_1.default.readFileSync(stPath, 'utf-8');
            const entry = `- ${text}`;
            const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
            const updated = (0, state_js_1.appendToStateSection)(content, sectionPattern, entry, [/None\.?\s*\n?/gi, /None yet\.?\s*\n?/gi]);
            if (!updated) {
                return (0, utils_js_1.mcpError)('Blockers section not found in STATE.md', 'Section not found');
            }
            node_fs_1.default.writeFileSync(stPath, updated, 'utf-8');
            return (0, utils_js_1.mcpSuccess)({ added: true, blocker: text }, 'Blocker added');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_resolve_blocker ─────────────────────────────────────────────────────
    server.tool('mcp_resolve_blocker', 'Remove a blocker from STATE.md by matching text (case-insensitive partial match).', {
        text: zod_1.z
            .string()
            .describe('Text to match against blocker entries (case-insensitive partial match)'),
    }, async ({ text }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const stPath = (0, core_js_1.statePath)(cwd);
            if (!node_fs_1.default.existsSync(stPath)) {
                return (0, utils_js_1.mcpError)('STATE.md not found', 'STATE.md missing');
            }
            let content = node_fs_1.default.readFileSync(stPath, 'utf-8');
            const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
            const match = content.match(sectionPattern);
            if (!match) {
                return (0, utils_js_1.mcpError)('Blockers section not found in STATE.md', 'Section not found');
            }
            const sectionBody = match[2];
            const lines = sectionBody.split('\n');
            const filtered = lines.filter((line) => {
                if (!line.startsWith('- '))
                    return true;
                return !line.toLowerCase().includes(text.toLowerCase());
            });
            let newBody = filtered.join('\n');
            if (!newBody.trim() || !newBody.includes('- ')) {
                newBody = 'None\n';
            }
            content = content.replace(sectionPattern, (_match, header) => `${header}${newBody}`);
            node_fs_1.default.writeFileSync(stPath, content, 'utf-8');
            return (0, utils_js_1.mcpSuccess)({ resolved: true, blocker: text }, 'Blocker resolved');
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
}
//# sourceMappingURL=state-tools.js.map