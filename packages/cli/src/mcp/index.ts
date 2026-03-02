/**
 * MCP Tool Registration — Orchestrates all tool registrations
 *
 * This is the single entry point for registering MCP tools on the server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPhaseTools } from './phase-tools.js';
import { registerTodoTools } from './todo-tools.js';
import { registerStateTools } from './state-tools.js';
import { registerContextTools } from './context-tools.js';
import { registerRoadmapTools } from './roadmap-tools.js';
import { registerConfigTools } from './config-tools.js';

/**
 * Register all MCP tools on the given server instance.
 */
export function registerAllTools(server: McpServer): void {
  registerPhaseTools(server);
  registerTodoTools(server);
  registerStateTools(server);
  registerContextTools(server);
  registerRoadmapTools(server);
  registerConfigTools(server);
}
