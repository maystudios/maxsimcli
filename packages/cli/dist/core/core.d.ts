/**
 * Core — Shared utilities, constants, and internal helpers
 *
 * Ported from maxsim/bin/lib/core.cjs
 */
import type { ModelProfiles, ModelResolution, AgentType, PhaseSearchResult, RoadmapPhaseInfo, ArchivedPhaseDir, GitResult, MilestoneInfo, AppConfig } from './types.js';
export declare const MODEL_PROFILES: ModelProfiles;
export declare function output(result: unknown, raw?: boolean, rawValue?: unknown): never;
export declare function error(message: string): never;
export declare function safeReadFile(filePath: string): string | null;
export declare function loadConfig(cwd: string): AppConfig;
export declare function isGitIgnored(cwd: string, targetPath: string): boolean;
export declare function execGit(cwd: string, args: string[]): GitResult;
export declare function normalizePhaseName(phase: string): string;
export declare function comparePhaseNum(a: string | number, b: string | number): number;
/**
 * Returns the canonical regex for matching Phase heading lines in ROADMAP.md.
 *
 * General form (no escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase number string (e.g. "03", "3A", "2.1")
 *   Group 2: phase name string (e.g. "Name Here")
 *
 * Specific form (with escapedPhaseNum):
 *   Matches: ## Phase 03: Name Here
 *   Group 1: phase name string only
 *
 * @param escapedPhaseNum - regex-escaped phase number string to match a specific phase
 * @param flags - regex flags (default: 'gi')
 */
export declare function getPhasePattern(escapedPhaseNum?: string, flags?: string): RegExp;
export declare function findPhaseInternal(cwd: string, phase: string): PhaseSearchResult | null;
export declare function getArchivedPhaseDirs(cwd: string): ArchivedPhaseDir[];
export declare function getRoadmapPhaseInternal(cwd: string, phaseNum: string | number): RoadmapPhaseInfo | null;
export declare function resolveModelInternal(cwd: string, agentType: AgentType): ModelResolution;
export declare function pathExistsInternal(cwd: string, targetPath: string): boolean;
export declare function generateSlugInternal(text: string | null | undefined): string | null;
export declare function getMilestoneInfo(cwd: string): MilestoneInfo;
//# sourceMappingURL=core.d.ts.map