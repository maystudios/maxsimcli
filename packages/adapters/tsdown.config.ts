import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'claude': 'src/claude.ts',
    'opencode': 'src/opencode.ts',
    'gemini': 'src/gemini.ts',
    'codex': 'src/codex.ts',
  },
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  dts: { build: true },
  clean: true,
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  external: [/^node:/, /^@maxsim\//],
});
