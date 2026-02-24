import { defineConfig } from 'tsdown';

/**
 * Server bundling config for standalone dashboard deployment.
 *
 * Inlines all custom server dependencies (ws, chokidar, detect-port, open)
 * into a single server.cjs file. Marks `next` as external because it is
 * provided by the standalone-traced node_modules.
 *
 * IMPORTANT: Must output CJS format because Next.js standalone places a
 * package.json with "type": "commonjs" in .next/standalone/. ESM output
 * renamed to .js would fail with "Cannot use import statement".
 *
 * Output goes to .server-build/ (intermediate dir) because tsdown cannot
 * use --out-dir . with clean mode without deleting project files.
 * The build:standalone script copies the output to .next/standalone/server.js.
 */
export default defineConfig({
  entry: { server: 'server.ts' },
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  external: ['next'],
  noExternal: ['ws', 'chokidar', 'detect-port', 'open'],
  inlineOnly: false,
  outDir: '.server-build',
  clean: false,
});
