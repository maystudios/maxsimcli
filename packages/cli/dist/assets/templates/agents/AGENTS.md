# AGENTS.md — Agent-Skill Registry

Maps MAXSIM agents to the skills they auto-load and enforce during execution. Skills are behavioral rules loaded once at agent startup from `SKILL.md` in each skill directory.

### Auto-Trigger Skills

Skills with `alwaysApply: true` load automatically at conversation start:

| Skill | Purpose |
|-------|---------|
| `using-maxsim` | Routes all work through MAXSIM commands |

## Registry

| Agent | Skills | Role |
|-------|--------|------|
| `maxsim-executor` | `tdd`, `verification-before-completion`, `using-maxsim` | Implements plan tasks with TDD and verified completion |
| `maxsim-debugger` | `systematic-debugging`, `verification-before-completion` | Investigates bugs via reproduce-hypothesize-isolate-verify-fix cycle |
| `maxsim-verifier` | `verification-before-completion` | Checks phase goal achievement with fresh evidence |
| `maxsim-planner` | `using-maxsim` | Creates executable PLAN.md files for phases |
| `maxsim-plan-checker` | `verification-before-completion` | Verifies plans achieve phase goal before execution |
| `maxsim-code-reviewer` | `verification-before-completion` | Reviews implementation for code quality with evidence |
| `maxsim-spec-reviewer` | `verification-before-completion` | Reviews implementation for spec compliance |
| `maxsim-roadmapper` | `using-maxsim` | Creates project roadmaps with phase breakdown and requirement mapping |
| `maxsim-phase-researcher` | `memory-management` | Researches phase implementation domain for planning context |
| `maxsim-project-researcher` | `memory-management` | Researches project domain ecosystem during init |
| `maxsim-research-synthesizer` | `memory-management` | Synthesizes parallel research outputs into unified findings |
| `maxsim-codebase-mapper` | `memory-management` | Maps codebase structure, patterns, and conventions |
| `maxsim-integration-checker` | `verification-before-completion` | Validates cross-component integration with tested evidence |

## Skill Reference

| Skill | Directory | Purpose |
|-------|-----------|---------|
| `systematic-debugging` | `skills/systematic-debugging/` | Root cause investigation before fixes |
| `tdd` | `skills/tdd/` | Failing test before implementation |
| `verification-before-completion` | `skills/verification-before-completion/` | Evidence before completion claims |
| `using-maxsim` | `skills/using-maxsim/` | Workflow routing and structure (alwaysApply) |
| `memory-management` | `skills/memory-management/` | Pattern and error persistence |
| `brainstorming` | `skills/brainstorming/` | Multi-approach exploration before design |
| `roadmap-writing` | `skills/roadmap-writing/` | Phased planning with success criteria |
| `simplify` | `skills/simplify/` | Code simplification and cleanup |
| `code-review` | `skills/code-review/` | Implementation quality review |
