# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

MAXSIM is a meta-prompting, context engineering, and spec-driven development system for Claude Code, OpenCode, Gemini CLI, and Codex. It solves "context rot" by offloading work to fresh-context subagents. Users install it via `npx maxsimcli@latest` and it installs command/workflow/agent files into their AI runtime's config directories.

## Commands

```bash
# Run all tests
npm test

# Run a single test file
node --test tests/phase.test.cjs

# Build compiled hooks (required before publishing)
npm run build:hooks
```

Tests use Node.js built-in `node:test` — no test framework to install.

## Architecture

### Delivery Mechanism

MAXSIM ships as an npm package that installs markdown files into AI runtime config directories:
- **Claude Code:** `~/.claude/commands/maxsim/`, `~/.claude/agents/`, `~/.claude/hooks/`
- **OpenCode/Gemini/Codex:** equivalent paths

The "runtime" for MAXSIM commands is the AI itself — commands are markdown prompts, not executable code.

### Three-Layer Structure

```
commands/maxsim/*.md       ← User-facing command specs (30 files, user types /maxsim:*)
maxsim/workflows/*.md      ← Implementation workflows (loaded via @path references)
agents/*.md                ← Specialized subagent prompts (11 agents)
```

Commands load workflows which spawn agents. Agents call `maxsim-tools.cjs` via the Bash tool.

### The Tools Layer

`maxsim/bin/maxsim-tools.cjs` is the main CLI router — it dispatches to 11 lib modules:

| Module | Responsibility |
|--------|---------------|
| `core.cjs` | Constants, git helpers, model resolution, phase sorting |
| `state.cjs` | STATE.md CRUD, decisions, blockers, metrics |
| `phase.cjs` | Phase add/insert/remove/complete lifecycle |
| `roadmap.cjs` | Roadmap parsing, phase analysis |
| `verify.cjs` | Plan structure and completeness checks |
| `config.cjs` | `.planning/config.json` loading with defaults |
| `init.cjs` | Context assembly for each workflow type |
| `template.cjs` | Template scaffolding and filling |
| `milestone.cjs` | Milestone completion and archiving |
| `commands.cjs` | Utilities: slugs, timestamps, todos, history |
| `frontmatter.cjs` | YAML frontmatter parsing |

Large outputs (>50KB) are written to a tmpfile and returned as `@file:/path` — this prevents overflow of the Claude Code Bash buffer.

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

Phases support decimal and letter suffixes: `01`, `01A`, `01B`, `01.1`, `01.2`. Sort order: `01 < 01A < 01B < 01.1`. The `normalizePhaseName()` and `comparePhaseNum()` functions in `core.cjs` handle this.

### Model Profiles

Config `model_profile` maps to Claude models per agent type. Defined in `core.cjs` as `MODEL_PROFILES`. Three tiers: `quality`, `balanced`, `budget`. Orchestrators use leaner models; planners/executors/debuggers use heavier models.

## Testing Patterns

Tests use `createTempProject()` from `tests/helpers.cjs` which creates a temp dir with `.planning/phases/`. Tests call `runMaxsimTools(args, cwd)` which executes `maxsim/bin/maxsim-tools.cjs` directly via `execSync`.

```javascript
const { runMaxsimTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('feature', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => { cleanup(tmpDir); });

  test('does something', () => {
    const result = runMaxsimTools('command args', tmpDir);
    assert.ok(result.success);
  });
});
```

## Git Workflow

Always **commit and push** after completing a change. Never leave work only committed locally.

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

The README at the repo root is automatically copied into `packages/cli/` during `prepublishOnly` so it appears on the npm package page.

## Key Files for Common Tasks

- **Adding a new tool command:** `maxsim/bin/maxsim-tools.cjs` (dispatch switch), then the relevant lib module
- **Adding a new workflow:** `maxsim/workflows/`, reference it from `commands/maxsim/`
- **Adding a new agent:** `agents/` directory
- **Changing model assignments:** `MODEL_PROFILES` in `maxsim/bin/lib/core.cjs`
- **Changing install behavior:** `bin/install.js`
- **Hook compilation:** `scripts/build-hooks.js` → outputs to `hooks/dist/`
