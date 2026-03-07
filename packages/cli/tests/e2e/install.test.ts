import { describe, it, expect } from 'vitest';
import { inject } from 'vitest';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

describe('install file structure (E2E-03)', () => {
  it('installs exactly 35 command .md files', () => {
    const installDir = inject('installDir');
    const commandsDir = join(installDir, '.claude', 'commands', 'maxsim');
    expect(existsSync(commandsDir)).toBe(true);
    const files = readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(35);
  });

  it('installs exactly 13 agent .md files', () => {
    const installDir = inject('installDir');
    const agentsDir = join(installDir, '.claude', 'agents');
    expect(existsSync(agentsDir)).toBe(true);
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(14);
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

  it('installs skills directory with skill files', () => {
    const installDir = inject('installDir');
    const skillsDir = join(installDir, '.claude', 'skills');
    expect(existsSync(skillsDir)).toBe(true);
    const dirs = readdirSync(skillsDir);
    expect(dirs.length).toBeGreaterThanOrEqual(3);
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

describe('install real-world verification (E2E-05)', () => {
  it('installs mcp-server.cjs in bin directory', () => {
    const installDir = inject('installDir');
    const mcpPath = join(installDir, '.claude', 'maxsim', 'bin', 'mcp-server.cjs');
    expect(existsSync(mcpPath)).toBe(true);
  });

  it('creates .mcp.json with maxsim server config', () => {
    const installDir = inject('installDir');
    const mcpJsonPath = join(installDir, '.mcp.json');
    expect(existsSync(mcpJsonPath)).toBe(true);

    const mcpJson = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));
    expect(mcpJson).toHaveProperty('mcpServers.maxsim');
    expect(mcpJson.mcpServers.maxsim).toHaveProperty('command', 'node');
    expect(mcpJson.mcpServers.maxsim.args).toContain('.claude/maxsim/bin/mcp-server.cjs');
  });

  it('installs all 11 skill directories', () => {
    const installDir = inject('installDir');
    const skillsDir = join(installDir, '.claude', 'skills');
    expect(existsSync(skillsDir)).toBe(true);

    const skillDirs = readdirSync(skillsDir);
    expect(skillDirs.length).toBeGreaterThanOrEqual(11);

    // Verify key skills are present
    const expectedSkills = ['maxsim-simplify', 'tdd', 'systematic-debugging', 'verification-before-completion'];
    for (const skill of expectedSkills) {
      expect(skillDirs).toContain(skill);
    }
  });

  it('installs hook .js files', () => {
    const installDir = inject('installDir');
    const hooksDir = join(installDir, '.claude', 'hooks');
    expect(existsSync(hooksDir)).toBe(true);

    const hookFiles = readdirSync(hooksDir).filter((f) => f.endsWith('.js'));
    expect(hookFiles).toContain('maxsim-statusline.js');
    expect(hookFiles).toContain('maxsim-context-monitor.js');
    expect(hookFiles).toContain('maxsim-check-update.js');
  });

  it('creates settings.json with hook configuration', () => {
    const installDir = inject('installDir');
    const settingsPath = join(installDir, '.claude', 'settings.json');
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(settings).toHaveProperty('hooks');
  });

  it('installs dashboard files', () => {
    const installDir = inject('installDir');
    const dashboardDir = join(installDir, '.claude', 'dashboard');
    expect(existsSync(dashboardDir)).toBe(true);

    // Dashboard should have server.js
    expect(existsSync(join(dashboardDir, 'server.js'))).toBe(true);
    // Dashboard should have client/index.html
    expect(existsSync(join(dashboardDir, 'client', 'index.html'))).toBe(true);
  });
});
