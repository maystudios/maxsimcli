/**
 * Drift — Drift report CRUD, requirement extraction, and spec extraction
 *
 * Provides CLI tool commands for the drift-checker agent and realign workflow.
 */
import type { CmdResult } from './types.js';
/**
 * Read the drift report from .planning/DRIFT-REPORT.md.
 * Returns parsed frontmatter and body content, or structured error if not found.
 */
export declare function cmdDriftReadReport(cwd: string): CmdResult;
/**
 * Write content to .planning/DRIFT-REPORT.md.
 * Supports direct content or reading from a file (tmpfile pattern for large reports).
 */
export declare function cmdDriftWriteReport(cwd: string, content: string | null, contentFile: string | null): CmdResult;
/**
 * Extract all requirements from .planning/REQUIREMENTS.md.
 * Parses requirement lines matching `- [ ] **ID**: description` or `- [x] **ID**: description`.
 */
export declare function cmdDriftExtractRequirements(cwd: string): CmdResult;
/**
 * Extract no-go rules from .planning/NO-GOS.md.
 * Returns array of no-go items with section context, or empty if file missing.
 */
export declare function cmdDriftExtractNoGos(cwd: string): CmdResult;
/**
 * Read .planning/CONVENTIONS.md and return its full content.
 * Returns the raw content for agent analysis, or null if missing.
 */
export declare function cmdDriftExtractConventions(cwd: string): CmdResult;
/**
 * Read existing DRIFT-REPORT.md frontmatter for diff tracking.
 * Returns previous_hash and checked date, or null if no report exists.
 */
export declare function cmdDriftPreviousHash(cwd: string): CmdResult;
//# sourceMappingURL=drift.d.ts.map