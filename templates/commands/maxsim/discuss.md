---
name: maxsim:discuss
description: Triage a problem, idea, or bug into the right size -- todo, quick task, or phase
argument-hint: "[description or todo reference]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Triage an unknown problem, idea, or bug into the right size -- quick todo, quick task, or new phase -- through collaborative discussion.

**How it works:**
1. User describes a problem, idea, or bug (or references an existing todo)
2. System asks 2-3 adaptive clarifying questions to understand scope
3. System proposes routing (todo vs phase) with explanation -- user confirms via AskUserQuestion before any filing
4. System files the item (todo or phase) using existing tools
5. System offers next action choices (work now, save for later, plan phase)

**Modes:**
- **No-arg mode:** User describes the problem interactively after invocation
- **With-arg mode:** User provides a description or existing todo reference inline (e.g., `/maxsim:discuss auth tokens expire too fast` or `/maxsim:discuss fix-login-redirect`)

**Key distinction from `/maxsim:discuss-phase`:**
- `/maxsim:discuss` triages an UNKNOWN problem into the right size. It answers: "Is this a todo or a phase?"
- `/maxsim:discuss-phase` gathers implementation decisions for a KNOWN phase. It answers: "How should we build this phase?"
- These are complementary, not overlapping. After `/maxsim:discuss` creates a phase, the natural next step is `/maxsim:discuss-phase` to gather context for it.

**CRITICAL -- AskUserQuestion tool mandate:**
Every single question to the user MUST use the `AskUserQuestion` tool. NEVER ask questions as plain text in your response. This includes clarifying questions, triage proposals, confirmation prompts, and next-action offers. If you need the user's input, use `AskUserQuestion`. No exceptions.

**Thinking-partner behaviors:**
Apply collaborative discussion behaviors -- challenge vague descriptions, surface unstated assumptions, propose alternatives with trade-offs. The user should feel like they are working through a problem with a collaborator, not filling out a form.
</objective>

<execution_context>
@./workflows/discuss.md
@./references/thinking-partner.md
</execution_context>

<context>
Arguments: $ARGUMENTS (optional description or todo reference)

State is resolved in-workflow via `init todos` and targeted reads.
</context>

<process>
**Follow the discuss workflow** from `@./workflows/discuss.md`.

The workflow handles all logic including:
1. Project state loading and todo initialization
2. Existing todo detection (if argument matches a pending todo)
3. Adaptive clarifying questions (2-3 minimum, more if complex)
4. Size classification triage with user confirmation
5. Filing as todo (using existing maxsim-tools.cjs commands) or phase (using phase add)
6. Post-filing next action offer
7. Git commits
</process>

<success_criteria>
- User's problem/idea/bug is understood through collaborative discussion
- Routing decision confirmed by user before any filing
- Item filed as todo or phase using existing tools
- Next action offered after filing
- Git commit created for the filed item
</success_criteria>
