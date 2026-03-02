/**
 * @maxsim/core — Shared type definitions
 */
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & {
    readonly [__brand]: B;
};
export type PhaseNumber = Brand<string, 'PhaseNumber'>;
export type PhasePath = Brand<string, 'PhasePath'>;
export type PhaseSlug = Brand<string, 'PhaseSlug'>;
export declare function phaseNumber(value: string): PhaseNumber;
export declare function phasePath(value: string): PhasePath;
export declare function phaseSlug(value: string): PhaseSlug;
export type Result<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare function ok<T>(data: T): Result<T>;
export declare function err<T = never>(error: string): Result<T>;
export type BranchingStrategy = 'none' | 'phase' | 'milestone';
export type ModelTier = 'opus' | 'sonnet' | 'haiku';
export type ModelProfileName = 'quality' | 'balanced' | 'budget' | 'tokenburner';
export type ModelResolution = 'inherit' | ModelTier;
export interface ModelProfileEntry {
    quality: ModelTier;
    balanced: ModelTier;
    budget: ModelTier;
    tokenburner: ModelTier;
}
export type AgentType = 'maxsim-planner' | 'maxsim-roadmapper' | 'maxsim-executor' | 'maxsim-phase-researcher' | 'maxsim-project-researcher' | 'maxsim-research-synthesizer' | 'maxsim-debugger' | 'maxsim-codebase-mapper' | 'maxsim-verifier' | 'maxsim-plan-checker' | 'maxsim-integration-checker';
export type ModelProfiles = Record<AgentType, ModelProfileEntry>;
export interface PhaseSearchResult {
    found: true;
    directory: string;
    phase_number: string;
    phase_name: string | null;
    phase_slug: string | null;
    plans: string[];
    summaries: string[];
    incomplete_plans: string[];
    has_research: boolean;
    has_context: boolean;
    has_verification: boolean;
    archived?: string;
}
export interface RoadmapPhaseInfo {
    found: true;
    phase_number: string;
    phase_name: string;
    goal: string | null;
    section: string;
}
export interface ArchivedPhaseDir {
    name: string;
    milestone: string;
    basePath: string;
    fullPath: string;
}
export interface GitResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
export interface MilestoneInfo {
    version: string;
    name: string;
}
export interface AppConfig {
    model_profile: ModelProfileName;
    commit_docs: boolean;
    search_gitignored: boolean;
    branching_strategy: BranchingStrategy;
    phase_branch_template: string;
    milestone_branch_template: string;
    research: boolean;
    plan_checker: boolean;
    verifier: boolean;
    parallelization: boolean;
    brave_search: boolean;
    model_overrides?: Partial<Record<AgentType, ModelTier>>;
}
export type FrontmatterData = Record<string, FrontmatterValue>;
export type FrontmatterValue = string | number | boolean | null | FrontmatterValue[] | {
    [key: string]: FrontmatterValue;
};
export interface FrontmatterParseResult {
    frontmatter: FrontmatterData;
    body: string;
    hasFrontmatter: boolean;
}
export interface FrontmatterValidationResult {
    valid: boolean;
    missing: string[];
    present: string[];
    schema: string;
}
export interface FrontmatterSchema {
    required: string[];
}
export interface PlanningConfig {
    model_profile: ModelProfileName;
    commit_docs: boolean;
    search_gitignored: boolean;
    branching_strategy: BranchingStrategy;
    phase_branch_template: string;
    milestone_branch_template: string;
    workflow: WorkflowConfig;
    parallelization: boolean;
    brave_search: boolean;
    [key: string]: unknown;
}
export interface WorkflowConfig {
    research: boolean;
    plan_checker: boolean;
    verifier: boolean;
    [key: string]: boolean;
}
export declare const PLANNING_CONFIG_DEFAULTS: PlanningConfig;
export interface StateSection {
    header: string;
    body: string;
}
export interface Decision {
    phase: string;
    summary: string;
    rationale: string;
}
export interface Blocker {
    text: string;
    resolved: boolean;
}
export interface PerformanceMetric {
    phase: string;
    plan: string;
    duration: string;
    tasks: string;
    files: string;
}
export interface StateData {
    content: string;
    fields: Record<string, string>;
    decisions: Decision[];
    blockers: Blocker[];
    metrics: PerformanceMetric[];
}
export interface StatePatchResult {
    updated: string[];
    failed: string[];
}
export interface StateSessionOptions {
    stopped_at?: string;
    resume_file?: string;
}
export interface StateMetricOptions {
    phase: string;
    plan: string;
    duration: string;
    tasks?: string;
    files?: string;
}
export interface StateDecisionOptions {
    phase?: string;
    summary?: string;
    summary_file?: string;
    rationale?: string;
    rationale_file?: string;
}
export interface StateBlockerOptions {
    text?: string;
    text_file?: string;
}
export interface StateSnapshot {
    current_phase: string | null;
    current_phase_name: string | null;
    total_phases: number | null;
    current_plan: string | null;
    total_plans_in_phase: number | null;
    status: string | null;
    progress_percent: number | null;
    last_activity: string | null;
    last_activity_desc: string | null;
    decisions: Decision[];
    blockers: string[];
    paused_at: string | null;
    session: {
        last_date: string | null;
        stopped_at: string | null;
        resume_file: string | null;
    };
}
export type PhaseStatus = 'no_directory' | 'empty' | 'discussed' | 'researched' | 'planned' | 'partial' | 'complete';
export interface RoadmapPhase {
    number: string;
    name: string;
    goal: string | null;
    depends_on: string | null;
    plan_count: number;
    summary_count: number;
    has_context: boolean;
    has_research: boolean;
    disk_status: PhaseStatus;
    roadmap_complete: boolean;
}
export interface RoadmapMilestone {
    heading: string;
    version: string;
}
export interface RoadmapAnalysis {
    milestones: RoadmapMilestone[];
    phases: RoadmapPhase[];
    phase_count: number;
    completed_phases: number;
    total_plans: number;
    total_summaries: number;
    progress_percent: number;
    current_phase: string | null;
    next_phase: string | null;
    missing_phase_details: string[] | null;
}
export interface RoadmapPhaseDetail {
    found: true;
    phase_number: string;
    phase_name: string;
    goal: string | null;
    success_criteria: string[];
    section: string;
}
export interface RoadmapPhaseNotFound {
    found: false;
    phase_number: string;
    phase_name?: string;
    error?: string;
    message?: string;
}
export type RoadmapGetPhaseResult = RoadmapPhaseDetail | RoadmapPhaseNotFound;
export interface MilestoneCompleteOptions {
    name?: string;
    archivePhases?: boolean;
}
export interface MilestoneResult {
    version: string;
    name: string;
    date: string;
    phases: number;
    plans: number;
    tasks: number;
    accomplishments: string[];
    archived: {
        roadmap: boolean;
        requirements: boolean;
        audit: boolean;
        phases: boolean;
    };
    milestones_updated: boolean;
    state_updated: boolean;
}
export interface ArchiveResult {
    updated: boolean;
    marked_complete: string[];
    not_found: string[];
    total: number;
}
export interface TodoItem {
    file: string;
    created: string;
    title: string;
    area: string;
    path: string;
}
export interface HistoryPhaseDigest {
    name: string;
    provides: string[];
    affects: string[];
    patterns: string[];
}
export interface HistoryDigest {
    phases: Record<string, HistoryPhaseDigest>;
    decisions: Array<{
        phase: string;
        decision: string;
    }>;
    tech_stack: string[];
}
export interface SlugResult {
    slug: string;
}
export interface WebSearchOptions {
    limit?: number;
    freshness?: string | null;
}
export interface WebSearchResult {
    title: string;
    url: string;
    description: string;
    age: string | null;
}
export interface ScaffoldOptions {
    phase: string | null;
    name: string | null;
}
export type TimestampFormat = 'full' | 'date' | 'filename';
export interface PhaseAddResult {
    phase_number: number;
    padded: string;
    name: string;
    slug: string | null;
    directory: string;
}
export interface PhaseInsertResult {
    phase_number: string;
    after_phase: string;
    name: string;
    slug: string | null;
    directory: string;
}
export interface PhaseRemoveResult {
    removed: string;
    directory_deleted: string | null;
    renamed_directories: Array<{
        from: string;
        to: string;
    }>;
    renamed_files: Array<{
        from: string;
        to: string;
    }>;
    roadmap_updated: boolean;
    state_updated: boolean;
}
export interface PhaseCompleteResult {
    completed_phase: string;
    phase_name: string | null;
    plans_executed: string;
    next_phase: string | null;
    next_phase_name: string | null;
    is_last_phase: boolean;
    date: string;
    roadmap_updated: boolean;
    state_updated: boolean;
}
export interface PhasePlanIndexResult {
    phase: string;
    plans: Array<{
        id: string;
        wave: number;
        autonomous: boolean;
        objective: string | null;
        files_modified: string[];
        task_count: number;
        has_summary: boolean;
    }>;
    waves: Record<string, string[]>;
    incomplete: string[];
    has_checkpoints: boolean;
}
export interface PhasesListOptions {
    type: string | null;
    phase: string | null;
    includeArchived: boolean;
    offset?: number;
    limit?: number;
}
export type CmdResult = {
    ok: true;
    result: unknown;
    rawValue?: unknown;
} | {
    ok: false;
    error: string;
};
export declare function cmdOk(result: unknown, rawValue?: unknown): CmdResult;
export declare function cmdErr(error: string): CmdResult;
export type RuntimeName = 'claude';
export interface AdapterConfig {
    runtime: RuntimeName;
    dirName: string;
    getGlobalDir(explicitDir?: string | null): string;
    getConfigDirFromHome(isGlobal: boolean): string;
    transformContent(content: string, pathPrefix: string): string;
    commandStructure: 'nested';
}
export {};
//# sourceMappingURL=types.d.ts.map