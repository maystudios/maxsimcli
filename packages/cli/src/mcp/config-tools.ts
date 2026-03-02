/**
 * Config Query MCP Tools — Project configuration exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { loadConfig } from '../core/core.js';
import { cmdConfigGet, cmdConfigSet } from '../core/config.js';
import { detectProjectRoot, mcpSuccess, mcpError } from './utils.js';

/**
 * Register all config query tools on the MCP server.
 */
export function registerConfigTools(server: McpServer): void {
  // ── mcp_get_config ──────────────────────────────────────────────────────────

  server.tool(
    'mcp_get_config',
    'Get project configuration. Optionally provide a key path to get a specific value.',
    {
      key: z
        .string()
        .optional()
        .describe('Optional dot-separated key path (e.g. "model_profile", "branching.strategy")'),
    },
    async ({ key }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        if (key) {
          const result = cmdConfigGet(cwd, key, true);
          if (!result.ok) {
            return mcpError(result.error, 'Config get failed');
          }
          return mcpSuccess(
            { key, value: result.rawValue ?? result.result },
            `Config value for "${key}"`,
          );
        }

        const config = loadConfig(cwd);
        return mcpSuccess(
          { config },
          'Full configuration loaded',
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_update_config ───────────────────────────────────────────────────────

  server.tool(
    'mcp_update_config',
    'Update a project configuration value by key path.',
    {
      key: z.string().describe('Dot-separated key path (e.g. "model_profile", "branching.strategy")'),
      value: z.string().describe('New value to set'),
    },
    async ({ key, value }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = cmdConfigSet(cwd, key, value, true);
        if (!result.ok) {
          return mcpError(result.error, 'Config update failed');
        }

        return mcpSuccess(
          { updated: true, key, value },
          `Config "${key}" updated to "${value}"`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );
}
