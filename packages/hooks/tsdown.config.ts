import { defineConfig } from 'tsdown';

const shared = {
  format: 'cjs' as const,
  platform: 'node' as const,
  target: 'es2022' as const,
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  external: [/^node:/],
};

// Each hook is built as a separate standalone bundle (no shared chunks).
// The index entry re-exports testable functions for unit testing.
export default defineConfig([
  {
    ...shared,
    entry: { 'maxsim-check-update': 'src/maxsim-check-update.ts' },
    dts: { build: true },
    clean: true,
  },
  {
    ...shared,
    entry: { 'maxsim-context-monitor': 'src/maxsim-context-monitor.ts' },
    dts: { build: true },
  },
  {
    ...shared,
    entry: { 'maxsim-statusline': 'src/maxsim-statusline.ts' },
    dts: { build: true },
  },
  {
    ...shared,
    entry: { 'index': 'src/index.ts' },
    dts: { build: true },
  },
]);
