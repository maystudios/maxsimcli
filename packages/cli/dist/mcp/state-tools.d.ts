/**
 * State Management MCP Tools — STATE.md operations exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register all state management tools on the MCP server.
 */
export declare function registerStateTools(server: McpServer): void;
//# sourceMappingURL=state-tools.d.ts.map