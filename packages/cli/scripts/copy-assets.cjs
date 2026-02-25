#!/usr/bin/env node
'use strict';

/**
 * Post-build asset copy for @maxsim/cli
 *
 * Copies template markdown files and compiled hooks into dist/assets/
 * so that the published npm package is fully self-contained.
 *
 * dist/assets/templates/  <- packages/templates/ (commands, agents, workflows, etc.)
 * dist/assets/hooks/      <- packages/hooks/dist/*.cjs (non-declaration files)
 * dist/assets/CHANGELOG.md <- CHANGELOG.md from monorepo root (if present)
 * dist/assets/dashboard/  <- packages/dashboard/dist/ (Vite client + bundled server.js)
 */

const fs = require('node:fs');
const path = require('node:path');

const pkgCliRoot = path.resolve(__dirname, '..');          // packages/cli
const monorepoRoot = path.resolve(pkgCliRoot, '..', '..'); // repo root
const distAssetsDir = path.join(pkgCliRoot, 'dist', 'assets');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  [warn] Source not found, skipping: ${src}`);
    return 0;
  }
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

// 1. Copy templates package root into dist/assets/templates
const templatesSrc = path.join(monorepoRoot, 'packages', 'templates');
const templatesDest = path.join(distAssetsDir, 'templates');
const templatesCount = copyDir(templatesSrc, templatesDest);
console.log(`  [assets] Copied ${templatesCount} files -> dist/assets/templates/`);

// 2. Copy hooks dist/*.cjs (non-declaration) into dist/assets/hooks
const hooksSrc = path.join(monorepoRoot, 'packages', 'hooks', 'dist');
const hooksDest = path.join(distAssetsDir, 'hooks');
fs.mkdirSync(hooksDest, { recursive: true });
let hooksCount = 0;
if (fs.existsSync(hooksSrc)) {
  for (const entry of fs.readdirSync(hooksSrc)) {
    if (entry.endsWith('.cjs') && !entry.includes('.d.')) {
      fs.copyFileSync(path.join(hooksSrc, entry), path.join(hooksDest, entry));
      hooksCount++;
    }
  }
}
console.log(`  [assets] Copied ${hooksCount} hook files -> dist/assets/hooks/`);

// 3. Copy CHANGELOG.md from monorepo root (optional)
const changelogSrc = path.join(monorepoRoot, 'CHANGELOG.md');
if (fs.existsSync(changelogSrc)) {
  fs.copyFileSync(changelogSrc, path.join(distAssetsDir, 'CHANGELOG.md'));
  console.log(`  [assets] Copied CHANGELOG.md -> dist/assets/`);
}

// 4. Copy dashboard Vite build into dist/assets/dashboard
// The Vite + Express migration produces:
//   packages/dashboard/dist/client/  <- Vite-built React app (static files)
//   packages/dashboard/dist/server.js <- tsdown-bundled Express server (self-contained)
// No node_modules/ needed — tsdown bundles all server deps inline.
const dashboardDist = path.join(monorepoRoot, 'packages', 'dashboard', 'dist');
const dashboardDest = path.join(distAssetsDir, 'dashboard');

if (fs.existsSync(dashboardDist)) {
  const serverJs = path.join(dashboardDist, 'server.js');
  const clientDir = path.join(dashboardDist, 'client');

  if (fs.existsSync(serverJs) && fs.existsSync(clientDir)) {
    // Clean dest to prevent stale files from old builds
    if (fs.existsSync(dashboardDest)) {
      fs.rmSync(dashboardDest, { recursive: true, force: true });
    }
    fs.mkdirSync(dashboardDest, { recursive: true });

    // Copy server.js
    fs.copyFileSync(serverJs, path.join(dashboardDest, 'server.js'));

    // Copy client/ directory (Vite static output)
    const clientCount = copyDir(clientDir, path.join(dashboardDest, 'client'));
    console.log(`  [assets] Copied dashboard: server.js + ${clientCount} client files -> dist/assets/dashboard/`);
  } else {
    console.warn('  [warn] Dashboard dist/ incomplete (missing server.js or client/), skipping. Run nx build dashboard first.');
  }
} else {
  console.warn('  [warn] Dashboard dist/ not found, skipping. Run nx build dashboard first.');
}

// 5. Copy root README.md into packages/cli/ so it's included in the npm tarball
// (npm "files" includes "README.md" which must be present at publish time)
const readmeSrc = path.join(monorepoRoot, 'README.md');
const readmeDest = path.join(pkgCliRoot, 'README.md');
if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, readmeDest);
  console.log(`  [assets] Copied README.md -> packages/cli/README.md`);
}

console.log('  [assets] Done.');
