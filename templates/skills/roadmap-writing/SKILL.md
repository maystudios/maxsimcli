---
name: roadmap-writing
description: Use when creating or restructuring a project roadmap — requires phased planning with dependencies, success criteria, and MAXSIM-compatible format
---

# Roadmap Writing

A roadmap without success criteria is a wish list. Define what done looks like for every phase.

**If a phase does not have measurable success criteria, it is not a plan — it is a hope.**

## The Iron Law

<HARD-GATE>
NO PHASE WITHOUT SUCCESS CRITERIA AND DEPENDENCIES.
Every phase MUST have: a number, a name, a goal, success criteria (testable statements), and explicit dependencies.
"We'll figure it out as we go" is not planning — it is drifting.
Violating this rule is a violation — not flexibility.
</HARD-GATE>

## The Gate Function

Follow these steps IN ORDER when creating or restructuring a roadmap.

### 1. SCOPE — Understand the Project

Before writing phases, understand what you are planning:

- Read PROJECT.md for vision and constraints
- Read REQUIREMENTS.md for v1/v2/out-of-scope boundaries
- Check existing STATE.md for decisions and blockers
- Identify the delivery target (MVP, v1, v2, etc.)

```bash
# Load project context
node ~/.claude/maxsim/bin/maxsim-tools.cjs state read --raw

# Check existing roadmap (if any)
node ~/.claude/maxsim/bin/maxsim-tools.cjs roadmap read --raw
```

### 2. DECOMPOSE — Break Into Phases

Each phase should be:

| Property | Requirement |
|----------|------------|
| **Independently deliverable** | The phase produces a working increment — not a half-built feature |
| **1-3 days of work** | Larger phases should be split; smaller ones should be merged |
| **Clear boundary** | You can tell when the phase is done without ambiguity |
| **Ordered by dependency** | No phase depends on a later phase |

**Phase numbering convention:**

| Format | When to Use |
|--------|------------|
| `01`, `02`, `03` | Standard sequential phases |
| `01A`, `01B` | Parallel sub-phases that can execute concurrently |
| `01.1`, `01.2` | Sequential sub-phases within a parent phase |

Sort order: `01 < 01A < 01B < 01.1 < 01.2 < 02`

### 3. DEFINE — Write Each Phase

Every phase MUST include all of these fields:

```markdown
### Phase {number}: {name}
**Goal**: {one sentence — what this phase achieves}
**Depends on**: {phase numbers, or "Nothing" for the first phase}
**Requirements**: {requirement IDs from REQUIREMENTS.md, if applicable}
**Success Criteria** (what must be TRUE):
  1. {Testable statement — can be verified with a command, test, or inspection}
  2. {Testable statement}
  3. {Testable statement}
**Plans**: TBD
```

**Success criteria rules:**
- Each criterion must be testable — "code is clean" is not testable; "no lint warnings" is testable
- Include at least 2 criteria per phase
- At least one criterion should be verifiable by running a command (test, build, lint)
- Criteria describe the END STATE, not the process ("tests pass" not "write tests")

### 4. CONNECT — Map Dependencies

Draw the dependency graph:
- Which phases can run in parallel? (Use letter suffixes: `03A`, `03B`)
- Which phases are strictly sequential? (Use number suffixes: `03.1`, `03.2`)
- Are there any circular dependencies? (This is a design error — restructure)

**Rule: Every phase except the first must declare at least one dependency.**

### 5. MILESTONE — Group Into Milestones

Group phases into milestones that represent user-visible releases:

```markdown
## Milestones

- **v1.0 MVP** — Phases 1-4
- **v1.1 Polish** — Phases 5-7
- **v2.0 Scale** — Phases 8-10
```

Each milestone should be a coherent deliverable that could ship independently.

### 6. WRITE — Produce the Roadmap

Assemble the complete ROADMAP.md:

```markdown
# Roadmap: {project name}

## Overview

{2-3 sentences: what the project is, what this roadmap covers, delivery strategy}

## Milestones

- {emoji} **{milestone name}** — Phases {range} ({status})

## Phases

- [ ] **Phase {N}: {name}** - {one-line summary}

## Phase Details

### Phase {N}: {name}
**Goal**: ...
**Depends on**: ...
**Requirements**: ...
**Success Criteria** (what must be TRUE):
  1. ...
**Plans**: TBD
```

### 7. VALIDATE — Check the Roadmap

Before finalizing, verify:

```bash
# Write the roadmap (creates or overwrites .planning/ROADMAP.md)
# Then verify phase structure
node ~/.claude/maxsim/bin/maxsim-tools.cjs roadmap read --raw
```

| Check | How to Verify |
|-------|--------------|
| Every phase has success criteria | Read each phase detail section |
| Dependencies are acyclic | Trace the dependency chain — no loops |
| Phase numbering is sequential | Numbers increase, no gaps larger than 1 |
| Milestones cover all phases | Every phase appears in exactly one milestone |
| Success criteria are testable | Each criterion can be verified by command, test, or inspection |

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "We don't know enough to plan" | Plan what you know. Unknown phases get a research spike first. |
| "The roadmap will change anyway" | Plans change — that is expected. No plan guarantees drift. |
| "Success criteria are too rigid" | Vague criteria are useless. Rigid criteria are adjustable. |
| "One big phase is simpler" | Big phases hide complexity and delay feedback. Split them. |
| "Dependencies are obvious" | Obvious to you now. Not obvious to the agent running phase 5 next week. |
| "We'll add details later" | Later never comes. Write the details now while context is fresh. |

## Red Flags — STOP If You Catch Yourself:

- Writing a phase without success criteria
- Creating phases longer than 3 days of work
- Skipping dependency declarations
- Writing vague criteria like "code is good" or "feature works"
- Creating circular dependencies between phases
- Putting all work in one or two massive phases

**If any red flag triggers: STOP. Review the phase structure and fix it.**

## Verification Checklist

Before finalizing a roadmap, confirm:

- [ ] Every phase has a number, name, goal, dependencies, and success criteria
- [ ] Success criteria are testable (verifiable by command, test, or inspection)
- [ ] Dependencies form a DAG (no circular dependencies)
- [ ] Phase numbering follows MAXSIM convention (01, 01A, 01B, 01.1, etc.)
- [ ] Phases are 1-3 days of work each
- [ ] Milestones group phases into coherent deliverables
- [ ] ROADMAP.md matches the expected format for MAXSIM CLI parsing
- [ ] Overview section summarizes the project and delivery strategy

## In MAXSIM Plan Execution

Roadmap writing integrates with the MAXSIM lifecycle:
- Use during project initialization (`/maxsim:plan-phase`) to create the initial roadmap
- Use when restructuring after a significant scope change or pivot
- The roadmap is read by MAXSIM agents via `roadmap read` — format compliance is mandatory
- Phase numbering must be parseable by `normalizePhaseName()` and `comparePhaseNum()` in core
- Config `model_profile` in `.planning/config.json` affects agent assignment per phase
