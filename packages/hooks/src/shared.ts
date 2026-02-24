/**
 * Shared utilities for MAXSIM hooks.
 */

/**
 * Read all stdin as a string, then invoke callback with parsed JSON.
 * Used by context-monitor and statusline hooks.
 */
export function readStdinJson<T>(callback: (data: T) => void): void {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => (input += chunk));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input) as T;
      callback(data);
    } catch {
      // Silent fail -- never block hook execution
      process.exit(0);
    }
  });
}

/** The '.claude' path segment -- template marker replaced during install. */
export const CLAUDE_DIR = '.claude';
