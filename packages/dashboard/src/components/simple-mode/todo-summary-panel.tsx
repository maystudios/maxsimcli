import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/lib/types";

export function TodoSummaryPanel() {
  const { lastChange } = useWebSocket();
  const [pending, setPending] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) return;
      const data = (await res.json()) as { pending: TodoItem[]; completed: TodoItem[] };
      setPending(data.pending);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    if (lastChange > 0) fetchTodos();
  }, [lastChange, fetchTodos]);

  const handleToggle = useCallback(
    async (file: string) => {
      try {
        await fetch("/api/todos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, completed: true }),
        });
        await fetchTodos();
      } catch {
        // silently ignore
      }
    },
    [fetchTodos]
  );

  if (loading) {
    return (
      <div className="border border-border bg-card p-4">
        <div className="h-3 w-20 animate-pulse bg-muted mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse bg-muted" />
          <div className="h-3 w-3/4 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Todos
        </span>
        <span
          className={cn(
            "text-xs font-mono tabular-nums",
            pending.length > 0 ? "text-warning" : "text-muted-foreground"
          )}
        >
          {pending.length} pending
        </span>
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground">No pending todos</p>
      ) : (
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {pending.slice(0, 8).map((todo) => (
            <button
              key={todo.file}
              type="button"
              onClick={() => handleToggle(todo.file)}
              className="group flex w-full items-center gap-2.5 py-1.5 text-left transition-colors hover:bg-card-hover"
            >
              <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center border border-muted-foreground/60 transition-colors group-hover:border-simple-accent" />
              <span className="text-xs text-foreground/90 truncate">
                {todo.text}
              </span>
            </button>
          ))}
          {pending.length > 8 && (
            <p className="text-[10px] text-muted-foreground pt-1">
              +{pending.length - 8} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
