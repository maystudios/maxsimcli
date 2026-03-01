import type { RuntimeName } from '../adapters/index.js';
/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
export declare function getCommitAttribution(runtime: RuntimeName, explicitConfigDir: string | null): null | undefined | string;
/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 */
export declare function parseJsonc(content: string): Record<string, unknown>;
/**
 * Configure OpenCode permissions to allow reading MAXSIM reference docs
 */
export declare function configureOpencodePermissions(isGlobal?: boolean): void;
//# sourceMappingURL=adapters.d.ts.map