# Roadmap: MAXSIM

## Milestones

- [x] **v1.0 Core** - Phases 1-30 (shipped)
- [ ] **v1.1 Simple Dashboard Mode** - Phases 31-35 (in progress)

## Phases

<details>
<summary>v1.0 Core (Phases 1-30) - COMPLETE</summary>

Phases 1-30 delivered the full MAXSIM CLI and advanced dashboard:
- 30+ slash commands across plan/execute/verify/debug/milestone/dashboard workflows
- Full phase lifecycle: discuss → research → plan → execute → verify → complete
- Advanced dashboard: Claude Code terminal, phase viewer, plan cards, real-time file watching
- Multi-runtime installation (Claude, OpenCode, Gemini, Codex)
- Hook system: statusline, context monitor, update check
- Automated npm publish via semantic-release

</details>

### v1.1 Simple Dashboard Mode (In Progress)

**Milestone Goal:** Users can manage phases entirely from a browser UI — no terminal required. A question-driven flow handles discussion, planning, and execution with visible progress. The advanced terminal mode remains fully intact.

## Phase Details

### Phase 31: Simple Mode UI Shell
**Goal**: Users can enter and use a distinct Simple Mode view in the dashboard that hides the terminal
**Depends on**: Phases 1-30 (existing dashboard)
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. User can toggle between Simple Mode and Advanced Mode from the dashboard header without losing state
  2. Simple Mode view shows no terminal panel — only clean browser UI
  3. User sees an action screen listing available phase operations (plan new phase, add phase, etc.)
  4. User can type a phase description into a text input field and submit it to start a workflow
**Plans**: 2 plans

Plans:
- [x] 31-01-PLAN.md — SimpleModeProvider, useDashboardMode hook, ModeToggleButton, FirstRunCard, AppShell/Sidebar slots, /api/simple-mode-config server endpoint, teal color token
- [x] 31-02-PLAN.md — Action definitions, RecommendationCard, ActionGrid with tabs + slide animation, ActionCard accordion, ActionForm auto-resize textarea, SimpleModeView wiring into App.tsx

### Phase 32: Question-Driven Discussion Flow
**Goal**: Users can answer planning discussion questions entirely in the browser with free-form text and control when discussion ends
**Depends on**: Phase 31
**Requirements**: DASH-04, DASH-05, DASH-07
**Success Criteria** (what must be TRUE):
  1. Discussion questions appear as rendered UI prompts in the browser (not terminal text)
  2. User can type a free-form text answer to any discussion question in an input field
  3. After each answer, user sees "Ask me more" and "I'm done, execute" buttons
  4. Selecting "I'm done, execute" closes the discussion and queues execution
**Plans**: 2 plans

Plans:
- [ ] 32-01-PLAN.md — DiscussionProvider state machine, QuestionCard, OptionCard, AnsweredCard, SkeletonCard, OptionPreviewPanel, react-markdown dependency
- [ ] 32-02-PLAN.md — DiscussionView container, DiscussionFooter, ConfirmationDialog, DiscussionCompleteCard, SimpleModeView wiring, mock questions

### Phase 33: Workflow-Dashboard Hook Bridge
**Goal**: Claude Code workflow events (questions asked, phase started, phase complete) are reliably bridged to the dashboard UI in real time
**Depends on**: Phase 32
**Requirements**: HOOK-01, HOOK-02
**Success Criteria** (what must be TRUE):
  1. When a workflow triggers AskUserQuestion, the question appears in Simple Mode UI within 1 second
  2. Answers submitted in the browser are relayed back to the waiting workflow without terminal interaction
  3. Hook API fires reliably for: question asked, answer given, phase started, phase complete
  4. Hook registration is documented and a developer can add a new hook without modifying core workflow files
**Plans**: TBD

Plans:
- [ ] 33-01: Hook bridge event bus (server-side) + WebSocket relay
- [ ] 33-02: AskUserQuestion intercept wiring + hook API documentation

### Phase 34: Execution Progress View
**Goal**: Users can trigger automatic phase execution from Simple Mode and see visible progress without reading terminal output
**Depends on**: Phase 33
**Requirements**: DASH-06, AUTO-01
**Success Criteria** (what must be TRUE):
  1. Simple Mode shows a progress indicator, current step name, and completion percentage during execution
  2. User can click "Execute automatically" to start phase execution without typing in a terminal
  3. Execution launches after discussion completes without requiring additional user interaction
  4. Progress updates appear in real time as execution advances through steps
**Plans**: TBD

Plans:
- [ ] 34-01: Execution progress UI (step name, percentage, status indicator)
- [ ] 34-02: Auto-execute trigger wiring from "I'm done" → execution start

### Phase 35: Action Menu Extensibility
**Goal**: The Simple Mode action menu is data-driven so new actions can be added via config without code changes
**Depends on**: Phase 34
**Requirements**: EXT-01
**Success Criteria** (what must be TRUE):
  1. Simple Mode action menu items are loaded from a config file, not hardcoded in UI components
  2. A developer can add a new action to the menu by editing config only — no React component changes required
  3. Existing built-in actions (plan phase, add phase) continue working after config refactor
**Plans**: TBD

Plans:
- [ ] 35-01: Data-driven action menu config schema + loader
- [ ] 35-02: Refactor built-in actions to config entries + document extension pattern

## Progress

**Execution Order:** 31 → 32 → 33 → 34 → 35

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 31. Simple Mode UI Shell | 2/2 | Complete   | 2026-02-28 | - |
| 32. Question-Driven Discussion Flow | v1.1 | 0/2 | Planned | - |
| 33. Workflow-Dashboard Hook Bridge | v1.1 | 0/2 | Not started | - |
| 34. Execution Progress View | v1.1 | 0/2 | Not started | - |
| 35. Action Menu Extensibility | v1.1 | 0/2 | Not started | - |
