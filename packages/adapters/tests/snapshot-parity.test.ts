/**
 * Snapshot parity tests — verifies adapter output matches bin/install.js behavior.
 *
 * These tests are the precondition for deleting bin/install.js.
 * Each adapter's path resolution and content transformation must match
 * the baseline captured from install.js before install.js can be removed.
 *
 * All 4 adapters tested: Claude, OpenCode, Gemini, Codex.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as os from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ── Helpers ────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load baseline JSON with {HOME} placeholders resolved to actual homedir */
function loadBaseline(): Record<string, any> {
  const raw = readFileSync(
    path.join(__dirname, 'snapshots', 'install-js-baseline.json'),
    'utf8',
  );
  return JSON.parse(raw.replace(/\{HOME\}/g, os.homedir().replace(/\\/g, '/')));
}

// ── Reference functions extracted from bin/install.js ──
// These are copied verbatim to serve as the "source of truth" oracle.
// When an adapter matches these, it matches install.js.

function installJs_getDirName(runtime: string): string {
  if (runtime === 'opencode') return '.opencode';
  if (runtime === 'gemini') return '.gemini';
  if (runtime === 'codex') return '.codex';
  return '.claude';
}

function installJs_getConfigDirFromHome(runtime: string, isGlobal: boolean): string {
  if (!isGlobal) {
    return `'${installJs_getDirName(runtime)}'`;
  }
  if (runtime === 'opencode') return "'.config', 'opencode'";
  if (runtime === 'gemini') return "'.gemini'";
  if (runtime === 'codex') return "'.codex'";
  return "'.claude'";
}

function installJs_getGlobalDir_claude(explicitDir?: string | null): string {
  if (explicitDir) return explicitDir;
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return path.join(os.homedir(), '.claude');
}

// ── Environment safety ─────────────────────────────────

const ENV_KEYS = [
  'CLAUDE_CONFIG_DIR',
  'OPENCODE_CONFIG_DIR',
  'OPENCODE_CONFIG',
  'XDG_CONFIG_HOME',
  'GEMINI_CONFIG_DIR',
  'CODEX_HOME',
];

let savedEnv: Record<string, string | undefined> = {};

// ── Tests ──────────────────────────────────────────────

describe('Snapshot parity: adapter output vs install.js baseline', () => {
  let baseline: Record<string, any>;

  before(() => {
    // Save and clear env vars for deterministic tests
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    baseline = loadBaseline();
  });

  after(() => {
    // Restore env vars
    for (const key of ENV_KEYS) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  // ── Claude adapter ──────────────────────────────────

  describe('claude adapter', () => {
    let adapter: any;

    before(async () => {
      // Import the built CJS dist
      adapter = await import('../dist/claude.cjs');
      // Handle default export wrapping
      if (adapter.default?.claudeAdapter) {
        adapter = adapter.default;
      }
    });

    it('dirName matches install.js getDirName("claude")', () => {
      assert.equal(adapter.claudeAdapter.dirName, baseline.claude.dirName);
      assert.equal(adapter.claudeAdapter.dirName, installJs_getDirName('claude'));
    });

    it('getGlobalDir() default matches install.js', () => {
      const result = adapter.claudeAdapter.getGlobalDir();
      const expected = installJs_getGlobalDir_claude();
      // Normalize path separators for cross-platform
      assert.equal(
        result.replace(/\\/g, '/'),
        expected.replace(/\\/g, '/'),
      );
    });

    it('getGlobalDir("/explicit/path") matches install.js', () => {
      const result = adapter.claudeAdapter.getGlobalDir('/explicit/path');
      assert.equal(result, '/explicit/path');
    });

    it('getConfigDirFromHome(true) matches install.js global', () => {
      const result = adapter.claudeAdapter.getConfigDirFromHome(true);
      const expected = installJs_getConfigDirFromHome('claude', true);
      assert.equal(result, expected);
    });

    it('getConfigDirFromHome(false) matches install.js local', () => {
      const result = adapter.claudeAdapter.getConfigDirFromHome(false);
      const expected = installJs_getConfigDirFromHome('claude', false);
      assert.equal(result, expected);
    });

    it('transformContent matches install.js path replacement', () => {
      const { input, pathPrefix, expected } = baseline.claude.transformContent;
      const result = adapter.claudeAdapter.transformContent(input, pathPrefix);
      assert.equal(result, expected);
    });
  });

  // ── OpenCode adapter ────────────────────────────────

  describe('opencode adapter', () => {
    let adapter: any;

    before(async () => {
      adapter = await import('../dist/opencode.cjs');
      if (adapter.default?.opencodeAdapter) {
        adapter = adapter.default;
      }
    });

    it('dirName matches install.js getDirName("opencode")', () => {
      assert.equal(adapter.opencodeAdapter.dirName, baseline.opencode.dirName);
      assert.equal(adapter.opencodeAdapter.dirName, installJs_getDirName('opencode'));
    });

    it('getGlobalDir() default matches install.js', () => {
      const result = adapter.opencodeAdapter.getGlobalDir();
      assert.equal(
        result.replace(/\\/g, '/'),
        baseline.opencode.getGlobalDir.default.replace(/\\/g, '/'),
      );
    });

    it('getGlobalDir("/explicit/path") matches install.js', () => {
      const result = adapter.opencodeAdapter.getGlobalDir('/explicit/path');
      assert.equal(result, '/explicit/path');
    });

    it('getConfigDirFromHome(true) matches install.js global', () => {
      assert.equal(adapter.opencodeAdapter.getConfigDirFromHome(true), baseline.opencode.getConfigDirFromHome.global);
    });

    it('getConfigDirFromHome(false) matches install.js local', () => {
      assert.equal(adapter.opencodeAdapter.getConfigDirFromHome(false), baseline.opencode.getConfigDirFromHome.local);
    });

    it('transformContent (convertClaudeToOpencodeFrontmatter) matches install.js', () => {
      const { input, pathPrefix, expected } = baseline.opencode.transformContent;
      const result = adapter.opencodeAdapter.transformContent(input, pathPrefix);
      assert.equal(result, expected);
    });
  });

  // ── Gemini adapter ────────────────────────────────────

  describe('gemini adapter', () => {
    let adapter: any;

    before(async () => {
      adapter = await import('../dist/gemini.cjs');
      if (adapter.default?.geminiAdapter) {
        adapter = adapter.default;
      }
    });

    it('dirName matches install.js getDirName("gemini")', () => {
      assert.equal(adapter.geminiAdapter.dirName, baseline.gemini.dirName);
      assert.equal(adapter.geminiAdapter.dirName, installJs_getDirName('gemini'));
    });

    it('getGlobalDir() default matches install.js', () => {
      const result = adapter.geminiAdapter.getGlobalDir();
      assert.equal(
        result.replace(/\\/g, '/'),
        baseline.gemini.getGlobalDir.default.replace(/\\/g, '/'),
      );
    });

    it('getGlobalDir("/explicit/path") matches install.js', () => {
      const result = adapter.geminiAdapter.getGlobalDir('/explicit/path');
      assert.equal(result, '/explicit/path');
    });

    it('getConfigDirFromHome(true) matches install.js global', () => {
      assert.equal(adapter.geminiAdapter.getConfigDirFromHome(true), baseline.gemini.getConfigDirFromHome.global);
    });

    it('getConfigDirFromHome(false) matches install.js local', () => {
      assert.equal(adapter.geminiAdapter.getConfigDirFromHome(false), baseline.gemini.getConfigDirFromHome.local);
    });

    it('transformContent (convertClaudeToGeminiToml) matches install.js', () => {
      const { input, pathPrefix, expected } = baseline.gemini.transformContent;
      const result = adapter.geminiAdapter.transformContent(input, pathPrefix);
      assert.equal(result, expected);
    });
  });

  // ── Codex adapter ─────────────────────────────────────

  describe('codex adapter', () => {
    let adapter: any;

    before(async () => {
      adapter = await import('../dist/codex.cjs');
      if (adapter.default?.codexAdapter) {
        adapter = adapter.default;
      }
    });

    it('dirName matches install.js getDirName("codex")', () => {
      assert.equal(adapter.codexAdapter.dirName, baseline.codex.dirName);
      assert.equal(adapter.codexAdapter.dirName, installJs_getDirName('codex'));
    });

    it('getGlobalDir() default matches install.js', () => {
      const result = adapter.codexAdapter.getGlobalDir();
      assert.equal(
        result.replace(/\\/g, '/'),
        baseline.codex.getGlobalDir.default.replace(/\\/g, '/'),
      );
    });

    it('getGlobalDir("/explicit/path") matches install.js', () => {
      const result = adapter.codexAdapter.getGlobalDir('/explicit/path');
      assert.equal(result, '/explicit/path');
    });

    it('getConfigDirFromHome(true) matches install.js global', () => {
      assert.equal(adapter.codexAdapter.getConfigDirFromHome(true), baseline.codex.getConfigDirFromHome.global);
    });

    it('getConfigDirFromHome(false) matches install.js local', () => {
      assert.equal(adapter.codexAdapter.getConfigDirFromHome(false), baseline.codex.getConfigDirFromHome.local);
    });

    it('transformContent (convertClaudeCommandToCodexSkill) matches install.js', () => {
      const { input, pathPrefix, expected_contains } = baseline.codex.transformContent;
      const result = adapter.codexAdapter.transformContent(input, pathPrefix);
      for (const substr of expected_contains) {
        assert.ok(result.includes(substr), `Expected output to contain "${substr}"`);
      }
    });
  });
});
