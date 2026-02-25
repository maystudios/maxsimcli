import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Vitest 4 globalSetup: export setup(context) function
export async function setup(context: { provide: (key: string, value: unknown) => void }) {
  // Resolve packages/cli directory — Vitest sets cwd to packages/cli
  const cliDir = process.cwd();

  // Step 1: npm pack from packages/cli
  const packOutput = execSync('npm pack', {
    cwd: cliDir,
    encoding: 'utf8',
    timeout: 60_000,
  });
  const tarballName = packOutput.trim().split('\n').pop()!;
  const tarballPath = join(cliDir, tarballName);

  // Step 2: Create temp dir and install tarball
  const installDir = mkdtempSync(join(tmpdir(), 'maxsim-e2e-'));
  writeFileSync(join(installDir, 'package.json'), '{}');
  execSync(`npm install "${tarballPath}"`, {
    cwd: installDir,
    timeout: 120_000,
    stdio: 'pipe',
  });

  // Step 3: Run maxsimcli --claude --local to install MAXSIM files into installDir/.claude/
  const installCjs = join(installDir, 'node_modules', 'maxsimcli', 'dist', 'install.cjs');
  execSync(`node "${installCjs}" --claude --local`, {
    cwd: installDir,
    timeout: 30_000,
    stdio: 'pipe',
  });

  // Step 4: Expose paths to test files via provide()
  const toolsPath = join(installDir, '.claude', 'maxsim', 'bin', 'maxsim-tools.cjs');
  context.provide('installDir', installDir);
  context.provide('tarballPath', tarballPath);
  context.provide('toolsPath', toolsPath);

  // Return teardown function — Vitest calls this after all tests complete
  return () => {
    rmSync(installDir, { recursive: true, force: true });
    rmSync(tarballPath, { force: true });
  };
}
