/**
 * Context Loader — Intelligent file selection for workflow context assembly
 *
 * Selects relevant planning files based on the current task/phase domain,
 * preventing context overload by loading only what matters.
 */
import type { CmdResult } from './types.js';
export interface ContextFile {
    path: string;
    role: string;
    size: number;
}
export interface ContextLoadResult {
    files: ContextFile[];
    total_size: number;
    phase: string | null;
    topic: string | null;
}
export declare function cmdContextLoad(cwd: string, phase: string | undefined, topic: string | undefined, includeHistory: boolean): CmdResult;
//# sourceMappingURL=context-loader.d.ts.map