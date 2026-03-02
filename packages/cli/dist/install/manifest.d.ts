import type { RuntimeName } from '../adapters/index.js';
export declare const MANIFEST_NAME = "maxsim-file-manifest.json";
/**
 * Compute SHA256 hash of file contents
 */
export declare function fileHash(filePath: string): string;
/**
 * Recursively collect all files in dir with their hashes
 */
export declare function generateManifest(dir: string, baseDir?: string): Record<string, string>;
export interface Manifest {
    version: string;
    timestamp: string;
    files: Record<string, string>;
}
/**
 * Write file manifest after installation for future modification detection
 */
export declare function writeManifest(configDir: string, _runtime?: RuntimeName): Manifest;
//# sourceMappingURL=manifest.d.ts.map