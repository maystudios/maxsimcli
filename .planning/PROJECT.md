# MAXSIM

## What This Is

MAXSIM is a spec-driven development (SDD) system for Claude Code. It prevents context rot by offloading work to fresh-context subagents. Ships as an npm package (`maxsimcli`) that installs markdown commands, workflows, agents, and skills into `~/.claude/`. Users run `/maxsim:*` slash commands to plan, execute, and verify project phases.

## Core Value

Every AI-assisted coding task runs with the right amount of context -- no more, no less -- producing consistent, correct output from phase 1 to phase 50.

## Current State

MAXSIM is a working product at v5.0 with real users. Shipped v5.0 Context-Aware SDD on 2026-03-08. The following is implemented and shipped:

### CLI & Core Engine
- **CLI tools router** (`cli.cjs`) dispatching 150+ commands to core modules
- **Phase lifecycle**: create, list, complete, insert, remove phases with `.planning/` directory structure
- **State management**: STATE.md CRUD with decisions, blockers, metrics tracking
- **Roadmap parsing**: phase goal/criteria extraction, dependency analysis
- **Plan verification**: structure validation, health checks, auto-repair
- **Smart context loading**: topic-based file selection to prevent context overload
- **Model profiles**: quality/balanced/budget/tokenburner tiers with per-agent model resolution
- **Atomic git commits** per task with conventional commit format

### Agents (14 specialized subagent prompts)
- **Executor**: runs tasks with atomic commits and deviation handling
- **Planner**: creates phase plans with task breakdown and dependency analysis
- **Phase Researcher**: investigates implementation approaches before planning
- **Plan Checker**: verifies plans achieve phase goals before execution
- **Spec Reviewer**: checks implementation matches spec (stage 1 review)
- **Code Reviewer**: checks code quality, security, patterns (stage 2 review)
- **Verifier**: goal-backward phase verification
- **Debugger**: scientific method bug investigation
- **Codebase Mapper**: parallel codebase analysis (4 focus areas)
- **Research Synthesizer**: merges parallel research outputs
- **Roadmapper**: creates roadmaps with phase breakdown and success criteria
- **Project Researcher**: domain ecosystem research before roadmap creation
- **Integration Checker**: cross-phase E2E flow verification
- **Drift Checker**: spec-vs-codebase drift analysis with severity-tiered reporting

### Skills (11 built-in workflow enforcement skills)
- **using-maxsim**: entry point, routes work through MAXSIM workflow
- **tdd**: Red-Green-Refactor enforcement
- **systematic-debugging**: root-cause analysis before any fix
- **verification-before-completion**: evidence-first gates, blocks false completion claims
- **code-review**: security/correctness/quality gates
- **maxsim-simplify**: 3-reviewer parallel pattern (reuse, quality, efficiency)
- **maxsim-batch**: worktree-based parallel execution (5-30 agents)
- **sdd**: fresh subagent per task with mandatory 2-stage review
- **brainstorming**: hard-gate design approval with trade-off analysis
- **roadmap-writing**: standardized roadmap format generation
- **memory-management**: persistent pattern/error/decision storage

### Workflows (orchestration templates)
- **execute-phase**: wave-based parallel plan execution with Execute-Review-Simplify-Review cycle
- **plan-phase**: research -> plan -> verify loop
- **new-project**: vision -> requirements -> acceptance criteria -> roadmap
- **init-existing**: codebase scan -> validation -> context generation
- **discuss-phase**: adaptive questioning before planning
- **discuss**: triage problems/ideas/bugs to todo or phase with adaptive questioning
- **check-drift**: compare spec against codebase, produce severity-tiered drift report
- **realign**: correct spec-code divergence in either direction (to-code or to-spec)
- **sdd**: spec-driven dispatch with fresh agent per task
- **batch**: worktree-based parallel execution orchestration

### Dashboard
- **React 19 + Vite frontend** with phase overview, terminal (xterm.js), Q&A panel
- **Express + WebSocket backend** for real-time `.planning/` file watching
- **MCP server integration** for Claude Code tool access
- **`maxsimcli start`** launches Dashboard + MCP + Terminal
- **Multi-project** via port range isolation (3333-3343)

### Install System
- **`npx maxsimcli@latest`** installs commands, workflows, agents, skills to `~/.claude/`
- **Manifest tracking** with hash-based modification detection
- **Patch persistence** for user customizations across updates
- **Claude Code only** -- no multi-runtime selection

## Constraints

- **npm delivery**: everything must work via `npx maxsimcli@latest`
- **Backward compatibility**: existing `.planning/` directories must remain readable
- **Claude Code only**: no adapter abstractions for other runtimes
- **Build verification**: `npm run build` must pass before any push to main
- **Single-user**: no multi-user collaboration support planned

## Tech Stack

- TypeScript 5.9.3, Node.js 22+, npm workspaces monorepo
- React 19 + Vite for dashboard, tsdown for Node.js bundling
- Express + WebSockets for dashboard backend, MCP SDK for Claude integration
- Vitest for testing, Biome for linting, semantic-release for publishing

## Known Tech Debt

- Large monolithic modules: server.ts (1371 lines), verify.ts (965 lines), phase.ts (1193 lines)
- 5 `any` type usages across 4 files
- Mixed error handling: exceptions vs CmdResult vs CliOutput/CliError
- Sync/async file I/O inconsistency in CLI tool functions

---
*Last updated: 2026-03-08 after v5.0 milestone*
