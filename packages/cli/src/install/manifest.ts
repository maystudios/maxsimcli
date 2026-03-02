import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import type { RuntimeName } from '../adapters/index.js';
import { pkg } from './shared.js';
import { listCodexSkillNames } from './copy.js';

export const MANIFEST_NAME = 'maxsim-file-manifest.json';

/**
 * Compute SHA256 hash of file contents
 */
export function fileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collect all files in dir with their hashes
 */
export function generateManifest(
  dir: string,
  baseDir?: string,
): Record<string, string> {
  if (!baseDir) baseDir = dir;
  const manifest: Record<string, string> = {};
  if (!fs.existsSync(dir)) return manifest;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      Object.assign(manifest, generateManifest(fullPath, baseDir));
    } else {
      manifest[relPath] = fileHash(fullPath);
    }
  }
  return manifest;
}

export interface Manifest {
  version: string;
  timestamp: string;
  files: Record<string, string>;
}

/**
 * Write file manifest after installation for future modification detection
 */
export function writeManifest(
  configDir: string,
  runtime: RuntimeName = 'claude',
): Manifest {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const maxsimDir = path.join(configDir, 'maxsim');
  const commandsDir = path.join(configDir, 'commands', 'maxsim');
  const opencodeCommandDir = path.join(configDir, 'command');
  const codexSkillsDir = path.join(configDir, 'skills');
  const agentsDir = path.join(configDir, 'agents');
  const manifest: Manifest = {
    version: pkg.version,
    timestamp: new Date().toISOString(),
    files: {},
  };

  const maxsimHashes = generateManifest(maxsimDir);
  for (const [rel, hash] of Object.entries(maxsimHashes)) {
    manifest.files['maxsim/' + rel] = hash;
  }
  if (!isOpencode && !isCodex && fs.existsSync(commandsDir)) {
    const cmdHashes = generateManifest(commandsDir);
    for (const [rel, hash] of Object.entries(cmdHashes)) {
      manifest.files['commands/maxsim/' + rel] = hash;
    }
  }
  if (isOpencode && fs.existsSync(opencodeCommandDir)) {
    for (const file of fs.readdirSync(opencodeCommandDir)) {
      if (file.startsWith('maxsim-') && file.endsWith('.md')) {
        manifest.files['command/' + file] = fileHash(
          path.join(opencodeCommandDir, file),
        );
      }
    }
  }
  if (isCodex && fs.existsSync(codexSkillsDir)) {
    for (const skillName of listCodexSkillNames(codexSkillsDir)) {
      const skillRoot = path.join(codexSkillsDir, skillName);
      const skillHashes = generateManifest(skillRoot);
      for (const [rel, hash] of Object.entries(skillHashes)) {
        manifest.files[`skills/${skillName}/${rel}`] = hash;
      }
    }
  }
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (file.startsWith('maxsim-') && file.endsWith('.md')) {
        manifest.files['agents/' + file] = fileHash(
          path.join(agentsDir, file),
        );
      }
    }
  }
  // Include skills in manifest (agents/skills/<skill-name>/*)
  const skillsManifestDir = path.join(agentsDir, 'skills');
  if (fs.existsSync(skillsManifestDir)) {
    const skillHashes = generateManifest(skillsManifestDir);
    for (const [rel, hash] of Object.entries(skillHashes)) {
      manifest.files['agents/skills/' + rel] = hash;
    }
  }

  fs.writeFileSync(
    path.join(configDir, MANIFEST_NAME),
    JSON.stringify(manifest, null, 2),
  );
  return manifest;
}

/**
 * Read an existing manifest from the config directory, or return null if none exists / is invalid
 */
export function readManifest(configDir: string): Manifest | null {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  } catch {
    return null;
  }
}
