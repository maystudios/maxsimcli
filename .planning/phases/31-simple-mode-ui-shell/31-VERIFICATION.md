---
phase: 31-simple-mode-ui-shell
verified: 2026-02-28T12:00:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Open the dashboard and verify the mode toggle button appears in the header"
    expected: "A globe/terminal icon button is visible in the top bar; clicking it toggles between Simple Mode and Advanced Mode without losing state"
    why_human: "Visual rendering and state preservation require browser interaction"
  - test: "In Simple Mode, verify the terminal panel is hidden and the action grid is visible"
    expected: "No terminal panel visible; action grid shows 'Plan & Discuss' and 'Execute & Verify' tabs with action cards"
    why_human: "CSS display:none hiding and tab rendering require visual verification"
  - test: "Click an action card with requiresInput (e.g., 'Plan New Phase') and type into the textarea"
    expected: "Textarea auto-resizes as you type; Enter submits; command string is built and passed to terminal"
    why_human: "Auto-resize behavior and keyboard interaction require browser testing"
  - test: "On first visit (clear localStorage), verify the FirstRunCard modal appears"
    expected: "A centered card with blurred backdrop shows 'Simple Mode' and 'Advanced Mode' options; choosing one sets the mode and hides the card"
    why_human: "First-run flow depends on localStorage state and visual modal rendering"
---

# Phase 31: Simple Mode UI Shell Verification Report

**Phase Goal:** Users can enter and use a distinct Simple Mode view in the dashboard that hides the terminal
**Verified:** 2026-02-28T12:00:00Z
**Status:** human_needed (all automated checks PASS; visual/interactive behavior needs browser verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Phase 31 Success Criteria from ROADMAP.md)

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can toggle between Simple Mode and Advanced Mode from the dashboard header without losing state | VERIFIED | `App.tsx` lines 88-90: `toggleMode` callback switches between `"simple"` and `"advanced"` via `setMode`. `mode-toggle-button.tsx` lines 10-51: renders globe icon (Simple) or terminal icon (Advanced) with `motion.span` spin animation. `use-dashboard-mode.ts` line 38-46: `setMode()` persists to `localStorage` and fires `POST /api/simple-mode-config`. State is preserved because advanced mode content stays mounted via `display: none` (App.tsx line 246). |
| 2  | Simple Mode view shows no terminal panel — only clean browser UI | VERIFIED | `App.tsx` lines 225-233: sidebar wrapped in `<div style={{ display: isSimple ? "none" : "contents" }}>`. Lines 246-267: entire advanced content block wrapped in `<div style={{ display: isSimple ? "none" : "contents" }}>`. Lines 239-243: Simple mode renders `<SimpleModeView>` only when `isSimple && initialized`. Terminal `<div>` (line 261) is inside the hidden advanced block. |
| 3  | User sees an action screen listing available phase operations (plan new phase, add phase, etc.) | VERIFIED | `simple-mode-actions.tsx` lines 26-202: `ACTION_DEFS` array contains 10 action definitions across two tabs. `action-grid.tsx` lines 24-25: filters into `planActions` (plan tab: Plan New Phase, Add Phase, Discuss Phase, Init Existing, New Project) and `executeActions` (execute tab: Execute Phase, Verify Work, Audit Milestone, Fix Gaps, Find Gaps, View Roadmap). Lines 48-68: two tab buttons labeled "Plan & Discuss" and "Execute & Verify" with slide animation via `motion.div`. |
| 4  | User can type a phase description into a text input field and submit it to start a workflow | VERIFIED | `action-form.tsx` lines 91-103: `<textarea>` element with auto-resize (`useEffect` on lines 32-37 sets `height: auto` then `scrollHeight`). Lines 50-54: `handleKeyDown` — Enter without Shift calls `handleSubmit()`. Lines 57-61: `buildCommandString()` constructs command like `/maxsim:plan-phase "Phase 31: ..."`. Lines 63-68: `handleSubmit()` calls `onExecute(cmd)` which routes to `executeInTerminal` (App.tsx line 109-112) writing the command to the terminal. |

**Score:** 4/4 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dashboard/src/components/providers/simple-mode-provider.tsx` | SimpleModeProvider context with tab state, expanded card, input values | VERIFIED | Exports `SimpleModeProvider` and `useSimpleMode` hook; manages `activeTab`, `expandedCardId`, `inputValues` state |
| `packages/dashboard/src/hooks/use-dashboard-mode.ts` | useDashboardMode hook for mode toggle persistence | VERIFIED | 50 lines; initializes from `localStorage` key `maxsim_dashboard_mode`; falls back to `GET /api/simple-mode-config`; `setMode()` writes localStorage + fires POST to server |
| `packages/dashboard/src/components/simple-mode/mode-toggle-button.tsx` | Toggle button with globe/terminal icons | VERIFIED | 52 lines; renders `ModeToggleButton` with `motion.span` spin animation; globe SVG for simple mode, terminal SVG for advanced mode; `title` and `aria-label` for accessibility |
| `packages/dashboard/src/components/simple-mode/first-run-card.tsx` | First-run card for mode selection | VERIFIED | 68 lines; blurred backdrop overlay (`backdrop-blur-sm bg-background/60`); two option columns with SVG wireframe previews; "Use Simple Mode" (teal) and "Use Advanced Mode" (accent blue) buttons |
| `packages/dashboard/src/components/layout/app-shell.tsx` | AppShell with `headerRight` and `simpleMode` props | VERIFIED | Lines 6-12: `AppShellProps` includes `headerRight?: ReactNode` and `simpleMode?: boolean`. Lines 32-35: mobile top bar applies teal border/bg when `simpleMode`. Lines 84-91: desktop simple mode header with "MAXSIM Simple Mode" label and `headerRight` slot. |
| `packages/dashboard/src/components/layout/sidebar.tsx` | Sidebar with `logoAction` prop | VERIFIED | Line 14: `SidebarProps` includes `logoAction?: ReactNode`. Line 88: `{logoAction}` rendered next to MAXSIM logo in sidebar header. |
| `packages/dashboard/src/server.ts` (GET/POST `/api/simple-mode-config`) | Server endpoints for mode config persistence | VERIFIED | Lines 916-941: `GET /api/simple-mode-config` reads from `simple-mode-config.json`; `POST /api/simple-mode-config` validates `default_mode` is `"simple"` or `"advanced"`, merges into existing config, writes file. |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dashboard/src/lib/simple-mode-actions.tsx` | ACTION_DEFS array with action definitions | VERIFIED | 202 lines; 10 `ActionDef` objects with `id`, `tab`, `title`, `description`, `icon` (SVG), `requiresInput`, `command`, `isAvailable` guard, `unavailableReason`. Two tabs: "plan" (5 actions) and "execute" (5 actions). |
| `packages/dashboard/src/components/simple-mode/action-grid.tsx` | ActionGrid with tabs, slide animation, empty state | VERIFIED | 111 lines; two tabs "Plan & Discuss" / "Execute & Verify" (line 51); `AnimatePresence` + `motion.div` slide animation (lines 71-77); empty state "No actions available" (lines 79-81); "Show more" pagination (lines 95-103). |
| `packages/dashboard/src/components/simple-mode/action-card.tsx` | ActionCard with accordion expand/collapse | VERIFIED | 100 lines; `AnimatePresence` with `motion.div` height animation (lines 82-97); `ring-1 ring-simple-accent/40` when open; recommended badge logic (lines 22-33); chevron rotation (line 71). |
| `packages/dashboard/src/components/simple-mode/action-form.tsx` | ActionForm with auto-resize textarea, Enter-to-submit | VERIFIED | 154 lines; auto-resize via `useEffect` (lines 32-37); `handleKeyDown` Enter-to-submit (lines 50-54); `buildCommandString()` (lines 57-61); command display shows `/maxsim:plan-phase "..."` pattern; reset with double-click confirmation (lines 70-79). |
| `packages/dashboard/src/components/simple-mode/simple-mode-view.tsx` | SimpleModeView wiring into App.tsx | VERIFIED | 63 lines; renders `<RecommendationCard>` + `<ActionGrid>` in idle state; switches to `<DiscussionView>` when `phase !== 'idle'`. Discuss-phase intercept on line 16: `cmd.startsWith("/maxsim:discuss-phase")` calls `startDiscussion()` instead of terminal. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `App.tsx` | `SimpleModeProvider` | `<SimpleModeProvider>` wraps `DashboardApp` | WIRED | `App.tsx` line 3: import; lines 279-284: `<SimpleModeProvider><DiscussionProvider><DashboardApp /></DiscussionProvider></SimpleModeProvider>` |
| `App.tsx` | `useDashboardMode` | Hook call in `DashboardApp` | WIRED | `App.tsx` line 6: import; line 81: `const { mode, setMode, initialized } = useDashboardMode()` |
| `App.tsx` | `ModeToggleButton` | Rendered as `headerRight` and `logoAction` | WIRED | Lines 92-94: `modeToggle` rendered as `<ModeToggleButton mode={mode} onToggle={toggleMode} />`; passed to `AppShell` line 222 and `Sidebar` line 230 |
| `App.tsx` | `FirstRunCard` | Conditional render when `mode === null` | WIRED | Line 236: `{initialized && mode === null && <FirstRunCard onChoose={setMode} />}` |
| `AppShell` | Mobile/Desktop headers | `headerRight` prop + `simpleMode` styling | WIRED | Line 41: `{headerRight}` in mobile bar; line 89: `{headerRight}` in desktop simple-mode header; lines 34, 85: teal `border-simple-accent` styling |
| `Sidebar` | `ModeToggleButton` | `logoAction` prop | WIRED | Line 88: `{logoAction}` rendered adjacent to MAXSIM logo |
| `useDashboardMode` | Server | `GET`/`POST /api/simple-mode-config` | WIRED | Hook lines 25-26: fetches GET on init; lines 42-46: fires POST on mode change. Server lines 916-941: both endpoints implemented. |
| `ActionGrid` | `ACTION_DEFS` | Import and filter | WIRED | `action-grid.tsx` line 7: import; lines 24-25: filter by `tab === "plan"` / `tab === "execute"` |
| `ActionCard` | `ActionForm` | Accordion expand | WIRED | `action-card.tsx` line 93: `<ActionForm action={action} onExecute={onExecute} />` inside `motion.div` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-01 | 31-01-PLAN | User can open Simple Mode view that hides the terminal | SATISFIED | `useDashboardMode` hook manages mode state; `ModeToggleButton` renders in header/sidebar; `App.tsx` hides sidebar+terminal via `display: none` when `isSimple`; `AppShell` shows teal simple-mode header on desktop |
| DASH-02 | 31-02-PLAN | User can select "Plan new phase" or "Add phase" from action screen | SATISFIED | `ACTION_DEFS` includes "Plan New Phase" (`id: plan-new-phase`, `command: /maxsim:plan-phase`) and "Add Phase" (`id: add-phase`, `command: /maxsim:add-phase`); both rendered in `ActionGrid` under "Plan & Discuss" tab; `isAvailable` guard checks `hasPhases(roadmap)` |
| DASH-03 | 31-02-PLAN | User can enter phase description in browser UI | SATISFIED | `ActionForm` renders `<textarea>` with auto-resize; `buildCommandString()` constructs `/maxsim:plan-phase "description"` command; `onExecute` routes to `executeInTerminal` which writes command to terminal. **Scope note:** At Phase 31 scope, "passed to planning workflow" means the command string is built and executed in the terminal. Direct browser-to-workflow bridging (bypassing terminal) is Phase 33 (HOOK-01/HOOK-02). |

---

## Human Verification Required

### 1. Mode Toggle

**Test:** Open the dashboard. Click the mode toggle button in the header (globe or terminal icon).
**Expected:** Dashboard switches between Simple Mode (teal header, no sidebar, action grid) and Advanced Mode (sidebar, phase viewer, terminal). State is preserved when toggling back.
**Why human:** Visual mode switch and state preservation require browser interaction.

### 2. Simple Mode View

**Test:** In Simple Mode, verify the layout.
**Expected:** No sidebar visible. No terminal panel. The main content shows a RecommendationCard at the top and an ActionGrid with two tabs below it. The header shows "MAXSIM Simple Mode" with a teal accent.
**Why human:** CSS display toggling and teal theming require visual verification.

### 3. Action Grid Tabs

**Test:** Click the "Execute & Verify" tab in the ActionGrid.
**Expected:** Tab switches with a slide animation. Cards for "Execute Phase", "Verify Work", "Audit Milestone", etc. appear. Switching back to "Plan & Discuss" shows the planning actions.
**Why human:** Tab animation and card rendering require browser.

### 4. Action Card Accordion

**Test:** Click an action card (e.g., "Plan New Phase").
**Expected:** Card expands with a smooth height animation showing the ActionForm below. A teal ring appears around the expanded card. The chevron rotates 180 degrees. Clicking again collapses it.
**Why human:** Framer-motion animation and ring styling require visual verification.

### 5. Textarea Auto-Resize and Submit

**Test:** In an expanded action card with `requiresInput`, type a multi-line description.
**Expected:** Textarea grows in height as text wraps. Pressing Enter (without Shift) submits and routes the command to the terminal. The command string (e.g., `/maxsim:plan-phase "Phase 33: ..."`) is shown.
**Why human:** Auto-resize behavior and keyboard submission require interactive testing.

### 6. First-Run Card

**Test:** Clear `localStorage` key `maxsim_dashboard_mode` and reload the page.
**Expected:** A blurred backdrop covers the page. A centered card offers "Simple Mode" and "Advanced Mode" options with wireframe previews. Choosing one sets the mode and dismisses the card.
**Why human:** First-run flow depends on localStorage and visual rendering.

### 7. Server Endpoint Persistence

**Test:** Set mode to "simple", reload the page, verify mode persists.
**Expected:** After reload, Simple Mode is still active (reads from localStorage; server config is backup).
**Why human:** Persistence across page reloads requires browser testing.

---

## Summary

All 4 Phase 31 success criteria from the ROADMAP are verified by code inspection with line-number evidence from the actual source files. All required artifacts exist and are substantive implementations (not stubs). All 3 requirement IDs (DASH-01, DASH-02, DASH-03) are satisfied by concrete implementations.

The architecture is complete:
- `useDashboardMode` hook handles mode state with localStorage + server persistence + first-run detection
- `ModeToggleButton` renders in both the sidebar logo area and the AppShell header for access in both modes
- `AppShell` adapts its layout with teal theming in simple mode and hides the sidebar on desktop
- `FirstRunCard` provides onboarding for new users who haven't chosen a mode
- `ACTION_DEFS` provides 10 data-driven action definitions across two tabs
- `ActionGrid`, `ActionCard`, and `ActionForm` compose the interactive action selection experience
- `SimpleModeView` integrates everything and intercepts discuss-phase commands for the Phase 32 flow

The phase is **functionally complete** pending human browser verification of visual rendering and interactive behaviors.

---

_Verified: 2026-02-28T12:00:00Z_
_Verifier: Claude (maxsim-verifier)_
