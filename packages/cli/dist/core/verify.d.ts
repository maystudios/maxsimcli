/**
 * Verify — Verification suite, consistency, and health validation
 *
 * Ported from maxsim/bin/lib/verify.cjs
 */
export interface ValidationError {
    code?: string;
    message: string;
    fix?: string;
    repairable?: boolean;
}
export interface ValidationWarning {
    code?: string;
    message: string;
    fix?: string;
    repairable?: boolean;
}
export interface TaskInfo {
    name: string;
    hasFiles: boolean;
    hasAction: boolean;
    hasVerify: boolean;
    hasDone: boolean;
}
export interface VerificationResult {
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
export interface PlanStructureResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    task_count: number;
    tasks: TaskInfo[];
    frontmatter_fields: string[];
}
export interface PhaseCompletenessResult {
    complete: boolean;
    phase: string;
    plan_count: number;
    summary_count: number;
    incomplete_plans: string[];
    orphan_summaries: string[];
    errors: string[];
    warnings: string[];
}
export interface ReferencesResult {
    valid: boolean;
    found: number;
    missing: string[];
    total: number;
}
export interface CommitsResult {
    all_valid: boolean;
    valid: string[];
    invalid: string[];
    total: number;
}
export interface ArtifactCheck {
    path: string;
    exists: boolean;
    issues: string[];
    passed: boolean;
}
export interface ArtifactsResult {
    all_passed: boolean;
    passed: number;
    total: number;
    artifacts: ArtifactCheck[];
}
export interface KeyLinkCheck {
    from: string;
    to: string;
    via: string;
    verified: boolean;
    detail: string;
}
export interface KeyLinksResult {
    all_verified: boolean;
    verified: number;
    total: number;
    links: KeyLinkCheck[];
}
export interface ConsistencyResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    warning_count: number;
}
export interface HealthResult {
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
export declare function cmdVerifySummary(cwd: string, summaryPath: string | null, checkFileCount: number | null, raw: boolean): Promise<void>;
export declare function cmdVerifyPlanStructure(cwd: string, filePath: string | null, raw: boolean): void;
export declare function cmdVerifyPhaseCompleteness(cwd: string, phase: string | null, raw: boolean): void;
export declare function cmdVerifyReferences(cwd: string, filePath: string | null, raw: boolean): void;
export declare function cmdVerifyCommits(cwd: string, hashes: string[], raw: boolean): Promise<void>;
export declare function cmdVerifyArtifacts(cwd: string, planFilePath: string | null, raw: boolean): void;
export declare function cmdVerifyKeyLinks(cwd: string, planFilePath: string | null, raw: boolean): void;
export declare function cmdValidateConsistency(cwd: string, raw: boolean): void;
export declare function cmdValidateHealth(cwd: string, options: HealthOptions, raw: boolean): void;
export {};
//# sourceMappingURL=verify.d.ts.map