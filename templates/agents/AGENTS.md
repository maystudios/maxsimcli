# AGENTS.md — Agent-Skill Registry

This file maps MAXSIM agents to the skills they should auto-load and enforce during execution.

## How This Registry Works

When a MAXSIM agent is spawned, it checks this registry to determine which skills apply. Skills are behavioral rules that constrain agent actions — they are not optional guidelines.

Agents load skills by reading `SKILL.md` from each skill directory listed in their entry below. Skills are loaded once at agent startup and enforced throughout the session.

## Registry

### maxsim-executor

**Skills:** `tdd`, `verification-before-completion`, `using-maxsim`

The executor implements plan tasks. TDD ensures tests are written before code. Verification ensures completion claims have evidence. Using-maxsim ensures work stays within the plan structure.

### maxsim-debugger

**Skills:** `systematic-debugging`, `verification-before-completion`

The debugger investigates bugs. Systematic-debugging enforces the reproduce-hypothesize-isolate-verify-fix cycle. Verification ensures the fix is confirmed with evidence before claiming resolution.

### maxsim-verifier

**Skills:** `verification-before-completion`

The verifier checks phase goal achievement. Verification-before-completion is its core purpose — every claim must have fresh evidence.

### maxsim-planner

**Skills:** `using-maxsim`

The planner creates PLAN.md files. Using-maxsim ensures plans reference the correct workflow structure and available skills.

### maxsim-code-reviewer

**Skills:** `verification-before-completion`

The code reviewer checks implementation quality. Verification ensures review findings are backed by evidence from the codebase, not assumptions.

### maxsim-roadmapper

**Skills:** `using-maxsim`

The roadmapper creates project roadmaps. Using-maxsim ensures roadmaps align with the MAXSIM phase structure.

### maxsim-phase-researcher

**Skills:** `memory-management`

The phase researcher gathers context for planning. Memory-management ensures valuable research findings are persisted for future sessions.

### maxsim-project-researcher

**Skills:** `memory-management`

The project researcher analyzes project structure during init. Memory-management ensures architectural patterns and conventions are saved.

### maxsim-integration-checker

**Skills:** `verification-before-completion`

The integration checker validates cross-component wiring. Verification ensures integration claims are tested, not assumed.

## Skill Reference

| Skill | Directory | Purpose |
|-------|-----------|---------|
| `systematic-debugging` | `skills/systematic-debugging/` | Root cause investigation before fixes |
| `tdd` | `skills/tdd/` | Failing test before implementation |
| `verification-before-completion` | `skills/verification-before-completion/` | Evidence before completion claims |
| `using-maxsim` | `skills/using-maxsim/` | Workflow routing and structure |
| `memory-management` | `skills/memory-management/` | Pattern and error persistence |

## Adding New Skills

1. Create a directory under `skills/` with a `SKILL.md` file
2. Follow the existing skill format (frontmatter + Iron Law + Gate Function + Red Flags)
3. Add the skill to the relevant agent entries in this registry
4. Add the skill to the reference table above
