import type { RuntimeName } from '../adapters/index.js';
export declare const PATCHES_DIR_NAME = "maxsim-local-patches";
/**
 * Detect user-modified MAXSIM files by comparing against install manifest.
 */
export declare function saveLocalPatches(configDir: string): string[];
/**
 * After install, report backed-up patches for user to reapply.
 */
export declare function reportLocalPatches(configDir: string, runtime?: RuntimeName): string[];
//# sourceMappingURL=patches.d.ts.map