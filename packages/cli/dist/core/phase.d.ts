/**
 * Phase — Phase CRUD, query, and lifecycle operations
 *
 * Ported from maxsim/bin/lib/phase.cjs
 */
import type { PhasesListOptions } from './types.js';
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