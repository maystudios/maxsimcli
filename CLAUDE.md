# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

MAXSIM is a meta-prompting, context engineering, and spec-driven development system for Claude Code, OpenCode, Gemini CLI, and Codex. It solves "context rot" by offloading work to fresh-context subagents. Users install it via `npx maxsimcli@latest` and it installs command/workflow/agent files into their AI runtime's config directories.

## Commands

```bash
# Build all (cli + dashboard) — required before pushing
npm run build

# Build CLI only
npm run build:cli

# Build dashboard only
npm run build:dashboard

# Run unit tests
npm test

# Run e2e tests (requires build first)
cd packages/cli && npx vitest run --config vitest.e2e.config.ts

# Run a single test file
cd packages/cli && npx vitest run tests/pack.test.ts

# Lint (Biome)
npm run lint

# Run dashboard dev server
cd packages/dashboard && npm run dev
```

Tests use Vitest. The `packages/cli` package contains all test suites.

## Architecture

### Monorepo Structure

This is an **npm workspaces** monorepo with 3 packages:

| Package | Role |
|---------|------|
| `packages/cli` | Main package, published as `maxsimcli` to npm. Contains all core logic, adapters, hooks, CLI router, and installer. |
| `packages/dashboard` | Vite+React frontend + Express backend. Bundled into cli's `dist/assets/dashboard/` at build time. |
| `packages/website` | Marketing website (separate, not part of npm publish). |

Static assets (markdown commands, agents, workflows) live in `templates/` at the repo root.

### Delivery Mechanism

MAXSIM ships as an npm package that installs markdown files into AI runtime config directories:
- **Claude Code:** `~/.claude/commands/maxsim/`, `~/.claude/agents/`, `~/.claude/hooks/`
- **OpenCode/Gemini/Codex:** equivalent paths

The "runtime" for MAXSIM commands is the AI itself — commands are markdown prompts, not executable code.

### Three-Layer Structure

```
templates/commands/maxsim/*.md  ← User-facing command specs (30+ files, user types /maxsim:*)
templates/workflows/*.md        ← Implementation workflows (loaded via @path references)
templates/agents/*.md           ← Specialized subagent prompts (11 agents)
```

Commands load workflows which spawn agents. Agents call `cli.cjs` (the tools router) via the Bash tool.

### CLI Source Layout

All business logic lives in `packages/cli/src/`:

```
src/
├── cli.ts           ← Tools router (150+ commands, dispatches to core modules)
├── install.ts       ← npm install orchestration (runtime selection, file copying)
├── core/            ← Shared utilities (types, config, state, phase, roadmap, verify, etc.)
├── adapters/        ← Runtime adapters (Claude, OpenCode, Gemini, Codex)
└── hooks/           ← Compiled CLI hooks (statusline, context monitor, update check)
```

The core modules in `src/core/`:

| Module | Responsibility |
|--------|---------------|
| `core.ts` | Constants, git helpers, model resolution, phase sorting |
| `state.ts` | STATE.md CRUD, decisions, blockers, metrics |
| `phase.ts` | Phase add/insert/remove/complete lifecycle |
| `roadmap.ts` | Roadmap parsing, phase analysis |
| `verify.ts` | Plan structure and completeness checks |
| `config.ts` | `.planning/config.json` loading with defaults |
| `init.ts` | Context assembly for each workflow type |
| `template.ts` | Template scaffolding and filling |
| `milestone.ts` | Milestone completion and archiving |
| `commands.ts` | Utilities: slugs, timestamps, todos, history |
| `frontmatter.ts` | YAML frontmatter parsing |

Large outputs (>50KB) are written to a tmpfile and returned as `@file:/path` — this prevents overflow of the Claude Code Bash buffer.

### Build Pipeline

1. **tsdown** bundles `src/install.ts` → `dist/install.cjs` and `src/cli.ts` → `dist/cli.cjs`
2. **tsdown** also builds hooks from `src/hooks/` → `dist/assets/hooks/*.cjs`
3. **copy-assets.cjs** copies templates, dashboard build, CHANGELOG, and README into `dist/assets/`
4. Dashboard builds separately: Vite (client) + tsdown (server) → `dist/client/` + `dist/server.js`

### Data Structure in User Projects

MAXSIM creates a `.planning/` directory in user projects:

```
.planning/
├── config.json           # model_profile, workflow flags, branching strategy
├── PROJECT.md            # Vision (always loaded)
├── REQUIREMENTS.md       # v1/v2/out-of-scope requirements
├── ROADMAP.md            # Phase structure
├── STATE.md              # Memory: decisions, blockers, metrics
├── phases/
│   └── 01-Foundation/
│       ├── 01-CONTEXT.md        # User decisions
│       ├── 01-RESEARCH.md       # Phase findings
│       ├── 01-01-PLAN.md        # Task plan (numbered per attempt)
│       ├── 01-01-SUMMARY.md     # Completion record
│       ├── 01-VERIFICATION.md   # Verification results
│       └── 01-UAT.md            # User acceptance tests
└── todos/pending/ & todos/completed/
```

### Phase Numbering

Phases support decimal and letter suffixes: `01`, `01A`, `01B`, `01.1`, `01.2`. Sort order: `01 < 01A < 01B < 01.1`. The `normalizePhaseName()` and `comparePhaseNum()` functions in `core.ts` handle this.

### Dashboard Package

`packages/dashboard` is a Vite+React frontend with an Express backend (`server.ts`). It bundles to `dist/assets/dashboard/` in the CLI package and is served by `node .claude/dashboard/server.js` after install. It uses xterm.js for terminal emulation and WebSockets for real-time updates. Dashboard resolves `@maxsim/core` via path alias to `../cli/src/core/`.

### Model Profiles

Config `model_profile` maps to Claude models per agent type. Defined in `core.ts` as `MODEL_PROFILES`. Three tiers: `quality`, `balanced`, `budget`. Orchestrators use leaner models; planners/executors/debuggers use heavier models.

## Testing Patterns

Tests live in `packages/cli/tests/` and use Vitest:
- **Unit tests** (`vitest.config.ts`): `pack.test.ts` validates npm tarball contents
- **E2E tests** (`vitest.e2e.config.ts`): install, tools, and dashboard integration tests in `tests/e2e/`

## Pre-Push Build Verification

**MANDATORY: Always run `npm run build` locally and confirm it succeeds before pushing to `main`.**

```bash
npm run build
```

If the build fails: fix the issue, re-run the build to confirm it passes, then push.

## Git Workflow

Always **commit and push** after completing every change — fixes, features, refactors. Never leave work only committed locally. Every push to `main` triggers the CI/CD pipeline which publishes to npm (if the commit prefix warrants a version bump). This is intentional: users install via `npx maxsimcli@latest` and need fixes delivered immediately.

**Rule: No fix or improvement is done until it is pushed and published.**

### Conventional Commits

Use the following prefixes for all commit messages:

| Prefix | When to use |
|--------|-------------|
| `fix:` | Bug fix |
| `feat:` | New feature |
| `chore:` | Version bumps, build changes, non-functional maintenance |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change that's neither fix nor feature |
| `fix!:` / `feat!:` | Breaking change (adds `BREAKING CHANGE` to changelog) |

Example: `fix(install): copy maxsim-tools.cjs to bin/ during install`

### Publishing to npm

The GitHub Actions workflow (`publish.yml`) triggers on every push to `main` and is **fully automatic**:

| Commit prefix | Version bump |
|---------------|-------------|
| `fix:` | patch (1.0.8 → 1.0.9) |
| `feat:` | minor (1.0.8 → 1.1.0) |
| `feat!:` / `fix!:` | major (1.0.8 → 2.0.0) |
| `chore:`, `docs:`, `test:` | no bump, no publish |

`semantic-release` analyzes commits since the last git tag, bumps `packages/cli/package.json`, updates `CHANGELOG.md`, creates a GitHub release and git tag, then publishes to npm. **No manual version bumps needed.**

## Key Files for Common Tasks

- **Adding a new tool command:** `packages/cli/src/cli.ts` (dispatch switch), then the relevant module in `src/core/`
- **Adding a new workflow:** `templates/workflows/`, reference it from `templates/commands/maxsim/`
- **Adding a new agent:** `templates/agents/` directory
- **Changing model assignments:** `MODEL_PROFILES` in `packages/cli/src/core/core.ts`
- **Changing install behavior:** `packages/cli/src/install.ts`
- **Adding/modifying hooks:** `packages/cli/src/hooks/`
- **Dashboard development:** `packages/dashboard/src/`
