# Hook Bridge: MCP Server Integration

The Hook Bridge is an MCP (Model Context Protocol) server embedded in the MAXSIM dashboard Express process. It exposes tools that Claude Code workflows can call to interact with the browser UI — asking questions, reporting lifecycle events, and querying state.

## Architecture

```
Claude Code workflow
  -> MCP tool call (ask_question / submit_lifecycle_event / get_phase_status)
  -> POST /mcp (StreamableHTTPServerTransport)
  -> mcp-server.ts handler
  -> WebSocket broadcast to browser
  -> Browser UI updates (discussion-view, status-bar)
  -> User answers in browser
  -> POST /api/mcp-answer
  -> Resolves pending Promise in mcp-server.ts
  -> MCP tool returns answer to Claude Code
```

## MCP Tools Reference

### `ask_question`

Presents a question in the browser discussion view and blocks until the user answers.

**Input Schema:**
```json
{
  "question": "string (required) — The question text, supports markdown",
  "options": [
    {
      "value": "string — option identifier",
      "label": "string — display label",
      "description": "string — optional description"
    }
  ],
  "allow_free_text": "boolean (default: true) — whether free-text input is shown"
}
```

**Behavior:** The tool creates a `PendingQuestion` entry in the server's `pendingQuestions` Map, broadcasts a `question-received` WebSocket message, and returns a Promise that blocks until `/api/mcp-answer` is called with the matching `questionId`. There is no timeout — the tool waits indefinitely.

**Response:** `{ "answer": "string" }` — the user's answer text.

### `submit_lifecycle_event`

Broadcasts a lifecycle event to all connected browser clients for display in the StatusBar.

**Input Schema:**
```json
{
  "event_type": "string (enum: phase-started | phase-completed | plan-started | plan-completed | task-started | task-completed | verification-started | verification-completed)",
  "phase_name": "string (optional) — human-readable phase name",
  "phase_number": "string (optional) — phase number (e.g., '33')",
  "step": "number (optional) — current step index",
  "total_steps": "number (optional) — total steps in sequence"
}
```

**Behavior:** Stores the event as `lastLifecycleEvent` on the server (for reconnect delivery) and broadcasts a `lifecycle` WebSocket message. Non-blocking — returns immediately.

**Response:** `{ "status": "ok" }`

### `get_phase_status`

Returns current queue state and last lifecycle event. Useful for Claude Code to check if questions are pending.

**Input Schema:** None (no parameters).

**Response:**
```json
{
  "pendingQuestions": 2,
  "lastLifecycleEvent": { "event_type": "plan-started", "phase_name": "Hook Bridge", "phase_number": "33" }
}
```

## Extension Pattern

To add a new MCP tool (e.g., `show_progress`):

### 1. Register the tool in `mcp-server.ts`

```typescript
server.tool('show_progress', z.object({
  percent: z.number(),
  label: z.string().optional(),
}).shape, async ({ percent, label }) => {
  broadcast({ type: 'progress-update', percent, label });
  return { content: [{ type: 'text', text: JSON.stringify({ status: 'ok' }) }] };
});
```

### 2. Add WebSocket message handler in `websocket-provider.tsx`

```typescript
case 'progress-update':
  setProgressPercent(data.percent);
  break;
```

### 3. Wire to a UI component

Expose the new state from the WebSocket provider context and consume it in a React component.

### 4. (Optional) Add reconnect delivery in `server.ts`

If the new event should be delivered to clients that reconnect, store the latest value on the server and send it in the `wss.on('connection')` handler alongside existing `questions-queued` and `lifecycle` messages.

## Configuration

### MCP Timeout

The `ask_question` tool has **no timeout** — it waits indefinitely for the user to answer in the browser. If a timeout is needed in future, modify the Promise creation in `mcp-server.ts`:

```typescript
// In the ask_question handler, wrap the Promise with a timeout:
const answer = await Promise.race([
  new Promise<string>((resolve) => { pendingQuestions.set(id, { ...q, resolve }); }),
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), MCP_TIMEOUT_MS)),
]);
```

### Transport

Uses `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined` for stateless per-request operation. Each MCP request gets a fresh transport — no session persistence. This simplifies the server and avoids stale session cleanup.

## Auto-Registration

On dashboard startup, `registerMcpServerInClaudeJson()` writes an entry to `~/.claude.json`:

```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "maxsim-dashboard": {
          "type": "http",
          "url": "http://localhost:3333/mcp"
        }
      }
    }
  }
}
```

- Uses the project's `projectCwd` as the key (filesystem path as-is)
- Atomic write via `.tmp` file + rename to prevent corruption
- On shutdown, `unregisterMcpServerFromClaudeJson()` removes the `maxsim-dashboard` entry
- Claude Code must be restarted after registration to pick up the new MCP server
