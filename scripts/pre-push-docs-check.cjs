#!/usr/bin/env node
/**
 * Pre-push doc consistency check.
 * Validates structural invariants between ROADMAP.md and phase directories.
 * Exit 0 = all checks pass. Exit 1 = inconsistency found.
 */
const fs = require('fs');
const path = require('path');

const PLANNING_DIR = path.join(__dirname, '..', '.planning');
const ROADMAP_PATH = path.join(PLANNING_DIR, 'ROADMAP.md');
const PHASES_DIR = path.join(PLANNING_DIR, 'phases');

const errors = [];

// --- Read ROADMAP.md ---
let roadmap;
try {
  roadmap = fs.readFileSync(ROADMAP_PATH, 'utf8');
} catch (e) {
  console.log('SKIP: No .planning/ROADMAP.md found');
  process.exit(0);
}

if (!fs.existsSync(PHASES_DIR)) {
  console.log('SKIP: No .planning/phases/ directory found');
  process.exit(0);
}

// --- Parse phase checkboxes from ROADMAP.md ---
// Matches lines like: - [x] **Phase 15: E2E Package Scaffold**
const phaseCheckboxRe = /^- \[([ x])\] \*\*Phase (\d+[A-Za-z]?(?:\.\d+)?):?\s+(.+?)\*\*/gm;
const roadmapPhases = new Map(); // phaseNum -> { checked, name }
let match;
while ((match = phaseCheckboxRe.exec(roadmap)) !== null) {
  roadmapPhases.set(match[2], { checked: match[1] === 'x', name: match[3].trim() });
}

// --- Scan phase directories ---
const phaseDirs = fs.readdirSync(PHASES_DIR).filter(d => {
  return fs.statSync(path.join(PHASES_DIR, d)).isDirectory();
});

// Deduplicate: pick the directory with the most files per phase number
const phaseNumToDirs = new Map();
for (const dir of phaseDirs) {
  const phaseNum = dir.match(/^(\d+[A-Za-z]?(?:\.\d+)?)-/)?.[1];
  if (!phaseNum) continue;
  if (!phaseNumToDirs.has(phaseNum)) phaseNumToDirs.set(phaseNum, []);
  phaseNumToDirs.get(phaseNum).push(dir);
}

const canonicalDirs = [];
for (const [, dirs] of phaseNumToDirs) {
  if (dirs.length === 1) {
    canonicalDirs.push(dirs[0]);
  } else {
    // Pick the one with the most files
    dirs.sort((a, b) => {
      const aCount = fs.readdirSync(path.join(PHASES_DIR, a)).length;
      const bCount = fs.readdirSync(path.join(PHASES_DIR, b)).length;
      return bCount - aCount;
    });
    canonicalDirs.push(dirs[0]);
  }
}

for (const dir of canonicalDirs) {
  const phaseNum = dir.match(/^(\d+[A-Za-z]?(?:\.\d+)?)-/)?.[1];
  if (!phaseNum) continue;

  const fullDir = path.join(PHASES_DIR, dir);
  const files = fs.readdirSync(fullDir);
  const summaries = files.filter(f => f.includes('SUMMARY'));
  const plans = files.filter(f => f.includes('PLAN') && !f.includes('SUMMARY'));
  const hasSummary = summaries.length > 0;

  const roadmapEntry = roadmapPhases.get(phaseNum);
  if (!roadmapEntry) continue; // Phase not in ROADMAP (e.g. v1.0 archived phases)

  // Check 1: Phase marked [x] must have at least one SUMMARY
  if (roadmapEntry.checked && !hasSummary) {
    errors.push(`Phase ${phaseNum} marked [x] in ROADMAP but has no SUMMARY.md in ${dir}/`);
  }

  // Check 2: Phase with all plans having SUMMARYs should be [x] (only if all plans done)
  if (hasSummary && plans.length > 0 && summaries.length >= plans.length && !roadmapEntry.checked) {
    errors.push(`Phase ${phaseNum} has ${summaries.length} SUMMARY files (all plans done) but is not marked [x] in ROADMAP`);
  }
}

// --- Parse plan checkboxes from ROADMAP.md ---
// Matches: - [x] 16-01-PLAN.md
const planCheckboxRe = /^- \[([ x])\] (\d+[A-Za-z]?(?:\.\d+)?)-(\d+)-PLAN\.md/gm;
while ((match = planCheckboxRe.exec(roadmap)) !== null) {
  const checked = match[1] === 'x';
  const phaseNum = match[2];
  const planNum = match[3];
  const planId = `${phaseNum}-${planNum}`;

  // Find the canonical phase directory
  const phaseDir = canonicalDirs.find(d => d.startsWith(`${phaseNum}-`));
  if (!phaseDir) continue;

  const summaryFile = `${planId}-SUMMARY.md`;
  const summaryExists = fs.existsSync(path.join(PHASES_DIR, phaseDir, summaryFile));

  // Check 3: Plan marked [x] must have SUMMARY
  if (checked && !summaryExists) {
    errors.push(`Plan ${planId} marked [x] in ROADMAP but ${summaryFile} not found in ${phaseDir}/`);
  }

  // Check 4: Plan with SUMMARY should be [x]
  if (!checked && summaryExists) {
    errors.push(`Plan ${planId} has ${summaryFile} but is not marked [x] in ROADMAP`);
  }
}

// --- Report ---
if (errors.length > 0) {
  console.error('DOC CONSISTENCY CHECK FAILED:\n');
  errors.forEach(e => console.error(`  - ${e}`));
  console.error(`\n${errors.length} issue(s) found. Fix before pushing.`);
  process.exit(1);
} else {
  console.log('Doc consistency check passed.');
  process.exit(0);
}
