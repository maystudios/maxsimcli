import type { RuntimeName, AdapterConfig } from '../adapters/index.js';
import type { Manifest } from './manifest.js';
export declare const pkg: {
    version: string;
};
export declare const templatesRoot: string;
/**
 * Get adapter for a runtime
 */
export declare function getAdapter(runtime: RuntimeName): AdapterConfig;
/**
 * Get the global config directory for a runtime, using adapter
 */
export declare function getGlobalDir(runtime: RuntimeName, explicitDir?: string | null): string;
/**
 * Get the config directory path relative to home for hook templating
 */
export declare function getConfigDirFromHome(runtime: RuntimeName, isGlobal: boolean): string;
/**
 * Get the local directory name for a runtime
 */
export declare function getDirName(runtime: RuntimeName): string;
/**
 * Recursively remove a directory, handling Windows read-only file attributes.
 * fs-extra handles cross-platform edge cases (EPERM on Windows, symlinks, etc.)
 */
export declare function safeRmDir(dirPath: string): void;
/**
 * Recursively copy a directory (dereferences symlinks)
 */
export declare function copyDirRecursive(src: string, dest: string): void;
/**
 * Get the global config directory for OpenCode (for JSONC permissions)
 * OpenCode follows XDG Base Directory spec
 */
export declare function getOpencodeGlobalDir(): string;
/**
 * Verify a directory exists and contains files.
 * If expectedFiles is provided, also checks that those specific files exist inside the directory.
 */
export declare function verifyInstalled(dirPath: string, description: string, expectedFiles?: string[]): boolean;
/**
 * Verify a file exists
 */
export declare function verifyFileInstalled(filePath: string, description: string): boolean;
export interface InstallResult {
    settingsPath: string | null;
    settings: Record<string, unknown> | null;
    statuslineCommand: string | null;
    runtime: RuntimeName;
}
/**
 * Verify that all major install components are present. Uses the manifest
 * (if available) to check individual files; otherwise falls back to
 * directory-level checks.
 *
 * Returns an object with `complete` (boolean) and `missing` (list of
 * component names that are absent or incomplete).
 */
export declare function verifyInstallComplete(configDir: string, runtime: RuntimeName, manifest?: Manifest | null): {
    complete: boolean;
    missing: string[];
};
//# sourceMappingURL=shared.d.ts.map