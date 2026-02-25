/**
 * Init — Compound init commands for workflow bootstrapping
 *
 * Ported from maxsim/bin/lib/init.cjs
 */
import type { ModelResolution } from './types.js';
export type WorkflowType = 'execute-phase' | 'plan-phase' | 'new-project' | 'new-milestone' | 'quick' | 'resume' | 'verify-work' | 'phase-op' | 'todos' | 'milestone-op' | 'map-codebase' | 'progress';
export interface ExecutePhaseContext {
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
export interface PlanPhaseContext {
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
export interface NewProjectContext {
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
export interface NewMilestoneContext {
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
export interface QuickContext {
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
export interface ResumeContext {
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
export interface VerifyWorkContext {
    planner_model: ModelResolution;
    checker_model: ModelResolution;
    commit_docs: boolean;
    phase_found: boolean;
    phase_dir: string | null;
    phase_number: string | null;
    phase_name: string | null;
    has_verification: boolean;
}
export interface PhaseOpContext {
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
export interface TodosContext {
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
export interface MilestoneOpContext {
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
export interface MapCodebaseContext {
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
export interface ProgressContext {
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
export type InitContext = ExecutePhaseContext | PlanPhaseContext | NewProjectContext | NewMilestoneContext | QuickContext | ResumeContext | VerifyWorkContext | PhaseOpContext | TodosContext | MilestoneOpContext | MapCodebaseContext | ProgressContext;
export declare function cmdInitExecutePhase(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdInitPlanPhase(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdInitNewProject(cwd: string, raw: boolean): void;
export declare function cmdInitNewMilestone(cwd: string, raw: boolean): void;
export declare function cmdInitQuick(cwd: string, description: string | undefined, raw: boolean): void;
export declare function cmdInitResume(cwd: string, raw: boolean): void;
export declare function cmdInitVerifyWork(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdInitPhaseOp(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdInitTodos(cwd: string, area: string | undefined, raw: boolean): void;
export declare function cmdInitMilestoneOp(cwd: string, raw: boolean): void;
export declare function cmdInitMapCodebase(cwd: string, raw: boolean): void;
export declare function cmdInitProgress(cwd: string, raw: boolean): void;
export {};
//# sourceMappingURL=init.d.ts.map