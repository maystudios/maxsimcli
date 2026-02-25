import { defineConfig } from 'tsdown';

/**
 * Server bundling config for Vite + Express dashboard deployment.
 *
 * Bundles src/server.ts and ALL its dependencies (express, sirv, ws,
 * chokidar, detect-port, open, @maxsim/core) into a single server.js file.
 *
 * No external dependencies — the output is fully self-contained.
 * Users run: node dist/server.js
 * No node_modules/ required at the install destination.
 *
 * Output goes directly to dist/server.js. The dist/client/ folder (produced
 * by vite build) is referenced at runtime via path.join(__dirname, 'client').
 */
export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  outDir: 'dist',
  clean: false,
  tsconfig: 'tsconfig.server.json',
  // We intentionally bundle all deps into a single self-contained server.js.
  // inlineOnly: false suppresses tsdown's warning about detected dependencies.
  inlineOnly: false,
  external: ['node-pty'],
  noExternal: [
    'express',
    'sirv',
    'ws',
    'chokidar',
    'detect-port',
    'open',
    '@maxsim/core',
  ],
});
