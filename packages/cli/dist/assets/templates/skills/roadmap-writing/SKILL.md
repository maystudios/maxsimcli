---
name: roadmap-writing
description: >-
  Creates structured project roadmaps with phased planning, dependency graphs,
  and testable success criteria in MAXSIM-compatible format. Use when creating a
  new roadmap, restructuring project phases, or planning milestones.
---

# Roadmap Writing

A roadmap without success criteria is a wish list. Define what done looks like for every phase.

**HARD GATE: No phase without success criteria and dependencies. Every phase must have a number, name, goal, testable success criteria, and explicit dependencies. Violating this rule is a violation, not flexibility.**

## Process

### 1. SCOPE -- Understand the Project

Before writing phases, understand what you are planning:

- Read PROJECT.md for vision and constraints
- Read REQUIREMENTS.md for v1/v2/out-of-scope boundaries
- Check existing STATE.md for decisions and blockers
- Identify the delivery target (MVP, v1, v2, etc.)

### 2. DECOMPOSE -- Break Into Phases

Each phase should be:

| Property | Requirement |
|----------|------------|
| **Independently deliverable** | The phase produces a working increment, not a half-built feature |
| **1-3 days of work** | Larger phases should be split; smaller ones should be merged |
| **Clear boundary** | You can tell when the phase is done without ambiguity |
| **Ordered by dependency** | No phase depends on a later phase |

Phase numbering convention:

| Format | When to Use |
|--------|------------|
| `01`, `02`, `03` | Standard sequential phases |
| `01A`, `01B` | Parallel sub-phases that can execute concurrently |
| `01.1`, `01.2` | Sequential sub-phases within a parent phase |

Sort order: `01` then `01A` then `01B` then `01.1` then `01.2` then `02`.

### 3. DEFINE -- Write Each Phase

Every phase must include all of these fields:

```markdown
### Phase {number}: {name}
**Goal**: {one sentence -- what this phase achieves}
**Depends on**: {phase numbers, or "Nothing" for the first phase}
**Requirements**: {requirement IDs from REQUIREMENTS.md, if applicable}
**Success Criteria** (what must be TRUE):
  1. {Testable statement -- can be verified with a command, test, or inspection}
  2. {Testable statement}
  3. {Testable statement}
**Plans**: TBD
```

Success criteria rules:
- Each criterion must be testable -- "code is clean" is not testable; "no lint warnings" is testable
- Include at least 2 criteria per phase
- At least one criterion should be verifiable by running a command (test, build, lint)
- Criteria describe the end state, not the process ("tests pass" not "write tests")

### 4. CONNECT -- Map Dependencies

- Which phases can run in parallel? (Use letter suffixes: `03A`, `03B`)
- Which phases are strictly sequential? (Use number suffixes: `03.1`, `03.2`)
- Are there any circular dependencies? (This is a design error -- restructure)

Every phase except the first must declare at least one dependency.

### 5. MILESTONE -- Group Into Milestones

Group phases into milestones that represent user-visible releases. Each milestone should be a coherent deliverable that could ship independently.

```markdown
## Milestones

- **v1.0 MVP** -- Phases 1-4
- **v1.1 Polish** -- Phases 5-7
- **v2.0 Scale** -- Phases 8-10
```

### 6. WRITE -- Produce the Roadmap

Assemble the complete ROADMAP.md:

```markdown
# Roadmap: {project name}

## Overview

{2-3 sentences: what the project is, what this roadmap covers, delivery strategy}

## Milestones

- **{milestone name}** -- Phases {range} ({status})

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

### 7. VALIDATE -- Check the Roadmap

Before finalizing, verify:

| Check | How to Verify |
|-------|--------------|
| Every phase has success criteria | Read each phase detail section |
| Dependencies are acyclic | Trace the dependency chain -- no loops |
| Phase numbering is sequential | Numbers increase, no gaps larger than 1 |
| Milestones cover all phases | Every phase appears in exactly one milestone |
| Success criteria are testable | Each criterion can be verified by command, test, or inspection |

## Common Pitfalls

| Pitfall | Why It Fails |
|---------|-------------|
| "We don't know enough to plan" | Plan what you know. Unknown phases get a research spike first. |
| "The roadmap will change anyway" | Plans change -- that is expected. No plan guarantees drift. |
| "Success criteria are too rigid" | Vague criteria are useless. Rigid criteria are adjustable. |
| "One big phase is simpler" | Big phases hide complexity and delay feedback. Split them. |
| "Dependencies are obvious" | Obvious to you now. Not obvious to the agent running phase 5 next week. |
| "We'll add details later" | Later never comes. Write the details now while context is fresh. |

Stop if you catch yourself writing a phase without success criteria, creating phases longer than 3 days of work, skipping dependency declarations, writing vague criteria like "code is good", creating circular dependencies, or putting all work in one or two massive phases.

## Verification

Before finalizing a roadmap, confirm:

- [ ] Every phase has a number, name, goal, dependencies, and success criteria
- [ ] Success criteria are testable (verifiable by command, test, or inspection)
- [ ] Dependencies form a DAG (no circular dependencies)
- [ ] Phase numbering follows MAXSIM convention (01, 01A, 01B, 01.1, etc.)
- [ ] Phases are 1-3 days of work each
- [ ] Milestones group phases into coherent deliverables
- [ ] ROADMAP.md matches the expected format for MAXSIM CLI parsing
- [ ] Overview section summarizes the project and delivery strategy

## MAXSIM Integration

Roadmap writing integrates with the MAXSIM lifecycle:
- Use during project initialization to create the initial roadmap
- Use when restructuring after a significant scope change or pivot
- The roadmap is read by MAXSIM agents via `roadmap read` -- format compliance is mandatory
- Phase numbering must be parseable by `normalizePhaseName()` and `comparePhaseNum()` in core
- Config `model_profile` in `.planning/config.json` affects agent assignment per phase
