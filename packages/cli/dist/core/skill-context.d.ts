/**
 * Skill Context — Provides MAXSIM state to skills via a single CLI call
 */
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
    decisions: Array<{
        phase: string;
        summary: string;
        rationale: string;
    }>;
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
export declare function cmdSkillContext(cwd: string, skillName: string, raw: boolean): void;
//# sourceMappingURL=skill-context.d.ts.map