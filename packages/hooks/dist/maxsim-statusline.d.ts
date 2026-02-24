#!/usr/bin/env node
/**
 * Claude Code Statusline - MAXSIM Edition
 * Shows: model | current task | directory | context usage
 */
export interface StatuslineInput {
    model?: {
        display_name?: string;
    };
    workspace?: {
        current_dir?: string;
    };
    session_id?: string;
    context_window?: {
        remaining_percentage?: number;
    };
}
export declare function formatStatusline(data: StatuslineInput): string;
//# sourceMappingURL=maxsim-statusline.d.ts.map