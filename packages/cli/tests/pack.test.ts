import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const cliDir = path.resolve(__dirname, '..');
const distDir = path.join(cliDir, 'dist');

describe('npm pack validation', () => {
  it('bundled hooks assets exist in dist/assets/hooks/', () => {
    const hooksAssetsDir = path.join(distDir, 'assets', 'hooks');
    expect(existsSync(path.join(hooksAssetsDir, 'maxsim-check-update.cjs'))).toBe(true);
    expect(existsSync(path.join(hooksAssetsDir, 'maxsim-context-monitor.cjs'))).toBe(true);
    expect(existsSync(path.join(hooksAssetsDir, 'maxsim-statusline.cjs'))).toBe(true);
  });

  it('cli.cjs exists in dist/ — required for maxsim-tools.cjs install step', () => {
    expect(existsSync(path.join(distDir, 'cli.cjs'))).toBe(true);
  });

  it('npm pack --dry-run includes core CLI dist files and bundled hooks assets', () => {
    const output = execSync('npm pack --dry-run 2>&1', {
      cwd: cliDir,
      encoding: 'utf8',
      timeout: 30_000,
    });
    // Core CLI files
    expect(output).toContain('dist/cli.cjs');
    expect(output).toContain('dist/install.cjs');
    // Hooks bundled in assets (no longer a bundledDependency)
    expect(output).toContain('dist/assets/hooks/maxsim-statusline.cjs');
  }, 30_000);
});
