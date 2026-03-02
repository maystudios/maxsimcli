/**
 * Roadmap Query MCP Tools — Roadmap analysis exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { cmdRoadmapAnalyze } from '../core/roadmap.js';
import { detectProjectRoot, mcpSuccess, mcpError } from './utils.js';

/**
 * Register all roadmap query tools on the MCP server.
 */
export function registerRoadmapTools(server: McpServer): void {
  // ── mcp_get_roadmap ─────────────────────────────────────────────────────────

  server.tool(
    'mcp_get_roadmap',
    'Get the full roadmap analysis including all phases, their status, and progress.',
    {},
    async () => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = await cmdRoadmapAnalyze(cwd);
        if (!result.ok) {
          return mcpError(result.error, 'Roadmap analysis failed');
        }

        return mcpSuccess(
          { roadmap: result.result },
          'Roadmap analysis complete',
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_get_roadmap_progress ────────────────────────────────────────────────

  server.tool(
    'mcp_get_roadmap_progress',
    'Get a focused progress summary: total phases, completed, in-progress, not started, and progress percentage.',
    {},
    async () => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = await cmdRoadmapAnalyze(cwd);
        if (!result.ok) {
          return mcpError(result.error, 'Roadmap analysis failed');
        }

        const data = result.result as Record<string, unknown>;
        const phases = (data.phases ?? []) as Array<Record<string, unknown>>;

        const total_phases = phases.length;
        let completed = 0;
        let in_progress = 0;
        let not_started = 0;

        for (const p of phases) {
          const status = String(p.status ?? '').toLowerCase();
          if (status === 'completed' || status === 'done') {
            completed++;
          } else if (status === 'in-progress' || status === 'in_progress' || status === 'active') {
            in_progress++;
          } else {
            not_started++;
          }
        }

        const progress_percent =
          total_phases > 0 ? Math.round((completed / total_phases) * 100) : 0;

        return mcpSuccess(
          {
            total_phases,
            completed,
            in_progress,
            not_started,
            progress_percent,
            current_phase: data.current_phase ?? null,
            next_phase: data.next_phase ?? null,
          },
          `Progress: ${completed}/${total_phases} phases complete (${progress_percent}%)`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );
}
