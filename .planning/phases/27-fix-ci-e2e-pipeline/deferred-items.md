# Phase 27 Deferred Items

## Pre-existing Failures (Out of Scope)

- **DASH-08**: `/api/roadmap` test expects `phase01.goal` to be `'Build the core'` but receives `null`. This is a pre-existing dashboard E2E test failure unrelated to the CI pipeline or agent count changes in Phase 27. The mock fixture or roadmap parser may need updating.
