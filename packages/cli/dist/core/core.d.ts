/**
 * Core — Shared utilities, constants, and internal helpers
 *
 * Ported from maxsim/bin/lib/core.cjs
 */
import type { ModelProfiles, ModelResolution, AgentType, PhaseSearchResult, RoadmapPhaseInfo, ArchivedPhaseDir, GitResult, MilestoneInfo, AppConfig } from './types.js';
export declare const MODEL_PROFILES: ModelProfiles;
/** Thrown by output() to signal successful command completion. */
export declare class CliOutput {
    readonly result: unknown;
    readonly raw: boolean;
    readonly rawValue: unknown;
    constructor(result: unknown, raw?: boolean, rawValue?: unknown);
}
/** Thrown by error() to signal a command error. */
export declare class CliError {
    readonly message: string;
    constructor(message: string);
}
export declare function output(result: unknown, raw?: boolean, rawValue?: unknown): never;
export declare function error(message: string): never;
/** Re-throw CliOutput/CliError signals so catch blocks don't intercept them */
export declare function rethrowCliSignals(e: unknown): void;
/**
 * Handle a CliOutput by writing to stdout. Extracted so cli.ts can use it.
 */
export declare function writeOutput(out: CliOutput): void;
/** Today's date as YYYY-MM-DD. */
export declare function todayISO(): string;
/** Canonical .planning/ sub-paths. */
export declare function planningPath(cwd: string, ...segments: string[]): string;
export declare function statePath(cwd: string): string;
export declare function roadmapPath(cwd: string): string;
export declare function configPath(cwd: string): string;
export declare function phasesPath(cwd: string): string;
/** Phase-file predicates. */
export declare const isPlanFile: (f: string) => boolean;
export declare const isSummaryFile: (f: string) => boolean;
/** Strip suffix to get plan/summary ID. */
export declare const planId: (f: string) => string;
export declare const summaryId: (f: string) => string;
/** List subdirectory names, optionally sorted by phase number. */
export declare function listSubDirs(dir: string, sortByPhase?: boolean): string[];
/** Async version of listSubDirs using fs.promises. */
export declare function listSubDirsAsync(dir: string, sortByPhase?: boolean): Promise<string[]>;
/** Async version of safeReadFile using fs.promises. */
export declare function safeReadFileAsync(filePath: string): Promise<string | null>;
/** Extract a human-readable message from an unknown thrown value. */
export declare function errorMsg(e: unknown): string;
/** Log only when MAXSIM_DEBUG is set. Accepts an optional context label. */
export declare function debugLog(contextOrError: unknown, error?: unknown): void;
/** Escape a phase number for use in regex. */
export declare function escapePhaseNum(phase: string | number): string;
export declare function safeReadFile(filePath: string): string | null;
export declare function loadConfig(cwd: string): AppConfig;
export declare function isGitIgnored(cwd: string, targetPath: string): Promise<boolean>;
export declare function execGit(cwd: string, args: string[]): Promise<GitResult>;
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
export declare function resolveModelInternal(cwd: string, agentType: AgentType, config?: AppConfig): ModelResolution;
export declare function pathExistsInternal(cwd: string, targetPath: string): boolean;
export declare function generateSlugInternal(text: string | null | undefined): string | null;
export declare function getMilestoneInfo(cwd: string): MilestoneInfo;
//# sourceMappingURL=core.d.ts.map