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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './mcp/index.js';

async function main() {
  const server = new McpServer({
    name: 'maxsim',
    version: '1.0.0',
  });

  registerAllTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr ONLY — stdout is reserved for MCP JSON-RPC protocol
  process.stderr.write('MAXSIM MCP server started\n');
}

main().catch((err) => {
  process.stderr.write(`MAXSIM MCP server error: ${err}\n`);
  process.exitCode = 1;
});
