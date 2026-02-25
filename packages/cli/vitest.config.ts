import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
