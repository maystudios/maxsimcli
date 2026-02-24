import { defineConfig } from 'tsdown';

const shared = {
  format: 'cjs' as const,
  platform: 'node' as const,
  target: 'es2022' as const,
  banner: { js: '#!/usr/bin/env node' },
  dts: { build: true },
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  external: [/^node:/],
  noExternal: [/^@maxsim\//],
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
]);
