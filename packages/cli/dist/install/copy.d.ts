import type { RuntimeName } from '../adapters/index.js';
/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
export declare function copyWithPathReplacement(srcDir: string, destDir: string, pathPrefix: string, runtime: RuntimeName, explicitConfigDir: string | null): void;
//# sourceMappingURL=copy.d.ts.map