export declare const pkg: {
    version: string;
};
export declare const templatesRoot: string;
export declare const builtInSkills: readonly ["tdd", "systematic-debugging", "verification-before-completion", "simplify", "code-review", "memory-management", "using-maxsim"];
/**
 * Get the global config directory, using the Claude adapter
 */
export declare function getGlobalDir(explicitDir?: string | null): string;
/**
 * Get the config directory path relative to home for hook templating
 */
export declare function getConfigDirFromHome(isGlobal: boolean): string;
/**
 * Get the local directory name
 */
export declare function getDirName(): string;
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
 * Verify a directory exists and contains files
 */
export declare function verifyInstalled(dirPath: string, description: string): boolean;
/**
 * Verify a file exists
 */
export declare function verifyFileInstalled(filePath: string, description: string): boolean;
export interface InstallResult {
    settingsPath: string | null;
    settings: Record<string, unknown> | null;
    statuslineCommand: string | null;
    runtime: 'claude';
}
//# sourceMappingURL=shared.d.ts.map