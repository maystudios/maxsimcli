---
title: "Wire E2E suite into GitHub Actions as publish gate"
plan: 19-01-PLAN.md
completed_at: 2026-02-25
requirements_completed: [CI-01]
---

# Summary: Phase 19 — Plan 01

## What Was Done

Split `.github/workflows/publish.yml` from a single `release` job into two jobs:

1. **`e2e` job** — builds the project (`STANDALONE_BUILD: 'true'`) then runs `npx nx run e2e:e2e`
2. **`release` job** — unchanged original steps, plus `needs: e2e` so GitHub Actions skips it when E2E fails

## Verification

- [x] `e2e` job exists with Build step (`STANDALONE_BUILD: 'true'`) and E2E Tests step (`npx nx run e2e:e2e`)
- [x] `release` job has `needs: e2e`
- [x] `release` job checkout has `fetch-depth: 0` and `token: ${{ secrets.GITHUB_TOKEN }}`
- [x] `release` job node setup has `registry-url: https://registry.npmjs.org`
- [x] Workflow-level `concurrency` (`group: release`, `cancel-in-progress: false`) preserved
- [x] All four `permissions` entries preserved (`contents`, `issues`, `pull-requests`, `id-token`)

## Files Modified

- `.github/workflows/publish.yml`
