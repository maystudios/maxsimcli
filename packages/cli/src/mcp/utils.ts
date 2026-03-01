/**
 * MCP Utilities — Shared helpers for MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Walk up from startDir to find a directory containing `.planning/`.
 * Returns the directory containing `.planning/` or null if not found.
 */
let _cachedRoot: string | null | undefined;

export function detectProjectRoot(startDir?: string): string | null {
  // Only cache when using default startDir (cwd)
  if (startDir === undefined && _cachedRoot !== undefined) {
    return _cachedRoot;
  }

  let dir = startDir || process.cwd();

  // Safety limit to prevent infinite loops
  for (let i = 0; i < 100; i++) {
    const planningDir = path.join(dir, '.planning');
    try {
      const stat = fs.statSync(planningDir);
      if (stat.isDirectory()) {
        if (startDir === undefined) _cachedRoot = dir;
        return dir;
      }
    } catch {
      // Not found here, walk up
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      // Reached filesystem root
      if (startDir === undefined) _cachedRoot = null;
      return null;
    }
    dir = parent;
  }

  if (startDir === undefined) _cachedRoot = null;
  return null;
}

/**
 * Return a structured MCP success response.
 */
export function mcpSuccess(data: Record<string, unknown>, summary: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, data, summary }, null, 2),
      },
    ],
  };
}

/**
 * Return a structured MCP error response.
 */
export function mcpError(error: string, summary: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: false, error, summary }, null, 2),
      },
    ],
    isError: true as const,
  };
}
