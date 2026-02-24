import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const cliDir = path.resolve(__dirname, '..');

describe('npm pack validation', () => {
  it('package.json declares hooks as bundledDependency', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(cliDir, 'package.json'), 'utf8'),
    );
    expect(pkg.bundledDependencies).toContain('@maxsim/hooks');
    expect(pkg.dependencies['@maxsim/hooks']).toBeDefined();
  });

  it('hooks dist files exist and contain expected bundles', () => {
    // Resolve hooks package via require.resolve (same path install.ts uses)
    const hooksPkg = require.resolve('@maxsim/hooks');
    // require.resolve returns .../dist/index.cjs, so dirname IS the dist dir
    const distDir = path.dirname(hooksPkg);

    expect(existsSync(path.join(distDir, 'maxsim-check-update.cjs'))).toBe(true);
    expect(existsSync(path.join(distDir, 'maxsim-context-monitor.cjs'))).toBe(true);
    expect(existsSync(path.join(distDir, 'maxsim-statusline.cjs'))).toBe(true);
  });

  it('npm pack --dry-run includes core CLI dist files', () => {
    const output = execSync('npm pack --dry-run 2>&1', {
      cwd: cliDir,
      encoding: 'utf8',
      timeout: 30_000,
    });
    // Core CLI files always present (not behind bundledDependencies)
    expect(output).toContain('dist/cli.cjs');
    expect(output).toContain('dist/install.cjs');
    // bundledDependencies declared
    expect(output).toContain('@maxsim/hooks');
  }, 30_000);
});
