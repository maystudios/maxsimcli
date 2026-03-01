"use strict";
/**
 * MCP Tool Registration — Orchestrates all tool registrations
 *
 * This is the single entry point for registering MCP tools on the server.
 * Later plans will add registerTodoTools, registerStateTools, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllTools = registerAllTools;
const phase_tools_js_1 = require("./phase-tools.js");
const todo_tools_js_1 = require("./todo-tools.js");
const state_tools_js_1 = require("./state-tools.js");
/**
 * Register all MCP tools on the given server instance.
 */
function registerAllTools(server) {
    (0, phase_tools_js_1.registerPhaseTools)(server);
    (0, todo_tools_js_1.registerTodoTools)(server);
    (0, state_tools_js_1.registerStateTools)(server);
}
//# sourceMappingURL=index.js.map