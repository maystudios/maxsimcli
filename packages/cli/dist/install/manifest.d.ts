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
export declare function writeManifest(configDir: string): Manifest;
/**
 * Read an existing manifest from the config directory, or return null if none exists / is invalid
 */
export declare function readManifest(configDir: string): Manifest | null;
//# sourceMappingURL=manifest.d.ts.map