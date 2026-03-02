/**
 * Backend Terminal — PTY management and scrollback session store
 *
 * Adapted from packages/dashboard/src/terminal/pty-manager.ts and session-store.ts.
 * Provides terminal support with graceful degradation when node-pty is unavailable.
 */
import type { WebSocket } from 'ws';
export declare class SessionStore {
    private scrollback;
    append(data: string): void;
    getAll(): string;
    clear(): void;
}
interface PtyStatus {
    pid: number;
    uptime: number;
    cwd: string;
    memoryMB: number;
    isActive: boolean;
    skipPermissions: boolean;
    alive: boolean;
}
export declare class PtyManager {
    private static instance;
    private session;
    private connectedClients;
    private lastOutputTime;
    private statusInterval;
    static getInstance(): PtyManager;
    spawn(opts: {
        skipPermissions: boolean;
        cwd: string;
        cols?: number;
        rows?: number;
    }): void;
    write(data: string): void;
    resize(cols: number, rows: number): void;
    kill(): void;
    getStatus(): PtyStatus | null;
    addClient(ws: WebSocket): void;
    removeClient(ws: WebSocket): void;
    isAlive(): boolean;
    isAvailable(): boolean;
    private broadcastToClients;
    private startStatusBroadcast;
    private stopStatusBroadcast;
}
export {};
//# sourceMappingURL=terminal.d.ts.map