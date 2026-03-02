/**
 * Template — Template selection and fill operations
 *
 * Ported from maxsim/bin/lib/template.cjs
 */
import type { FrontmatterData, CmdResult } from './types.js';
export interface TemplateSelectResult {
    template: string;
    type: 'minimal' | 'standard' | 'complex';
    taskCount: number;
    fileCount: number;
    hasDecisions: boolean;
    error?: string;
}
export interface TemplateFillOptions {
    phase: string;
    name?: string;
    plan?: string;
    type?: string;
    wave?: string;
    fields?: FrontmatterData;
}
export interface TemplateFillResult {
    created: boolean;
    path: string;
    template: string;
}
export declare function cmdTemplateSelect(cwd: string, planPath: string | null): CmdResult;
export declare function cmdTemplateFill(cwd: string, templateType: string | null, options: TemplateFillOptions): CmdResult;
//# sourceMappingURL=template.d.ts.map