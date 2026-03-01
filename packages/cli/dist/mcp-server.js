"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const index_js_1 = require("./mcp/index.js");
async function main() {
    const server = new mcp_js_1.McpServer({
        name: 'maxsim',
        version: '1.0.0',
    });
    (0, index_js_1.registerAllTools)(server);
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Log to stderr ONLY — stdout is reserved for MCP JSON-RPC protocol
    process.stderr.write('MAXSIM MCP server started\n');
}
main().catch((err) => {
    process.stderr.write(`MAXSIM MCP server error: ${err}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=mcp-server.js.map