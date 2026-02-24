<div align="center">

# MAXSIM

**A meta-prompting, context engineering, and spec-driven development system for Claude Code, OpenCode, Gemini CLI, and Codex.**

**Solves context rot — the quality degradation that happens as Claude fills its context window.**

[![npm version](https://img.shields.io/npm/v/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![npm downloads](https://img.shields.io/npm/dm/maxsimcli?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/maxsimcli)
[![GitHub stars](https://img.shields.io/github/stars/maystudios/maxsim?style=for-the-badge&logo=github&color=181717)](https://github.com/maystudios/maxsim)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

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
| `/maxsim:quick` | Ad-hoc task with atomic commits |
| `/maxsim:debug [desc]` | Systematic debugging with persistent state |
| `/maxsim:map-codebase` | Analyze existing codebase |
| `/maxsim:pause-work` | Create handoff when stopping mid-phase |
| `/maxsim:resume-work` | Restore from last session |

### Live Dashboard

| Command | Description |
|---------|-------------|
| `maxsim dashboard` | Launch the live project dashboard |
| `maxsim dashboard --stop` | Stop a running dashboard |

The dashboard is a real-time web UI that shows your project's progress as you work. It auto-launches during `/maxsim:execute-phase` or you can start it manually.

**Start the dashboard:**

```bash
# Via CLI (recommended)
maxsim dashboard

# Or directly for development
cd packages/dashboard && pnpm run dev
```

The dashboard auto-detects a free port (starting at 3333) and opens in your browser.

**Features:**
- Real-time updates via WebSocket — edit a `.planning/` file and the dashboard refreshes instantly
- Phase overview with animated progress bars and milestone stats
- Phase drill-down with plan tasks and toggleable checkboxes
- Inline CodeMirror Markdown editor for plan files (Ctrl+S to save)
- Todos panel — create, complete, and manage todos
- Blockers panel — view and resolve blockers from STATE.md
- Swiss Style Design dark theme

### Phase Management

| Command | Description |
|---------|-------------|
| `/maxsim:add-phase` | Append phase to roadmap |
| `/maxsim:insert-phase [N]` | Insert urgent work between phases |
| `/maxsim:remove-phase [N]` | Remove future phase, renumber |
| `/maxsim:settings` | Configure model profile and workflow agents |

---

## Configuration

Project settings live in `.planning/config.json`, created during `/maxsim:new-project` or editable via `/maxsim:settings`.

**Model Profiles** control which Claude model each agent uses:

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` (default) | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |

Switch with `/maxsim:set-profile <profile>`.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built and maintained by [MayStudios](https://github.com/maystudios).**

</div>
