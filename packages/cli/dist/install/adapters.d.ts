import type { RuntimeName } from '../adapters/index.js';
/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
export declare function getCommitAttribution(runtime: RuntimeName, explicitConfigDir: string | null): null | undefined | string;
//# sourceMappingURL=adapters.d.ts.map