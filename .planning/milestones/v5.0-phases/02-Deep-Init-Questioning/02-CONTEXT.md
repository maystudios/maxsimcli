# Phase 2: Deep Init Questioning -- Context

**Created:** 2026-03-07
**Source:** /maxsim:discuss-phase conversation
**Phase goal:** New-project and init-existing produce context documents thorough enough that any agent can start work without asking follow-up questions

---

## 1. Questioning Depth

### Decisions

- **Style:** Conversational + silent checklist. The AI follows threads naturally but internally tracks a comprehensive domain checklist. If domains remain uncovered by the "Ready?" gate, it weaves questions about them naturally -- never switches to checklist mode.
- **Minimum rounds:** At least 10 questioning rounds before the "Ready to create PROJECT.md?" gate appears. More is always better -- depth produces better downstream results.
- **Domain checklist (tracked silently, all 4 categories):**
  - **Core:** Auth, data model, API style, deployment, error handling, testing strategy
  - **Infrastructure:** Caching, search, monitoring/logging, CI/CD, environments (dev/staging/prod)
  - **UX/Product:** User roles/permissions, notifications, file uploads, internationalization, accessibility
  - **Scale/Ops:** Performance targets, concurrency model, data migration, backup/recovery, rate limiting
- **Hard gate at 80%:** The "Ready?" option does NOT appear until at least 80% of relevant domains have been discussed. Irrelevant domains (e.g., "internationalization" for a CLI tool) can be marked as N/A and count toward coverage.
- **Coverage score:** Before the "Ready?" gate, show which domains were covered vs skipped. No progress indicator during questioning -- coverage score only at the gate.
- **No visible progress indicator:** Questioning feels natural and conversational, not like filling out a form.

### Init-Existing Additions

- **Stack preference questions:** After the codebase scan, present all architecturally significant detected dependencies (framework, DB, ORM, state management, testing framework, build tools -- not tiny utils) and ask if the user wants to keep, evolve, or replace each.
- **Convention confirmation:** Present scan-detected conventions (from codebase/CONVENTIONS.md) to the user: "Your codebase uses these patterns. Should new code follow them?" Lock confirmed conventions as the standard.

---

## 2. No-Gos Elicitation

### Decisions

- **Elicitation approach:** Both challenge-based probing AND domain-aware suggestions.
  1. Start with challenge-based probing (user-driven): "What would make this project fail?" "What shortcuts are tempting but dangerous?" "What did a previous version get wrong?"
  2. Supplement with domain-aware suggestions (AI-driven): Based on what the user is building, proactively suggest common anti-patterns for that domain. E.g., "Building a SaaS? Common no-gos: shared database tenancy, storing secrets in code, vendor lock-in without abstraction."
- **Timing:** Capture no-gos throughout questioning as they come up naturally. Then consolidate in a dedicated confirmation step at the end before writing NO-GOS.md.
- **Confirmation step:** Before writing NO-GOS.md, present all collected no-gos to the user: "Here are the no-gos I captured -- anything to add or remove?" User can adjust.
- **Init-existing scan integration:** Findings from CONCERNS.md are auto-suggested as candidate no-gos: "Your codebase has X pattern -- should this be a no-go for new code?" User confirms each.

---

## 3. Research Actionability

### Decisions

- **Enhanced research output:** All four additions required in research agent outputs:
  1. **Trade-off matrices:** For each major choice (framework, DB, auth, etc.), a comparison table of options with pros/cons/risk.
  2. **Decision rationale:** Explicit "Why X over Y" reasoning that downstream agents can reference.
  3. **Concrete code examples:** Snippet-level examples of recommended patterns (e.g., auth middleware pattern, error handling pattern).
  4. **Integration warnings:** Cross-cutting concerns: "If you use X for auth AND Y for database, watch out for Z."
- **Locked decisions:** The research synthesizer produces a "Decisions for Planner" section with locked choices (e.g., "Use PostgreSQL (not MongoDB)", "Use NextAuth (not Clerk)"). Planner treats these as constraints.
- **Approval gate:** After synthesis, present locked decisions to the user for review. User approves or overrides each decision before they flow to the planner.
- **PROJECT.md enrichment:** Synthesizer adds a "Tech Stack Decisions" section to PROJECT.md with locked choices from research. Makes PROJECT.md self-contained for agents.
- **Web verification required:** Research agents MUST verify version numbers and library status via web search (Context7/Brave). Flag anything unverifiable with confidence levels.
- **Effort estimates:** Each recommendation includes T-shirt size complexity estimate (S/M/L/XL) to help planner scope phases.

---

## 4. Agent-Ready Standard

### Decisions

- **Must-have sections for agent readiness:**
  1. **Concrete tech choices:** Specific libraries/frameworks with versions. Agent must be able to write import statements.
  2. **File/folder conventions:** Where to put things (routes, components, utils, tests). Agent must create files in the right places.
  3. **Error handling pattern:** How errors flow (exceptions, Result types, status codes). Agent must write consistent error handling.
  4. **Testing expectations:** What framework, where tests go, coverage targets, what to test per task.
- **Format:** Structured markdown with consistent headers. No JSON manifest needed.
- **CONVENTIONS.md:** Separate `.planning/CONVENTIONS.md` file for coding standards, file layout, and patterns. PROJECT.md stays vision-focused and links to it.
  - **New-project (greenfield):** Research agent recommends conventions for the chosen stack. Questioning confirms. Written to CONVENTIONS.md.
  - **Init-existing (brownfield):** Scan-detected conventions (from codebase/CONVENTIONS.md) are presented to user for confirmation, then promoted to `.planning/CONVENTIONS.md` as the standard for new code.
- **Validation: Agent dry-run (always runs):** After every init (new-project and init-existing), spawn a test agent that reads all generated docs and reports: "I could start Phase 1 but would need to ask about X, Y, Z." Its questions become a quality signal. If gaps are found, the workflow fills them before completing.

---

## Deferred Ideas

None captured.

---

## Requirements Traceability

| Requirement | Addressed By |
|-------------|-------------|
| INIT-01 (tech stack questions) | Section 1: 10+ round questioning with 4-category domain checklist, 80% hard gate |
| INIT-02 (no-gos, constraints, anti-patterns) | Section 2: Challenge-based + domain-aware elicitation, confirmation step |
| INIT-03 (agentic research with trade-offs) | Section 3: Trade-off matrices, decision rationale, code examples, integration warnings, web verification |
| INIT-04 (documents complete for fresh agents) | Section 4: 4 must-have sections, CONVENTIONS.md, agent dry-run validation |

---

*Context captured: 2026-03-07 via /maxsim:discuss-phase*
