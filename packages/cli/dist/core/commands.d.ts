/**
 * Commands — Standalone utility commands
 *
 * Ported from maxsim/bin/lib/commands.cjs
 */
import type { WebSearchOptions, ScaffoldOptions, TimestampFormat } from './types.js';
export declare function cmdGenerateSlug(text: string | undefined, raw: boolean): void;
export declare function cmdCurrentTimestamp(format: TimestampFormat, raw: boolean): void;
export declare function cmdListTodos(cwd: string, area: string | undefined, raw: boolean): void;
export declare function cmdVerifyPathExists(cwd: string, targetPath: string | undefined, raw: boolean): void;
export declare function cmdHistoryDigest(cwd: string, raw: boolean): void;
export declare function cmdResolveModel(cwd: string, agentType: string | undefined, raw: boolean): void;
export declare function cmdCommit(cwd: string, message: string | undefined, files: string[], raw: boolean, amend: boolean): Promise<void>;
export declare function cmdSummaryExtract(cwd: string, summaryPath: string | undefined, fields: string[] | null, raw: boolean): void;
export declare function cmdWebsearch(query: string | undefined, options: WebSearchOptions, raw: boolean): Promise<void>;
export declare function cmdProgressRender(cwd: string, format: string, raw: boolean): void;
export declare function cmdTodoComplete(cwd: string, filename: string | undefined, raw: boolean): void;
export declare function cmdScaffold(cwd: string, type: string | undefined, options: ScaffoldOptions, raw: boolean): void;
//# sourceMappingURL=commands.d.ts.map