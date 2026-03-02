# Research: Real-Time Communication Patterns

**Phase:** 03 — Backend Architecture Design
**Date:** 2026-03-02
**Scope:** Real-time communication patterns for backend-to-client communication in MAXSIM

---

## 1. Current WebSocket Usage Analysis

### Architecture Overview

The current dashboard uses the `ws` library with two separate WebSocket servers on a single HTTP server, distinguished by URL path during the upgrade handshake:

| Endpoint | Purpose | Server Variable |
|----------|---------|-----------------|
| `/api/ws` | Dashboard events (file changes, Q&A, lifecycle) | `wss` |
| `/ws/terminal` | PTY terminal I/O (xterm.js) | `terminalWss` |

Both use `noServer: true` mode, with manual upgrade routing in `server.on('upgrade', ...)`. This is a clean separation that avoids cross-contamination between high-frequency terminal output and lower-frequency dashboard events.

**Source files:**
- `packages/dashboard/src/server.ts` — server-side WebSocket setup, broadcast function, upgrade routing
- `packages/dashboard/src/components/providers/websocket-provider.tsx` — client-side React context for dashboard WS
- `packages/dashboard/src/hooks/use-terminal.ts` — client-side terminal WS hook
- `packages/dashboard/src/terminal/pty-manager.ts` — server-side PTY session management with per-client broadcast

### Broadcast Pattern

The `broadcast()` function iterates over `wss.clients` and sends to every connected client with `readyState === OPEN`. This is a simple fan-out pattern with no filtering, no message queuing, and no delivery confirmation:

```typescript
function broadcast(wss: WebSocketServer, message: Record<string, unknown>): void {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
```

The terminal PTY manager has its own separate broadcast via `broadcastToClients()` that iterates over a `Set<WebSocket>` of registered terminal clients.

### Current Message Types

**Dashboard WebSocket (`/api/ws`):**

| Type | Direction | Trigger | Payload |
|------|-----------|---------|---------|
| `connected` | server->client | On WS open | `{ timestamp }` |
| `file-changes` | server->client | Chokidar detects `.planning/` changes | `{ timestamp, changedFiles[] }` |
| `question-received` | server->client | MCP `ask_question` tool called | `{ question, queueLength }` |
| `questions-queued` | server->client | Client reconnects with pending questions | `{ questions[], count }` |
| `answer-given` | server->client | User answers via `/api/mcp-answer` | `{ questionId, conversationId, remainingQueue }` |
| `lifecycle` | server->client | MCP `submit_lifecycle_event` tool called | `{ event: { event_type, phase_name, phase_number, step, total_steps, timestamp } }` |
| `conversation-started` | server->client | MCP `start_conversation` tool called | `{ conversation: { id, topic, createdAt } }` |

**Terminal WebSocket (`/ws/terminal`):**

| Type | Direction | Trigger | Payload |
|------|-----------|---------|---------|
| `output` | server->client | PTY process writes data | `{ data }` (raw terminal bytes) |
| `scrollback` | server->client | New client connects | `{ data }` (full session buffer) |
| `status` | server->client | 1-second interval broadcast | `{ pid, uptime, cwd, memoryMB, isActive, skipPermissions, alive }` |
| `exit` | server->client | PTY process exits | `{ code }` |
| `started` | server->client | PTY process spawned | `{ pid }` |
| `unavailable` | server->client | node-pty not installed | `{ reason }` |
| `input` | client->server | User types in terminal | `{ data }` |
| `resize` | client->server | Terminal window resized | `{ cols, rows }` |
| `spawn` | client->server | Start terminal process | `{ skipPermissions, cols?, rows? }` |
| `kill` | client->server | Kill terminal process | (empty) |

### Client-Side Reconnection

The dashboard WebSocket provider (`websocket-provider.tsx`) implements exponential backoff reconnection:
- Initial delay: 2000ms
- Multiplier: 1.5x
- Max delay: 30000ms
- No max retry limit (reconnects forever)

The terminal hook (`use-terminal.ts`) uses fixed-delay reconnection:
- Fixed delay: 2000ms
- Max retries: 10
- Stops after max retries

### State Recovery on Reconnect

The server has a second `wss.on('connection')` handler that sends queued questions and the last lifecycle state to newly connected clients. This provides partial state recovery but has gaps:
- File change history is not replayed
- Conversation state is not sent on reconnect
- No sequence numbering to detect missed messages
- Terminal uses scrollback buffer replay (full session history via `SessionStore`)

---

## 2. WebSocket vs Server-Sent Events vs Long Polling

### Comparison Matrix

| Criterion | WebSocket | Server-Sent Events (SSE) | Long Polling |
|-----------|-----------|--------------------------|--------------|
| **Direction** | Bidirectional | Server-to-client only | Request-response |
| **Protocol** | `ws://` / `wss://` | Standard HTTP | Standard HTTP |
| **Binary data** | Yes | No (text only) | Yes |
| **Auto-reconnect** | Manual implementation | Built-in (`EventSource`) | Manual implementation |
| **Last-Event-ID** | Manual implementation | Built-in header | Manual implementation |
| **Proxy/CDN friendliness** | Poor (upgrade required) | Good (standard HTTP) | Good (standard HTTP) |
| **Browser support** | Universal | Universal (except IE11) | Universal |
| **Connection overhead** | Single TCP connection | Single TCP connection | New connection per poll |
| **Server complexity** | Moderate | Low | Low |
| **Max connections** | OS-limited (~65K) | OS-limited (~65K) | OS-limited (~65K) |

### Use Case Mapping for MAXSIM

| Use Case | Best Protocol | Rationale |
|----------|---------------|-----------|
| **State changes** (file changes, phase transitions) | SSE or WebSocket | Server-to-client only; SSE's built-in `Last-Event-ID` is ideal for replay |
| **Terminal output** | WebSocket | Bidirectional (input + output); high frequency; binary-friendly |
| **Lifecycle events** | SSE or WebSocket | Server-to-client only; low frequency |
| **Q&A questions** (server->dashboard) | SSE or WebSocket | Server-to-client push |
| **Q&A answers** (dashboard->server) | HTTP POST (current) | Already implemented as REST; no need for WS |
| **Progress updates** | SSE or WebSocket | Server-to-client only; could use SSE with Last-Event-ID |

### Analysis

The terminal use case firmly requires WebSocket due to its bidirectional nature (user types input, server sends output). For the dashboard event stream, SSE would be a viable simplification since all dashboard messages flow server-to-client, and user actions (answering questions) already go through HTTP POST endpoints.

However, the current codebase already has a working WebSocket implementation for dashboard events. Switching to SSE would provide marginal benefits (built-in reconnection and `Last-Event-ID`) at the cost of maintaining two different real-time protocols. The built-in `Last-Event-ID` feature of SSE is compelling for missed-message handling but can be replicated with a sequence number in WebSocket messages.

---

## 3. Event Types Catalog

A centralized backend should support the following event categories. This catalog extends the current implementation with events needed for multi-project and MCP routing scenarios.

### Category: State Changes

| Event Type | Description | Frequency | Refs |
|------------|-------------|-----------|------|
| `state.file-changed` | Files in `.planning/` modified | Medium (batch debounced) | DASH-02 |
| `state.config-updated` | `.planning/config.json` changed | Rare | DASH-02 |
| `state.state-updated` | STATE.md content changed | Medium | MCP-04 |

### Category: Phase Lifecycle

| Event Type | Description | Frequency | Refs |
|------------|-------------|-----------|------|
| `lifecycle.phase-started` | Phase execution begins | Rare | DASH-02 |
| `lifecycle.phase-complete` | Phase execution finishes | Rare | DASH-02 |
| `lifecycle.plan-started` | Plan generation begins | Rare | DASH-02 |
| `lifecycle.plan-complete` | Plan generation finishes | Rare | DASH-02 |
| `lifecycle.step-progress` | Step N of M within a plan | Medium | DASH-02 |

### Category: Q&A / Discussion

| Event Type | Description | Frequency | Refs |
|------------|-------------|-----------|------|
| `qa.question-received` | New question from Claude Code agent | Low | MCP-05, DISC-07 |
| `qa.answer-given` | User answered a question | Low | MCP-05, DISC-07 |
| `qa.questions-queued` | Bulk replay of pending questions (reconnect) | Rare | MCP-05 |
| `qa.conversation-started` | New multi-turn conversation thread | Rare | DISC-07 |

### Category: Terminal

| Event Type | Description | Frequency | Refs |
|------------|-------------|-----------|------|
| `terminal.output` | PTY stdout/stderr data | Very high | DASH-03 |
| `terminal.scrollback` | Full session replay on connect | Rare | DASH-03 |
| `terminal.status` | Process status (pid, uptime, memory) | High (1/sec) | DASH-03 |
| `terminal.started` | PTY process spawned | Rare | DASH-03 |
| `terminal.exit` | PTY process exited | Rare | DASH-03 |
| `terminal.unavailable` | node-pty not installed | Rare | DASH-03 |

### Category: System

| Event Type | Description | Frequency | Refs |
|------------|-------------|-----------|------|
| `system.connected` | Client successfully connected | Rare | — |
| `system.heartbeat` | Keep-alive ping | Low (30s interval) | — |
| `system.server-shutdown` | Server is shutting down | Rare | — |

---

## 4. Message Protocol Design

### JSON Envelope Format

Every message on the WebSocket should use a standardized envelope:

```typescript
interface WSMessage {
  /** Dotted event type, e.g. "qa.question-received" */
  type: string;

  /** Monotonically increasing per-server-instance sequence number */
  seq: number;

  /** ISO 8601 timestamp of when the event was created */
  ts: string;

  /** Event-specific payload */
  data: Record<string, unknown>;

  /** Optional: target client ID for directed messages (null = broadcast) */
  target?: string | null;

  /** Protocol version for backward compatibility */
  v: number;
}
```

### Example Messages

**File change event:**
```json
{
  "type": "state.file-changed",
  "seq": 42,
  "ts": "2026-03-02T14:30:00.123Z",
  "data": {
    "files": ["STATE.md", "phases/01-Foundation/01-01-PLAN.md"],
    "trigger": "chokidar"
  },
  "v": 1
}
```

**Question received:**
```json
{
  "type": "qa.question-received",
  "seq": 43,
  "ts": "2026-03-02T14:30:05.456Z",
  "data": {
    "id": "uuid-here",
    "question": "Which database should we use?",
    "options": [
      { "value": "sqlite", "label": "SQLite", "description": "Lightweight, file-based" },
      { "value": "postgres", "label": "PostgreSQL", "description": "Full-featured RDBMS" }
    ],
    "allowFreeText": true,
    "conversationId": null,
    "queueLength": 1
  },
  "v": 1
}
```

### Event Typing System

Events use a dotted namespace convention: `{category}.{action}`. This enables:
- **Subscription filtering**: clients can subscribe to `lifecycle.*` or `qa.*`
- **Pattern matching**: middleware can route based on prefix
- **Extension**: new events can be added without breaking existing handlers

### Versioning Strategy

The `v` field in the envelope enables backward compatibility:
- **v: 1** — current protocol version
- Server includes `v` in every message
- Client checks `v` on connection and warns if server version is newer than expected
- Payload shapes are versioned implicitly: a `v: 2` message may have additional fields in `data`, but `v: 1` fields remain stable
- Breaking changes (removed fields, changed semantics) require a major version bump

The server should announce its protocol version in the initial `system.connected` message:

```json
{
  "type": "system.connected",
  "seq": 0,
  "ts": "2026-03-02T14:30:00.000Z",
  "data": {
    "protocolVersion": 1,
    "serverVersion": "1.2.3",
    "capabilities": ["qa", "lifecycle", "terminal", "file-watch"]
  },
  "v": 1
}
```

---

## 5. Multi-Client Scenarios

### Current Situation

The dashboard is typically accessed by a single browser tab, but nothing prevents multiple tabs or devices from connecting simultaneously. The current broadcast pattern sends every message to every connected client.

### Scenario: Dashboard + Claude Code Both Connected

With the planned centralized backend (referenced in REQUIREMENTS.md MCP-05), the server will have two types of clients:

1. **Dashboard clients** (browser WebSocket) — receive all events for display
2. **Claude Code agents** (MCP tool calls) — submit events and questions, receive answers

Currently, Claude Code interacts via MCP tool calls (HTTP-based `StreamableHTTPServerTransport`), not WebSocket. This means Claude Code is not a WebSocket client — it pushes events via MCP tools and blocks on Promise resolution for answers. This is an important architectural distinction.

### Broadcast vs Targeted Messages

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Broadcast** | File changes, lifecycle events, progress | Send to all `wss.clients` (current approach) |
| **Targeted** | Answer notification to specific MCP tool call | Promise resolution (current approach via `pendingAnswers` Map) |
| **Filtered broadcast** | Terminal output to terminal-subscribed clients only | Separate WebSocket server (current approach with `terminalWss`) |

The current architecture handles multi-client correctly for the dashboard case. The separation of concerns is clean:
- MCP tools are request-response (blocking Promise)
- Dashboard events are broadcast (fan-out to all WS clients)
- Terminal I/O is scoped to terminal-connected clients only

### Fan-Out Considerations

For a centralized backend serving multiple projects (DASH-07), fan-out must be scoped by project:
- Each project gets its own server instance on a deterministic port (current: `projectPort()` hashing to 3100-3199)
- No cross-project message leakage since each project has its own `WebSocketServer` instance
- If a shared server is introduced later, messages must include a `projectId` field and clients must subscribe to specific projects

---

## 6. Reconnection and Missed-Message Handling

### Current Gaps

The current implementation has several gaps in message reliability:

1. **No sequence numbers** — clients cannot detect missed messages
2. **Partial state recovery** — only questions and last lifecycle event are replayed on reconnect; file changes, conversation state, and intermediate lifecycle events are lost
3. **No message buffer** — messages sent while a client is disconnected are lost forever
4. **Different reconnection strategies** — dashboard WS reconnects forever with backoff; terminal WS gives up after 10 retries

### Proposed: Sequence-Number-Based Replay

Add a server-side message buffer with sequence numbers:

```typescript
interface MessageBuffer {
  /** Ring buffer of recent messages */
  messages: WSMessage[];
  /** Max buffer size (e.g., 1000 messages or 5 minutes) */
  maxSize: number;
  /** Current sequence counter */
  nextSeq: number;
}
```

**Reconnection protocol:**

1. Client connects and sends `{ type: "resume", lastSeq: 41 }` (or omits `lastSeq` for fresh connection)
2. Server checks if `lastSeq` is within the buffer window
3. If yes: server replays all messages with `seq > lastSeq` in order, then switches to live broadcast
4. If no (gap too large): server sends `{ type: "system.full-sync" }` with current state snapshot, then switches to live broadcast
5. For fresh connections (no `lastSeq`): server sends current state snapshot (questions, lifecycle, recent file changes)

**Buffer sizing:**

For a single-developer tool running locally, a modest buffer suffices:
- 1000 messages or 5 minutes of history (whichever is smaller)
- Terminal output excluded from the buffer (handled separately by `SessionStore` scrollback)
- Buffer is in-memory only (no persistence needed for a localhost dev tool)

### Heartbeat / Keep-Alive

Add a server-side heartbeat to detect dead connections faster than TCP timeout:

```typescript
// Server sends ping every 30 seconds
setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  }
}, 30_000);

// Terminate clients that don't respond to pings within 10 seconds
```

The `ws` library supports native WebSocket ping/pong frames, which are more efficient than application-level heartbeat messages.

---

## 7. Authentication and Authorization

### Current State

The server binds to `127.0.0.1` by default (localhost only). It binds to `0.0.0.0` when:
- `MAXSIM_NETWORK_MODE=1` is set, OR
- A Tailscale IP is detected on the machine

There is no authentication. No CORS restrictions beyond what the browser enforces by default. No API keys, tokens, or session cookies.

### Localhost-Only (Default Mode)

For localhost binding, authentication is largely unnecessary:
- Only processes on the same machine can connect
- The user running the dashboard is the only intended user
- Adding authentication would create friction (password prompts, token management) with minimal security benefit
- This matches the pattern used by other dev tools (Vite dev server, webpack-dev-server, Storybook)

**Minimal hardening for localhost:**
- Validate `Origin` header on WebSocket upgrade to reject cross-origin connections from malicious websites (WebSocket is not subject to same-origin policy by default)
- Set `X-Content-Type-Options: nosniff` and other standard security headers on HTTP responses

### Network Mode / Tailscale

When the server is network-accessible, security becomes relevant:
- **Tailscale**: provides mutual authentication at the network layer (all devices on a Tailscale network are authenticated). No additional auth needed.
- **LAN mode** (`MAXSIM_NETWORK_MODE=1`): the server is exposed to the local network. A shared secret or simple bearer token would be prudent.

**Proposed for network mode:**
- Generate a random bearer token on server start
- Print the token in the terminal and include it in the QR code URL
- Clients must send the token as a query parameter on WebSocket upgrade: `ws://host:port/api/ws?token=xxx`
- Server validates the token during the upgrade handshake
- Token is per-session (regenerated each time the server starts)

### CORS

The current Express server does not set explicit CORS headers. For the API endpoints:
- Localhost: CORS is not a concern (same-origin)
- Network mode: restrict `Access-Control-Allow-Origin` to the server's own origin, or use the token-based approach above

---

## 8. Discussion/Q&A Routing

### Current Flow

The Q&A flow is currently:

```
Claude Code Agent
  -> MCP tool call: ask_question(question, options)
    -> mcp-server.ts: creates PendingQuestion, pushes to questionQueue
    -> broadcast() sends "question-received" to all dashboard WS clients
    -> MCP tool blocks on Promise (pendingAnswers Map)

Dashboard UI
  -> User sees question in Discussion panel
  -> User submits answer via HTTP POST to /api/mcp-answer
    -> server.ts: resolves the Promise in pendingAnswers Map
    -> MCP tool unblocks, returns answer to Claude Code Agent
    -> broadcast() sends "answer-given" to all dashboard WS clients
```

This is a clean design. The MCP tool call acts as a synchronous RPC from Claude Code's perspective (it blocks until the user answers), while the dashboard gets real-time push notifications via WebSocket.

### Current Limitations

1. **No timeout** — if the user never answers, the MCP tool blocks forever. Claude Code may time out on its end, but the server-side Promise never resolves.
2. **No answer routing without dashboard** — if the dashboard is not open, questions accumulate in the queue with no way to answer them (terminal-only mode has no Q&A UI).
3. **Single-answer model** — each question can only be answered once. No "revise answer" or "undo" capability.
4. **No persistence** — questions and conversations are in-memory. Server restart loses all pending questions and conversation history.

### How It Should Work with a Centralized Backend

With a centralized backend, the Q&A routing should support multiple answer sources:

```
Answer Sources:
  1. Dashboard UI (browser) — via WebSocket or HTTP POST
  2. Terminal prompt — via CLI stdin (for non-dashboard users)
  3. Future: mobile app, Slack integration, etc.

Routing Logic:
  1. Question arrives via MCP tool call
  2. Backend stores question in queue (with optional persistence)
  3. Backend broadcasts question to all connected clients
  4. First valid answer from any source resolves the question
  5. Backend broadcasts "answer-given" to all clients
  6. MCP tool unblocks with the answer
```

**Key design decisions for centralized routing:**

- **First-answer-wins**: when multiple clients are connected, the first answer submitted wins. Other clients see the question disappear.
- **Question timeout**: add a configurable timeout (e.g., 5 minutes) after which the MCP tool returns a timeout error rather than blocking forever.
- **Persistence**: for robustness across server restarts, pending questions should be persisted to a file (e.g., `.planning/.maxsim-queue.json`). This is simple and aligns with the local-filesystem-as-truth principle.
- **Terminal fallback**: when no dashboard is connected, questions could be forwarded to the terminal (if a PTY session is active) as a `readline` prompt.

---

## Recommendation

### Keep WebSocket for Both Channels

Maintain the current dual-WebSocket architecture (`/api/ws` for dashboard events, `/ws/terminal` for PTY). Do not switch to SSE for dashboard events. Rationale:
- The existing implementation works and is well-understood
- SSE's built-in `Last-Event-ID` is nice but easily replicated with sequence numbers
- Maintaining a single protocol (WebSocket) across both channels reduces cognitive overhead
- If a future need arises for client-to-server push on the dashboard channel (e.g., subscription filtering), WebSocket already supports it

### Add Sequence Numbers and Message Buffer

This is the highest-value improvement. Add a monotonically increasing sequence number to every broadcast message and maintain a ring buffer of recent messages (1000 messages or 5 minutes). On reconnection, clients send their last-seen sequence number and the server replays missed messages. This addresses the current gap where file changes and intermediate lifecycle events are lost on reconnect.

### Standardize the Message Envelope

Adopt the `{ type, seq, ts, data, v }` envelope format described in Section 4. This provides:
- Dotted event namespaces for filtering and routing
- Sequence numbers for replay
- Timestamps for ordering
- Protocol versioning for backward compatibility

### Add Heartbeat with Native Pings

Use `ws` library's native ping/pong frames (not application-level messages) to detect dead connections within 30-40 seconds rather than waiting for TCP timeout.

### Add Bearer Token for Network Mode

Generate a per-session random token when the server binds to `0.0.0.0`. Include the token in the startup URL and QR code. Validate the token on WebSocket upgrade and API requests. No authentication needed for localhost-only binding.

### Add Question Timeout

Add a configurable timeout (default 5 minutes) for MCP `ask_question` calls. If the user does not answer within the timeout, the MCP tool returns a timeout error. This prevents indefinite blocking.

### Do Not Add Persistence Yet

Questions and conversations are ephemeral by nature (they exist within a single Claude Code session). Adding file-based persistence adds complexity without clear benefit for the v1 use case. Revisit if users report losing questions due to accidental server restarts.

### Migration Path

1. **Phase 1**: Add `seq` and `ts` to all broadcast messages (backward-compatible; clients that ignore these fields still work)
2. **Phase 2**: Add server-side message buffer and `resume` protocol on reconnection
3. **Phase 3**: Standardize envelope format with `v` field; update client to use dotted event types
4. **Phase 4**: Add heartbeat and token auth for network mode

This incremental approach avoids a big-bang rewrite while delivering reliability improvements early.

---

*Research completed: 2026-03-02*
*Related requirements: MCP-05, DASH-02, DASH-03, DASH-04, DASH-07, DISC-07*
