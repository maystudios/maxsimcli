/**
 * @maxsim/adapters — Shared base utilities extracted from bin/install.js
 */
/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
export declare function expandTilde(filePath: string): string;
/**
 * Extract YAML frontmatter and body from markdown content.
 * Returns null frontmatter if content doesn't start with ---.
 */
export declare function extractFrontmatterAndBody(content: string): {
    frontmatter: string | null;
    body: string;
};
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
//# sourceMappingURL=base.d.ts.map