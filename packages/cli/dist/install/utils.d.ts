/**
 * Install utilities — shared helper functions for the install pipeline.
 * (Inlined from the former adapters/base.ts after multi-runtime removal.)
 */
/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
export declare function expandTilde(filePath: string): string;
/**
 * Process Co-Authored-By lines based on attribution setting.
 * @param content - File content to process
 * @param attribution - null=remove, undefined=keep default, string=replace
 */
export declare function processAttribution(content: string, attribution: null | undefined | string): string;
/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 */
export declare function buildHookCommand(configDir: string, hookName: string): string;
/**
 * Read and parse settings.json, returning empty object if it doesn't exist.
 */
export declare function readSettings(settingsPath: string): Record<string, unknown>;
/**
 * Write settings.json with proper formatting.
 */
export declare function writeSettings(settingsPath: string, settings: Record<string, unknown>): void;
//# sourceMappingURL=utils.d.ts.map