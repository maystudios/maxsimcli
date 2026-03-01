/**
 * Phase — Phase CRUD, query, and lifecycle operations
 *
 * Ported from maxsim/bin/lib/phase.cjs
 */
import type { PhasesListOptions } from './types.js';
export interface PhaseCreateOptions {
    includeStubs?: boolean;
}
export interface PhaseAddResult {
    phase_number: number;
    padded: string;
    slug: string;
    directory: string;
    description: string;
}
export interface PhaseInsertResult {
    phase_number: string;
    after_phase: string;
    slug: string;
    directory: string;
    description: string;
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
    requirements_updated: boolean;
}
export declare function scaffoldPhaseStubs(dirPath: string, phaseId: string, name: string): void;
export declare function phaseAddCore(cwd: string, description: string, options?: PhaseCreateOptions): PhaseAddResult;
export declare function phaseInsertCore(cwd: string, afterPhase: string, description: string, options?: PhaseCreateOptions): PhaseInsertResult;
export declare function phaseCompleteCore(cwd: string, phaseNum: string): PhaseCompleteResult;
export declare function cmdPhasesList(cwd: string, options: PhasesListOptions, raw: boolean): void;
export declare function cmdPhaseNextDecimal(cwd: string, basePhase: string, raw: boolean): void;
export declare function cmdFindPhase(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdPhasePlanIndex(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdPhaseAdd(cwd: string, description: string | undefined, raw: boolean): void;
export declare function cmdPhaseInsert(cwd: string, afterPhase: string | undefined, description: string | undefined, raw: boolean): void;
export declare function cmdPhaseRemove(cwd: string, targetPhase: string | undefined, options: {
    force: boolean;
}, raw: boolean): void;
export declare function cmdPhaseComplete(cwd: string, phaseNum: string | undefined, raw: boolean): void;
//# sourceMappingURL=phase.d.ts.map