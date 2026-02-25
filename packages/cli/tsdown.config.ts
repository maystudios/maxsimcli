import { defineConfig } from 'tsdown';

const shared = {
  format: 'cjs' as const,
  platform: 'node' as const,
  target: 'es2022' as const,
  banner: { js: '#!/usr/bin/env node' },
  dts: { build: true },
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  external: [/^node:/],
  inlineOnly: false,
};

const hookShared = {
  format: 'cjs' as const,
  platform: 'node' as const,
  target: 'es2022' as const,
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  external: [/^node:/],
  outDir: 'dist/assets/hooks',
  inlineOnly: false,
};

export default defineConfig([
  {
    ...shared,
    entry: { install: 'src/install.ts' },
    clean: true,
  },
  {
    ...shared,
    entry: { cli: 'src/cli.ts' },
  },
  // Hooks — compiled as standalone bundles into dist/assets/hooks/
  {
    ...hookShared,
    entry: { 'maxsim-check-update': 'src/hooks/maxsim-check-update.ts' },
    dts: { build: true },
  },
  {
    ...hookShared,
    entry: { 'maxsim-context-monitor': 'src/hooks/maxsim-context-monitor.ts' },
    dts: { build: true },
  },
  {
    ...hookShared,
    entry: { 'maxsim-statusline': 'src/hooks/maxsim-statusline.ts' },
    dts: { build: true },
  },
]);
