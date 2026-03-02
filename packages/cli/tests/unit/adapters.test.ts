/**
 * Pre-removal adapter tests.
 *
 * Verifies base utilities, the Claude adapter, and the adapter registry
 * before non-Claude runtimes are removed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  expandTilde,
  extractFrontmatterAndBody,
  processAttribution,
  buildHookCommand,
  readSettings,
  writeSettings,
} from '../../src/adapters/base.js';

import { claudeAdapter } from '../../src/adapters/claude.js';

// ─── Base utilities ──────────────────────────────────────────────────────────

describe('expandTilde', () => {
  it('expands ~/path to homedir/path', () => {
    const result = expandTilde('~/foo/bar');
    expect(result).toBe(path.join(os.homedir(), 'foo/bar'));
  });

  it('returns non-tilde paths unchanged', () => {
    expect(expandTilde('/absolute/path')).toBe('/absolute/path');
    expect(expandTilde('relative/path')).toBe('relative/path');
  });

  it('returns empty string unchanged', () => {
    expect(expandTilde('')).toBe('');
  });

  it('does not expand tilde in the middle of a path', () => {
    expect(expandTilde('/some/~/path')).toBe('/some/~/path');
  });
});

describe('extractFrontmatterAndBody', () => {
  it('extracts frontmatter and body from valid markdown', () => {
    const content = '---\ntitle: Hello\n---\nBody content';
    const result = extractFrontmatterAndBody(content);
    expect(result.frontmatter).toBe('title: Hello');
    expect(result.body).toBe('\nBody content');
  });

  it('returns null frontmatter when content does not start with ---', () => {
    const content = 'No frontmatter here';
    const result = extractFrontmatterAndBody(content);
    expect(result.frontmatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it('returns null frontmatter when closing --- is missing', () => {
    const content = '---\ntitle: Hello\nNo closing fence';
    const result = extractFrontmatterAndBody(content);
    expect(result.frontmatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it('handles empty frontmatter', () => {
    const content = '------\nBody';
    const result = extractFrontmatterAndBody(content);
    expect(result.frontmatter).toBe('');
    expect(result.body).toBe('\nBody');
  });
});

describe('processAttribution', () => {
  const content = 'Some commit message\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

  it('removes Co-Authored-By lines when attribution is null', () => {
    const result = processAttribution(content, null);
    expect(result).toBe('Some commit message');
    expect(result).not.toContain('Co-Authored-By');
  });

  it('keeps content unchanged when attribution is undefined', () => {
    const result = processAttribution(content, undefined);
    expect(result).toBe(content);
  });

  it('replaces Co-Authored-By name when attribution is a string', () => {
    const result = processAttribution(content, 'Custom Author <custom@example.com>');
    expect(result).toContain('Co-Authored-By: Custom Author <custom@example.com>');
    expect(result).not.toContain('Claude');
  });

  it('handles content without Co-Authored-By lines gracefully', () => {
    const plain = 'No attribution here';
    expect(processAttribution(plain, null)).toBe(plain);
    expect(processAttribution(plain, undefined)).toBe(plain);
    expect(processAttribution(plain, 'Someone')).toBe(plain);
  });
});

describe('buildHookCommand', () => {
  it('constructs a node command with forward slashes', () => {
    const result = buildHookCommand('/home/user/.claude', 'statusline.cjs');
    expect(result).toBe('node "/home/user/.claude/hooks/statusline.cjs"');
  });

  it('converts backslashes to forward slashes', () => {
    const result = buildHookCommand('C:\\Users\\me\\.claude', 'hook.cjs');
    expect(result).toBe('node "C:/Users/me/.claude/hooks/hook.cjs"');
  });
});

describe('readSettings / writeSettings', () => {
  let tmpDir: string;
  let settingsPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maxsim-test-'));
    settingsPath = path.join(tmpDir, 'settings.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('readSettings returns empty object for non-existent file', () => {
    expect(readSettings(settingsPath)).toEqual({});
  });

  it('writeSettings creates a JSON file and readSettings reads it back', () => {
    const data = { key: 'value', nested: { a: 1 } };
    writeSettings(settingsPath, data);
    const result = readSettings(settingsPath);
    expect(result).toEqual(data);
  });

  it('readSettings returns empty object for invalid JSON', () => {
    fs.writeFileSync(settingsPath, 'not json');
    expect(readSettings(settingsPath)).toEqual({});
  });

  it('writeSettings formats JSON with 2-space indent and trailing newline', () => {
    writeSettings(settingsPath, { a: 1 });
    const raw = fs.readFileSync(settingsPath, 'utf8');
    expect(raw).toBe('{\n  "a": 1\n}\n');
  });
});

// ─── Claude adapter ──────────────────────────────────────────────────────────

describe('claudeAdapter', () => {
  it('has dirName ".claude"', () => {
    expect(claudeAdapter.dirName).toBe('.claude');
  });

  it('has runtime "claude"', () => {
    expect(claudeAdapter.runtime).toBe('claude');
  });

  it('has commandStructure "nested"', () => {
    expect(claudeAdapter.commandStructure).toBe('nested');
  });

  describe('transformContent', () => {
    it('replaces ~/.claude/ references with the given path prefix', () => {
      const content = 'Run node ~/.claude/hooks/status.cjs';
      const result = claudeAdapter.transformContent(content, '/custom/path/');
      expect(result).toBe('Run node /custom/path/hooks/status.cjs');
    });

    it('keeps ./.claude/ references as-is', () => {
      const content = 'See ./.claude/config.json';
      const result = claudeAdapter.transformContent(content, '/custom/');
      expect(result).toBe('See ./.claude/config.json');
    });

    it('handles content with no path references', () => {
      const content = 'Plain text with no paths';
      const result = claudeAdapter.transformContent(content, '/prefix/');
      expect(result).toBe(content);
    });
  });

  describe('getGlobalDir', () => {
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.CLAUDE_CONFIG_DIR;
      } else {
        process.env.CLAUDE_CONFIG_DIR = originalEnv;
      }
    });

    it('returns explicit dir when provided', () => {
      const result = claudeAdapter.getGlobalDir('/explicit/dir');
      expect(result).toBe('/explicit/dir');
    });

    it('expands tilde in explicit dir', () => {
      const result = claudeAdapter.getGlobalDir('~/myconfig');
      expect(result).toBe(path.join(os.homedir(), 'myconfig'));
    });

    it('falls back to CLAUDE_CONFIG_DIR env var', () => {
      process.env.CLAUDE_CONFIG_DIR = '/from/env';
      const result = claudeAdapter.getGlobalDir();
      expect(result).toBe('/from/env');
    });

    it('defaults to ~/.claude when no explicit dir or env var', () => {
      delete process.env.CLAUDE_CONFIG_DIR;
      const result = claudeAdapter.getGlobalDir();
      expect(result).toBe(path.join(os.homedir(), '.claude'));
    });
  });
});

// ─── Adapter registry (post-cleanup: Claude-only) ───────────────────────────

describe('claudeAdapter (registry)', () => {
  it('Claude adapter satisfies the AdapterConfig interface', () => {
    expect(typeof claudeAdapter.runtime).toBe('string');
    expect(typeof claudeAdapter.dirName).toBe('string');
    expect(typeof claudeAdapter.getGlobalDir).toBe('function');
    expect(typeof claudeAdapter.getConfigDirFromHome).toBe('function');
    expect(typeof claudeAdapter.transformContent).toBe('function');
    expect(claudeAdapter.commandStructure).toBe('nested');
  });
});
