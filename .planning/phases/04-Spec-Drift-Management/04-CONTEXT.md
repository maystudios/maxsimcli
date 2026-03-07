# Phase 4: Spec Drift Management — Context

**Discussed:** 2026-03-07
**Phase goal:** Users can detect and correct divergence between `.planning/` spec and actual codebase state using a single command
**Requirements:** DRIFT-01, DRIFT-02, DRIFT-03, DRIFT-04

---

## Decisions

### Drift Report Content & Format (DRIFT-01, DRIFT-02)

- **Full inventory, not just mismatches.** Report shows both aligned items and drifted items — gives a complete picture of spec-vs-code state. If everything passes, the report confirms alignment.
- **Both phase-level and per-requirement granularity.** Phase-level summary at top, per-requirement detail below. User gets the overview first, drills into specifics as needed.
- **Three severity tiers: critical / warning / info.** Critical = requirement marked done but completely missing in code. Warning = partially implemented. Info = cosmetic or naming drift.
- **Evidence included per mismatch.** Each mismatch cites both the spec line (file + section) AND the code location (file path, or explicit "not found"). Immediately actionable without further searching.
- **Per-item fix recommendations.** Each mismatch ends with a suggested action (e.g., "update REQUIREMENTS.md to mark as incomplete" or "implement missing handler in src/api/").
- **Output to `.planning/DRIFT-REPORT.md`.** Persists as a file, can be referenced by other agents and the realign command.
- **Two directional sections.** Report separates "Spec ahead of code" (spec says done, code is missing) from "Code ahead of spec" (code exists, spec doesn't mention it).
- **Dedicated "Undocumented Features" section.** Things in the codebase that work but aren't in any spec — surfaced so user can decide whether to document or remove.
- **Per-criterion breakdown for partial implementations.** Each success criterion listed with pass/fail status — shows exactly which criteria are met and which are missing.
- **Timestamped with diff tracking.** Each run creates a dated report. Subsequent runs show what changed since last check (new drifts, resolved drifts).
- **YAML frontmatter for machine consumption.** `status: drift|aligned`, `critical_count`, `warning_count`, `info_count` — consistent with reviewer agent frontmatter schema.
- **Partial check on incomplete spec.** If REQUIREMENTS.md or other spec docs are missing, run the check on whatever exists and warn about missing pieces at the top of the report. Don't refuse to run.

### Realignment Interaction Style (DRIFT-03, DRIFT-04)

- **Realign-to-code: item-by-item approval.** When updating spec to match code, present each proposed spec change individually. User reviews and chooses Accept / Skip / Edit per item. No batch auto-apply.
- **Realign-to-spec: generate new MAXSIM phases.** When code needs to catch up to spec, create new phases in the roadmap for each gap. Flows into the standard plan/execute cycle.
- **All-or-nothing per direction.** No cherry-picking individual mismatches — realignment handles all items in the chosen direction. Keeps the flow simpler and ensures nothing is accidentally missed.
- **Both inline and standalone commands.** `check-drift` offers realignment at the end of its output ("Realign to code, to spec, or done?"). `/maxsim:realign` also exists as a standalone command that reads the latest DRIFT-REPORT.md — can be run later.
- **Fix phases inserted after current phase.** When realign-to-spec creates new phases, they go right after the active phase so they're addressed next, not pushed to the end.
- **Auto-mark phases complete.** If realign-to-code discovers that all requirements and success criteria for a phase are met in code, mark the phase `[x]` in ROADMAP.md automatically.
- **Group related gaps into fewer phases.** When realign-to-spec would create many phases (10+ gaps), cluster related gaps into larger phases (e.g., "Fix remaining auth gaps" covers 3 requirements). Avoid phase explosion.

### Comparison Scope & Boundaries (DRIFT-01, DRIFT-02)

- **Full `.planning/` sweep.** Compare everything: REQUIREMENTS.md, decisions in STATE.md, CONVENTIONS.md, no-gos, phase summaries. Not just requirements — the entire spec surface.
- **All milestones, including archived.** Check archived milestone phases too — catches regression where previously-working features have drifted. No scope limit by milestone.
- **Descoped/deferred items excluded.** Items explicitly in "out-of-scope" or "deferred" sections are silently skipped. They're not drift, they're intentional gaps.
- **No-go violation checking.** If code contains patterns that documented no-gos explicitly forbid, flag as critical drift. No-gos are contracts, not suggestions.
- **Implementation = source code + tests.** A requirement is "implemented" only if both the feature code AND relevant tests exist. Missing tests = warning-level drift.
- **Convention compliance: best-effort pattern check.** Search for violations of stated conventions (e.g., grep for `throw` when convention says use `Result`). May have false positives — report as info-level with confidence indicator.
- **Fresh codebase scan every run.** Always analyze the live codebase — don't rely on potentially stale `.planning/codebase/` docs. Accuracy over speed.
- **Verify phase summaries.** Cross-check completed phase SUMMARY.md claims against actual code changes. Catches inflated completion claims or features that have since regressed.

---

## Claude's Discretion

- How to implement the codebase scanning (reuse map-codebase agent, custom scanner, or hybrid)
- Specific heuristics for detecting whether a requirement is "implemented" in code
- Format of the diff-tracking section (inline annotations, separate changelog, etc.)
- How to detect no-go violations (regex patterns, AST analysis, or AI analysis)
- Grouping algorithm for consolidating gaps into phases
- How to structure the realign command's CLI interface (subcommands, flags, interactive prompts)
- Whether check-drift should be a command, a workflow, or both

---

## Deferred Ideas

- Scheduled/automated drift checks (e.g., run on every commit or PR) — useful but separate from the manual command
- Drift severity thresholds in config (e.g., "fail CI if critical_count > 0") — integration feature, not core drift detection
- Visual drift dashboard showing alignment over time — dashboard feature, not CLI scope
- Per-developer drift attribution (who introduced the drift) — git blame integration, out of scope for this phase
