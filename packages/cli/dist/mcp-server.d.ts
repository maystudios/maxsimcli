/**
 * MAXSIM MCP Server — Entry point
 *
 * Provides MCP tools for phase operations, state management, and more.
 * Communicates over stdio using the MCP JSON-RPC protocol.
 *
 * CRITICAL: Never write to stdout directly — stdout is reserved for MCP protocol.
 * All logging must go to stderr.
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 */
export {};
//# sourceMappingURL=mcp-server.d.ts.map