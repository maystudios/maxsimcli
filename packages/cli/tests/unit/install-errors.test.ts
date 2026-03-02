/**
 * Error-path tests for install utilities.
 *
 * Covers verifyInstalled(), verifyFileInstalled(), safeRmDir(),
 * copyDirRecursive(), and manifest-related graceful failure handling.
 *
 * Note: shared.ts has a module-level pkg read from package.json relative to
 * __dirname. When running from source (not bundled dist/), this path does not
 * resolve, so we mock it to avoid the import-time error.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Mock the pkg constant that shared.ts reads at module-load time.
// The actual functions we test do not depend on pkg.
vi.mock('../../src/install/shared.js', async (importOriginal) => {
  // Create a temporary package.json so the module-level read succeeds
  const nodeFs = await import('node:fs');
  const nodePath = await import('node:path');
  const targetDir = nodePath.default.resolve(__dirname, '../../src');
  const targetFile = nodePath.default.join(targetDir, 'package.json');
  const needsCleanup = !nodeFs.default.existsSync(targetFile);
  if (needsCleanup) {
    nodeFs.default.writeFileSync(targetFile, JSON.stringify({ version: '0.0.0-test' }));
  }
  const mod = await importOriginal<typeof import('../../src/install/shared.js')>();
  if (needsCleanup) {
    try { nodeFs.default.unlinkSync(targetFile); } catch { /* ignore */ }
  }
  return mod;
});

// patches.ts imports from shared.js, so the mock above covers it too
const { verifyInstalled, verifyFileInstalled, safeRmDir, copyDirRecursive } = await import('../../src/install/shared.js');
const { saveLocalPatches } = await import('../../src/install/patches.js');
const { MANIFEST_NAME } = await import('../../src/install/manifest.js');

// Track temp dirs for cleanup
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maxsim-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
  tempDirs.length = 0;
});

// ─── verifyInstalled ────────────────────────────────────────────────────────

describe('verifyInstalled', () => {
  it('returns false for a nonexistent directory', () => {
    const result = verifyInstalled('/tmp/nonexistent-dir-xyz-999', 'test');
    expect(result).toBe(false);
  });

  it('returns false for an empty directory', () => {
    const dir = makeTempDir();
    const result = verifyInstalled(dir, 'test');
    expect(result).toBe(false);
  });

  it('returns true even when directory has unrelated files', () => {
    // verifyInstalled only checks existence + non-empty; it does not validate file names
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'wrong-file.txt'), 'content');
    const result = verifyInstalled(dir, 'test');
    expect(result).toBe(true);
  });

  it('returns true for a directory with files', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'file.md'), '# Test');
    expect(verifyInstalled(dir, 'commands')).toBe(true);
  });
});

// ─── verifyFileInstalled ────────────────────────────────────────────────────

describe('verifyFileInstalled', () => {
  it('returns false for a nonexistent file path', () => {
    const result = verifyFileInstalled('/tmp/nonexistent-file-xyz-999.json', 'settings');
    expect(result).toBe(false);
  });

  it('returns true for an existing file', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, 'settings.json');
    fs.writeFileSync(filePath, '{}');
    expect(verifyFileInstalled(filePath, 'settings')).toBe(true);
  });
});

// ─── safeRmDir ──────────────────────────────────────────────────────────────

describe('safeRmDir', () => {
  it('does not throw when given a nonexistent path', () => {
    expect(() => safeRmDir('/tmp/nonexistent-dir-xyz-999')).not.toThrow();
  });

  it('removes an existing directory', () => {
    const dir = makeTempDir();
    const subDir = path.join(dir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'file.txt'), 'data');

    safeRmDir(subDir);
    expect(fs.existsSync(subDir)).toBe(false);
  });
});

// ─── copyDirRecursive ───────────────────────────────────────────────────────

describe('copyDirRecursive', () => {
  it('throws when source directory does not exist', () => {
    const dest = makeTempDir();
    expect(() =>
      copyDirRecursive('/tmp/nonexistent-source-xyz-999', path.join(dest, 'out')),
    ).toThrow();
  });

  it('copies an existing directory', () => {
    const src = makeTempDir();
    fs.writeFileSync(path.join(src, 'a.txt'), 'hello');
    const dest = path.join(makeTempDir(), 'copy');

    copyDirRecursive(src, dest);
    expect(fs.existsSync(path.join(dest, 'a.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(dest, 'a.txt'), 'utf-8')).toBe('hello');
  });
});

// ─── Manifest corrupted JSON ────────────────────────────────────────────────

describe('saveLocalPatches with corrupted manifest', () => {
  it('returns empty array when manifest JSON is corrupted', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, MANIFEST_NAME), '{not valid json!!!');
    const result = saveLocalPatches(dir);
    expect(result).toEqual([]);
  });

  it('returns empty array when manifest file does not exist', () => {
    const dir = makeTempDir();
    const result = saveLocalPatches(dir);
    expect(result).toEqual([]);
  });

  it('returns empty array when manifest has no modified files', () => {
    const dir = makeTempDir();
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      files: {},
    };
    fs.writeFileSync(path.join(dir, MANIFEST_NAME), JSON.stringify(manifest));
    const result = saveLocalPatches(dir);
    expect(result).toEqual([]);
  });
});
