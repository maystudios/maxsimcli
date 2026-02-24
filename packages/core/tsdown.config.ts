import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  dts: { build: true },
  clean: true,
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  external: [/^node:/],
});
