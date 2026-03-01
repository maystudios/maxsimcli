import * as fs from 'node:fs';
import * as path from 'node:path';

import chalk from 'chalk';

import type { RuntimeName } from '../adapters/index.js';
import { MANIFEST_NAME, fileHash } from './manifest.js';
import type { Manifest } from './manifest.js';

export const PATCHES_DIR_NAME = 'maxsim-local-patches';

interface BackupMeta {
  backed_up_at: string;
  from_version: string;
  files: string[];
}

/**
 * Detect user-modified MAXSIM files by comparing against install manifest.
 */
export function saveLocalPatches(configDir: string): string[] {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  let manifest: Manifest;
  try {
    manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as Manifest;
  } catch {
    return [];
  }

  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const modified: string[] = [];

  for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
    const fullPath = path.join(configDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const currentHash = fileHash(fullPath);
    if (currentHash !== originalHash) {
      const backupPath = path.join(patchesDir, relPath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);
      modified.push(relPath);
    }
  }

  if (modified.length > 0) {
    const meta: BackupMeta = {
      backed_up_at: new Date().toISOString(),
      from_version: manifest.version,
      files: modified,
    };
    fs.writeFileSync(
      path.join(patchesDir, 'backup-meta.json'),
      JSON.stringify(meta, null, 2),
    );
    console.log(
      '  ' +
        chalk.yellow('i') +
        '  Found ' +
        modified.length +
        ' locally modified MAXSIM file(s) \u2014 backed up to ' +
        PATCHES_DIR_NAME +
        '/',
    );
    for (const f of modified) {
      console.log('     ' + chalk.dim(f));
    }
  }
  return modified;
}

/**
 * After install, report backed-up patches for user to reapply.
 */
export function reportLocalPatches(
  configDir: string,
  runtime: RuntimeName = 'claude',
): string[] {
  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const metaPath = path.join(patchesDir, 'backup-meta.json');
  if (!fs.existsSync(metaPath)) return [];

  let meta: BackupMeta;
  try {
    meta = JSON.parse(
      fs.readFileSync(metaPath, 'utf8'),
    ) as BackupMeta;
  } catch {
    return [];
  }

  if (meta.files && meta.files.length > 0) {
    const reapplyCommand =
      runtime === 'opencode'
        ? '/maxsim-reapply-patches'
        : runtime === 'codex'
          ? '$maxsim-reapply-patches'
          : '/maxsim:reapply-patches';
    console.log('');
    console.log(
      '  ' +
        chalk.yellow('Local patches detected') +
        ' (from v' +
        meta.from_version +
        '):',
    );
    for (const f of meta.files) {
      console.log('     ' + chalk.cyan(f));
    }
    console.log('');
    console.log(
      '  Your modifications are saved in ' +
        chalk.cyan(PATCHES_DIR_NAME + '/'),
    );
    console.log(
      '  Run ' +
        chalk.cyan(reapplyCommand) +
        ' to merge them into the new version.',
    );
    console.log('  Or manually compare and merge the files.');
    console.log('');
  }
  return meta.files || [];
}
