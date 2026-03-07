# Phase 2: Deep Init Questioning - Research

**Researched:** 2026-03-07
**Domain:** Conversational AI questioning flows, codebase convention detection, research agent synthesis
**Confidence:** HIGH (implementation is within existing MAXSIM architecture; no external libraries needed)

---

## User Constraints

Copied verbatim from 02-CONTEXT.md locked decisions.

### 1. Questioning Depth (Locked)

- **Style:** Conversational + silent checklist. The AI follows threads naturally but internally tracks a comprehensive domain checklist. If domains remain uncovered by the "Ready?" gate, it weaves questions about them naturally -- never switches to checklist mode.
- **Minimum rounds:** At least 10 questioning rounds before the "Ready to create PROJECT.md?" gate appears.
- **Domain checklist (tracked silently, all 4 categories):**
  - **Core:** Auth, data model, API style, deployment, error handling, testing strategy
  - **Infrastructure:** Caching, search, monitoring/logging, CI/CD, environments (dev/staging/prod)
  - **UX/Product:** User roles/permissions, notifications, file uploads, internationalization, accessibility
  - **Scale/Ops:** Performance targets, concurrency model, data migration, backup/recovery, rate limiting
- **Hard gate at 80%:** The "Ready?" option does NOT appear until at least 80% of relevant domains have been discussed. Irrelevant domains can be marked as N/A and count toward coverage.
- **Coverage score:** Before the "Ready?" gate, show which domains were covered vs skipped. No progress indicator during questioning.
- **No visible progress indicator** during questioning.

### 2. No-Gos Elicitation (Locked)

- Both challenge-based probing AND domain-aware suggestions.
- Timing: Capture throughout questioning, consolidate in dedicated confirmation step.
- Confirmation step before writing NO-GOS.md.
- Init-existing: CONCERNS.md findings auto-suggested as candidate no-gos.

### 3. Research Actionability (Locked)

- Enhanced research output: trade-off matrices, decision rationale, code examples, integration warnings.
- Locked decisions section in synthesizer output.
- Approval gate after synthesis (user reviews locked decisions).
- PROJECT.md enrichment with "Tech Stack Decisions" section.
- Web verification required for versions and library status.
- Effort estimates (T-shirt sizes) per recommendation.

### 4. Agent-Ready Standard (Locked)

- Must-have sections: concrete tech choices, file/folder conventions, error handling pattern, testing expectations.
- CONVENTIONS.md: separate `.planning/CONVENTIONS.md` file.
- Agent dry-run validation (always runs after every init).

### Init-Existing Additions (Locked)

- Stack preference questions after codebase scan.
- Convention confirmation from scan-detected conventions.

### Deferred Ideas

None captured.

---

## Summary

Phase 2 transforms MAXSIM's two initialization flows (`new-project` and `init-existing`) from shallow questioning into deep, conversational context extraction. The core innovation is a **silent domain checklist** that tracks coverage across 4 categories (20+ domains) while maintaining natural conversation flow, gated at 80% before the "Ready?" option appears with a minimum of 10 rounds.

The implementation is entirely within MAXSIM's markdown-prompt architecture. No new npm packages, no new TypeScript modules, no new CLI commands are needed. The changes are to **6 markdown template files** (2 commands, 2 workflows, 2 agents) plus **1 new template** (CONVENTIONS.md) and **minor CLI extensions** for the `init` context assembly. The research agent and synthesizer get enhanced output formats, and a new **agent dry-run validation** step is appended to both init workflows.

**Primary recommendation:** Implement as sequential modifications to existing workflow files, with the silent checklist as embedded prompt instructions (not runtime code), and CONVENTIONS.md as a new `.planning/` artifact generated during init.

---

## Standard Stack

This phase does not introduce new libraries. Everything is markdown prompt engineering and minor CLI tool additions.

### Core (what gets modified)

| File | Role | Change Type |
|------|------|-------------|
| `templates/workflows/new-project.md` | New-project orchestration | Major rewrite of Step 3 (questioning) |
| `templates/workflows/init-existing.md` | Init-existing orchestration | Add stack preference + convention confirmation steps |
| `templates/references/questioning.md` | Questioning guide | Major expansion with domain checklist + no-gos |
| `templates/agents/maxsim-project-researcher.md` | Research agent | Enhanced output format |
| `templates/agents/maxsim-research-synthesizer.md` | Research synthesizer | Add locked decisions + approval gate |
| `templates/templates/project.md` | PROJECT.md template | Add Tech Stack Decisions section |
| `templates/templates/conventions.md` | **NEW** CONVENTIONS.md template | File/folder layout, error patterns, testing |
| `templates/templates/no-gos.md` | NO-GOS.md template | Expand with structured sections |

### Supporting (CLI)

| File | Role | Change Type |
|------|------|-------------|
| `packages/cli/src/core/init.ts` | Context assembly | Add `conventions_path` to init contexts |

### No New Dependencies

The entire phase is markdown prompt changes. The "runtime" is Claude Code itself interpreting these prompts. No npm packages, no new TypeScript modules, no build changes.

---

## Architecture Patterns

### Pattern 1: Silent Domain Checklist (in workflow prompt)

The domain checklist is **embedded in the workflow markdown as prompt instructions**, not tracked by CLI tooling. The AI maintains state in its context window across questioning rounds.

**Implementation approach:** Add a `<domain_checklist>` section to `questioning.md` that the AI reads at workflow start and tracks internally. The checklist is a flat list with category tags.

```markdown
<domain_checklist>
Track these domains silently. Mark each as COVERED, N/A, or UNCOVERED as conversation progresses.
Do NOT show this to the user. Do NOT switch to checklist mode.

## Core
- [ ] Auth approach (SSO, email/pass, OAuth, magic links)
- [ ] Data model (relational, document, graph, key-value)
- [ ] API style (REST, GraphQL, tRPC, gRPC)
- [ ] Deployment target (serverless, containers, VPS, edge)
- [ ] Error handling strategy (exceptions, Result types, error boundaries)
- [ ] Testing strategy (unit, integration, e2e, coverage targets)

## Infrastructure
- [ ] Caching strategy (Redis, in-memory, CDN, none)
- [ ] Search (full-text, Elasticsearch, Algolia, none)
- [ ] Monitoring/logging (structured logs, APM, error tracking)
- [ ] CI/CD (GitHub Actions, GitLab CI, CircleCI, none yet)
- [ ] Environments (dev/staging/prod, single env, preview deploys)

## UX/Product
- [ ] User roles/permissions (RBAC, ABAC, simple admin/user)
- [ ] Notifications (email, push, in-app, none)
- [ ] File uploads (images, documents, media, none)
- [ ] Internationalization (i18n needed, English only, later)
- [ ] Accessibility (WCAG compliance level, not applicable)

## Scale/Ops
- [ ] Performance targets (response time, throughput, concurrent users)
- [ ] Concurrency model (single-threaded, worker pools, event-driven)
- [ ] Data migration (from existing system, fresh start, import needed)
- [ ] Backup/recovery (RTO/RPO targets, disaster recovery plan)
- [ ] Rate limiting (API limits, abuse prevention, quotas)

## Gates
- Minimum 10 questioning rounds before "Ready?" appears
- "Ready?" appears ONLY when >= 80% of relevant domains are COVERED or N/A
- Before showing "Ready?", internally calculate: covered_count / (total - na_count) >= 0.80
- When showing coverage score at gate, list domains by category with status
</domain_checklist>
```

**Why this works:** Claude Code maintains full conversation context during a single session. The checklist persists as part of the system prompt loaded via `@./references/questioning.md`. No external state tracking needed.

**Source:** Analysis of existing `questioning.md` reference file which already has a `<context_checklist>` with 4 items. This expands to 20+ domains with the same "background checklist, not conversation structure" pattern.

### Pattern 2: No-Gos Elicitation (woven into questioning flow)

No-gos are captured as a **side-channel during questioning**, not a separate phase. The workflow instructions tell the AI to watch for no-go signals and accumulate them silently, then present a confirmation step.

**Implementation approach:** Add `<nogos_tracking>` to `questioning.md`:

```markdown
<nogos_tracking>
## During questioning:
Watch for no-go signals in user responses:
- Explicit rejections: "I don't want X", "Never use Y"
- Past failures: "Last time we tried X and it was terrible"
- Strong opinions: "Absolutely not Z"
- Anti-patterns: "The codebase already has too much of X"

Silently accumulate these. Do NOT confirm each one as it comes up.

## Challenge-based probing (after 5+ rounds):
Weave these naturally when the conversation allows:
- "What would make this project fail?"
- "What shortcuts are tempting but dangerous?"
- "What did a previous version get wrong?"

## Domain-aware suggestions (after understanding the domain):
Based on what they are building, suggest common anti-patterns:
- SaaS: shared-database tenancy, secrets in code, vendor lock-in
- CLI tool: global state, implicit dependencies, breaking flag changes
- API: N+1 queries, unbounded responses, missing rate limits

## Before writing NO-GOS.md:
Present ALL collected no-gos to user:
"Here are the no-gos I captured -- anything to add or remove?"
User confirms/adjusts before they become locked.
</nogos_tracking>
```

### Pattern 3: Research Agent Enhanced Output

The existing `maxsim-project-researcher.md` already outputs to `.planning/research/STACK.md`, `FEATURES.md`, etc. The enhancement adds **4 mandatory sections** to each research output.

**Add to each researcher's output format:**

```markdown
## Trade-Off Matrix
| Option | Pros | Cons | Risk | Effort |
|--------|------|------|------|--------|
| [Option A] | ... | ... | LOW/MED/HIGH | S/M/L/XL |

## Decision Rationale
**Recommendation:** [X] over [Y]
**Why:** [Specific technical reasoning]
**When to reconsider:** [Conditions that would change this recommendation]

## Code Examples
[Concrete import statements, config snippets, middleware patterns]

## Integration Warnings
[Cross-cutting concerns: "If X + Y, watch out for Z"]
```

### Pattern 4: Research Synthesizer with Locked Decisions

The existing `maxsim-research-synthesizer.md` produces `SUMMARY.md`. Enhancement adds a "Decisions for Planner" section.

```markdown
## Locked Decisions

These flow to the planner as constraints. User has approved each one.

| # | Decision | Rationale | Alternatives Rejected | Effort |
|---|----------|-----------|----------------------|--------|
| 1 | Use PostgreSQL (not MongoDB) | Relational queries dominate this domain | MongoDB (schema flexibility not needed) | M |
| 2 | Use NextAuth (not Clerk) | Self-hosted, no vendor lock-in | Clerk (faster setup but SaaS dependency) | S |

## Approval Required
Present these decisions to the user before proceeding. User can override any decision.
```

### Pattern 5: CONVENTIONS.md Generation

New template for `.planning/CONVENTIONS.md` with the 4 must-have sections from CONTEXT.md.

```markdown
# Conventions

## Tech Stack
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | 22.x | Server and build |
| Language | TypeScript | 5.9 | Type safety |

## File Layout
| Type | Location | Naming |
|------|----------|--------|
| Components | src/components/ | PascalCase.tsx |
| Utils | src/utils/ | camelCase.ts |
| Tests | src/__tests__/ | *.test.ts |

## Error Handling
[Pattern description: exceptions vs Result types, error boundaries, etc.]

## Testing
| Framework | Location | Coverage Target |
|-----------|----------|----------------|
| Vitest | src/__tests__/ | 80% |
```

**For new-project (greenfield):** Research agent recommends conventions, questioning confirms.
**For init-existing (brownfield):** Codebase scan detects conventions from `codebase/CONVENTIONS.md`, user confirms, then promoted to `.planning/CONVENTIONS.md`.

### Pattern 6: Agent Dry-Run Validation

A test agent spawned after init that reads all generated docs and reports gaps.

**Implementation:** Add as final step in both `new-project.md` and `init-existing.md` workflows:

```markdown
## Step N: Agent Dry-Run Validation

Task(prompt="
You are a fresh agent about to start Phase 1 of this project.
Read the following files and report what you would need to ask
before starting work:

<files_to_read>
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/CONVENTIONS.md
- .planning/NO-GOS.md
- .planning/ROADMAP.md
</files_to_read>

Report format:
## DRY-RUN RESULT

### Can Start: YES/NO
### Gaps Found:
- [What information is missing]
- [What is ambiguous]
- [What would need clarification]

### Quality Score: [1-10]
", model="{planner_model}", description="Agent readiness dry-run")
```

If gaps found, the orchestrator fills them by updating the relevant docs before completing init.

### Pattern 7: Init-Existing Stack Preference Questions

After codebase scan (Step 3), before document generation (Step 9), add a new Step 6b.

```markdown
## Step 6b: Stack Preference Questions

Read .planning/codebase/STACK.md and extract architecturally significant dependencies.
Filter out utility libraries (lodash, uuid, etc.) -- only framework-level choices.

Present to user:
"Your codebase uses these key technologies. For each, do you want to keep, evolve, or replace?"

AskUserQuestion with multiSelect for each significant dependency:
- "Keep [React 18]" -- Continue using as-is
- "Evolve [React 18 -> React 19]" -- Upgrade or modernize
- "Replace [React -> Svelte]" -- Switch to alternative

Capture decisions as constraints for CONVENTIONS.md and DECISIONS.md.
```

### Anti-Patterns to Avoid

1. **Runtime state tracking for checklist** -- Do NOT add CLI commands to track domain coverage. The AI manages this in-context.
2. **Separate checklist-mode questioning** -- Do NOT create a fallback that switches from conversational to checklist. The instructions must be clear enough that the AI weaves missing domains naturally.
3. **Blocking on research for init-existing** -- The init-existing flow already has codebase scan data. Do NOT add a separate project-research step. The scan IS the research for brownfield.
4. **Custom JSON schema for CONVENTIONS.md** -- Keep it as markdown. The "runtime" (AI) reads markdown natively. Adding JSON parsing adds complexity with no benefit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Domain coverage tracking | CLI state machine for checklist progress | In-context prompt instructions (AI tracks coverage in conversation) | No runtime code needed; AI maintains state naturally within a session |
| Convention detection (brownfield) | Custom AST parser for conventions | Existing `maxsim-codebase-mapper` agent (quality focus) already produces `codebase/CONVENTIONS.md` | Agent already exists, just promote its output |
| Research web verification | Custom web scraping pipeline | Existing Context7/WebSearch/WebFetch tools already in researcher agent | Tools already available, just mandate their use in prompt |
| No-gos template | New CLI command for no-gos management | Existing `artefakte-write` CLI command + expanded template | Template exists, just needs better sections |
| Agent dry-run validation | New CLI validation tool | Task tool spawning a test agent with all docs as input | Standard MAXSIM subagent pattern |
| Tech stack decisions in PROJECT.md | Custom section injection code | Direct markdown template expansion (add section to `templates/project.md`) | It is a template, just add the section |

---

## Common Pitfalls

### Pitfall 1: Questioning Feels Like Interrogation Despite Instructions

**What goes wrong:** The domain checklist (20+ items) makes the AI fire rapid questions to cover domains, losing conversational flow.

**Why:** Large checklists create urgency. The AI optimizes for coverage over conversation quality.

**How to avoid:** The checklist instructions must explicitly state: "Follow the user's thread first. Only weave checklist domains when natural pauses occur or when the user's response opens a related domain." Include anti-pattern examples: "BAD: 'What about caching?' out of nowhere. GOOD: 'You mentioned handling 10K concurrent users -- have you thought about caching strategy?'"

**Warning signs:** User gives short answers. Questions feel disconnected from previous answers. User says "can we just get started?"

### Pitfall 2: 80% Gate Creates Frustrating UX

**What goes wrong:** User wants to proceed but the gate blocks because obscure domains (backup/recovery for a CLI tool) are uncovered.

**Why:** Not all 20 domains apply to every project. The N/A marking must be aggressive.

**How to avoid:** Instructions must explicitly say: "Mark domains as N/A generously. A CLI tool does not need file uploads, internationalization, backup/recovery, etc. The 80% gate counts N/A as covered." Include examples per project type.

**Warning signs:** User hits the "Keep exploring" option but runs out of things to say. Questioning goes past 20 rounds with diminishing returns.

### Pitfall 3: Research Synthesizer Produces Decisions User Disagrees With

**What goes wrong:** The locked decisions section recommends choices the user already rejected during questioning.

**Why:** Research agents run in parallel subagents that do NOT have questioning context. They research the domain generically.

**How to avoid:** The research prompt must include PROJECT.md (which captures questioning decisions). The synthesizer must cross-reference against existing decisions before locking anything. The approval gate is the safety net.

**Warning signs:** User overrides multiple locked decisions at the approval gate. Decisions contradict PROJECT.md Key Decisions table.

### Pitfall 4: CONVENTIONS.md Becomes Stale Immediately

**What goes wrong:** CONVENTIONS.md is generated at init but never updated, becoming a lie.

**Why:** No lifecycle hook updates it as the project evolves.

**How to avoid:** This is a known limitation for Phase 2. Document in CONVENTIONS.md: "Generated at init. Update when conventions change." Phase 3 (Agent Coherence) should address lifecycle updates. Do NOT try to solve this in Phase 2.

**Warning signs:** Agents following outdated conventions. Phase discussions contradicting CONVENTIONS.md.

### Pitfall 5: Agent Dry-Run Always Passes

**What goes wrong:** The test agent reports "Can Start: YES" even when docs have gaps, because it infers missing information from training data.

**Why:** LLMs are good at filling gaps with plausible defaults. A test agent may not surface true ambiguity.

**How to avoid:** The dry-run prompt must include: "Do NOT infer missing information. If a specific library version is not stated, report it as a gap. If the error handling pattern is not described, report it as a gap. Your job is to find what is NOT written, not to demonstrate you could figure it out."

**Warning signs:** Dry-run quality score is always 9-10. Downstream agents still ask clarifying questions despite passing dry-run.

### Pitfall 6: Init-Existing Stack Preference Step Overwhelms User

**What goes wrong:** Presenting every dependency from STACK.md (20-50 packages) for keep/evolve/replace.

**Why:** The scan detects ALL dependencies, not just architecturally significant ones.

**How to avoid:** Filter to only "architecturally significant" dependencies: framework, database, ORM, state management, testing framework, build tools. Explicitly exclude: utility libraries, dev tools, type definitions. Cap at 8-10 items max.

**Warning signs:** User selects "keep" for everything to skip the wall of questions.

---

## Code Examples

### Example 1: Modified questioning.md with Domain Checklist

The `questioning.md` reference file gets expanded. Key change is adding the `<domain_checklist>` and `<nogos_tracking>` sections (shown in Architecture Patterns above) while keeping the existing `<philosophy>`, `<how_to_question>`, and `<anti_patterns>` sections intact.

The `<context_checklist>` section (currently 4 items) gets replaced by the new `<domain_checklist>` with the 80% gate logic.

### Example 2: New-Project Workflow Step 3 Changes

Current Step 3 in `new-project.md`:
- Opens with "What do you want to build?"
- Follows threads using thinking-partner behaviors
- Decision gate when AI could write PROJECT.md

Enhanced Step 3 adds:
1. **Round counter:** AI internally counts questioning rounds (not shown to user).
2. **Domain tracking:** AI checks domains covered after each answer.
3. **No-gos accumulation:** AI watches for rejection signals.
4. **Gate logic:** "Ready?" only appears when round >= 10 AND coverage >= 80%.
5. **Coverage display at gate:** Show domain coverage summary before the "Ready?" option.
6. **No-gos confirmation:** After "Ready?" selected, before writing PROJECT.md, present accumulated no-gos.

### Example 3: Enhanced Research Prompt (Stack Dimension)

Current researcher prompt includes: "What's the standard 2025 stack for [domain]?" and writes STACK.md.

Enhanced prompt adds to `<output>`:

```markdown
Your STACK.md MUST include these sections (in addition to existing format):

## Trade-Off Matrix
For each major category (framework, database, auth, hosting), compare top 2-3 options.

## Decision Rationale
For your primary recommendation in each category: "Why X over Y" with specific reasoning.

## Code Examples
For each recommended technology: import statement, basic config, and one usage pattern.

## Integration Warnings
Cross-cutting concerns between recommended technologies.

## Effort Estimates
For each recommendation: S (hours), M (days), L (week), XL (weeks) complexity estimate.
```

### Example 4: CONVENTIONS.md Template

```markdown
# Conventions

**Generated:** {{date}}
**Source:** {{source}}

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| | | | |

## File Layout

| Type | Location | Naming Convention | Example |
|------|----------|-------------------|---------|
| | | | |

## Error Handling

**Pattern:** [exceptions / Result types / error codes / error boundaries]

**Standard flow:**
```
[Describe how errors propagate through the system]
```

**What to catch:** [List what error types to handle vs. let propagate]

## Testing

| Aspect | Standard |
|--------|----------|
| Framework | |
| Test location | |
| Naming convention | |
| Coverage target | |
| What to test per task | |

---
*Conventions {{generated_or_confirmed}}: {{date}}*
```

---

## State of the Art

| Old Approach (Current) | New Approach (Phase 2) | Impact |
|------------------------|----------------------|--------|
| 4-item background checklist in questioning.md | 20+ domain silent checklist with 80% hard gate | Much deeper context extraction; agents get richer PROJECT.md |
| No-gos captured as afterthought in artefakte step | No-gos woven into questioning + confirmation step | No-gos become first-class constraints, not boilerplate |
| Research outputs: stack/features/architecture/pitfalls | Same 4 outputs + trade-off matrices + locked decisions + code examples | Downstream agents get prescriptive guidance, not options |
| PROJECT.md has generic Requirements section | PROJECT.md gains Tech Stack Decisions section | Self-contained for agents; no cross-reference needed |
| No CONVENTIONS.md | CONVENTIONS.md with 4 must-have sections | Agents know where to put files, how to handle errors, what to test |
| No validation of init output quality | Agent dry-run validation after every init | Catches gaps before they compound through phases |
| Init-existing: quick config + scan + documents | + stack preference questions + convention confirmation | Brownfield gets same depth as greenfield |

---

## Open Questions

### What We Know

- The domain checklist approach is sound -- Claude Code maintains full context during a single session
- The 80% threshold is a good balance (user confirmed in discuss-phase)
- All modifications are to markdown templates, requiring no build changes
- The agent dry-run is a standard Task tool pattern already used in MAXSIM

### What Is Unclear

1. **Round counting accuracy:** The AI counting its own questioning rounds may drift. If the AI asks 2 questions in one message, does that count as 1 round or 2? **Recommendation:** Define "round" as one `AskUserQuestion` call. Count those, not messages.

2. **N/A marking heuristics:** When should a domain be marked N/A? The instructions should include examples, but some edge cases will be ambiguous (e.g., "caching" for a small SaaS). **Recommendation:** Include a decision tree: "If the project has < 100 expected users and no real-time features, mark caching as N/A."

3. **Dry-run agent model cost:** Spawning an extra agent at the end of init adds tokens. For budget profiles, this may matter. **Recommendation:** Use the planner model (not researcher/quality model) for dry-run. It is cheap and sufficient for gap detection.

4. **CONVENTIONS.md for greenfield before research:** In new-project flow, CONVENTIONS.md should be generated after research (since research recommends the stack). But research is optional. **Recommendation:** If research runs, generate CONVENTIONS.md from research output. If not, generate from questioning context + reasonable defaults.

---

## Phase Requirements Mapping

| Requirement | Research Support |
|-------------|-----------------|
| INIT-01 (tech stack questions) | Domain checklist (Pattern 1) covers tech stack domains explicitly. 80% gate ensures coverage. |
| INIT-02 (no-gos, constraints) | No-gos tracking (Pattern 2) with challenge probing + domain suggestions + confirmation step. |
| INIT-03 (agentic research with trade-offs) | Enhanced research output (Pattern 3) + synthesizer locked decisions (Pattern 4). |
| INIT-04 (docs complete for fresh agents) | CONVENTIONS.md (Pattern 5) + agent dry-run validation (Pattern 6). |

---

## Sources

### Primary (HIGH Confidence)

- Current `templates/workflows/new-project.md` -- 1226 lines of existing workflow (read directly)
- Current `templates/workflows/init-existing.md` -- 1221 lines of existing workflow (read directly)
- Current `templates/references/questioning.md` -- 145 lines of questioning guide (read directly)
- Current `templates/references/thinking-partner.md` -- 74 lines of thinking partner behaviors (read directly)
- Current `templates/agents/maxsim-project-researcher.md` -- 181 lines (read directly)
- Current `templates/agents/maxsim-research-synthesizer.md` -- 131 lines (read directly)
- Current `packages/cli/src/core/init.ts` -- 792 lines, context assembly (read directly)
- `02-CONTEXT.md` -- user decisions from discuss-phase (read directly)

### Secondary (MEDIUM Confidence)

- Current `templates/agents/maxsim-roadmapper.md` -- 240 lines (read directly, informs how roadmapper consumes research)
- Current `templates/templates/project.md` -- 185 lines (read directly, informs PROJECT.md expansion)
- Current `.planning/PROJECT.md` -- current project state (read directly)

---

## Metadata

| Area | Confidence | Reason |
|------|-----------|--------|
| Architecture Patterns | HIGH | All patterns use existing MAXSIM infrastructure; no novel mechanisms |
| Implementation Scope | HIGH | Every file to modify identified; all are markdown templates or minor CLI additions |
| Domain Checklist Design | HIGH | Extends existing `context_checklist` pattern from `questioning.md` |
| Agent Dry-Run | MEDIUM | Pattern is sound but effectiveness depends on prompt quality; needs iteration |
| N/A Marking Heuristics | MEDIUM | Edge cases exist; first version may need tuning based on user feedback |
| Round Counting | HIGH | Simple counter per AskUserQuestion call; no ambiguity |

**Research date:** 2026-03-07
**Valid until:** No expiration (implementation targets internal MAXSIM markdown templates, not external dependencies with version drift)
