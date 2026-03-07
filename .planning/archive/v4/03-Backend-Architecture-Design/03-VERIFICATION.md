# Phase 03: Backend Architecture Design — Verification

**Verified:** 2026-03-02
**Reviewer:** Automated verification (Unit 7)
**PRs reviewed:** #41, #42, #43, #44, #45, #46

---

## 1. Document Existence

| # | Document | PR | Status | Lines |
|---|----------|----|--------|-------|
| 1 | `03-RESEARCH-TECH-STACKS.md` | #41 (OPEN) | Exists | 315 |
| 2 | `03-RESEARCH-MCP-PROTOCOL.md` | #42 (OPEN) | Exists | 396 |
| 3 | `03-RESEARCH-STATE-FILEWATCHING.md` | #43 (OPEN) | Exists | 456 |
| 4 | `03-RESEARCH-TERMINAL-PROCESS.md` | #44 (OPEN) | Exists | 345 |
| 5 | `03-RESEARCH-REALTIME-COMM.md` | #45 (OPEN) | Exists | 534 |
| 6 | `03-ARCHITECTURE.md` | #46 (OPEN) | Exists | 645 |

**Result: PASS** — All 6 documents exist. Total content: ~2,691 lines across all documents. None are stubs.

---

## 2. Success Criteria Coverage

Checking that the architecture document (`03-ARCHITECTURE.md`, PR #46) meets the required success criteria:

### 2.1 Research doc comparing tech stack options

- **Status: PASS**
- `03-RESEARCH-TECH-STACKS.md` (PR #41) evaluates Node.js/TypeScript, Python, Rust, and Go across 8 criteria (process stability, MCP SDK maturity, WebSocket ecosystem, cross-platform pty, file watching, cross-platform support, developer experience, npm delivery).
- Includes a comparison matrix (Section 6) and a clear recommendation (Section 7).
- The architecture document (Section 1) summarizes the evaluation and references the same criteria.

### 2.2 Decision documented with rationale

- **Status: PASS**
- The architecture document opens with a Decision Summary table listing all major technology choices with rationale.
- Section 1 provides a detailed justification for Node.js/TypeScript, explicitly referencing GUARD-01 (npm delivery) as the dominant factor.
- The rationale is substantive: it explains why alternatives were rejected (not just why Node.js was chosen).

### 2.3 Library selection for each concern

- **Status: PASS**
- Section 5 ("Library Selection Table") lists 12 libraries with version, rationale, and explicit note that all are existing dependencies.
- Concerns covered: MCP SDK, HTTP server, WebSocket, terminal pty, file watching, schema validation, static file serving, port detection, slug generation, debouncing, logging, process management.
- The document explicitly notes that zero new dependencies are introduced.

### 2.4 Architecture doc with component diagram, data flow, and API surface

- **Status: PASS**
- **Component diagram:** Section 2 contains a Mermaid graph showing all backend components (MCP Server, HTTP Server, WebSocket Server, State Manager, Terminal Manager, File Watcher, Q&A Router, Process Manager) and their connections to Claude Code, Browser, and the filesystem.
- **Data flow:** Section 3 provides 4 Mermaid sequence diagrams: state read, state write with dashboard notification, terminal output streaming, and Q&A routing.
- **API surface:** Section 4 defines the full API surface across three interfaces: MCP tools (23 tools), REST endpoints (18 endpoints), and WebSocket events (12 server-to-client types, 5 client-to-server types).

---

## 3. Stability Guard Compliance

### GUARD-01: MUST NOT break `npx maxsimcli@latest` install flow

- **Status: PASS**
- The architecture preserves the existing npm delivery model. The backend bundles into `dist/assets/backend/backend.js` and ships in the npm tarball alongside existing assets.
- Section 6 (Migration Path) explicitly states: "CLI stdio MCP server continues to work independently for users who do not start the backend."
- Section 8 (Deployment Model) confirms the installation flow adds the backend as an optional component without changing the core install.

### GUARD-02: MUST NOT remove existing `/maxsim:*` command interfaces

- **Status: PASS**
- Section 6 states: "No breaking changes: All existing `/maxsim:*` commands continue to work through CLI stdio MCP or through the backend MCP."
- The CLI `dist/cli.cjs` tools router is preserved. The backend extends functionality; it does not replace the CLI.
- Appendix A maps GUARD-02 to: "All `/maxsim:*` commands continue to work via CLI or backend MCP."

### GUARD-03: MUST NOT break existing `.planning/` file format

- **Status: PASS**
- The state management research (PR #43) explicitly recommends keeping markdown as the canonical format (Section 6) with GUARD-03 as the primary justification.
- The architecture document confirms `.planning/` file formats are unchanged (Appendix A).
- The State Manager reads/writes the same markdown files with the same format. No migration or format change is proposed.

### GUARD-04: Every change must ship in the npm package

- **Status: PASS**
- Section 8 shows the backend shipping as `dist/assets/backend/backend.js` inside the npm tarball.
- Section 5 confirms all libraries are existing dependencies; no new native dependencies are introduced beyond what already exists (node-pty).
- The tech stack research (PR #41) uses GUARD-04 as a key criterion, rating Python, Rust, and Go as "Poor" or "Feasible" on npm delivery.

---

## 4. Cross-Document Consistency

### 4.1 Tech stack research vs architecture decision

- **Status: CONSISTENT**
- Tech stack research (PR #41) recommends Node.js/TypeScript. Architecture (PR #46) selects Node.js/TypeScript.
- Both documents cite the same rationale: npm delivery constraint, zero migration cost, first-party MCP SDK.
- The architecture's comparison table (Section 1) is a faithful summary of the research.

### 4.2 MCP protocol research vs architecture MCP design

- **Status: CONSISTENT**
- MCP research (PR #42) recommends "Option B: Shared Core, Separate Transports" (Section 6).
- Architecture adopts this: Streamable HTTP as primary transport, stdio as fallback (Decision Summary).
- MCP research recommends unifying tool registries (R1). Architecture merges all tools into a single MCP server (Section 4.1).
- MCP research recommends fixing per-request server instantiation (R4). Architecture uses a persistent MCP server instance.
- **Minor gap:** MCP research recommends MCP Resources (R2) for exposing STATE.md/ROADMAP.md. The architecture document does not include MCP Resources in the API surface; only MCP tools are defined. This is a minor omission — resources are additive and can be added later without architectural changes.
- **Minor gap:** MCP research recommends tool annotations (R3). The architecture does not mention tool annotations. Again, additive and non-blocking.

### 4.3 State management research vs architecture state design

- **Status: CONSISTENT**
- State research (PR #43) recommends "Option A: File-Based with Caching Layer." Architecture adopts the State Manager pattern with file-backed storage.
- State research recommends optimistic concurrency. Architecture does not explicitly mention the concurrency strategy, but the State Manager design (single writer in the backend) is compatible with optimistic concurrency.
- State research redefines "source of truth" as files-are-truth, backend-is-authoritative-reader. Architecture Section 2 describes the State Manager as "Single source of truth for all `.planning/` file operations" which is consistent with this interpretation.
- State research recommends consolidating dashboard parsing logic into shared core. Architecture adopts this via `@maxsim/core` imports.

### 4.4 Terminal research vs architecture terminal design

- **Status: CONSISTENT**
- Terminal research (PR #44) recommends staying with node-pty and hardening the self-daemonization approach with PID file management.
- Architecture selects node-pty 1.x and PID file + lock for process management.
- Terminal research recommends unifying port ranges. Architecture uses the 3100-3199 range consistently.
- Terminal research recommends extending the disconnect timer (from 60s to 10-15 minutes). Architecture does not explicitly address the disconnect timer. This is a detail-level gap, not an architectural inconsistency.
- Terminal research identifies a port range mismatch bug (server uses 3100-3199, launcher scans 3333-3343). Architecture uses 3100-3199 throughout, implicitly fixing this. However, the bug fix is not explicitly called out.

### 4.5 Real-time communication research vs architecture WebSocket design

- **Status: MOSTLY CONSISTENT**
- Realtime research (PR #45) recommends keeping dual-WebSocket architecture (`/api/ws` + `/ws/terminal`). Architecture Section 4.3 shows a single `/ws` endpoint with namespaced event types (e.g., `terminal:output`, `file-changes`). This is a simplification from two WebSocket servers to one.
- This is not a contradiction — it is a design decision that differs from the research recommendation. The architecture's approach (single WebSocket with event namespacing) is a valid alternative that reduces connection management complexity. However, the rationale for diverging from the research recommendation is not documented.
- Realtime research recommends adding sequence numbers and a message buffer. Architecture does not include these in the WebSocket event types. This is a gap — the `seq`, `ts`, `v` envelope from the research is not reflected in the architecture's event type definitions.
- Realtime research recommends bearer token authentication for network mode. Architecture does not address authentication. Acceptable for v1 (localhost-only), but worth noting.

### 4.6 Summary of cross-document gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| MCP Resources not in architecture API surface | Low | Additive feature, no architectural impact |
| Tool annotations not mentioned in architecture | Low | Additive feature, no architectural impact |
| Message envelope (seq/ts/v) not in WebSocket event types | Medium | Affects reconnection reliability; should be added to architecture |
| Single WS endpoint vs dual WS — divergence not explained | Low | Valid design choice but rationale should be documented |
| Disconnect timer duration not specified | Low | Implementation detail, not architectural |
| Port range bug fix not explicitly called out | Low | Implicitly fixed by consistent range usage |
| Authentication for network mode not addressed | Low | Acceptable for localhost-only v1 |

---

## 5. Substantiveness Check

| Document | Lines | Sections | Assessment |
|----------|-------|----------|------------|
| `03-RESEARCH-TECH-STACKS.md` | 315 | 7 sections + comparison matrix + recommendation | **Substantive.** Thorough evaluation of 4 runtimes across 8 criteria with sourced data. |
| `03-RESEARCH-MCP-PROTOCOL.md` | 396 | 8 sections + 7 recommendations | **Substantive.** Deep analysis of current MCP implementations, SDK capabilities, transport options, and protocol evolution. |
| `03-RESEARCH-STATE-FILEWATCHING.md` | 456 | 8 sections + recommendation | **Substantive.** Detailed analysis of current state management, 3 storage options evaluated, concurrency strategies, cache invalidation design. |
| `03-RESEARCH-TERMINAL-PROCESS.md` | 345 | 8 sections + recommendations | **Substantive.** Covers node-pty analysis, 5 alternative approaches, 4 persistence strategies, process manager evaluation, port allocation analysis with bug identification. |
| `03-RESEARCH-REALTIME-COMM.md` | 534 | 8 sections + recommendation | **Substantive.** Complete event catalog, protocol envelope design, reconnection strategy, authentication analysis, Q&A routing design. |
| `03-ARCHITECTURE.md` | 645 | 8 sections + appendix | **Substantive.** Full architecture document with component diagram, 4 data flow diagrams, complete API surface (MCP + REST + WS), library selection, migration path, package structure, deployment model, requirement traceability. |

**Result: PASS** — All 6 documents are substantive. None are stubs or placeholders.

---

## 6. Overall Assessment

### Result: PASS

The Phase 03 research and architecture documents form a comprehensive, internally consistent body of work. The architecture document addresses all success criteria (tech stack comparison, decision with rationale, library selection, component diagram, data flow, API surface). All four stability guards are respected. The research recommendations are reflected in the architecture with only minor omissions (MCP Resources, tool annotations, message envelope).

### Strengths

1. **Thorough research.** Each research document evaluates multiple options with pros/cons and clear recommendations.
2. **Requirement traceability.** The architecture document maps every requirement (BE-01 through BE-06, DC-01 through DC-05, FUT-05, GUARD-01 through GUARD-04) to specific design decisions.
3. **Incremental migration.** The Phase 4/6/8 migration path ensures no big-bang rewrite; each phase is independently deployable.
4. **Zero new dependencies.** The architecture reuses all existing libraries, minimizing supply chain risk and tarball size.
5. **Backward compatibility.** The CLI stdio MCP server remains as a fallback, ensuring existing workflows are not disrupted.

### Items to Address Before Implementation

1. **Add message envelope to WebSocket protocol.** The architecture's WebSocket event types should include the `seq`/`ts`/`v` envelope from the real-time communication research. This is important for reconnection reliability.
2. **Document the single-WS-endpoint decision.** The architecture chose a single `/ws` endpoint while the research recommended dual WebSocket servers. The rationale should be briefly stated.
3. **Consider adding MCP Resources** to the API surface in the architecture. The MCP research makes a compelling case for exposing `.planning/` documents as resources.

---

*Verification completed: 2026-03-02*
