---
phase: "20"
plan: "02"
subsystem: dashboard
tags: [vite, react, migration, components, typescript]
dependency_graph:
  requires: [Phase 20-01 - Build Infrastructure]
  provides: [Complete React SPA migration, all components ported from Next.js to Vite]
  affects: [packages/dashboard/src/]
tech_stack:
  added: []
  patterns: [Vite React SPA, Express API, WebSocket provider, React hooks, CodeMirror editor]
key_files:
  created:
    - packages/dashboard/src/App.tsx
    - packages/dashboard/src/lib/types.ts
    - packages/dashboard/src/lib/utils.ts
    - packages/dashboard/src/components/providers/websocket-provider.tsx
    - packages/dashboard/src/hooks/use-dashboard-data.ts
    - packages/dashboard/src/hooks/use-phase-detail.ts
    - packages/dashboard/src/components/layout/app-shell.tsx
    - packages/dashboard/src/components/layout/sidebar.tsx
    - packages/dashboard/src/components/dashboard/stats-header.tsx
    - packages/dashboard/src/components/dashboard/phase-progress.tsx
    - packages/dashboard/src/components/dashboard/phase-list.tsx
    - packages/dashboard/src/components/dashboard/phase-detail.tsx
    - packages/dashboard/src/components/dashboard/plan-card.tsx
    - packages/dashboard/src/components/dashboard/task-list.tsx
    - packages/dashboard/src/components/dashboard/todos-panel.tsx
    - packages/dashboard/src/components/dashboard/blockers-panel.tsx
    - packages/dashboard/src/components/dashboard/state-editor.tsx
    - packages/dashboard/src/components/editor/plan-editor.tsx
  modified:
    - packages/dashboard/tsconfig.json (path alias updated to ./src/*)
    - packages/dashboard/src/lib/types.ts (PhaseStatus type completeness fix)
decisions:
  - "App.tsx wraps DashboardApp in WebSocketProvider — single provider boundary at app root, consistent with Next.js layout.tsx pattern"
  - "Removed all 'use client' directives — not needed in Vite/React, these are Next.js App Router annotations"
  - "ParsedState interface moved to src/lib/types.ts — was in server-only parsers.ts in Next.js; now shared client type"
  - "Import paths updated from @/app/* to @/components/* and @/hooks/* — flat src/ structure"
  - "DashboardPhase.diskStatus extended with 'discussed' | 'researched' — matches @maxsim/core PhaseStatus type"
  - "phase-detail.tsx imports from @/hooks/use-phase-detail (not @/app/hooks/) after migration"
metrics:
  duration: "Session 1 continuation (Bash tool unavailable)"
  completed: "2026-02-25"
  tasks_completed: 5
  files_created: 18
  files_modified: 2
requirements_completed: []
---

# Phase 20 Plan 02: React + Express Code Migration Summary

Migrated all dashboard React components and hooks from Next.js `app/` directory structure to
Vite-compatible `src/` directory. Removed all Next.js-specific code (`"use client"` directives,
`next/*` imports, server components) and updated import paths throughout.

## What Was Built

### Shared Types and Utilities

**packages/dashboard/src/lib/types.ts** — Complete dashboard type definitions:
- `DashboardPhase`, `PlanFile`, `PlanTask`, `TodoItem` interfaces
- `ParsedState` interface (moved from server-only parsers.ts — now a proper client type)
- `WSMessage` discriminated union, `FileChangeEvent`, `WSConnectedEvent`, `WSErrorEvent`
- `DashboardPhase.diskStatus` union extended to include `'discussed'` and `'researched'`

**packages/dashboard/src/lib/utils.ts** — `cn()` utility using clsx + tailwind-merge.

### Providers and Hooks

**packages/dashboard/src/components/providers/websocket-provider.tsx**:
- WebSocket connection with exponential backoff reconnection
- Broadcasts `lastChange` timestamp on `file-changes` events
- `useWebSocket()` hook exported for consumer access

**packages/dashboard/src/hooks/use-dashboard-data.ts**:
- Fetches roadmap, state, todos in parallel via `Promise.all`
- Refetches on WebSocket `lastChange` signal
- Returns `{ roadmap, state, todos, loading, error }`

**packages/dashboard/src/hooks/use-phase-detail.ts**:
- Fetches phase detail and plan files from `/api/phase/:id`
- Refetches on WebSocket changes
- Returns `{ plans, context, research, loading, error, refetch }`

### Layout Components

**packages/dashboard/src/components/layout/app-shell.tsx**:
- Flex `h-screen` layout with sidebar (hidden below md) and scrollable main content

**packages/dashboard/src/components/layout/sidebar.tsx**:
- Phase list navigation with status dots
- Todos/Blockers links with badge counts
- Connection status footer
- Updated status dot to handle `'discussed'` and `'researched'` statuses

### Dashboard Components

**packages/dashboard/src/components/dashboard/stats-header.tsx**:
- Animated progress bar via `motion/react`
- Phase count, current phase name, blocker/todo counts

**packages/dashboard/src/components/dashboard/phase-progress.tsx**:
- Per-phase animated progress bar with status icon
- Status icon updated to handle `'discussed'` and `'researched'` (shows muted dot)

**packages/dashboard/src/components/dashboard/phase-list.tsx**:
- Section header with phase count
- Renders list of `PhaseProgress` cards

**packages/dashboard/src/components/dashboard/phase-detail.tsx**:
- Back button, phase header with context/research badges
- Loading skeletons, empty state
- Plan card list
- `PlanEditor` overlay for inline editing

**packages/dashboard/src/components/dashboard/plan-card.tsx**:
- Plan number, wave/autonomous badges
- Objective excerpt from `<objective>` XML tag
- Frontmatter summary (depends_on, file count, task count)
- `TaskList` with checkbox toggles

**packages/dashboard/src/components/dashboard/task-list.tsx**:
- Toggleable task checkboxes
- Modifies raw Markdown `<done>` tag content with `[x]` prefix
- Writes back via `PUT /api/plan/*`
- Type badge (auto/checkpoint/etc)

**packages/dashboard/src/components/dashboard/todos-panel.tsx**:
- Pending/completed todo lists
- Add todo form (POST /api/todos)
- Mark complete/incomplete (PATCH /api/todos)
- Collapsed completed section

**packages/dashboard/src/components/dashboard/state-editor.tsx**:
- Decision/Blocker tabs
- Phase prefix input for decisions
- Submits via PATCH /api/state

**packages/dashboard/src/components/dashboard/blockers-panel.tsx**:
- Active/resolved blocker display
- Resolve button (PATCH /api/state with `~~text~~ RESOLVED`)
- Embedded StateEditor for adding entries

**packages/dashboard/src/components/editor/plan-editor.tsx**:
- Full-screen CodeMirror 6 Markdown editor
- oneDark theme
- Ctrl+S / Cmd+S keyboard shortcut
- Unsaved changes guard on close

### Root Application

**packages/dashboard/src/App.tsx**:
- `WebSocketProvider` at root wrapping `DashboardApp`
- View routing via React state: `overview | phase | todos | blockers`
- `LoadingSkeleton` and `ErrorState` components
- Maps roadmap phases from snake_case to `DashboardPhase` camelCase

## Migration Notes

### Key Changes from Next.js to Vite

| Next.js | Vite equivalent |
|---------|----------------|
| `"use client"` directive | Not needed (all components are client components in Vite) |
| `@/app/components/*` | `@/components/*` |
| `@/app/hooks/*` | `@/hooks/*` |
| `import type { Metadata } from "next"` | Removed (title in index.html) |
| `next/font/google` | Google Fonts link in index.html |
| `WebSocketProvider` in layout.tsx | `WebSocketProvider` wrapping App in App.tsx |
| `export default function Home()` (page.tsx) | `export function App()` (App.tsx) |

### Files NOT Deleted

The old Next.js files in `app/`, `next.config.mjs`, `next-env.d.ts`, `server.ts` (root), and
`postcss.config.mjs` were not deleted because the Bash tool was unavailable (EINVAL error).
These files are excluded from the new tsconfig.json:
- `app/` is in the `exclude` array
- `.next` is in the `exclude` array
- The old root `server.ts` is excluded by the include pattern (`src/**/*.ts` only)

The old files do not affect the Vite build or tsdown bundle. They can be cleaned up when the
Bash tool is available via: `rm -rf packages/dashboard/app packages/dashboard/next.config.mjs packages/dashboard/next-env.d.ts packages/dashboard/server.ts packages/dashboard/postcss.config.mjs`

## Deviations from Plan

None beyond what was documented in Plan 01 SUMMARY (PhaseStatus type fix applied to newly
created components).

## Files Created

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root application with WebSocketProvider wrapper |
| `src/lib/types.ts` | Complete dashboard type definitions |
| `src/lib/utils.ts` | cn() utility |
| `src/components/providers/websocket-provider.tsx` | WebSocket context provider |
| `src/hooks/use-dashboard-data.ts` | Dashboard data fetching hook |
| `src/hooks/use-phase-detail.ts` | Phase detail fetching hook |
| `src/components/layout/app-shell.tsx` | App layout shell |
| `src/components/layout/sidebar.tsx` | Navigation sidebar |
| `src/components/dashboard/stats-header.tsx` | Progress stats header |
| `src/components/dashboard/phase-progress.tsx` | Per-phase progress bar card |
| `src/components/dashboard/phase-list.tsx` | Phase list container |
| `src/components/dashboard/phase-detail.tsx` | Phase drill-down view |
| `src/components/dashboard/plan-card.tsx` | Plan summary card |
| `src/components/dashboard/task-list.tsx` | Task checkbox list |
| `src/components/dashboard/todos-panel.tsx` | Todos management panel |
| `src/components/dashboard/blockers-panel.tsx` | Blockers panel with resolve |
| `src/components/dashboard/state-editor.tsx` | STATE.md decision/blocker editor |
| `src/components/editor/plan-editor.tsx` | CodeMirror Markdown editor overlay |

## Self-Check: PARTIAL

Files created: CONFIRMED (all 18 files exist in packages/dashboard/src/)
Git commits: NOT PERFORMED (Bash tool unavailable)
Build verification: NOT PERFORMED (Bash tool unavailable)

All source code is complete and ready for build verification. The migration is functionally
complete — running `pnpm run build` in packages/dashboard should produce dist/client/ and
dist/server.js when dependencies are installed.
