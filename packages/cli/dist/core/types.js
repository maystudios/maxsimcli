"use strict";
/**
 * @maxsim/core — Shared type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANNING_CONFIG_DEFAULTS = void 0;
exports.phaseNumber = phaseNumber;
exports.phasePath = phasePath;
exports.phaseSlug = phaseSlug;
exports.ok = ok;
exports.err = err;
function phaseNumber(value) {
    const match = value.match(/^\d+[A-Z]?(\.\d+)?$/i);
    if (!match) {
        throw new Error(`Invalid phase number: ${value}`);
    }
    return value;
}
function phasePath(value) {
    if (!value || typeof value !== 'string') {
        throw new Error(`Invalid phase path: ${value}`);
    }
    return value;
}
function phaseSlug(value) {
    if (!value || typeof value !== 'string') {
        throw new Error(`Invalid phase slug: ${value}`);
    }
    return value;
}
function ok(data) {
    return { success: true, data };
}
function err(error) {
    return { success: false, error };
}
exports.PLANNING_CONFIG_DEFAULTS = {
    model_profile: 'balanced',
    commit_docs: true,
    search_gitignored: false,
    branching_strategy: 'none',
    phase_branch_template: 'maxsim/phase-{phase}-{slug}',
    milestone_branch_template: 'maxsim/{milestone}-{slug}',
    workflow: {
        research: true,
        plan_check: true,
        verifier: true,
        nyquist_validation: false,
    },
    parallelization: true,
    brave_search: false,
};
//# sourceMappingURL=types.js.map