/**
 * Phase CRUD MCP Tools — Phase operations exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */

import fs from 'node:fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  findPhaseInternal,
  comparePhaseNum,
  getArchivedPhaseDirs,
  phasesPath,
  listSubDirs,
} from '../core/core.js';

import {
  phaseAddCore,
  phaseInsertCore,
  phaseCompleteCore,
} from '../core/phase.js';

import { detectProjectRoot, mcpSuccess, mcpError } from './utils.js';

/**
 * Register all phase CRUD tools on the MCP server.
 */
export function registerPhaseTools(server: McpServer): void {
  // ── mcp_find_phase ──────────────────────────────────────────────────────────

  server.tool(
    'mcp_find_phase',
    'Find a phase directory by number or name. Returns phase details including plans, summaries, and status.',
    {
      phase: z.string().describe('Phase number or name (e.g. "01", "1", "01A", "1.1")'),
    },
    async ({ phase }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = findPhaseInternal(cwd, phase);
        if (!result) {
          return mcpError(`Phase ${phase} not found`, 'Phase not found');
        }

        return mcpSuccess(
          {
            found: result.found,
            directory: result.directory,
            phase_number: result.phase_number,
            phase_name: result.phase_name,
            phase_slug: result.phase_slug,
            plans: result.plans,
            summaries: result.summaries,
            incomplete_plans: result.incomplete_plans,
            has_research: result.has_research,
            has_context: result.has_context,
            has_verification: result.has_verification,
            archived: result.archived ?? null,
          },
          `Found phase ${result.phase_number}: ${result.phase_name ?? 'unnamed'}`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );

  // ── mcp_list_phases ─────────────────────────────────────────────────────────

  server.tool(
    'mcp_list_phases',
    'List phase directories with pagination. Returns sorted phases with offset/limit support.',
    {
      include_archived: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include archived phases from completed milestones'),
      offset: z
        .number()
        .optional()
        .default(0)
        .describe('Number of phases to skip (for pagination)'),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Maximum number of phases to return'),
    },
    async ({ include_archived, offset, limit }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const phasesDir = phasesPath(cwd);
        if (!fs.existsSync(phasesDir)) {
          return mcpSuccess(
            { directories: [], count: 0, total_count: 0, offset, limit, has_more: false },
            'No phases directory found',
          );
        }

        let dirs = listSubDirs(phasesDir);

        if (include_archived) {
          const archived = getArchivedPhaseDirs(cwd);
          for (const a of archived) {
            dirs.push(`${a.name} [${a.milestone}]`);
          }
        }

        dirs.sort((a, b) => comparePhaseNum(a, b));

        const total_count = dirs.length;
        const paginated = dirs.slice(offset, offset + limit);
        const has_more = offset + limit < total_count;

        return mcpSuccess(
          { directories: paginated, count: paginated.length, total_count, offset, limit, has_more },
          `Showing ${paginated.length} of ${total_count} phase(s)`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );

  // ── mcp_create_phase ────────────────────────────────────────────────────────

  server.tool(
    'mcp_create_phase',
    'Create a new phase. Adds the next sequential phase directory and appends to ROADMAP.md.',
    {
      name: z.string().describe('Phase description/name (e.g. "Authentication System")'),
    },
    async ({ name }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        if (!name || !name.trim()) {
          return mcpError('Phase name must not be empty', 'Validation failed');
        }

        const result = await phaseAddCore(cwd, name, { includeStubs: true });

        return mcpSuccess(
          {
            phase_number: result.phase_number,
            padded: result.padded,
            name: result.description,
            slug: result.slug,
            directory: result.directory,
          },
          `Created Phase ${result.phase_number}: ${result.description}`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );

  // ── mcp_insert_phase ────────────────────────────────────────────────────────

  server.tool(
    'mcp_insert_phase',
    'Insert a decimal phase after a specified phase (e.g. 01.1 after 01). Creates directory and updates ROADMAP.md.',
    {
      name: z.string().describe('Phase description/name'),
      after: z.string().describe('Phase number to insert after (e.g. "01", "1")'),
    },
    async ({ name, after }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        if (!name || !name.trim()) {
          return mcpError('Phase name must not be empty', 'Validation failed');
        }

        const result = await phaseInsertCore(cwd, after, name, { includeStubs: true });

        return mcpSuccess(
          {
            phase_number: result.phase_number,
            after_phase: result.after_phase,
            name: result.description,
            slug: result.slug,
            directory: result.directory,
          },
          `Inserted Phase ${result.phase_number}: ${result.description} after Phase ${result.after_phase}`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );

  // ── mcp_complete_phase ──────────────────────────────────────────────────────

  server.tool(
    'mcp_complete_phase',
    'Mark a phase as complete. Updates ROADMAP.md checkbox, progress table, plan count, STATE.md, and REQUIREMENTS.md.',
    {
      phase: z.string().describe('Phase number to complete (e.g. "01", "1", "1.1")'),
    },
    async ({ phase }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const result = await phaseCompleteCore(cwd, phase);

        return mcpSuccess(
          {
            completed_phase: result.completed_phase,
            phase_name: result.phase_name,
            plans_executed: result.plans_executed,
            next_phase: result.next_phase,
            next_phase_name: result.next_phase_name,
            is_last_phase: result.is_last_phase,
            date: result.date,
            roadmap_updated: result.roadmap_updated,
            state_updated: result.state_updated,
          },
          `Phase ${phase} marked as complete${result.next_phase ? `, next: Phase ${result.next_phase}` : ''}`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );
}
