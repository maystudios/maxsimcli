---
phase: 16-pack-install-tool-tests
type: verification
status: passed
verified: 2026-02-25
verifier: orchestrator
---

# Phase 16 Verification: Pack + Install + Tool Tests

## Goal

The full E2E pipeline runs — `npm pack` produces a local tarball, install writes files to a temp directory, and passing assertions prove exactly 31 commands, exactly 11 agents, binary execution, and correct tool behavior against a mock project fixture.

## Requirements Verified

| Req ID | Description | Status |
|--------|-------------|--------|
| E2E-02 | globalSetup runs npm pack + install via local tarball, never registry | PASSED |
| E2E-03 | install.test.ts: 31 commands, 11 agents, known workflow dir structure | PASSED |
| E2E-04 | Binary smoke: node install.cjs --version exits 0 with semver | PASSED |
| TOOL-01 | phases list, phase add, phase complete — all exit 0 | PASSED |
| TOOL-02 | state read, state add-decision, state add-blocker — all exit 0 | PASSED |
| TOOL-03 | roadmap analyze returns structured phase data | PASSED |
| TOOL-04 | list-todos returns fixture todo; todo complete moves to completed/ | PASSED |
| TOOL-05 | validate health returns valid status JSON | PASSED |
| TOOL-06 | createMockProject() is reusable shared helper in all test files | PASSED |

## Success Criteria Check

1. **globalSetup.ts runs npm pack from packages/cli/ and installs via local tarball**
   - PASSED: `packages/e2e/src/globalSetup.ts` uses `execSync('npm pack', { cwd: cliDir })`, `npm install "${tarballPath}"`, and `node install.cjs --claude --local`
   - context.provide() exposes installDir, toolsPath, tarballPath

2. **install.test.ts asserts exactly 31 command .md files, exactly 11 agent .md files, known workflow dir**
   - PASSED: Test asserts `toHaveLength(31)` for commands, `toHaveLength(11)` for agents, `existsSync(workflowsDir)` for workflows

3. **node install.cjs --version exits 0 from installed temp path**
   - PASSED: `--version` flag added to install.ts before banner. `node dist/install.cjs --version` outputs `1.2.3` cleanly.

4. **tools.test.ts runs commands against mock project fixture — all exit 0**
   - PASSED: 10 behavioral tests across TOOL-01 through TOOL-05 all pass. `npx vitest run` → 15/15 passed.

5. **Mock project fixture is a reusable shared helper**
   - PASSED: `packages/e2e/src/fixtures/mock-project.ts` exports `createMockProject()` and `MockProject` interface. Used in TOOL-01 through TOOL-05 describe blocks via `beforeEach`.

## Test Run Results

```
Test Files: 2 passed (2)
Tests:      15 passed (15)

install.test.ts: 5 tests (31 commands, 11 agents, tools path, workflows dir, --version)
tools.test.ts:   10 tests (phases list/add/complete, state read/decision/blocker, roadmap analyze, list-todos/complete, validate health)
```

## Notes

- The NX `e2e:e2e` target cannot be run directly on Windows because its `dependsOn` includes `dashboard:build` which requires `STANDALONE_BUILD=true` (Unix env var syntax). Tests validated via `npx vitest run` directly in `packages/e2e`. The NX target will work in CI where `STANDALONE_BUILD=true` is set correctly on the build step.
- `phase add` returns `{ phase_number, name, slug, directory }` not `{ added: true }` — plan assertion was updated to reflect actual API shape.
