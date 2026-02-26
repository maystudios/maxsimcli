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
3. **Dashboard network access** — Optionally expose the dashboard on your local network (adds firewall rule)

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

```bash
npx maxsimcli dashboard
```

MAXSIM includes a real-time web dashboard. Auto-installed during `npx maxsimcli@latest` — no separate setup needed.

```bash
npx maxsimcli dashboard           # Launch locally (localhost only)
npx maxsimcli dashboard --network # Launch on local network (phone/tablet access)
```

The dashboard auto-detects a free port starting from 3333 and opens your browser automatically. It watches `.planning/` for file changes and updates in real-time via WebSocket.

**Overview & Progress**
- Milestone progress bar with phase completion stats
- Current phase indicator, active blockers count, pending todos count
- Phase list with disk-status indicators (complete / partial / planned)
- Phase drill-down with plan tasks and progress

**Plan Editing**
- Inline CodeMirror Markdown editor for `.planning/` files
- Ctrl+S to save, unsaved-changes indicator

**Todos & Blockers**
- Create, complete, and reopen todos
- View and resolve blockers from `STATE.md`
- Add decisions and blockers via built-in state editor

**Integrated Terminal**
- Full terminal emulation via xterm.js (WebGL rendering)
- Quick command bar with configurable preset commands
- Split-mode: terminal and dashboard side by side
- Status bar showing process PID, uptime, memory, working directory
- Stop / Restart process controls

**Local Network Sharing**
- Enable during install or with `--network` flag at launch
- Exposes dashboard on your local network (e.g. `http://192.168.1.x:3333`)
- QR code button in sidebar — scan to open on phone or tablet
- OS-specific firewall rule applied automatically (Windows UAC elevation, Linux ufw/iptables, macOS no-op)

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

## Acknowledgments

Inspired by [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done).

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built and maintained by [MayStudios](https://github.com/maystudios).**

</div>
