/**
 * MAXSIM Backend Server — Unified persistent backend service
 *
 * Consolidates HTTP API, WebSocket, MCP endpoint, terminal management,
 * and file watching into a single per-project process.
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout directly — stdout may be reserved for protocol use.
 * All logging must go to stderr via console.error().
 */
import type { BackendConfig, BackendServer } from './types.js';
export declare function createBackendServer(config: BackendConfig): BackendServer;
//# sourceMappingURL=server.d.ts.map