<div align="center">

# MAXSIM

**A meta-prompting, context engineering, and spec-driven development system for Claude Code, OpenCode, Gemini CLI, and Codex.**

**Solves context rot — the quality degradation that happens as Claude fills its context window.**

[![npm version](https://img.shields.io/npm/v/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![npm downloads](https://img.shields.io/npm/dm/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![GitHub stars](https://img.shields.io/github/stars/maystudios/maxsim?style=for-the-badge&logo=github&color=181717)](https://github.com/maystudios/maxsim)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

[![Website](https://img.shields.io/badge/Website-maxsimcli.dev-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://maxsimcli.dev/)
[![Documentation](https://img.shields.io/badge/Documentation-maxsimcli.dev%2Fdocs-6366f1?style=for-the-badge&logo=readthedocs&logoColor=white)](https://maxsimcli.dev/docs)

<br>

```bash
npx maxsimcli@latest
```

**Works on Mac, Windows, and Linux.**

</div>

---

## Getting Started

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

## Live Dashboard

MAXSIM ships with a real-time web dashboard — bundled inside the CLI, no separate setup needed.

```bash
npx maxsimcli dashboard
```

The dashboard opens in your browser and updates instantly as `.planning/` files change via WebSocket.

**Dashboard features:**
- **Phase overview** — progress bars, milestone stats, and completion percentage
- **Phase drill-down** — expand any phase to see individual plan tasks with toggleable checkboxes
- **Inline Markdown editor** — edit plan files directly in the browser (CodeMirror, Ctrl+S to save)
- **Todos panel** — create, complete, and delete todos
- **Blockers panel** — view and resolve blockers from STATE.md
- **STATE.md editor** — edit project state inline
- **Auto-launches** during `/maxsim:execute-phase` so you always have a live view
- **Idempotent** — running the command again when a server is already up does nothing
- **LAN sharing** — share your dashboard with teammates on the same network

### Network / LAN Sharing

```bash
npx maxsimcli dashboard --network
```

Enables LAN sharing so anyone on your local network (or Tailscale VPN) can open the dashboard in their browser. MAXSIM:

- Detects your local IP and Tailscale IP automatically
- Configures firewall rules on Windows (`netsh`) and Linux (`ufw`/`iptables`) with one command
- Generates a **QR code** so you can open the dashboard on your phone in seconds

---

## How It Works

### 1. Initialize Project

```
/maxsim:new-project
```

Questions → Research → Requirements → Roadmap. One command captures your idea, scopes v1/v2, and creates a phased build plan.

### 2. Discuss Phase

```
/maxsim:discuss-phase 1
```

Shape the implementation before anything gets built. The system identifies gray areas and asks until your vision is clear.

### 3. Plan Phase

```
/maxsim:plan-phase 1
```

Researches how to implement, creates atomic task plans, and verifies them against requirements.

### 4. Execute Phase

```
/maxsim:execute-phase 1
```

Runs plans in parallel waves with fresh context per plan. Each task gets its own atomic commit. Verifies the codebase delivers what the phase promised.

### 5. Verify Work

```
/maxsim:verify-work 1
```

Walk through testable deliverables one by one. If something's broken, the system creates fix plans automatically.

### 6. Repeat → Ship

```
/maxsim:complete-milestone
/maxsim:new-milestone
```

Loop **discuss → plan → execute → verify** until done. Archive the milestone and start the next version.

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

The context bar in the statusline shows a 10-segment progress indicator that turns red and blinks when context is above 95% — giving you a clear signal to spawn a new session before quality degrades.

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

## Acknowledgments

Inspired by [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done).

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built and maintained by [MayStudios](https://github.com/maystudios).**

</div>
