//#region src/maxsim-statusline.d.ts
/**
 * Claude Code Statusline - MAXSIM Edition
 * Shows: model | current task | directory | context usage
 */
interface StatuslineInput {
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
declare function formatStatusline(data: StatuslineInput): string;
//#endregion
export { StatuslineInput, formatStatusline };
//# sourceMappingURL=maxsim-statusline.d.cts.map