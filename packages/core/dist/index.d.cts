//#region src/types.d.ts
/**
 * @maxsim/core — Shared type definitions
 */
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & {
  readonly [__brand]: B;
};
type PhaseNumber = Brand<string, 'PhaseNumber'>;
type PhasePath = Brand<string, 'PhasePath'>;
type PhaseSlug = Brand<string, 'PhaseSlug'>;
declare function phaseNumber(value: string): PhaseNumber;
declare function phasePath(value: string): PhasePath;
declare function phaseSlug(value: string): PhaseSlug;
type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
declare function ok<T>(data: T): Result<T>;
declare function err<T = never>(error: string): Result<T>;
type ModelTier = 'opus' | 'sonnet' | 'haiku';
type ModelProfileName = 'quality' | 'balanced' | 'budget' | 'tokenburner';
type ModelResolution = 'inherit' | ModelTier;
interface ModelProfileEntry {
  quality: ModelTier;
  balanced: ModelTier;
  budget: ModelTier;
  tokenburner: ModelTier;
}
type AgentType = 'maxsim-planner' | 'maxsim-roadmapper' | 'maxsim-executor' | 'maxsim-phase-researcher' | 'maxsim-project-researcher' | 'maxsim-research-synthesizer' | 'maxsim-debugger' | 'maxsim-codebase-mapper' | 'maxsim-verifier' | 'maxsim-plan-checker' | 'maxsim-integration-checker';
type ModelProfiles = Record<AgentType, ModelProfileEntry>;
interface PhaseSearchResult {
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
interface RoadmapPhaseInfo {
  found: true;
  phase_number: string;
  phase_name: string;
  goal: string | null;
  section: string;
}
interface ArchivedPhaseDir {
  name: string;
  milestone: string;
  basePath: string;
  fullPath: string;
}
interface GitResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
interface MilestoneInfo {
  version: string;
  name: string;
}
interface AppConfig {
  model_profile: ModelProfileName;
  commit_docs: boolean;
  search_gitignored: boolean;
  branching_strategy: string;
  phase_branch_template: string;
  milestone_branch_template: string;
  research: boolean;
  plan_checker: boolean;
  verifier: boolean;
  parallelization: boolean;
  brave_search: boolean;
  model_overrides?: Partial<Record<AgentType, ModelTier>>;
}
type FrontmatterData = Record<string, FrontmatterValue>;
type FrontmatterValue = string | number | boolean | null | FrontmatterValue[] | {
  [key: string]: FrontmatterValue;
};
interface FrontmatterParseResult {
  frontmatter: FrontmatterData;
  body: string;
  hasFrontmatter: boolean;
}
interface FrontmatterValidationResult {
  valid: boolean;
  missing: string[];
  present: string[];
  schema: string;
}
interface FrontmatterSchema {
  required: string[];
}
interface PlanningConfig {
  model_profile: ModelProfileName;
  commit_docs: boolean;
  search_gitignored: boolean;
  branching_strategy: string;
  phase_branch_template: string;
  milestone_branch_template: string;
  workflow: WorkflowConfig;
  parallelization: boolean;
  brave_search: boolean;
  [key: string]: unknown;
}
interface WorkflowConfig {
  research: boolean;
  plan_check: boolean;
  verifier: boolean;
  nyquist_validation: boolean;
  [key: string]: boolean;
}
declare const PLANNING_CONFIG_DEFAULTS: PlanningConfig;
interface StateSection {
  header: string;
  body: string;
}
interface Decision {
  phase: string;
  summary: string;
  rationale: string;
}
interface Blocker {
  text: string;
  resolved: boolean;
}
interface PerformanceMetric {
  phase: string;
  plan: string;
  duration: string;
  tasks: string;
  files: string;
}
interface StateData {
  content: string;
  fields: Record<string, string>;
  decisions: Decision[];
  blockers: Blocker[];
  metrics: PerformanceMetric[];
}
interface StatePatchResult {
  updated: string[];
  failed: string[];
}
interface StateSessionOptions {
  stopped_at?: string;
  resume_file?: string;
}
interface StateMetricOptions {
  phase: string;
  plan: string;
  duration: string;
  tasks?: string;
  files?: string;
}
interface StateDecisionOptions {
  phase?: string;
  summary?: string;
  summary_file?: string;
  rationale?: string;
  rationale_file?: string;
}
interface StateBlockerOptions {
  text?: string;
  text_file?: string;
}
interface StateSnapshot {
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
type PhaseStatus = 'no_directory' | 'empty' | 'discussed' | 'researched' | 'planned' | 'partial' | 'complete';
interface RoadmapPhase {
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
interface RoadmapMilestone {
  heading: string;
  version: string;
}
interface RoadmapAnalysis {
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
interface RoadmapPhaseDetail {
  found: true;
  phase_number: string;
  phase_name: string;
  goal: string | null;
  success_criteria: string[];
  section: string;
}
interface RoadmapPhaseNotFound {
  found: false;
  phase_number: string;
  phase_name?: string;
  error?: string;
  message?: string;
}
type RoadmapGetPhaseResult = RoadmapPhaseDetail | RoadmapPhaseNotFound;
interface MilestoneCompleteOptions {
  name?: string;
  archivePhases?: boolean;
}
interface MilestoneResult {
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
interface ArchiveResult {
  updated: boolean;
  marked_complete: string[];
  not_found: string[];
  total: number;
}
interface TodoItem {
  file: string;
  created: string;
  title: string;
  area: string;
  path: string;
}
interface HistoryPhaseDigest {
  name: string;
  provides: string[];
  affects: string[];
  patterns: string[];
}
interface HistoryDigest {
  phases: Record<string, HistoryPhaseDigest>;
  decisions: Array<{
    phase: string;
    decision: string;
  }>;
  tech_stack: string[];
}
interface SlugResult {
  slug: string;
}
interface WebSearchOptions {
  limit?: number;
  freshness?: string | null;
}
interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  age: string | null;
}
interface ScaffoldOptions {
  phase: string | null;
  name: string | null;
}
type TimestampFormat = 'full' | 'date' | 'filename';
interface PhaseAddResult {
  phase_number: number;
  padded: string;
  name: string;
  slug: string | null;
  directory: string;
}
interface PhaseInsertResult {
  phase_number: string;
  after_phase: string;
  name: string;
  slug: string | null;
  directory: string;
}
interface PhaseRemoveResult {
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
interface PhaseCompleteResult {
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
interface PhasePlanIndexResult {
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
interface PhasesListOptions {
  type: string | null;
  phase: string | null;
  includeArchived: boolean;
}
type RuntimeName = 'claude' | 'opencode' | 'gemini' | 'codex';
interface AdapterConfig {
  runtime: RuntimeName;
  dirName: string;
  getGlobalDir(explicitDir?: string | null): string;
  getConfigDirFromHome(isGlobal: boolean): string;
  transformContent(content: string, pathPrefix: string): string;
  commandStructure: 'nested' | 'flat' | 'skills';
}
//#endregion
//#region src/core.d.ts
declare const MODEL_PROFILES: ModelProfiles;
declare function output(result: unknown, raw?: boolean, rawValue?: unknown): never;
declare function error(message: string): never;
declare function safeReadFile(filePath: string): string | null;
declare function loadConfig(cwd: string): AppConfig;
declare function isGitIgnored(cwd: string, targetPath: string): boolean;
declare function execGit(cwd: string, args: string[]): GitResult;
declare function normalizePhaseName(phase: string): string;
declare function comparePhaseNum(a: string | number, b: string | number): number;
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
declare function getPhasePattern(escapedPhaseNum?: string, flags?: string): RegExp;
declare function findPhaseInternal(cwd: string, phase: string): PhaseSearchResult | null;
declare function getArchivedPhaseDirs(cwd: string): ArchivedPhaseDir[];
declare function getRoadmapPhaseInternal(cwd: string, phaseNum: string | number): RoadmapPhaseInfo | null;
declare function resolveModelInternal(cwd: string, agentType: AgentType): ModelResolution;
declare function pathExistsInternal(cwd: string, targetPath: string): boolean;
declare function generateSlugInternal(text: string | null | undefined): string | null;
declare function getMilestoneInfo(cwd: string): MilestoneInfo;
//#endregion
//#region src/frontmatter.d.ts
/**
 * Extract YAML frontmatter from markdown content into a typed object.
 */
declare function extractFrontmatter(content: string): FrontmatterData;
/**
 * Reconstruct YAML frontmatter string from an object.
 */
declare function reconstructFrontmatter(obj: FrontmatterData): string;
/**
 * Replace or insert frontmatter in markdown content.
 */
declare function spliceFrontmatter(content: string, newObj: FrontmatterData): string;
interface MustHaveItem {
  [key: string]: string | number | string[];
}
/**
 * Parse a specific block from must_haves in raw frontmatter YAML.
 */
declare function parseMustHavesBlock(content: string, blockName: string): (string | MustHaveItem)[];
declare const FRONTMATTER_SCHEMAS: Record<string, FrontmatterSchema>;
declare function cmdFrontmatterGet(cwd: string, filePath: string | null, field: string | null, raw: boolean): void;
declare function cmdFrontmatterSet(cwd: string, filePath: string | null, field: string | null, value: string | undefined, raw: boolean): void;
declare function cmdFrontmatterMerge(cwd: string, filePath: string | null, data: string | null, raw: boolean): void;
declare function cmdFrontmatterValidate(cwd: string, filePath: string | null, schemaName: string | null, raw: boolean): void;
//#endregion
//#region src/config.d.ts
/**
 * Config — Planning config CRUD operations
 *
 * Ported from maxsim/bin/lib/config.cjs
 */
declare function cmdConfigEnsureSection(cwd: string, raw: boolean): void;
declare function cmdConfigSet(cwd: string, keyPath: string | undefined, value: string | undefined, raw: boolean): void;
declare function cmdConfigGet(cwd: string, keyPath: string | undefined, raw: boolean): void;
//#endregion
//#region src/state.d.ts
declare function stateExtractField(content: string, fieldName: string): string | null;
declare function stateReplaceField(content: string, fieldName: string, newValue: string): string | null;
declare function cmdStateLoad(cwd: string, raw: boolean): void;
declare function cmdStateGet(cwd: string, section: string | null, raw: boolean): void;
declare function cmdStatePatch(cwd: string, patches: Record<string, string>, raw: boolean): void;
declare function cmdStateUpdate(cwd: string, field: string | undefined, value: string | undefined): void;
declare function cmdStateAdvancePlan(cwd: string, raw: boolean): void;
declare function cmdStateRecordMetric(cwd: string, options: StateMetricOptions, raw: boolean): void;
declare function cmdStateUpdateProgress(cwd: string, raw: boolean): void;
declare function cmdStateAddDecision(cwd: string, options: StateDecisionOptions, raw: boolean): void;
declare function cmdStateAddBlocker(cwd: string, text: string | StateBlockerOptions, raw: boolean): void;
declare function cmdStateResolveBlocker(cwd: string, text: string | null, raw: boolean): void;
declare function cmdStateRecordSession(cwd: string, options: StateSessionOptions, raw: boolean): void;
declare function cmdStateSnapshot(cwd: string, raw: boolean): void;
//#endregion
//#region src/roadmap.d.ts
/**
 * Roadmap — Roadmap parsing and update operations
 *
 * Ported from maxsim/bin/lib/roadmap.cjs
 */
declare function cmdRoadmapGetPhase(cwd: string, phaseNum: string, raw: boolean): void;
declare function cmdRoadmapAnalyze(cwd: string, raw: boolean): void;
declare function cmdRoadmapUpdatePlanProgress(cwd: string, phaseNum: string, raw: boolean): void;
//#endregion
//#region src/milestone.d.ts
declare function cmdRequirementsMarkComplete(cwd: string, reqIdsRaw: string[], raw: boolean): void;
declare function cmdMilestoneComplete(cwd: string, version: string | undefined, options: MilestoneCompleteOptions, raw: boolean): void;
//#endregion
//#region src/commands.d.ts
declare function cmdGenerateSlug(text: string | undefined, raw: boolean): void;
declare function cmdCurrentTimestamp(format: TimestampFormat, raw: boolean): void;
declare function cmdListTodos(cwd: string, area: string | undefined, raw: boolean): void;
declare function cmdVerifyPathExists(cwd: string, targetPath: string | undefined, raw: boolean): void;
declare function cmdHistoryDigest(cwd: string, raw: boolean): void;
declare function cmdResolveModel(cwd: string, agentType: string | undefined, raw: boolean): void;
declare function cmdCommit(cwd: string, message: string | undefined, files: string[], raw: boolean, amend: boolean): void;
declare function cmdSummaryExtract(cwd: string, summaryPath: string | undefined, fields: string[] | null, raw: boolean): void;
declare function cmdWebsearch(query: string | undefined, options: WebSearchOptions, raw: boolean): Promise<void>;
declare function cmdProgressRender(cwd: string, format: string, raw: boolean): void;
declare function cmdTodoComplete(cwd: string, filename: string | undefined, raw: boolean): void;
declare function cmdScaffold(cwd: string, type: string | undefined, options: ScaffoldOptions, raw: boolean): void;
//#endregion
//#region src/verify.d.ts
/**
 * Verify — Verification suite, consistency, and health validation
 *
 * Ported from maxsim/bin/lib/verify.cjs
 */
interface ValidationError {
  code?: string;
  message: string;
  fix?: string;
  repairable?: boolean;
}
interface ValidationWarning {
  code?: string;
  message: string;
  fix?: string;
  repairable?: boolean;
}
interface TaskInfo {
  name: string;
  hasFiles: boolean;
  hasAction: boolean;
  hasVerify: boolean;
  hasDone: boolean;
}
interface VerificationResult {
  passed: boolean;
  checks: {
    summary_exists: boolean;
    files_created: {
      checked: number;
      found: number;
      missing: string[];
    };
    commits_exist: boolean;
    self_check: 'not_found' | 'passed' | 'failed';
  };
  errors: string[];
}
interface PlanStructureResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  task_count: number;
  tasks: TaskInfo[];
  frontmatter_fields: string[];
}
interface PhaseCompletenessResult {
  complete: boolean;
  phase: string;
  plan_count: number;
  summary_count: number;
  incomplete_plans: string[];
  orphan_summaries: string[];
  errors: string[];
  warnings: string[];
}
interface ReferencesResult {
  valid: boolean;
  found: number;
  missing: string[];
  total: number;
}
interface CommitsResult {
  all_valid: boolean;
  valid: string[];
  invalid: string[];
  total: number;
}
interface ArtifactCheck {
  path: string;
  exists: boolean;
  issues: string[];
  passed: boolean;
}
interface ArtifactsResult {
  all_passed: boolean;
  passed: number;
  total: number;
  artifacts: ArtifactCheck[];
}
interface KeyLinkCheck {
  from: string;
  to: string;
  via: string;
  verified: boolean;
  detail: string;
}
interface KeyLinksResult {
  all_verified: boolean;
  verified: number;
  total: number;
  links: KeyLinkCheck[];
}
interface ConsistencyResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  warning_count: number;
}
interface HealthResult {
  status: 'healthy' | 'degraded' | 'broken';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationError[];
  repairable_count: number;
  repairs_performed?: RepairAction[];
}
interface RepairAction {
  action: string;
  success: boolean;
  path?: string;
  error?: string;
}
interface HealthOptions {
  repair?: boolean;
}
declare function cmdVerifySummary(cwd: string, summaryPath: string | null, checkFileCount: number | null, raw: boolean): void;
declare function cmdVerifyPlanStructure(cwd: string, filePath: string | null, raw: boolean): void;
declare function cmdVerifyPhaseCompleteness(cwd: string, phase: string | null, raw: boolean): void;
declare function cmdVerifyReferences(cwd: string, filePath: string | null, raw: boolean): void;
declare function cmdVerifyCommits(cwd: string, hashes: string[], raw: boolean): void;
declare function cmdVerifyArtifacts(cwd: string, planFilePath: string | null, raw: boolean): void;
declare function cmdVerifyKeyLinks(cwd: string, planFilePath: string | null, raw: boolean): void;
declare function cmdValidateConsistency(cwd: string, raw: boolean): void;
declare function cmdValidateHealth(cwd: string, options: HealthOptions, raw: boolean): void;
//#endregion
//#region src/phase.d.ts
declare function cmdPhasesList(cwd: string, options: PhasesListOptions, raw: boolean): void;
declare function cmdPhaseNextDecimal(cwd: string, basePhase: string, raw: boolean): void;
declare function cmdFindPhase(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdPhasePlanIndex(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdPhaseAdd(cwd: string, description: string | undefined, raw: boolean): void;
declare function cmdPhaseInsert(cwd: string, afterPhase: string | undefined, description: string | undefined, raw: boolean): void;
declare function cmdPhaseRemove(cwd: string, targetPhase: string | undefined, options: {
  force: boolean;
}, raw: boolean): void;
declare function cmdPhaseComplete(cwd: string, phaseNum: string | undefined, raw: boolean): void;
//#endregion
//#region src/template.d.ts
interface TemplateSelectResult {
  template: string;
  type: 'minimal' | 'standard' | 'complex';
  taskCount: number;
  fileCount: number;
  hasDecisions: boolean;
  error?: string;
}
interface TemplateFillOptions {
  phase: string;
  name?: string;
  plan?: string;
  type?: string;
  wave?: string;
  fields?: FrontmatterData;
}
interface TemplateFillResult {
  created: boolean;
  path: string;
  template: string;
}
declare function cmdTemplateSelect(cwd: string, planPath: string | null, raw: boolean): void;
declare function cmdTemplateFill(cwd: string, templateType: string | null, options: TemplateFillOptions, raw: boolean): void;
//#endregion
//#region src/init.d.ts
type WorkflowType = 'execute-phase' | 'plan-phase' | 'new-project' | 'new-milestone' | 'quick' | 'resume' | 'verify-work' | 'phase-op' | 'todos' | 'milestone-op' | 'map-codebase' | 'progress';
interface ExecutePhaseContext {
  executor_model: ModelResolution;
  verifier_model: ModelResolution;
  commit_docs: boolean;
  parallelization: boolean;
  branching_strategy: string;
  phase_branch_template: string;
  milestone_branch_template: string;
  verifier_enabled: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  phase_req_ids: string | null;
  plans: string[];
  summaries: string[];
  incomplete_plans: string[];
  plan_count: number;
  incomplete_count: number;
  branch_name: string | null;
  milestone_version: string;
  milestone_name: string;
  milestone_slug: string | null;
  state_exists: boolean;
  roadmap_exists: boolean;
  config_exists: boolean;
  state_path: string;
  roadmap_path: string;
  config_path: string;
}
interface PlanPhaseContext {
  researcher_model: ModelResolution;
  planner_model: ModelResolution;
  checker_model: ModelResolution;
  research_enabled: boolean;
  plan_checker_enabled: boolean;
  nyquist_validation_enabled: boolean;
  commit_docs: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  padded_phase: string | null;
  phase_req_ids: string | null;
  has_research: boolean;
  has_context: boolean;
  has_plans: boolean;
  plan_count: number;
  planning_exists: boolean;
  roadmap_exists: boolean;
  state_path: string;
  roadmap_path: string;
  requirements_path: string;
  context_path?: string;
  research_path?: string;
  verification_path?: string;
  uat_path?: string;
}
interface NewProjectContext {
  researcher_model: ModelResolution;
  synthesizer_model: ModelResolution;
  roadmapper_model: ModelResolution;
  commit_docs: boolean;
  project_exists: boolean;
  has_codebase_map: boolean;
  planning_exists: boolean;
  has_existing_code: boolean;
  has_package_file: boolean;
  is_brownfield: boolean;
  needs_codebase_map: boolean;
  has_git: boolean;
  brave_search_available: boolean;
  project_path: string;
}
interface NewMilestoneContext {
  researcher_model: ModelResolution;
  synthesizer_model: ModelResolution;
  roadmapper_model: ModelResolution;
  commit_docs: boolean;
  research_enabled: boolean;
  current_milestone: string;
  current_milestone_name: string;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  project_path: string;
  roadmap_path: string;
  state_path: string;
}
interface QuickContext {
  planner_model: ModelResolution;
  executor_model: ModelResolution;
  checker_model: ModelResolution;
  verifier_model: ModelResolution;
  commit_docs: boolean;
  next_num: number;
  slug: string | null;
  description: string | null;
  date: string;
  timestamp: string;
  quick_dir: string;
  task_dir: string | null;
  roadmap_exists: boolean;
  planning_exists: boolean;
}
interface ResumeContext {
  state_exists: boolean;
  roadmap_exists: boolean;
  project_exists: boolean;
  planning_exists: boolean;
  state_path: string;
  roadmap_path: string;
  project_path: string;
  has_interrupted_agent: boolean;
  interrupted_agent_id: string | null;
  commit_docs: boolean;
}
interface VerifyWorkContext {
  planner_model: ModelResolution;
  checker_model: ModelResolution;
  commit_docs: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  has_verification: boolean;
}
interface PhaseOpContext {
  commit_docs: boolean;
  brave_search: boolean;
  phase_found: boolean;
  phase_dir: string | null;
  phase_number: string | null;
  phase_name: string | null;
  phase_slug: string | null;
  padded_phase: string | null;
  has_research: boolean;
  has_context: boolean;
  has_plans: boolean;
  has_verification: boolean;
  plan_count: number;
  roadmap_exists: boolean;
  planning_exists: boolean;
  state_path: string;
  roadmap_path: string;
  requirements_path: string;
  context_path?: string;
  research_path?: string;
  verification_path?: string;
  uat_path?: string;
}
interface TodosContext {
  commit_docs: boolean;
  date: string;
  timestamp: string;
  todo_count: number;
  todos: Array<{
    file: string;
    created: string;
    title: string;
    area: string;
    path: string;
  }>;
  area_filter: string | null;
  pending_dir: string;
  completed_dir: string;
  planning_exists: boolean;
  todos_dir_exists: boolean;
  pending_dir_exists: boolean;
}
interface MilestoneOpContext {
  commit_docs: boolean;
  milestone_version: string;
  milestone_name: string;
  milestone_slug: string | null;
  phase_count: number;
  completed_phases: number;
  all_phases_complete: boolean;
  archived_milestones: string[];
  archive_count: number;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  archive_exists: boolean;
  phases_dir_exists: boolean;
}
interface MapCodebaseContext {
  mapper_model: ModelResolution;
  commit_docs: boolean;
  search_gitignored: boolean;
  parallelization: boolean;
  codebase_dir: string;
  existing_maps: string[];
  has_maps: boolean;
  planning_exists: boolean;
  codebase_dir_exists: boolean;
}
interface ProgressPhaseInfo {
  number: string;
  name: string | null;
  directory: string;
  status: string;
  plan_count: number;
  summary_count: number;
  has_research: boolean;
}
interface ProgressContext {
  executor_model: ModelResolution;
  planner_model: ModelResolution;
  commit_docs: boolean;
  milestone_version: string;
  milestone_name: string;
  phases: ProgressPhaseInfo[];
  phase_count: number;
  completed_count: number;
  in_progress_count: number;
  current_phase: ProgressPhaseInfo | null;
  next_phase: ProgressPhaseInfo | null;
  paused_at: string | null;
  has_work_in_progress: boolean;
  project_exists: boolean;
  roadmap_exists: boolean;
  state_exists: boolean;
  state_path: string;
  roadmap_path: string;
  project_path: string;
  config_path: string;
}
type InitContext = ExecutePhaseContext | PlanPhaseContext | NewProjectContext | NewMilestoneContext | QuickContext | ResumeContext | VerifyWorkContext | PhaseOpContext | TodosContext | MilestoneOpContext | MapCodebaseContext | ProgressContext;
declare function cmdInitExecutePhase(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdInitPlanPhase(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdInitNewProject(cwd: string, raw: boolean): void;
declare function cmdInitNewMilestone(cwd: string, raw: boolean): void;
declare function cmdInitQuick(cwd: string, description: string | undefined, raw: boolean): void;
declare function cmdInitResume(cwd: string, raw: boolean): void;
declare function cmdInitVerifyWork(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdInitPhaseOp(cwd: string, phase: string | undefined, raw: boolean): void;
declare function cmdInitTodos(cwd: string, area: string | undefined, raw: boolean): void;
declare function cmdInitMilestoneOp(cwd: string, raw: boolean): void;
declare function cmdInitMapCodebase(cwd: string, raw: boolean): void;
declare function cmdInitProgress(cwd: string, raw: boolean): void;
//#endregion
export { type AdapterConfig, type AgentType, type AppConfig, type ArchiveResult, type ArchivedPhaseDir, type ArtifactCheck, type ArtifactsResult, type Blocker, type CommitsResult, type ConsistencyResult, type Decision, type ExecutePhaseContext, FRONTMATTER_SCHEMAS, type FrontmatterData, type FrontmatterParseResult, type FrontmatterSchema, type FrontmatterValidationResult, type FrontmatterValue, type GitResult, type HealthResult, type HistoryDigest, type HistoryPhaseDigest, type InitContext, type KeyLinkCheck, type KeyLinksResult, MODEL_PROFILES, type MapCodebaseContext, type MilestoneCompleteOptions, type MilestoneInfo, type MilestoneOpContext, type MilestoneResult, type ModelProfileEntry, type ModelProfileName, type ModelProfiles, type ModelResolution, type ModelTier, type NewMilestoneContext, type NewProjectContext, PLANNING_CONFIG_DEFAULTS, type PerformanceMetric, type PhaseAddResult, type PhaseCompleteResult, type PhaseCompletenessResult, type PhaseInsertResult, type PhaseNumber, type PhaseOpContext, type PhasePath, type PhasePlanIndexResult, type PhaseRemoveResult, type PhaseSearchResult, type PhaseSlug, type PhaseStatus, type PhasesListOptions, type PlanPhaseContext, type PlanStructureResult, type PlanningConfig, type ProgressContext, type QuickContext, type ReferencesResult, type Result, type ResumeContext, type RoadmapAnalysis, type RoadmapGetPhaseResult, type RoadmapMilestone, type RoadmapPhase, type RoadmapPhaseDetail, type RoadmapPhaseInfo, type RoadmapPhaseNotFound, type RuntimeName, type ScaffoldOptions, type SlugResult, type StateBlockerOptions, type StateData, type StateDecisionOptions, type StateMetricOptions, type StatePatchResult, type StateSection, type StateSessionOptions, type StateSnapshot, type TaskInfo, type TemplateFillOptions, type TemplateFillResult, type TemplateSelectResult, type TimestampFormat, type TodoItem, type TodosContext, type ValidationError, type ValidationWarning, type VerificationResult, type VerifyWorkContext, type WebSearchOptions, type WebSearchResult, type WorkflowConfig, type WorkflowType, cmdCommit, cmdConfigEnsureSection, cmdConfigGet, cmdConfigSet, cmdCurrentTimestamp, cmdFindPhase, cmdFrontmatterGet, cmdFrontmatterMerge, cmdFrontmatterSet, cmdFrontmatterValidate, cmdGenerateSlug, cmdHistoryDigest, cmdInitExecutePhase, cmdInitMapCodebase, cmdInitMilestoneOp, cmdInitNewMilestone, cmdInitNewProject, cmdInitPhaseOp, cmdInitPlanPhase, cmdInitProgress, cmdInitQuick, cmdInitResume, cmdInitTodos, cmdInitVerifyWork, cmdListTodos, cmdMilestoneComplete, cmdPhaseAdd, cmdPhaseComplete, cmdPhaseInsert, cmdPhaseNextDecimal, cmdPhasePlanIndex, cmdPhaseRemove, cmdPhasesList, cmdProgressRender, cmdRequirementsMarkComplete, cmdResolveModel, cmdRoadmapAnalyze, cmdRoadmapGetPhase, cmdRoadmapUpdatePlanProgress, cmdScaffold, cmdStateAddBlocker, cmdStateAddDecision, cmdStateAdvancePlan, cmdStateGet, cmdStateLoad, cmdStatePatch, cmdStateRecordMetric, cmdStateRecordSession, cmdStateResolveBlocker, cmdStateSnapshot, cmdStateUpdate, cmdStateUpdateProgress, cmdSummaryExtract, cmdTemplateFill, cmdTemplateSelect, cmdTodoComplete, cmdValidateConsistency, cmdValidateHealth, cmdVerifyArtifacts, cmdVerifyCommits, cmdVerifyKeyLinks, cmdVerifyPathExists, cmdVerifyPhaseCompleteness, cmdVerifyPlanStructure, cmdVerifyReferences, cmdVerifySummary, cmdWebsearch, comparePhaseNum, err, error, execGit, extractFrontmatter, findPhaseInternal, generateSlugInternal, getArchivedPhaseDirs, getMilestoneInfo, getPhasePattern, getRoadmapPhaseInternal, isGitIgnored, loadConfig, normalizePhaseName, ok, output, parseMustHavesBlock, pathExistsInternal, phaseNumber, phasePath, phaseSlug, reconstructFrontmatter, resolveModelInternal, safeReadFile, spliceFrontmatter, stateExtractField, stateReplaceField };
//# sourceMappingURL=index.d.cts.map