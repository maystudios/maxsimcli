/**
 * Skill Context — Provides MAXSIM state to skills via a single CLI call
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  loadConfig,
  findPhaseInternal,
  pathExistsInternal,
  safeReadFile,
  output,
  statePath,
  isPlanFile,
  isSummaryFile,
} from './core.js';

import { stateExtractField } from './state.js';
import type { AppConfig, PhaseSearchResult } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SkillContextResult {
  skill_name: string;
  planning_dir: string | null;
  phase: {
    number: string | null;
    name: string | null;
    directory: string | null;
  };
  state: {
    current_focus: string | null;
    position: string | null;
    status: string | null;
  };
  blockers: string[];
  decisions: Array<{ phase: string; summary: string; rationale: string }>;
  artifacts: {
    plan: string | null;
    summary: string | null;
    research: string | null;
    context: string | null;
    verification: string | null;
  };
  config: {
    model_profile: string;
    commit_docs: boolean;
    branching_strategy: string;
  };
}

// ─── Command ─────────────────────────────────────────────────────────────────

export function cmdSkillContext(cwd: string, skillName: string, raw: boolean): void {
  const planningExists = pathExistsInternal(cwd, '.planning');

  if (!planningExists) {
    const result: SkillContextResult = {
      skill_name: skillName,
      planning_dir: null,
      phase: { number: null, name: null, directory: null },
      state: { current_focus: null, position: null, status: null },
      blockers: [],
      decisions: [],
      artifacts: { plan: null, summary: null, research: null, context: null, verification: null },
      config: { model_profile: 'balanced', commit_docs: true, branching_strategy: 'none' },
    };
    output(result, raw);
    return;
  }

  // Load config
  const config: AppConfig = loadConfig(cwd);

  // Read STATE.md
  const stateContent = safeReadFile(statePath(cwd));
  let currentPhase: string | null = null;
  let currentPhaseName: string | null = null;
  let currentPlan: string | null = null;
  let status: string | null = null;
  const blockers: string[] = [];
  const decisions: Array<{ phase: string; summary: string; rationale: string }> = [];

  if (stateContent) {
    currentPhase = stateExtractField(stateContent, 'Current Phase');
    currentPhaseName = stateExtractField(stateContent, 'Current Phase Name');
    currentPlan = stateExtractField(stateContent, 'Current Plan');
    status = stateExtractField(stateContent, 'Status');

    // Extract blockers
    const blockersMatch = stateContent.match(/##\s*Blockers\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (blockersMatch) {
      const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
      for (const item of items) {
        blockers.push(item.replace(/^-\s+/, '').trim());
      }
    }

    // Extract decisions
    const decisionsMatch = stateContent.match(/##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i);
    if (decisionsMatch) {
      const rows = decisionsMatch[1].trim().split('\n').filter(r => r.includes('|'));
      for (const row of rows) {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 3) {
          decisions.push({ phase: cells[0], summary: cells[1], rationale: cells[2] });
        }
      }
    }
  }

  // Find phase directory and artifacts
  const phaseInfo: PhaseSearchResult | null = currentPhase
    ? findPhaseInternal(cwd, currentPhase)
    : null;

  const phaseDir = phaseInfo?.directory ?? null;
  const phaseNumber = phaseInfo?.phase_number ?? currentPhase;
  const phaseName = phaseInfo?.phase_name ?? currentPhaseName;

  // Resolve artifact paths within the phase directory
  const artifacts: SkillContextResult['artifacts'] = {
    plan: null,
    summary: null,
    research: null,
    context: null,
    verification: null,
  };

  if (phaseDir) {
    const absPhaseDir = path.isAbsolute(phaseDir) ? phaseDir : path.join(cwd, phaseDir);
    try {
      const files = fs.readdirSync(absPhaseDir);
      for (const f of files) {
        if (isPlanFile(f)) {
          artifacts.plan = path.join(phaseDir, f);
        } else if (isSummaryFile(f)) {
          artifacts.summary = path.join(phaseDir, f);
        } else if (f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md') {
          artifacts.research = path.join(phaseDir, f);
        } else if (f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md') {
          artifacts.context = path.join(phaseDir, f);
        } else if (f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md') {
          artifacts.verification = path.join(phaseDir, f);
        }
      }
    } catch {
      // Phase directory unreadable — leave artifacts as null
    }
  }

  // Build position string
  const totalPlans = stateContent ? stateExtractField(stateContent, 'Total Plans in Phase') : null;
  const position = currentPlan && totalPlans
    ? `Plan ${currentPlan} of ${totalPlans}`
    : currentPlan
      ? `Plan ${currentPlan}`
      : null;

  const result: SkillContextResult = {
    skill_name: skillName,
    planning_dir: '.planning',
    phase: {
      number: phaseNumber ?? null,
      name: phaseName ?? null,
      directory: phaseDir,
    },
    state: {
      current_focus: currentPhaseName ?? null,
      position,
      status,
    },
    blockers,
    decisions,
    artifacts,
    config: {
      model_profile: config.model_profile,
      commit_docs: config.commit_docs,
      branching_strategy: config.branching_strategy,
    },
  };

  output(result, raw);
}
