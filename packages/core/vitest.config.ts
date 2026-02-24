import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 30-second timeout for subprocess integration tests (execSync calls to maxsim-tools.cjs)
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // Note: execSync subprocess tests produce 0% coverage because child processes
      // run outside the instrumented V8 context. This is expected and accepted per
      // project decision — integration correctness is verified by assertion, not coverage.
    },
  },
});
