import type { RuntimeName } from '../adapters/index.js';
/**
 * Clean up orphaned files from previous MAXSIM versions
 */
export declare function cleanupOrphanedFiles(configDir: string): void;
/**
 * Clean up orphaned hook registrations from settings.json
 */
export declare function cleanupOrphanedHooks(settings: Record<string, unknown>): Record<string, unknown>;
/**
 * Install hook files and configure settings.json for a runtime
 */
export declare function installHookFiles(targetDir: string, runtime: RuntimeName, isGlobal: boolean, failures: string[]): void;
/**
 * Configure hooks and statusline in settings.json
 */
export declare function configureSettingsHooks(targetDir: string, runtime: RuntimeName, isGlobal: boolean): {
    settingsPath: string;
    settings: Record<string, unknown>;
    statuslineCommand: string;
    updateCheckCommand: string;
    contextMonitorCommand: string;
};
/**
 * Handle statusline configuration — returns true if MAXSIM statusline should be installed
 */
export declare function handleStatusline(settings: Record<string, unknown>, isInteractive: boolean, forceStatusline: boolean): Promise<boolean>;
/**
 * Apply statusline config, then print completion message
 */
export declare function finishInstall(settingsPath: string | null, settings: Record<string, unknown> | null, statuslineCommand: string | null, shouldInstallStatusline: boolean, runtime?: RuntimeName, isGlobal?: boolean): void;
//# sourceMappingURL=hooks.d.ts.map