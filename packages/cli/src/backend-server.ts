/**
 * MAXSIM Backend Server — Entry point
 *
 * Starts the unified backend server (Express + WS + MCP + Terminal).
 * Environment: MAXSIM_PORT, MAXSIM_PROJECT_CWD
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout directly — stdout may be reserved for protocol use.
 */

import path from 'node:path';
import { createBackendServer } from './backend/server.js';
import type { BackendConfig } from './backend/types.js';

const port = parseInt(process.env.MAXSIM_PORT || '3142', 10);
const cwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();

const config: BackendConfig = {
  port,
  host: '127.0.0.1',
  projectCwd: cwd,
  enableTerminal: true,
  enableFileWatcher: true,
  enableMcp: true,
  logDir: path.join(cwd, '.planning', 'logs'),
};

const server = createBackendServer(config);

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
