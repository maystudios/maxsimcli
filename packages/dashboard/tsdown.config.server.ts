import { defineConfig } from 'tsdown';

/**
 * Server bundling config for standalone dashboard deployment.
 *
 * Inlines all custom server dependencies (ws, chokidar, detect-port, open)
 * into a single server.mjs file. Marks `next` as external because it is
 * provided by the standalone-traced node_modules.
 *
 * Output goes to .server-build/ (intermediate dir) because tsdown cannot
 * use --out-dir . with clean mode without deleting project files.
 * The build:standalone script copies the output to .next/standalone/server.js.
 */
export default defineConfig({
  entry: { server: 'server.ts' },
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['next'],
  noExternal: ['ws', 'chokidar', 'detect-port', 'open'],
  outDir: '.server-build',
  clean: false,
});
