# Key Decisions

**Updated:** 2026-03-06
**Source:** Clean slate rewrite for v5.0 milestone

| # | Decision | Rationale | Alternatives Considered | Status |
|---|----------|-----------|------------------------|--------|
| 1 | Claude Code only -- no multi-runtime support | Simplifies codebase, enables deeper integration, one runtime to optimize for | Keep multi-runtime (broader reach but thinner integration) | Locked |
| 2 | SDD as core methodology | Two-stage review (spec + quality) catches more errors than end-of-phase review | Phase-only review, manual review, no formal review | Locked |
| 3 | Clean slate planning rewrite | Previous 17 completed phases created context rot in planning docs. Archive old phases, renumber from 1, describe what exists as baseline instead of tracking history | Keep accumulated roadmap (familiar but noisy), partial cleanup (half measures) | Locked |
| 4 | Context rot prevention as Phase 1 | MAXSIM should practice what it preaches -- if we prevent context rot for users, we must prevent it in our own planning docs first | Start with init questioning (more visible feature), start with agent coherence (higher impact) | Locked |
| 5 | YOLO mode with standard depth | Project owner knows the codebase well; interactive confirmations slow down iteration | Interactive mode (safer but slower), comprehensive depth (overkill) | Locked |
| 6 | Balanced model profile | Good quality/cost ratio for iterative development | Quality (higher cost), budget (lower quality) | Locked |

---
*Decisions captured during v5.0 planning rewrite*
