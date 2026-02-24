/**
 * MAXSIM Tools Test Helpers (TypeScript)
 *
 * 1:1 port of tests/helpers.cjs with full type safety.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Absolute path to maxsim-tools.cjs entry point.
 * Three levels up from packages/core/tests/ to repo root.
 */
export const TOOLS_PATH = path.resolve(__dirname, '..', '..', '..', 'maxsim', 'bin', 'maxsim-tools.cjs');

export interface RunResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Run a maxsim-tools command and return structured result.
 */
export function runMaxsimTools(args: string, cwd?: string): RunResult {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd: cwd ?? process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
    return {
      success: false,
      output: e.stdout?.toString().trim() ?? '',
      error: e.stderr?.toString().trim() ?? e.message,
    };
  }
}

/**
 * Create a temporary project directory with .planning/phases/ structure.
 */
export function createTempProject(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maxsim-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

/**
 * Remove a temporary project directory.
 */
export function cleanup(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
