import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/lib/types";

/**
 * Todos panel with pending/completed lists, add new todo, and mark complete.
 *
 * Fetches from /api/todos and refreshes on WebSocket file change events.
 * POST creates new todos; PATCH toggles completion state.
 */
export function TodosPanel() {
  const { lastChange } = useWebSocket();

  const [pending, setPending] = useState<TodoItem[]>([]);
  const [completed, setCompleted] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error(`Failed to fetch todos: ${res.status}`);
      const data = (await res.json()) as { pending: TodoItem[]; completed: TodoItem[] };
      setPending(data.pending);
      setCompleted(data.completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Refetch on WebSocket change
  useEffect(() => {
    if (lastChange > 0) {
      fetchTodos();
    }
  }, [lastChange, fetchTodos]);

  const handleAddTodo = useCallback(async () => {
    const text = newTodoText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      setNewTodoText("");
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    } finally {
      setSubmitting(false);
    }
  }, [newTodoText, fetchTodos]);

  const handleToggle = useCallback(
    async (file: string, markCompleted: boolean) => {
      try {
        const res = await fetch("/api/todos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, completed: markCompleted }),
        });
        if (!res.ok) throw new Error("Failed to update todo");
        await fetchTodos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update todo");
      }
    },
    [fetchTodos]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
          Todos
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {pending.length} pending
        </span>
      </div>

      {/* Add todo form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !submitting) handleAddTodo();
          }}
          placeholder="Add a new todo..."
          className="flex-1 rounded-sm border border-border bg-card px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddTodo}
          disabled={submitting || !newTodoText.trim()}
          className={cn(
            "rounded-sm bg-accent px-4 py-2 font-mono text-xs font-semibold text-foreground transition-colors",
            "hover:bg-accent-glow disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          Add
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-sm border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-sm bg-card px-4 py-3">
              <div className="h-4 w-4 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded-sm bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Pending todos */}
      {!loading && (
        <div className="space-y-1">
          {pending.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No pending todos
            </p>
          ) : (
            pending.map((todo) => (
              <button
                key={todo.file}
                type="button"
                onClick={() => handleToggle(todo.file, true)}
                className="group flex w-full items-center gap-3 rounded-sm px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
              >
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-muted-foreground transition-colors group-hover:border-accent">
                  {/* empty checkbox */}
                </span>
                <span className="text-sm text-foreground">{todo.text}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Completed section (collapsed by default) */}
      {!loading && completed.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex w-full items-center gap-2 text-left"
          >
            <svg
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform",
                showCompleted && "rotate-90"
              )}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M4 2l5 4-5 4z" />
            </svg>
            <span className="font-mono text-xs text-muted-foreground">
              Completed ({completed.length})
            </span>
          </button>

          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completed.map((todo) => (
                <button
                  key={todo.file}
                  type="button"
                  onClick={() => handleToggle(todo.file, false)}
                  className="group flex w-full items-center gap-3 rounded-sm px-4 py-2 text-left transition-colors hover:bg-card-hover"
                >
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-success bg-success/20">
                    <svg
                      className="h-3 w-3 text-success"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {todo.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
