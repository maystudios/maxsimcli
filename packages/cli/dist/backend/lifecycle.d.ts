/**
 * Backend Lifecycle — Start, stop, health check, discovery
 */
import type { BackendLockFile, BackendStatus } from './types.js';
export declare function startBackend(projectCwd: string, opts?: {
    port?: number;
    background?: boolean;
}): Promise<BackendLockFile>;
export declare function stopBackend(projectCwd: string): Promise<boolean>;
export declare function getBackendStatus(projectCwd: string): Promise<BackendStatus | null>;
export declare function isBackendRunning(projectCwd: string): Promise<boolean>;
export declare function findBackendPort(projectCwd: string): number | null;
//# sourceMappingURL=lifecycle.d.ts.map