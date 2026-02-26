<div align="center">

# MAXSIM

**Your AI coding assistant is forgetting things. MAXSIM fixes that.**

As Claude fills its context window, code quality degrades — wrong decisions, repeated mistakes, lost intent.
MAXSIM solves this by offloading work to fresh-context subagents, each with a single responsibility and no memory of the mess before.

[![npm version](https://img.shields.io/npm/v/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![npm downloads](https://img.shields.io/npm/dm/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![GitHub stars](https://img.shields.io/github/stars/maystudios/maxsimcli?style=for-the-badge&logo=github&logoColor=white&color=24292e)](https://github.com/maystudios/maxsimcli)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

<br>

[![Website](https://img.shields.io/badge/Website-maxsimcli.dev-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://maxsimcli.dev/)
[![Docs](https://img.shields.io/badge/Docs-maxsimcli.dev%2Fdocs-6366f1?style=for-the-badge&logo=readthedocs&logoColor=white)](https://maxsimcli.dev/docs)

<br>

```bash
npx maxsimcli@latest
```

**Works with Claude Code, OpenCode, Gemini CLI, and Codex — on Mac, Windows, and Linux.**

> ⚠️ **Early Alpha** — APIs, commands, and workflows may change between releases. Expect rough edges.

</div>

---

## The Problem in 30 Seconds

You start a session with Claude. The first 20 minutes are great. Then it starts forgetting your architecture decisions. It repeats the same mistakes. Output quality drops. You start a new session and lose all context.

This is **context rot** — and it gets worse the bigger your project is.

**MAXSIM fixes this** by breaking your build into phases, planning each one independently, and running each task in a fresh subagent with only the context it needs. No rot. No drift. Consistent quality from phase 1 to phase 50.

---

## Try It in 1 Minute

```bash
# Install
npx maxsimcli@latest

# In Claude Code, start a new project:
/maxsim:new-project

# Or jump straight to planning a phase:
/maxsim:plan-phase 1

# Execute it:
/maxsim:execute-phase 1
```

That's the loop. Discuss → Plan → Execute → Verify. Each phase is isolated, each task gets a fresh agent, every change gets an atomic commit.

---

## Who Is This For

**Individual developers** who want to ship complex projects with Claude without losing coherence over long sessions.

**Teams** who want a shared structure for AI-assisted development — consistent planning, traceable decisions, reproducible phases.

**AI-heavy projects** (SaaS, CLIs, data pipelines) where a single Claude session can't hold the full project context.

**Not a fit if** your project is a single file, a one-shot script, or you just want quick answers from Claude — MAXSIM is a workflow system, not a chat interface.

---

## How It Works

MAXSIM installs 30+ slash commands into your AI runtime. Each command is a structured workflow that spawns specialized subagents with fresh context.

### The Core Loop

**1. Initialize your project**
```
/maxsim:new-project
```
Answer a few questions → MAXSIM researches your domain, scopes v1/v2, and creates a phased roadmap in `.planning/`.

**2. Discuss a phase** _(optional but recommended)_
```
/maxsim:discuss-phase 1
```
Shape the implementation before anything gets built. Surfaces gray areas and locks in decisions.

**3. Plan the phase**
```
/maxsim:plan-phase 1
```
Research agent investigates. Planner creates atomic task plans. Plan-checker verifies them. You get a PLAN.md ready to execute.

**4. Execute**
```
/maxsim:execute-phase 1
```
Plans run in parallel waves. Each task gets its own fresh executor agent and atomic git commit. Verifier checks the codebase delivered what the phase promised.

**5. Verify**
```
/maxsim:verify-work 1
```
Walk through testable deliverables. Broken things get fix plans automatically.

**6. Repeat until shipped**
```
/maxsim:complete-milestone
/maxsim:new-milestone
```

---

## Real-World CLI Flow

```
You: /maxsim:new-project
MAXSIM: Tell me about your project...
You: A CLI tool that converts PDFs to structured JSON using AI
MAXSIM: [spawns 4 research agents in parallel]
        [synthesizes findings]
        [creates REQUIREMENTS.md and ROADMAP.md with 8 phases]
        Phase 1: PDF parsing + text extraction
        Phase 2: AI-powered structure detection
        ...

You: /maxsim:plan-phase 1
MAXSIM: [research agent investigates pdf libraries]
        [planner creates 3 atomic task plans]
        [plan-checker verifies feasibility]
        Ready. Run /maxsim:execute-phase 1

You: /maxsim:execute-phase 1
MAXSIM: [wave 1: executor installs dependencies, commits]
        [wave 2: executor implements PDF reader, commits]
        [wave 3: executor adds tests, commits]
        [verifier confirms phase goal achieved]
        ✓ Phase 1 complete. 3 commits. Dashboard updated.
```

---

## Live Dashboard

```bash
npx maxsimcli dashboard
```

Real-time web dashboard — bundled inside the CLI, no separate setup needed.

- **Phase overview** — progress bars, milestone stats, completion percentage
- **Phase drill-down** — expand phases to see individual tasks with checkboxes
- **Inline Markdown editor** — edit plan files directly in the browser (CodeMirror, Ctrl+S)
- **Todos & Blockers** — manage todos and resolve blockers from STATE.md
- **Auto-launches** during `/maxsim:execute-phase` so you always have a live view
- **LAN sharing** — share with teammates on the same network

```bash
npx maxsimcli dashboard --network  # LAN sharing + QR code
```

![MAXSIM Dashboard — Phase Overview](https://raw.githubusercontent.com/maystudios/maxsimcli/main/assets/dashboard-phases.png)

![MAXSIM Dashboard — Integrated Terminal](https://raw.githubusercontent.com/maystudios/maxsimcli/main/assets/dashboard-terminal.png)

---

## Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `/maxsim:new-project` | Initialize: questions → research → requirements → roadmap |
| `/maxsim:discuss-phase [N]` | Capture implementation decisions before planning |
| `/maxsim:plan-phase [N]` | Research + plan + verify for a phase |
| `/maxsim:execute-phase <N>` | Execute plans in parallel waves |
| `/maxsim:verify-work [N]` | User acceptance testing |
| `/maxsim:complete-milestone` | Archive milestone, tag release |
| `/maxsim:new-milestone` | Start next version |

### Navigation & Utilities

| Command | Description |
|---------|-------------|
| `/maxsim:progress` | Where am I? What's next? |
| `/maxsim:help` | Show all commands |
| `/maxsim:quick` | Ad-hoc task with atomic commits (skips optional agents) |
| `/maxsim:debug [desc]` | Systematic debugging with persistent state |
| `/maxsim:map-codebase` | Analyze existing codebase with parallel mapper agents |
| `/maxsim:pause-work` | Create handoff when stopping mid-phase |
| `/maxsim:resume-work` | Restore from last session |
| `/maxsim:roadmap` | Display the full project roadmap |
| `/maxsim:health [--repair]` | Diagnose and auto-repair `.planning/` directory |
| `/maxsim:update` | Check and install MAXSIM updates |

### Phase Management

| Command | Description |
|---------|-------------|
| `/maxsim:add-phase` | Append phase to roadmap |
| `/maxsim:insert-phase [N]` | Insert urgent work between phases (decimal numbering) |
| `/maxsim:remove-phase [N]` | Remove future phase, renumber |
| `/maxsim:list-phase-assumptions [N]` | Surface Claude's assumptions before planning |
| `/maxsim:research-phase [N]` | Standalone phase research |

### Milestone & Quality

| Command | Description |
|---------|-------------|
| `/maxsim:audit-milestone` | Audit completion against original intent before archiving |
| `/maxsim:plan-milestone-gaps` | Create phases for all gaps found by audit |
| `/maxsim:add-tests <N>` | Generate tests from UAT criteria and implementation |
| `/maxsim:cleanup` | Archive accumulated phase directories |

### Todos

| Command | Description |
|---------|-------------|
| `/maxsim:add-todo` | Capture idea as a todo from current conversation |
| `/maxsim:check-todos` | List pending todos and select one to work on |

### Live Dashboard

| Command | Description |
|---------|-------------|
| `npx maxsimcli dashboard` | Launch the real-time web dashboard |
| `npx maxsimcli dashboard --network` | Launch with LAN/Tailscale sharing + QR code |
| `npx maxsimcli dashboard --stop` | Shut down the running dashboard server |

### Settings

| Command | Description |
|---------|-------------|
| `/maxsim:settings` | Configure model profile and workflow agent toggles |
| `/maxsim:set-profile <profile>` | Switch model profile |
| `/maxsim:reapply-patches` | Reapply local modifications after a MAXSIM update |

---

## Installation

```bash
npx maxsimcli@latest
```

The installer prompts you to choose:
1. **Runtime** — Claude Code, OpenCode, Gemini, Codex, or all
2. **Location** — Global (all projects) or local (current project only)

Verify with:
- Claude Code / Gemini: `/maxsim:help`
- OpenCode: `/maxsim-help`
- Codex: `$maxsim-help`

<details>
<summary><strong>Non-interactive Install (Docker, CI, Scripts)</strong></summary>

```bash
npx maxsimcli --claude --global    # Claude Code → ~/.claude/
npx maxsimcli --opencode --global  # OpenCode → ~/.config/opencode/
npx maxsimcli --gemini --global    # Gemini CLI → ~/.gemini/
npx maxsimcli --codex --global     # Codex → ~/.codex/
npx maxsimcli --all --global       # All runtimes
```

Add `--local` instead of `--global` for project-scoped installs.

</details>

---

## Configuration

Project settings live in `.planning/config.json`, created during `/maxsim:new-project` or editable via `/maxsim:settings`.

```json
{
  "model_profile": "balanced",
  "branching_strategy": "none",
  "commit_docs": true,
  "research": true,
  "plan_checker": true,
  "verifier": true,
  "parallelization": true,
  "brave_search": false
}
```

| Key | Values | Default | Description |
|-----|--------|---------|-------------|
| `model_profile` | `quality` \| `balanced` \| `budget` \| `tokenburner` | `balanced` | Which models agents use |
| `branching_strategy` | `none` \| `phase` \| `milestone` | `none` | Git branch creation per phase or milestone |
| `commit_docs` | boolean | `true` | Commit documentation changes separately |
| `research` | boolean | `true` | Enable research agent before planning |
| `plan_checker` | boolean | `true` | Enable plan-checker agent before execution |
| `verifier` | boolean | `true` | Enable verifier agent after execution |
| `parallelization` | boolean | `true` | Enable wave-based parallel plan execution |
| `brave_search` | boolean | `false` | Enable Brave Search API in research agents |

### Model Profiles

MAXSIM has **4 model profiles** that control which Claude model each of the 11 specialized agents uses:

| Profile | Planners & Executors | Researchers | Orchestrators |
|---------|---------------------|-------------|---------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` *(default)* | Sonnet | Sonnet | Haiku |
| `budget` | Sonnet | Haiku | Haiku |
| `tokenburner` | **Opus everywhere** | **Opus everywhere** | **Opus everywhere** |

> `tokenburner` assigns Opus to every single agent. Use it when cost is no concern and you want maximum quality end-to-end.

Switch profiles at any time:

```bash
/maxsim:set-profile quality
/maxsim:set-profile balanced
/maxsim:set-profile budget
/maxsim:set-profile tokenburner
```

You can also override individual agents in `config.json`:

```json
{
  "model_profile": "balanced",
  "model_overrides": {
    "maxsim-planner": "opus",
    "maxsim-executor": "opus"
  }
}
```

---

## Hook System

MAXSIM installs three compiled hooks into Claude Code:

| Hook | Function |
|------|----------|
| `maxsim-statusline` | Status bar: model · task · directory · context usage bar |
| `maxsim-context-monitor` | Warns when context window is running low (35% / 25% thresholds) |
| `maxsim-check-update` | Periodic npm update check with statusline notification |

The context bar shows a 10-segment indicator that turns red and blinks above 95% — your signal to spawn a new session before quality degrades.

---

## Agents

11 specialized subagents, each with fresh context and a single responsibility:

| Agent | Role |
|-------|------|
| `maxsim-phase-researcher` | Researches how to implement a phase |
| `maxsim-project-researcher` | Domain research before roadmap creation |
| `maxsim-research-synthesizer` | Synthesizes parallel research outputs |
| `maxsim-planner` | Creates executable plans with task breakdown |
| `maxsim-roadmapper` | Creates project roadmaps with phase breakdown |
| `maxsim-plan-checker` | Verifies plans will achieve the phase goal |
| `maxsim-executor` | Implements plans with atomic commits |
| `maxsim-verifier` | Goal-backward verification after execution |
| `maxsim-debugger` | Scientific-method debugging with persistent state |
| `maxsim-integration-checker` | Verifies cross-phase integration and E2E flows |
| `maxsim-codebase-mapper` | Explores codebase and writes structured analysis |

---

## Contributing

MAXSIM is open source and contributions are welcome.

- **Bug reports:** [Open an issue](https://github.com/maystudios/maxsimcli/issues)
- **Feature requests:** [Start a discussion](https://github.com/maystudios/maxsimcli/discussions)
- **PRs:** Fork, branch, and open a pull request — see [CLAUDE.md](CLAUDE.md) for architecture overview

The "runtime" for MAXSIM is the AI itself — commands are markdown prompts in `templates/`, not compiled code. If you want to improve a workflow or add a command, you're editing markdown.

---

## Acknowledgments

Inspired by [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done).

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built and maintained by [MayStudios](https://github.com/maystudios).**

</div>
