/**
 * Phase CRUD MCP Tools — Phase operations exposed as MCP tools
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
  comparePhaseNum,
  normalizePhaseName,
  getPhasePattern,
  getArchivedPhaseDirs,
  generateSlugInternal,
} from '../core/core.js';

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
    'List all phase directories, sorted correctly. Optionally include archived phases from milestones.',
    {
      include_archived: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include archived phases from completed milestones'),
    },
    async ({ include_archived }) => {
      try {
        const cwd = detectProjectRoot();
        if (!cwd) {
          return mcpError('No .planning/ directory found', 'Project not detected');
        }

        const phasesDir = path.join(cwd, '.planning', 'phases');
        if (!fs.existsSync(phasesDir)) {
          return mcpSuccess(
            { directories: [], count: 0 },
            'No phases directory found',
          );
        }

        const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
        let dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

        if (include_archived) {
          const archived = getArchivedPhaseDirs(cwd);
          for (const a of archived) {
            dirs.push(`${a.name} [${a.milestone}]`);
          }
        }

        dirs.sort((a, b) => comparePhaseNum(a, b));

        return mcpSuccess(
          { directories: dirs, count: dirs.length },
          `Found ${dirs.length} phase(s)`,
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

        const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
        if (!fs.existsSync(roadmapPath)) {
          return mcpError('ROADMAP.md not found', 'Missing ROADMAP.md');
        }

        const content = fs.readFileSync(roadmapPath, 'utf-8');
        const slug = generateSlugInternal(name);

        // Find the highest phase number
        const phasePattern = getPhasePattern();
        let maxPhase = 0;
        let m: RegExpExecArray | null;
        while ((m = phasePattern.exec(content)) !== null) {
          const num = parseInt(m[1], 10);
          if (num > maxPhase) maxPhase = num;
        }

        const newPhaseNum = maxPhase + 1;
        const paddedNum = String(newPhaseNum).padStart(2, '0');
        const dirName = `${paddedNum}-${slug}`;
        const dirPath = path.join(cwd, '.planning', 'phases', dirName);

        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

        // Scaffold template stub files
        const today = new Date().toISOString().split('T')[0];
        fs.writeFileSync(
          path.join(dirPath, `${paddedNum}-CONTEXT.md`),
          `# Phase ${newPhaseNum} Context: ${name}\n\n**Created:** ${today}\n**Phase goal:** [To be defined during /maxsim:discuss-phase]\n\n---\n\n_Context will be populated by /maxsim:discuss-phase_\n`,
        );
        fs.writeFileSync(
          path.join(dirPath, `${paddedNum}-RESEARCH.md`),
          `# Phase ${newPhaseNum}: ${name} - Research\n\n**Researched:** Not yet\n**Domain:** TBD\n**Confidence:** TBD\n\n---\n\n_Research will be populated by /maxsim:research-phase_\n`,
        );

        const phaseEntry = `\n### Phase ${newPhaseNum}: ${name}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${newPhaseNum} to break down)\n`;

        let updatedContent: string;
        const lastSeparator = content.lastIndexOf('\n---');
        if (lastSeparator > 0) {
          updatedContent =
            content.slice(0, lastSeparator) +
            phaseEntry +
            content.slice(lastSeparator);
        } else {
          updatedContent = content + phaseEntry;
        }

        fs.writeFileSync(roadmapPath, updatedContent, 'utf-8');

        return mcpSuccess(
          {
            phase_number: newPhaseNum,
            padded: paddedNum,
            name,
            slug,
            directory: `.planning/phases/${dirName}`,
          },
          `Created Phase ${newPhaseNum}: ${name}`,
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

        const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
        if (!fs.existsSync(roadmapPath)) {
          return mcpError('ROADMAP.md not found', 'Missing ROADMAP.md');
        }

        const content = fs.readFileSync(roadmapPath, 'utf-8');
        const slug = generateSlugInternal(name);

        const normalizedAfter = normalizePhaseName(after);
        const unpadded = normalizedAfter.replace(/^0+/, '');
        const afterPhaseEscaped = '0*' + unpadded.replace(/\./g, '\\.');
        const targetPattern = getPhasePattern(afterPhaseEscaped, 'i');

        if (!targetPattern.test(content)) {
          return mcpError(
            `Phase ${after} not found in ROADMAP.md`,
            'Phase not found',
          );
        }

        // Find existing decimal phases
        const phasesDir = path.join(cwd, '.planning', 'phases');
        const normalizedBase = normalizePhaseName(after);
        const existingDecimals: number[] = [];

        try {
          const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
          const dirs = entries
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
          const decimalPattern = new RegExp(
            `^${normalizedBase}\\.(\\d+)`,
          );
          for (const dir of dirs) {
            const dm = dir.match(decimalPattern);
            if (dm) existingDecimals.push(parseInt(dm[1], 10));
          }
        } catch {
          // Optional — phases dir may not exist
        }

        const nextDecimal =
          existingDecimals.length === 0
            ? 1
            : Math.max(...existingDecimals) + 1;
        const decimalPhase = `${normalizedBase}.${nextDecimal}`;
        const dirName = `${decimalPhase}-${slug}`;
        const dirPath = path.join(cwd, '.planning', 'phases', dirName);

        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

        // Scaffold template stub files
        const today = new Date().toISOString().split('T')[0];
        fs.writeFileSync(
          path.join(dirPath, `${decimalPhase}-CONTEXT.md`),
          `# Phase ${decimalPhase} Context: ${name}\n\n**Created:** ${today}\n**Phase goal:** [To be defined during /maxsim:discuss-phase]\n\n---\n\n_Context will be populated by /maxsim:discuss-phase_\n`,
        );
        fs.writeFileSync(
          path.join(dirPath, `${decimalPhase}-RESEARCH.md`),
          `# Phase ${decimalPhase}: ${name} - Research\n\n**Researched:** Not yet\n**Domain:** TBD\n**Confidence:** TBD\n\n---\n\n_Research will be populated by /maxsim:research-phase_\n`,
        );

        const phaseEntry = `\n### Phase ${decimalPhase}: ${name} (INSERTED)\n\n**Goal:** [Urgent work - to be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${after}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${decimalPhase} to break down)\n`;

        // Find the after-phase header and insert after its section
        const headerPattern = new RegExp(
          `(#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:[^\\n]*\\n)`,
          'i',
        );
        const headerMatch = content.match(headerPattern);
        if (!headerMatch) {
          return mcpError(
            `Could not find Phase ${after} header in ROADMAP.md`,
            'Phase header not found',
          );
        }

        const headerIdx = content.indexOf(headerMatch[0]);
        const afterHeader = content.slice(
          headerIdx + headerMatch[0].length,
        );
        const nextPhaseMatch = afterHeader.match(
          /\n#{2,4}\s+Phase\s+\d/i,
        );

        let insertIdx: number;
        if (nextPhaseMatch) {
          insertIdx =
            headerIdx + headerMatch[0].length + nextPhaseMatch.index!;
        } else {
          insertIdx = content.length;
        }

        const updatedContent =
          content.slice(0, insertIdx) +
          phaseEntry +
          content.slice(insertIdx);
        fs.writeFileSync(roadmapPath, updatedContent, 'utf-8');

        return mcpSuccess(
          {
            phase_number: decimalPhase,
            after_phase: after,
            name,
            slug,
            directory: `.planning/phases/${dirName}`,
          },
          `Inserted Phase ${decimalPhase}: ${name} after Phase ${after}`,
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

        const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
        const statePath = path.join(cwd, '.planning', 'STATE.md');
        const phasesDir = path.join(cwd, '.planning', 'phases');
        const normalized = normalizePhaseName(phase);
        const today = new Date().toISOString().split('T')[0];

        const phaseInfo = findPhaseInternal(cwd, phase);
        if (!phaseInfo) {
          return mcpError(`Phase ${phase} not found`, 'Phase not found');
        }

        const planCount = phaseInfo.plans.length;
        const summaryCount = phaseInfo.summaries.length;

        // Update ROADMAP.md
        if (fs.existsSync(roadmapPath)) {
          let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

          // Check off the phase checkbox
          const checkboxPattern = new RegExp(
            `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phase.replace('.', '\\.')}[:\\s][^\\n]*)`,
            'i',
          );
          roadmapContent = roadmapContent.replace(
            checkboxPattern,
            `$1x$2 (completed ${today})`,
          );

          // Update progress table
          const phaseEscaped = phase.replace('.', '\\.');
          const tablePattern = new RegExp(
            `(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|[^|]*\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`,
            'i',
          );
          roadmapContent = roadmapContent.replace(
            tablePattern,
            `$1 Complete    $2 ${today} $3`,
          );

          // Update plan count
          const planCountPattern = new RegExp(
            `(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`,
            'i',
          );
          roadmapContent = roadmapContent.replace(
            planCountPattern,
            `$1${summaryCount}/${planCount} plans complete`,
          );

          fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

          // Update REQUIREMENTS.md
          const reqPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');
          if (fs.existsSync(reqPath)) {
            const reqMatch = roadmapContent.match(
              new RegExp(
                `Phase\\s+${phase.replace('.', '\\.')}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`,
                'i',
              ),
            );

            if (reqMatch) {
              const reqIds = reqMatch[1]
                .replace(/[\[\]]/g, '')
                .split(/[,\s]+/)
                .map((r) => r.trim())
                .filter(Boolean);
              let reqContent = fs.readFileSync(reqPath, 'utf-8');

              for (const reqId of reqIds) {
                reqContent = reqContent.replace(
                  new RegExp(
                    `(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`,
                    'gi',
                  ),
                  '$1x$2',
                );
                reqContent = reqContent.replace(
                  new RegExp(
                    `(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`,
                    'gi',
                  ),
                  '$1 Complete $2',
                );
              }

              fs.writeFileSync(reqPath, reqContent, 'utf-8');
            }
          }
        }

        // Find next phase
        let nextPhaseNum: string | null = null;
        let nextPhaseName: string | null = null;
        let isLastPhase = true;

        try {
          const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
          const dirs = entries
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort((a, b) => comparePhaseNum(a, b));

          for (const dir of dirs) {
            const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
            if (dm) {
              if (comparePhaseNum(dm[1], phase) > 0) {
                nextPhaseNum = dm[1];
                nextPhaseName = dm[2] || null;
                isLastPhase = false;
                break;
              }
            }
          }
        } catch {
          // Optional — phases dir scan failure is non-fatal
        }

        // Update STATE.md
        if (fs.existsSync(statePath)) {
          let stateContent = fs.readFileSync(statePath, 'utf-8');

          stateContent = stateContent.replace(
            /(\*\*Current Phase:\*\*\s*).*/,
            `$1${nextPhaseNum || phase}`,
          );

          if (nextPhaseName) {
            stateContent = stateContent.replace(
              /(\*\*Current Phase Name:\*\*\s*).*/,
              `$1${nextPhaseName.replace(/-/g, ' ')}`,
            );
          }

          stateContent = stateContent.replace(
            /(\*\*Status:\*\*\s*).*/,
            `$1${isLastPhase ? 'Milestone complete' : 'Ready to plan'}`,
          );

          stateContent = stateContent.replace(
            /(\*\*Current Plan:\*\*\s*).*/,
            '$1Not started',
          );

          stateContent = stateContent.replace(
            /(\*\*Last Activity:\*\*\s*).*/,
            `$1${today}`,
          );

          stateContent = stateContent.replace(
            /(\*\*Last Activity Description:\*\*\s*).*/,
            `$1Phase ${phase} complete${nextPhaseNum ? `, transitioned to Phase ${nextPhaseNum}` : ''}`,
          );

          fs.writeFileSync(statePath, stateContent, 'utf-8');
        }

        return mcpSuccess(
          {
            completed_phase: phase,
            phase_name: phaseInfo.phase_name,
            plans_executed: `${summaryCount}/${planCount}`,
            next_phase: nextPhaseNum,
            next_phase_name: nextPhaseName,
            is_last_phase: isLastPhase,
            date: today,
            roadmap_updated: fs.existsSync(roadmapPath),
            state_updated: fs.existsSync(statePath),
          },
          `Phase ${phase} marked as complete${nextPhaseNum ? `, next: Phase ${nextPhaseNum}` : ''}`,
        );
      } catch (e) {
        return mcpError((e as Error).message, 'Operation failed');
      }
    },
  );
}
