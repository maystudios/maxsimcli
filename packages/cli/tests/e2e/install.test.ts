import { describe, it, expect } from 'vitest';
import { inject } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('install file structure (E2E-03)', () => {
  it('installs exactly 31 command .md files', () => {
    const installDir = inject('installDir');
    const commandsDir = join(installDir, '.claude', 'commands', 'maxsim');
    expect(existsSync(commandsDir)).toBe(true);
    const files = readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(31);
  });

  it('installs exactly 11 agent .md files', () => {
    const installDir = inject('installDir');
    const agentsDir = join(installDir, '.claude', 'agents');
    expect(existsSync(agentsDir)).toBe(true);
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(11);
  });

  it('installs maxsim-tools.cjs at expected path', () => {
    const toolsPath = inject('toolsPath');
    expect(existsSync(toolsPath)).toBe(true);
  });

  it('installs maxsim workflows directory', () => {
    const installDir = inject('installDir');
    const workflowsDir = join(installDir, '.claude', 'maxsim', 'workflows');
    expect(existsSync(workflowsDir)).toBe(true);
  });
});

describe('binary smoke test (E2E-04)', () => {
  it('node install.cjs --version exits 0 and prints semver', () => {
    const installDir = inject('installDir');
    const installCjs = join(installDir, 'node_modules', 'maxsimcli', 'dist', 'install.cjs');
    expect(existsSync(installCjs)).toBe(true);

    let output: string;
    expect(() => {
      output = execSync(`node "${installCjs}" --version`, {
        encoding: 'utf8',
        timeout: 10_000,
      });
    }).not.toThrow();

    // Semver pattern: digits.digits.digits (with optional pre-release)
    expect(output!.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
