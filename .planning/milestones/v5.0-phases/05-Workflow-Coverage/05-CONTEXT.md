# Phase 5 Context: Workflow Coverage

**Phase goal**: Fill the two verified gaps in workflow coverage -- todo/bug discussion flow and phase listing pagination
**Requirements**: FLOW-01, FLOW-02
**Date**: 2026-03-07

---

## 1. Discussion Flow — Unified /maxsim:discuss Command

### Entry Point & Triage

- **Single command**: `/maxsim:discuss` replaces the need for users to pick between add-todo, add-phase, or discuss-phase for new items
- User describes their problem/idea/bug in natural language
- System triages to the right size: quick todo, phase creation, or deeper discussion
- **Always confirm routing** — system proposes ("This sounds like a quick bug fix — add as todo?"), user confirms or redirects
- Less commands for the end user to remember, more intelligence under the hood

### Scope — New and Existing Items

- Handles **both new ideas and existing todos**
- If user mentions something matching a pending todo, link to it
- Can be invoked with a todo reference to discuss an existing item
- Without args or reference, starts fresh discussion from user description

### Discussion Depth — Adaptive

- Start with 2-3 questions to understand the item
- If answers reveal complexity, ask more questions
- If simple, route quickly without unnecessary probing
- System reads the room — no fixed question count

### Post-Triage Routing

- After filing (as todo or phase recommendation), **offer next action**:
  - "Want to work on it now (/maxsim:quick)?"
  - "Save for later?"
  - "Want to plan this phase (/maxsim:plan-phase)?"
- User always chooses — no auto-start

### Phase Creation

- When triage determines phase-sized work: **recommend with preview, user confirms**
- Show what would be added to ROADMAP.md, user says yes/no
- Do NOT silently modify the roadmap

---

## 2. Phase Listing Pagination

### Where Pagination Applies

- **MCP tool** (`mcp_list_phases`): add `offset` and `limit` parameters
- **Roadmap command** (`/maxsim:roadmap`): paginate display output
- **STATE.md performance metrics table**: same 20-item limit

### Default Page Size

- **20 phases per page** — balanced for scanning without overwhelming output

### Roadmap Display Behavior (50+ phases)

- **Auto-collapse completed phases**: completed phases show as one-liners (name + checkmark only), active/upcoming show full details with plans and criteria
- **Paginate remaining phases**: after collapsing, paginate at 20/page
- **Footer with page info**: "Showing phases 1-20 of 53. Use --page 2 for next."
- Both behaviors combined: natural compression + explicit pagination

### MCP Tool Parameters

- `offset` (default 0): skip first N phases
- `limit` (default 20): return at most N phases
- Response includes `total_count` for clients to know if there are more pages

### Metrics Table

- Same 20-item pagination limit applies to the performance metrics table in STATE.md
- Consistent behavior across all list-style outputs

---

## Deferred Ideas

None surfaced during discussion.

---

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discussion entry point | Single `/maxsim:discuss` command | Less commands, more intelligence under the hood |
| Triage confirmation | Always confirm routing | No surprise filings or roadmap changes |
| Discussion depth | Adaptive (2-3 questions, expand if complex) | Matches item complexity, no wasted time |
| Post-triage action | File and offer next action | User stays in control of what happens next |
| Phase creation from discuss | Recommend with preview, user confirms | Transparent roadmap changes |
| Existing todo handling | Both new and existing items | One command covers all discussion needs |
| Pagination scope | MCP tool + roadmap + metrics table | Consistent behavior everywhere |
| Page size | 20 phases | Balanced scanning without overwhelming |
| Roadmap pagination UX | Auto-collapse completed + paginate remaining | Natural compression plus explicit paging |
