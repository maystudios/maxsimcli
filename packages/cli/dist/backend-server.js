"use strict";
/**
 * MAXSIM Backend Server — Entry point
 *
 * Starts the unified backend server (Express + WS + MCP + Terminal).
 * Environment: MAXSIM_PORT, MAXSIM_PROJECT_CWD
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout directly — stdout may be reserved for protocol use.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const server_js_1 = require("./backend/server.js");
const port = parseInt(process.env.MAXSIM_PORT || '3142', 10);
const cwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();
const config = {
    port,
    host: '127.0.0.1',
    projectCwd: cwd,
    enableTerminal: true,
    enableFileWatcher: true,
    enableMcp: true,
    logDir: node_path_1.default.join(cwd, '.planning', 'logs'),
};
const server = (0, server_js_1.createBackendServer)(config);
process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
});
server.start().then(() => {
    console.error(`MAXSIM backend running on port ${server.getPort()} for ${cwd}`);
}).catch((err) => {
    console.error('Backend server error:', err);
    process.exitCode = 1;
});
//# sourceMappingURL=backend-server.js.map