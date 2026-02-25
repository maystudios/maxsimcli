"use strict";
/**
 * Shared utilities for MAXSIM hooks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLAUDE_DIR = void 0;
exports.readStdinJson = readStdinJson;
/**
 * Read all stdin as a string, then invoke callback with parsed JSON.
 * Used by context-monitor and statusline hooks.
 */
function readStdinJson(callback) {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (input += chunk));
    process.stdin.on('end', () => {
        try {
            const data = JSON.parse(input);
            callback(data);
        }
        catch {
            // Silent fail -- never block hook execution
            process.exit(0);
        }
    });
}
/** The '.claude' path segment -- template marker replaced during install. */
exports.CLAUDE_DIR = '.claude';
//# sourceMappingURL=shared.js.map