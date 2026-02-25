/**
 * Shared utilities for MAXSIM hooks.
 */
/**
 * Read all stdin as a string, then invoke callback with parsed JSON.
 * Used by context-monitor and statusline hooks.
 */
export declare function readStdinJson<T>(callback: (data: T) => void): void;
/** The '.claude' path segment -- template marker replaced during install. */
export declare const CLAUDE_DIR = ".claude";
//# sourceMappingURL=shared.d.ts.map