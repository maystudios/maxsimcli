# Requirements: MAXSIM

**Defined:** 2026-02-27
**Core Value:** Consistent, high-quality AI-assisted development without context rot — accessible via CLI and a simple browser UI.
**Stage:** MVP

---

## v1 Requirements

User stories for the Simple Dashboard Mode milestone.

### Simple Dashboard Mode

- [ ] **DASH-01**: As a user, I can open a "Simple Mode" view in the dashboard so that I can manage phases without a terminal
  - Acceptance: Simple mode accessible via toggle/button from dashboard; terminal panel hidden
- [ ] **DASH-02**: As a user, I can select "Plan new phase" or "Add phase" from a simple action screen so that I can start work with one click
  - Acceptance: Action screen shows available phase actions; selecting one initiates the flow
- [ ] **DASH-03**: As a user, I can enter a phase description in the dashboard UI so that I don't need to type in a terminal
  - Acceptance: Text input in browser captures phase description; passed to planning workflow
- [ ] **DASH-04**: As a user, I can answer discussion questions from the dashboard so that the planning discussion happens entirely in the browser
  - Acceptance: AskUserQuestion-equivalent prompts rendered as UI elements; responses captured and sent to workflow
- [ ] **DASH-05**: As a user, I can choose "Ask me more" or "I'm done, execute" at the end of discussion so that I control when planning ends
  - Acceptance: Two clear CTA buttons shown after discussion; selecting "execute" triggers execution
- [ ] **DASH-06**: As a user, I can see phase execution progress in simple mode so that I know what's happening without reading terminal output
  - Acceptance: Progress indicator, current step name, and completion percentage shown during execution
- [ ] **DASH-07**: As a user, I can type free-form answers to discussion questions in the dashboard so that I'm not limited to button choices
  - Acceptance: Text input available alongside option buttons for any discussion question

### Hook System for Dashboard Interaction

- [ ] **HOOK-01**: As a user, workflow AskUserQuestion calls are intercepted by the dashboard so that questions appear in the browser UI
  - Acceptance: When a workflow triggers a question, it appears in simple mode UI within 1 second
- [ ] **HOOK-02**: As a developer, I can register hooks that bridge Claude Code workflow events to the dashboard so that simple mode stays in sync
  - Acceptance: Hook API documented; events (question asked, answer given, phase started, phase complete) fire reliably

### Full Auto-Run Foundation

- [ ] **AUTO-01**: As a user, I can trigger a phase to execute automatically after planning completes so that I don't manually initiate each step
  - Acceptance: "Execute automatically" option in simple mode; execution starts without terminal interaction

### Superpowers-Style Extensibility

- [ ] **EXT-01**: As a developer, I can add new skills/commands that appear in the simple dashboard action menu so that the system is extensible
  - Acceptance: Simple mode action menu is data-driven; new actions added via config without code changes

---

## v2 Requirements

Deferred to future releases.

- **DASH-08**: Mobile-responsive simple mode layout — touch-optimized for phone/tablet use
- **DASH-09**: QR code to open simple mode on mobile from the dashboard
- **AUTO-02**: Full auto-run — entire project executes phase by phase without any manual steps
- **AUTO-03**: Scheduled auto-run — phases execute on a timer or trigger
- **EXT-02**: Deeper Superpowers integration — skill marketplace, shared skill library
- **EXT-03**: Multi-user dashboard — team members see same project state in real-time
- **PERF-01**: STATE.md compaction command — archive old entries, prevent unbounded growth
- **TEST-01**: Unit tests for core parsing (frontmatter, state field extraction, phase sorting)
- **TEST-02**: E2E tests for all 4 runtime adapter transforms

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| External database for state | File-based state is a core design principle; git-trackable |
| Breaking changes to CLI commands | External users depend on stability; additive only |
| Removing advanced dashboard mode | Simple mode is additive; power users keep terminal access |
| Authentication/user accounts | MAXSIM is local-only by design |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 31 | Pending |
| DASH-02 | Phase 31 | Pending |
| DASH-03 | Phase 31 | Pending |
| DASH-04 | Phase 32 | Pending |
| DASH-05 | Phase 32 | Pending |
| DASH-07 | Phase 32 | Pending |
| HOOK-01 | Phase 33 | Pending |
| HOOK-02 | Phase 33 | Pending |
| DASH-06 | Phase 34 | Pending |
| AUTO-01 | Phase 34 | Pending |
| EXT-01 | Phase 35 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---

*Requirements defined: 2026-02-27*
