# Research: MCP Protocol & SDK Deep Dive

**Phase:** 03 — Backend Architecture Design
**Date:** 2026-03-02
**Scope:** MCP capabilities, SDK options, transport mechanisms, current implementations, unification strategy

---

## 1. Current MCP SDK Capabilities

### SDK Version & Status

MAXSIM currently uses `@modelcontextprotocol/sdk` v1.27.1 in both `packages/cli` and `packages/dashboard`. The SDK is at v1.27.x (latest as of March 2026), with a stable v2 release anticipated in Q1 2026. The v1.x line will continue to receive bug fixes and security updates for at least 6 months after v2 ships.

### Transport Options

The SDK provides three transport implementations:

| Transport | Import Path | Use Case |
|-----------|-------------|----------|
| **Stdio** | `@modelcontextprotocol/sdk/server/stdio.js` | Local process communication; client spawns server as child process |
| **Streamable HTTP** | `@modelcontextprotocol/sdk/server/streamableHttp.js` | Network-accessible servers; replaced SSE in spec 2025-03-26 |
| **SSE** (deprecated) | `@modelcontextprotocol/sdk/server/sse.js` | Legacy HTTP transport; still functional but superseded |

### Key SDK Classes

- **`McpServer`** — High-level server class. Provides `.tool()`, `.resource()`, `.prompt()` registration methods. Accepts `{ name, version }` config.
- **`StdioServerTransport`** — Reads JSON-RPC from stdin, writes to stdout. Zero configuration.
- **`StreamableHTTPServerTransport`** — Handles HTTP POST/GET/DELETE on a single endpoint. Supports optional session management via `Mcp-Session-Id` header. Accepts `{ sessionIdGenerator }` config (set to `undefined` for stateless mode).

### Schema Validation

The SDK uses **Zod** for input schema validation. Tool parameters are defined as Zod schemas and automatically converted to JSON Schema for the MCP protocol. This is consistent across both MAXSIM server implementations.

---

## 2. How Claude Code Discovers and Connects to MCP Servers

### Configuration Locations

Claude Code reads MCP server configuration from multiple locations (in priority order):

1. **Project-scoped** — `.mcp.json` in project root (version-controlled)
2. **Project-local** — `.claude/settings.local.json` (gitignored)
3. **User-global** — `~/.claude.json` (per-user)

### Stdio Servers

For stdio-based servers, Claude Code spawns the server as a child process:

```json
{
  "mcpServers": {
    "maxsim": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-server.cjs"],
      "env": {}
    }
  }
}
```

Claude Code manages the process lifecycle: spawns on session start, communicates via stdin/stdout JSON-RPC, and kills on session end.

### HTTP Servers

For HTTP-based servers, Claude Code connects to a running network endpoint:

```json
{
  "mcpServers": {
    "maxsim-dashboard": {
      "type": "http",
      "url": "http://localhost:3142/mcp"
    }
  }
}
```

The server must already be running; Claude Code does not manage its lifecycle. This is how MAXSIM's dashboard currently registers itself (see `registerMcpServerInClaudeJson()` in `packages/dashboard/src/server.ts`).

### Tool Discovery

Claude Code uses **MCP Tool Search** when tool descriptions would consume more than 10% of the context window. Instead of preloading all tool schemas, it dynamically loads tools on-demand. This is relevant for MAXSIM because a unified server with many tools could trigger this behavior.

---

## 3. MCP Tool Registration Patterns

### Current Pattern in MAXSIM

Both servers use the `McpServer.tool()` API with three arguments:

```typescript
server.tool(
  'tool_name',           // Unique identifier
  'Tool description',    // Human-readable description for LLM
  { /* Zod schema */ },  // Input parameters
  async (params) => {    // Handler returning { content: [...] }
    return { content: [{ type: 'text', text: '...' }] };
  }
);
```

### Tool Response Format

MAXSIM CLI tools use a structured JSON envelope via `mcpSuccess()` / `mcpError()` helpers:

```typescript
// Success
{ content: [{ type: 'text', text: JSON.stringify({ success: true, data: {...}, summary: '...' }) }] }

// Error
{ content: [{ type: 'text', text: JSON.stringify({ success: false, error: '...', summary: '...' }) }], isError: true }
```

The dashboard tools return raw JSON without the envelope (inconsistent with CLI tools).

### Tool Annotations (Spec 2025-03-26)

The 2025-03-26 specification added tool annotations that describe tool behavior:
- `readOnlyHint` — Tool does not modify state
- `destructiveHint` — Tool may perform destructive operations
- `idempotentHint` — Repeated calls with same args produce same result
- `openWorldHint` — Tool interacts with external entities

MAXSIM does not currently use tool annotations. Adding them would help Claude Code make better decisions about tool invocation safety.

### Resources and Prompts

The MCP protocol also supports:
- **Resources** — Expose files or data for the LLM to read (e.g., STATE.md contents, ROADMAP.md)
- **Prompts** — Reusable prompt templates with arguments

MAXSIM currently only uses the **tools** primitive. Resources and prompts could be valuable additions (see Recommendations).

---

## 4. Current Two MCP Server Implementations

### CLI Stdio Server (`packages/cli/src/mcp-server.ts`)

**Transport:** Stdio (stdin/stdout JSON-RPC)
**Entry point:** `packages/cli/src/mcp-server.ts` (built to `dist/mcp-server.cjs`)
**Tools registered via:** `registerAllTools()` from `packages/cli/src/mcp/index.ts`

**Architecture:**
- Standalone Node.js process spawned by Claude Code
- Uses `StdioServerTransport` — zero HTTP, zero network
- Tools: `mcp_find_phase`, `mcp_list_phases`, `mcp_create_phase`, `mcp_insert_phase`, `mcp_complete_phase`, `mcp_get_state`, `mcp_update_state`, `mcp_add_decision`, `mcp_add_blocker`, `mcp_resolve_blocker`, `mcp_add_todo`, `mcp_complete_todo`, `mcp_list_todos` (13 tools)
- Project root detection: walks up from `process.cwd()` looking for `.planning/`
- **Critical constraints documented in code:** never import `output()`/`error()` (they call `process.exit()`), never write to stdout (reserved for protocol), never call `process.exit()` (server must stay alive)

**Strengths:**
- Simple, reliable, no network dependencies
- Claude Code manages lifecycle automatically
- No port conflicts, no firewall issues
- Fast startup (single Node.js process)

**Weaknesses:**
- Only accessible to the spawning Claude Code session
- Cannot be shared with dashboard or other clients
- One instance per Claude Code session

### Dashboard HTTP Server (`packages/dashboard/src/mcp-server.ts` + `server.ts`)

**Transport:** Streamable HTTP on `POST /mcp`
**Entry point:** `createMcpServer()` factory in `packages/dashboard/src/mcp-server.ts`, mounted in `packages/dashboard/src/server.ts`
**Registration:** Writes to `~/.claude.json` under `projects[projectPath].mcpServers["maxsim-dashboard"]`

**Architecture:**
- Express app with `/mcp` endpoint handling POST/GET/DELETE
- Uses `StreamableHTTPServerTransport` in **stateless mode** (`sessionIdGenerator: undefined`)
- Creates a **new McpServer + transport per request** (stateless — no session persistence)
- Tools: `ask_question`, `start_conversation`, `get_conversation_history`, `submit_lifecycle_event`, `get_phase_status` (5 tools)
- Depends on injected dependencies: WebSocket server, question queue, pending answers map, conversations map, lifecycle state
- Port: deterministic per project path (range 3100-3199, djb2 hash)

**Strengths:**
- Network-accessible — dashboard UI and Claude Code can both call it
- Stateless design means no session cleanup complexity
- WebSocket broadcast for real-time dashboard updates

**Weaknesses:**
- Creates new server instance per request (inefficient; no connection reuse)
- Different tool set from CLI server — no overlap, no shared tools
- Different response format (raw JSON vs. structured envelope)
- Requires manual server management (not auto-spawned by Claude Code)
- Port conflicts possible across projects

### Key Differences Summary

| Aspect | CLI Server | Dashboard Server |
|--------|-----------|-----------------|
| Transport | Stdio | Streamable HTTP |
| Lifecycle | Managed by Claude Code | Self-managed (manual start) |
| Tools | 13 (phase, state, todo CRUD) | 5 (Q&A, lifecycle, conversations) |
| Response format | `{ success, data, summary }` envelope | Raw JSON |
| State | Stateless (filesystem-backed) | Stateful (in-memory queues, maps) |
| Clients | Single Claude Code session | Claude Code + Dashboard UI |
| Project detection | Walk up from cwd | `MAXSIM_PROJECT_CWD` env var |

---

## 5. MCP Server Lifecycle

### Stdio Server Lifecycle

1. **Startup:** Claude Code spawns `node dist/mcp-server.cjs` as child process
2. **Initialize:** Client sends `initialize` JSON-RPC request; server responds with capabilities
3. **Operation:** Client sends `tools/list` to discover tools, then `tools/call` for invocations
4. **Health:** No explicit health checks — Claude Code monitors the child process
5. **Reconnection:** If the process dies, Claude Code may restart it (implementation-dependent)
6. **Shutdown:** Claude Code kills the process on session end

### HTTP Server Lifecycle

1. **Startup:** User runs `maxsimcli start` or `maxsimcli dashboard`; Express server binds to port
2. **Registration:** Server writes its URL to `~/.claude.json` for Claude Code discovery
3. **Health:** `GET /api/health` endpoint returns `{ status: 'ok', cwd, uptime }`
4. **Operation:** Each `POST /mcp` creates a fresh transport + server, handles one request, then closes
5. **Reconnection:** Claude Code retries HTTP if request fails; server is always available at the port
6. **Shutdown:** Graceful shutdown via `SIGTERM`/`SIGINT`; unregisters from `~/.claude.json`

### Lifecycle Gaps

- No heartbeat/keepalive protocol in MCP itself (relies on transport-level mechanisms)
- The dashboard's per-request server instantiation means no persistent connection state
- No graceful degradation: if the HTTP server goes down, Claude Code gets connection errors with no fallback to stdio tools

---

## 6. Scaling: Can One Server Serve Both Claude Code and Dashboard?

### The Question

Can a single MCP server process provide tools to both Claude Code (as an MCP client) and the Dashboard (as a web UI)?

### Answer: Yes, with a Dual-Transport Architecture

A single Node.js process can expose:
1. **Stdio transport** for Claude Code (spawned as child process)
2. **HTTP transport** for the Dashboard and other network clients

However, this requires careful design:

**Option A: Single Process, Dual Transport**
- One process listens on stdio AND serves HTTP
- Shared tool registry, shared state
- Claude Code spawns it via stdio; dashboard connects via HTTP
- Challenge: Claude Code's stdio spawn model assumes the process communicates ONLY via stdio. Binding an HTTP port in a stdio-spawned process is unconventional but technically possible.

**Option B: Shared Core, Separate Transports (Recommended)**
- One shared library of tool handlers (the "core" layer)
- CLI entry point: wraps core in stdio transport
- Dashboard entry point: wraps core in HTTP transport + Express + WebSocket
- Both import from the same `registerAllTools()` registry
- Clean separation of concerns; no transport mixing

**Option C: HTTP-Only with Proxy**
- Single HTTP server; Claude Code connects via HTTP instead of stdio
- Requires server to be running before Claude Code session starts
- Loses the auto-spawn convenience of stdio
- Adds network dependency for local development

### Transport Combination Recommendations

For MAXSIM's use case, **Option B** is the most practical:

- Claude Code sessions get a lightweight stdio server with fast startup
- Dashboard gets an HTTP server with the same tools PLUS dashboard-specific tools (Q&A, lifecycle)
- The shared core ensures consistency without coupling transports
- Both can run simultaneously without conflict

---

## 7. MCP Protocol Evolution (2025-2026)

### Spec Version Timeline

| Version | Date | Key Changes |
|---------|------|-------------|
| 2024-11-05 | Nov 2024 | Initial stable spec: stdio + SSE transports |
| 2025-03-26 | Mar 2025 | Streamable HTTP replaces SSE; OAuth 2.1 auth; tool annotations; audio content; JSON-RPC batching |
| 2025-11-25 | Nov 2025 | Tasks primitive (experimental); improved OAuth with PKCE; extension system; client ID metadata |
| ~2026-06 (est.) | Mid 2026 | Next major spec release (SEPs being finalized in Q1 2026) |

### Streamable HTTP Transport (2025-03-26)

Replaced the SSE transport. Key properties:
- Single endpoint (e.g., `/mcp`) handling POST, GET, DELETE
- POST for client-to-server messages; can return immediate response or upgrade to SSE stream
- GET for server-to-client streaming (server-initiated notifications)
- DELETE for session termination
- Optional session management via `Mcp-Session-Id` header
- Proxy-friendly (standard HTTP semantics)

MAXSIM's dashboard already uses this transport correctly.

### OAuth 2.1 Authorization (2025-03-26, refined 2025-11-25)

- Servers can act as OAuth 2.1 resource servers
- Clients behave as OAuth clients with PKCE (mandatory)
- Supports dynamic client registration, incremental scope requests
- Client ID metadata documents for simplified registration
- Relevant for MAXSIM if the dashboard is exposed beyond localhost

### Tasks Primitive (2025-11-25, Experimental)

- Any request can become "call-now, fetch-later"
- Client submits a request, gets a task ID, polls for completion
- Useful for long-running operations (e.g., phase execution, batch operations)
- Could enable async workflows: start a phase execution, check status from dashboard

### Extension System (2025-11-25)

- Formal mechanism for optional spec extensions
- Explicit capability negotiation during initialization
- Extension settings for client/server coordination
- MAXSIM could define custom extensions for workflow-specific capabilities

### Tool Annotations (2025-03-26)

Already mentioned in Section 3. Annotations are hints, not guarantees — clients should treat them as untrusted unless the server is trusted. MAXSIM's tools would benefit from:
- `mcp_list_phases` / `mcp_get_state` / `mcp_list_todos` — `readOnlyHint: true`
- `mcp_create_phase` / `mcp_insert_phase` — `destructiveHint: false`, `idempotentHint: false`
- `mcp_complete_phase` — `destructiveHint: false`, `idempotentHint: true`

---

## 8. Recommendations

### R1: Unify Tool Registries via Shared Core

Extract all tool handlers into a shared module that both the stdio server and dashboard HTTP server import. This directly addresses the current split between 13 CLI tools and 5 dashboard tools.

**Implementation:**
- Move `packages/cli/src/mcp/` handlers to a shared location (or keep in `cli` and import from dashboard)
- Dashboard server calls `registerAllTools(server)` to get phase/state/todo tools AND its own dashboard-specific tools
- Standardize response format: all tools use the `{ success, data, summary }` envelope

**Relates to:** MCP-05 (Q&A routing), DASH-04 (dashboard as optional UI layer)

### R2: Add MCP Resources for Context Documents

Expose `.planning/` documents as MCP resources:
- `maxsim://state` — STATE.md contents
- `maxsim://roadmap` — ROADMAP.md contents
- `maxsim://requirements` — REQUIREMENTS.md contents

This gives Claude Code direct read access without tool invocation overhead.

### R3: Add Tool Annotations

Annotate all existing tools with `readOnlyHint`, `destructiveHint`, and `idempotentHint`. Low effort, high value for Claude Code's tool selection.

### R4: Fix Dashboard Per-Request Server Instantiation

The current pattern of creating a new `McpServer` + `StreamableHTTPServerTransport` per HTTP request is wasteful. Refactor to:
- Create the `McpServer` once at startup
- Use session-based or sessionless transport that persists across requests
- This also enables server-initiated notifications (e.g., file-change events to Claude Code)

### R5: Keep Dual-Transport Architecture (Option B from Section 6)

Do not try to serve stdio and HTTP from the same process. Maintain:
- Stdio server for Claude Code (auto-spawned, lightweight)
- HTTP server for dashboard + external clients (user-managed, feature-rich)
- Shared tool handlers imported by both

### R6: Plan for Tasks Primitive

The experimental Tasks primitive in spec 2025-11-25 maps well to MAXSIM's long-running phase execution workflows. Monitor its stabilization and plan to adopt when it leaves experimental status.

### R7: Defer OAuth Until Network Exposure Is Needed

OAuth 2.1 authorization is unnecessary while MAXSIM servers run on localhost. If/when the dashboard is exposed to LAN or remote access (MAXSIM_NETWORK_MODE), implement OAuth as a security layer.

---

## References

- [MCP Specification 2025-03-26 — Transports](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [MCP Specification 2025-03-26 — Key Changes](https://modelcontextprotocol.io/specification/2025-03-26/changelog)
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK — GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [@modelcontextprotocol/sdk — npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Why MCP Deprecated SSE and Went with Streamable HTTP](https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/)
- [MCP 2025-11-25 Spec Update — WorkOS](https://workos.com/blog/mcp-2025-11-25-spec-update)
- [Exploring the Future of MCP Transports — MCP Blog](http://blog.modelcontextprotocol.io/posts/2025-12-19-mcp-transport-future/)

---

*Research completed: 2026-03-02*
