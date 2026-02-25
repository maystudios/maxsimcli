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

/**
 * Hoist pnpm flat-store packages to top-level node_modules entries.
 *
 * pnpm stores packages at node_modules/.pnpm/<name>@<ver>/node_modules/<pkg>/
 * with top-level symlinks (node_modules/<pkg> -> .pnpm/.../node_modules/<pkg>).
 * Next.js standalone traces only real files from .pnpm/ but omits the symlinks,
 * breaking require() resolution. This function recreates the top-level entries
 * by copying from .pnpm/ into node_modules/<pkg>.
 */
function hoistPnpmPackages(nodeModulesDir) {
  const pnpmDir = path.join(nodeModulesDir, '.pnpm');
  if (!fs.existsSync(pnpmDir)) return;

  let hoisted = 0;
  for (const storeEntry of fs.readdirSync(pnpmDir)) {
    const innerNM = path.join(pnpmDir, storeEntry, 'node_modules');
    if (!fs.existsSync(innerNM)) continue;

    for (const pkg of fs.readdirSync(innerNM)) {
      // Skip the .pnpm virtual store link
      if (pkg === '.pnpm') continue;

      const pkgSrc = path.join(innerNM, pkg);
      const pkgDest = path.join(nodeModulesDir, pkg);

      // Skip if already exists at top level (first match wins, like pnpm hoisting)
      if (fs.existsSync(pkgDest)) continue;

      // Handle scoped packages: entry is @scope, contains actual package dirs
      if (pkg.startsWith('@') && fs.statSync(pkgSrc).isDirectory()) {
        for (const scopedPkg of fs.readdirSync(pkgSrc)) {
          const scopedSrc = path.join(pkgSrc, scopedPkg);
          const scopedDest = path.join(pkgDest, scopedPkg);
          if (!fs.existsSync(scopedDest) && fs.statSync(scopedSrc).isDirectory()) {
            fs.cpSync(scopedSrc, scopedDest, { recursive: true });
            hoisted++;
          }
        }
      } else if (fs.statSync(pkgSrc).isDirectory()) {
        fs.cpSync(pkgSrc, pkgDest, { recursive: true });
        hoisted++;
      }
    }
  }

  if (hoisted > 0) {
    console.log(`  [assets] Hoisted ${hoisted} packages from .pnpm/ to top-level node_modules/`);
  }
}

// 4. Copy dashboard standalone build into dist/assets/dashboard
const dashboardStandalone = path.join(monorepoRoot, 'packages', 'dashboard', '.next', 'standalone');
const dashboardStatic = path.join(monorepoRoot, 'packages', 'dashboard', '.next', 'static');
const dashboardPublic = path.join(monorepoRoot, 'packages', 'dashboard', 'public');
const dashboardDest = path.join(distAssetsDir, 'dashboard');

if (fs.existsSync(dashboardStandalone)) {
  // Use fs.cpSync for dashboard — standalone node_modules contain symlinks (pnpm)
  // that the simple copyDir function cannot handle (EISDIR on symlinked dirs)
  fs.cpSync(dashboardStandalone, dashboardDest, { recursive: true, dereference: true });
  console.log(`  [assets] Copied standalone build -> dist/assets/dashboard/`);

  // Hoist pnpm flat store packages to top-level node_modules entries.
  // Next.js standalone traces files from .pnpm/ but does NOT recreate pnpm's
  // top-level symlinks (e.g. node_modules/next -> .pnpm/next@.../node_modules/next).
  // Without hoisting, require("next") fails with MODULE_NOT_FOUND.
  hoistPnpmPackages(path.join(dashboardDest, 'node_modules'));

  // Copy static assets into the standalone .next/static (required by Next.js)
  if (fs.existsSync(dashboardStatic)) {
    const staticDest = path.join(dashboardDest, '.next', 'static');
    fs.cpSync(dashboardStatic, staticDest, { recursive: true });
    console.log(`  [assets] Copied static files -> dist/assets/dashboard/.next/static/`);
  }

  // Next.js standalone in monorepo mode does not copy all manifest files into the
  // nested .next/ dir (packages/dashboard/.next/). Without required-server-files.json
  // the server falls back to dev mode and fails. Copy all required files explicitly
  // using the files[] list from required-server-files.json.
  const dashboardAppSrc = path.join(monorepoRoot, 'packages', 'dashboard');
  const dashboardAppDest = path.join(dashboardDest, 'packages', 'dashboard');
  const requiredServerFilesSrc = path.join(dashboardAppSrc, '.next', 'required-server-files.json');
  if (fs.existsSync(requiredServerFilesSrc)) {
    const serverFilesData = JSON.parse(fs.readFileSync(requiredServerFilesSrc, 'utf8'));
    const filesToCopy = serverFilesData.files || [];
    let manifestCount = 0;
    for (const relFile of filesToCopy) {
      // Normalize path separators (Windows builds use backslashes, Linux uses forward)
      const normalizedRel = relFile.split(/[\\/]/).join(path.sep);
      const src = path.join(dashboardAppSrc, normalizedRel);
      const dst = path.join(dashboardAppDest, normalizedRel);
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        manifestCount++;
      }
    }
    if (manifestCount > 0) {
      console.log(`  [assets] Copied ${manifestCount} manifest files -> packages/dashboard/.next/`);
    }
  }

  // Copy public/ assets if they exist
  if (fs.existsSync(dashboardPublic)) {
    const publicDest = path.join(dashboardDest, 'public');
    fs.cpSync(dashboardPublic, publicDest, { recursive: true });
    console.log(`  [assets] Copied public files -> dist/assets/dashboard/public/`);
  }
} else {
  console.warn('  [warn] Dashboard standalone build not found, skipping. Run STANDALONE_BUILD=true nx build dashboard first.');
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
