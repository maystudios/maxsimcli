/**
 * Context Query MCP Tools — Project context exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  findPhaseInternal,
  planningPath,
  safeReadFile,
  loadConfig,
} from '../core/core.js';

import { cmdRoadmapAnalyze } from '../core/roadmap.js';
import { stateExtractField } from '../core/state.js';
import { cmdContextLoad } from '../core/context-loader.js';
import { detectProjectRoot, mcpSuccess, mcpError } from './utils.js';

/**
 * Register all context query tools on the MCP server.
 */
export function registerContextTools(server: McpServer): void {
  // ── mcp_get_active_phase ────────────────────────────────────────────────────

  server.tool(
    'mcp_get_active_phase',
    'Get the currently active phase and next phase from roadmap analysis and STATE.md.',
    {},
    async () => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const roadmapResult = await cmdRoadmapAnalyze(cwd);
        let current_phase: unknown = null;
        let next_phase: unknown = null;
        let phase_name: string | null = null;
        let status: string | null = null;

        if (roadmapResult.ok) {
          const data = roadmapResult.result as Record<string, unknown>;
          current_phase = data.current_phase ?? null;
          next_phase = data.next_phase ?? null;
        }

        // Also read STATE.md for current phase field
        const stateContent = safeReadFile(planningPath(cwd, 'STATE.md'));
        if (stateContent) {
          const statePhase = stateExtractField(stateContent, 'Current Phase');
          if (statePhase) phase_name = statePhase;
          const stateStatus = stateExtractField(stateContent, 'Status');
          if (stateStatus) status = stateStatus;
        }

        return mcpSuccess(
          { current_phase, next_phase, phase_name, status },
          `Active phase: ${phase_name ?? current_phase ?? 'unknown'}`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_get_guidelines ──────────────────────────────────────────────────────

  server.tool(
    'mcp_get_guidelines',
    'Get project guidelines: PROJECT.md vision, config, and optionally phase-specific context.',
    {
      phase: z
        .string()
        .optional()
        .describe('Optional phase number to include phase-specific context'),
    },
    async ({ phase }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const project_vision = safeReadFile(planningPath(cwd, 'PROJECT.md'));
        const config = loadConfig(cwd);

        let phase_context: string | null = null;
        if (phase) {
          const phaseInfo = findPhaseInternal(cwd, phase);
          if (phaseInfo) {
            const contextPath = path.join(
              phaseInfo.directory,
              `${phaseInfo.phase_number}-CONTEXT.md`,
            );
            phase_context = safeReadFile(contextPath);
          }
        }

        return mcpSuccess(
          { project_vision, config, phase_context },
          `Guidelines loaded${phase ? ` with phase ${phase} context` : ''}`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_get_context_for_task ────────────────────────────────────────────────

  server.tool(
    'mcp_get_context_for_task',
    'Load context files for a task, including project context, roadmap, and optionally phase-specific and topic-specific files.',
    {
      phase: z
        .string()
        .optional()
        .describe('Optional phase number to scope context to'),
      topic: z
        .string()
        .optional()
        .describe('Optional topic to filter context by'),
    },
    async ({ phase, topic }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = cmdContextLoad(cwd, phase, topic, true);
        if (!result.ok) {
          return mcpError(result.error, 'Context load failed');
        }

        return mcpSuccess(
          { context: result.result },
          `Context loaded${phase ? ` for phase ${phase}` : ''}${topic ? ` topic "${topic}"` : ''}`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_get_project_overview ────────────────────────────────────────────────

  server.tool(
    'mcp_get_project_overview',
    'Get a high-level project overview: PROJECT.md, REQUIREMENTS.md, and STATE.md contents.',
    {},
    async () => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const project = safeReadFile(planningPath(cwd, 'PROJECT.md'));
        const requirements = safeReadFile(planningPath(cwd, 'REQUIREMENTS.md'));
        const state = safeReadFile(planningPath(cwd, 'STATE.md'));

        return mcpSuccess(
          { project, requirements, state },
          'Project overview loaded',
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );

  // ── mcp_get_phase_detail ────────────────────────────────────────────────────

  server.tool(
    'mcp_get_phase_detail',
    'Get detailed information about a specific phase including all its files (plans, summaries, context, research, verification).',
    {
      phase: z.string().describe('Phase number or name (e.g. "01", "1", "01A")'),
    },
    async ({ phase }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const phaseInfo = findPhaseInternal(cwd, phase);
        if (!phaseInfo) {
          return mcpError(`Phase ${phase} not found`, 'Phase not found');
        }

        // Read all files in the phase directory
        const files: Array<{ name: string; content: string | null }> = [];
        try {
          const entries = fs.readdirSync(phaseInfo.directory);
          for (const entry of entries) {
            const fullPath = path.join(phaseInfo.directory, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
              files.push({
                name: entry,
                content: safeReadFile(fullPath),
              });
            }
          }
        } catch {
          // Directory may not exist or be empty
        }

        return mcpSuccess(
          {
            phase_number: phaseInfo.phase_number,
            phase_name: phaseInfo.phase_name,
            directory: phaseInfo.directory,
            files,
          },
          `Phase ${phaseInfo.phase_number} detail: ${files.length} file(s)`,
        );
      } catch (e: unknown) {
        return mcpError('Failed: ' + (e as Error).message, 'Error occurred');
      }
    },
  );
}
