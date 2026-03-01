/**
 * Dashboard Launcher — Shared dashboard lifecycle utilities
 *
 * Used by both cli.ts (tool-router) and install.ts (npx entry point).
 */
export declare const DEFAULT_PORT = 3333;
export declare const PORT_RANGE_END = 3343;
export declare const HEALTH_TIMEOUT_MS = 1500;
/**
 * Check if a dashboard health endpoint is responding on the given port.
 */
export declare function checkHealth(port: number, timeoutMs?: number): Promise<boolean>;
/**
 * Scan the port range for a running dashboard instance.
 * Returns the port number if found, null otherwise.
 */
export declare function findRunningDashboard(timeoutMs?: number): Promise<number | null>;
/**
 * Kill processes listening on the given port. Cross-platform.
 */
export declare function killProcessOnPort(port: number): void;
/**
 * Resolve the dashboard server entry point path.
 * Tries: local project install, global install, @maxsim/dashboard package, monorepo walk.
 */
export declare function resolveDashboardServer(): string | null;
/**
 * Ensure node-pty is installed in the dashboard directory.
 * Returns true if node-pty is available after this call.
 */
export declare function ensureNodePty(serverDir: string): boolean;
export interface DashboardConfig {
    projectCwd: string;
    networkMode: boolean;
}
/**
 * Read dashboard.json config from the parent directory of the dashboard dir.
 */
export declare function readDashboardConfig(serverPath: string): DashboardConfig;
export interface SpawnDashboardOptions {
    serverPath: string;
    projectCwd: string;
    networkMode?: boolean;
    nodeEnv?: string;
}
/**
 * Spawn the dashboard server as a detached background process.
 * Returns the child process PID, or null if spawn failed.
 */
export declare function spawnDashboard(options: SpawnDashboardOptions): number | null;
/**
 * Poll the port range until a dashboard health endpoint responds.
 * Returns the URL if found within the timeout, null otherwise.
 */
export declare function waitForDashboard(pollIntervalMs?: number, pollTimeoutMs?: number, healthTimeoutMs?: number): Promise<string | null>;
//# sourceMappingURL=dashboard-launcher.d.ts.map