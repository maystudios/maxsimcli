# No-Gos

**Updated:** 2026-03-06
**Source:** Clean slate rewrite for v5.0 milestone

## Must Not Break

- `npx maxsimcli@latest` install flow -- this is how every user gets MAXSIM
- Existing `/maxsim:*` command interfaces -- users have muscle memory
- Existing `.planning/` file format -- projects with v4.x planning dirs must still work
- npm publish pipeline -- every push to main auto-publishes via semantic-release

## Anti-Patterns

- Adding multi-runtime adapter code back -- Claude Code only, no abstraction layers
- Over-engineering context assembly -- keep it simple, role-based, not ML-powered
- Agents that operate in isolation -- every agent must know what comes before and after it
- Skills with overlapping activation triggers -- one trigger = one skill
- Sync file I/O in hot paths -- use async for all file operations in frequently-called code
- Monorepo-only features -- everything must ship in the npm tarball
- Accumulating completed phase data in active planning docs -- archive or delete, never keep

## Scope Boundaries

- This milestone is NOT refactoring large modules (server.ts, verify.ts, phase.ts) -- that is tech debt, not feature work
- This milestone is NOT redesigning the dashboard UI
- This milestone is NOT adding community features, marketplace, or multi-user support
- This milestone is NOT adding new agent types -- it is making existing agents work as a system

---
*No-gos captured during v5.0 planning rewrite*
