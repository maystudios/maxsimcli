---
name: using-maxsim
description: Entry skill that establishes MAXSIM workflow rules — triggers before any action to route work through the correct MAXSIM commands, skills, and agents
---

# Using MAXSIM

MAXSIM is a spec-driven development system. Work flows through phases, plans, and tasks — not ad-hoc coding.

**If you are about to write code without a plan, STOP. Route through MAXSIM first.**

## The Iron Law

<HARD-GATE>
NO IMPLEMENTATION WITHOUT A PLAN.
If there is no .planning/ directory, run `/maxsim:init` first.
If there is no current phase, run `/maxsim:plan-phase` first.
If there is no PLAN.md for the current phase, run `/maxsim:plan-phase` first.
If there IS a plan, run `/maxsim:execute-phase` to execute it.
Skipping the workflow is a violation — not a shortcut.
</HARD-GATE>

## When This Skill Triggers

This skill applies to ALL work sessions. Before starting any task:

1. **Check for `.planning/` directory** — if missing, initialize with `/maxsim:init`
2. **Check STATE.md** — resume from last checkpoint if one exists
3. **Check current phase** — determine what phase is active in ROADMAP.md
4. **Route to the correct command** based on the situation (see routing table below)

## Routing Table

| Situation | Route To |
|-----------|----------|
| No `.planning/` directory | `/maxsim:init` |
| No ROADMAP.md or empty roadmap | `/maxsim:plan-roadmap` |
| Active phase has no PLAN.md | `/maxsim:plan-phase` |
| Active phase has PLAN.md, not started | `/maxsim:execute-phase` |
| Checkpoint exists in STATE.md | `/maxsim:resume-work` |
| Bug found during execution | `/maxsim:debug` (triggers systematic-debugging skill) |
| Phase complete, needs verification | `/maxsim:verify-phase` (triggers verification-before-completion skill) |
| Quick standalone task | `/maxsim:quick` |
| User asks for help | `/maxsim:help` |

## Available Skills

Skills are behavioral rules that activate automatically based on context:

| Skill | Triggers When |
|-------|---------------|
| `systematic-debugging` | Any bug, test failure, or unexpected behavior encountered |
| `tdd` | Implementing any feature or bug fix (write test first) |
| `verification-before-completion` | Before claiming any work is complete or passing |
| `memory-management` | Recurring patterns, errors, or decisions worth persisting |
| `using-maxsim` | Always — entry point for all MAXSIM work |

## Available Agents

Agents are specialized subagent prompts spawned by MAXSIM commands:

| Agent | Purpose | Triggered By |
|-------|---------|-------------|
| `maxsim-executor` | Executes plans with atomic commits | `/maxsim:execute-phase` |
| `maxsim-planner` | Creates structured PLAN.md files | `/maxsim:plan-phase` |
| `maxsim-debugger` | Investigates bugs systematically | `/maxsim:debug` |
| `maxsim-verifier` | Verifies phase goal achievement | `/maxsim:verify-phase` |
| `maxsim-roadmapper` | Creates project roadmaps | `/maxsim:plan-roadmap` |
| `maxsim-phase-researcher` | Researches phase requirements | `/maxsim:plan-phase` |
| `maxsim-code-reviewer` | Reviews code changes | `/maxsim:review` |
| `maxsim-spec-reviewer` | Reviews specifications | `/maxsim:plan-roadmap` |
| `maxsim-plan-checker` | Validates plan completeness | `/maxsim:plan-phase` |
| `maxsim-project-researcher` | Researches project context | `/maxsim:init` |
| `maxsim-research-synthesizer` | Synthesizes research findings | `/maxsim:plan-phase` |
| `maxsim-codebase-mapper` | Maps codebase structure | `/maxsim:init` |
| `maxsim-integration-checker` | Checks integration points | `/maxsim:verify-phase` |

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "It's just a small fix" | Small fixes have context and consequences. Use `/maxsim:quick`. |
| "I know what to do, I don't need a plan" | Plans catch what you miss. The plan is the checkpoint. |
| "MAXSIM overhead is too much for this" | `/maxsim:quick` exists for lightweight tasks. Use it. |
| "I'll plan it in my head" | Plans in your head die with context. Write them down. |
| "The user said 'just do it'" | Route through `/maxsim:quick` — it is fast and still tracked. |

## Red Flags — STOP If You Catch Yourself:

- Writing implementation code without a PLAN.md
- Skipping `/maxsim:init` because "the project is simple"
- Ignoring STATE.md checkpoints from previous sessions
- Working outside the current phase without explicit user approval
- Making architectural decisions without documenting them in STATE.md
- Finishing work without running verification

**If any red flag triggers: STOP. Check the routing table. Follow the workflow.**

## Verification Checklist

Before ending any work session:

- [ ] All work was routed through MAXSIM commands (not ad-hoc)
- [ ] STATE.md reflects current progress and decisions
- [ ] Any bugs encountered were debugged systematically (not guessed)
- [ ] Tests were written before implementation (TDD)
- [ ] Completion claims have verification evidence
- [ ] Recurring patterns or errors were saved to memory

## Integration with CLAUDE.md

When a project has a `CLAUDE.md`, both apply:
- `CLAUDE.md` defines project-specific conventions (language, tools, style)
- MAXSIM skills define workflow rules (how work is structured and verified)
- If they conflict, `CLAUDE.md` project conventions take priority for code style; MAXSIM takes priority for workflow structure
