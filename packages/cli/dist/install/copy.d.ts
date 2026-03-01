import type { RuntimeName } from '../adapters/index.js';
/**
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/maxsim-help.md (invoked as /maxsim-help)
 * Source structure: commands/maxsim/help.md
 */
export declare function copyFlattenedCommands(srcDir: string, destDir: string, prefix: string, pathPrefix: string, runtime: RuntimeName, explicitConfigDir: string | null): void;
export declare function listCodexSkillNames(skillsDir: string, prefix?: string): string[];
export declare function copyCommandsAsCodexSkills(srcDir: string, skillsDir: string, prefix: string, pathPrefix: string, runtime: RuntimeName, explicitConfigDir: string | null): void;
/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 */
export declare function copyWithPathReplacement(srcDir: string, destDir: string, pathPrefix: string, runtime: RuntimeName, explicitConfigDir: string | null, isCommand?: boolean): void;
//# sourceMappingURL=copy.d.ts.map