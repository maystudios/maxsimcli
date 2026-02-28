<dashboard_bridge>

## Dashboard Mode Detection

At the START of this workflow (before any user interaction), probe for the dashboard MCP server:

Call `mcp__maxsim-dashboard__get_phase_status` (no parameters).

- **Success** (returns JSON) → set `DASHBOARD_ACTIVE = true` for this workflow session
- **Failure** (tool not found, connection error) → set `DASHBOARD_ACTIVE = false`

Probe **once** per workflow. Do not re-probe. If the dashboard was not detected, use standard tools throughout.

**Mid-workflow fallback:** If an MCP call fails after a successful probe (dashboard crashed), fall back to `AskUserQuestion` for that call and set `DASHBOARD_ACTIVE = false` for the remainder.

## Question Routing

**When `DASHBOARD_ACTIVE = true`:** Use `mcp__maxsim-dashboard__ask_question` for ALL user questions.

**When `DASHBOARD_ACTIVE = false`:** Use `AskUserQuestion` as normal.

### Schema Translation: AskUserQuestion → ask_question

When routing to the dashboard MCP tool, translate fields as follows:

**Merge header into question:**
```
AskUserQuestion: header="Context", question="Which areas need discussion?"
→ ask_question:  question="**Context** — Which areas need discussion?"
```

**Convert options:**
```
AskUserQuestion: options=[{label: "Cards", description: "Grid layout"}]
→ ask_question:  options=[{value: "cards", label: "Cards", description: "Grid layout"}]
```

Rules:
1. Prepend `header` as bold prefix: `"**{header}** — {question}"`
2. Option `value` = slugified `label` (lowercase, spaces→hyphens)
3. Option `label` and `description` map directly
4. Always set `allow_free_text: true` (equivalent to AskUserQuestion's implicit "Other")
5. For `multiSelect`: prefix question with "Select all that apply:" and number each option. Parse the user's comma-separated response to determine selections.
6. The MCP tool returns a plain string. Match it against option `label` or `value` to identify the selection. Non-matching text = free-text "Other" input.

## Lifecycle Events

Use `mcp__maxsim-dashboard__submit_lifecycle_event` to report workflow progress to the dashboard. Only emit when `DASHBOARD_ACTIVE = true`.

| Event type | When to emit | Fields |
|---|---|---|
| `phase-started` | execute-phase: after init, before first wave | `phase_name`, `phase_number` |
| `plan-started` | execute-phase: before spawning each plan executor | `phase_name`, `phase_number`, `step` (1-based plan index), `total_steps` |
| `plan-complete` | execute-phase: after executor returns success | `phase_name`, `phase_number`, `step`, `total_steps` |
| `phase-complete` | execute-phase: after roadmap update | `phase_name`, `phase_number` |

**Fire-and-forget.** If the call fails, ignore and continue. Never gate workflow progress on lifecycle event delivery.

</dashboard_bridge>
