import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import type { TodoItem, ParsedState } from "@/lib/types";
import type { RoadmapAnalysis } from "@maxsim/core";

interface DashboardData {
  roadmap: RoadmapAnalysis | null;
  state: ParsedState | null;
  todos: { pending: TodoItem[]; completed: TodoItem[] } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook that fetches roadmap, state, and todos data from the dashboard API.
 *
 * Refetches automatically when WebSocket `lastChange` timestamp updates,
 * keeping the dashboard in sync with file system changes.
 */
export function useDashboardData(): DashboardData {
  const { lastChange } = useWebSocket();

  const [roadmap, setRoadmap] = useState<RoadmapAnalysis | null>(null);
  const [state, setState] = useState<ParsedState | null>(null);
  const [todos, setTodos] = useState<{ pending: TodoItem[]; completed: TodoItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);

      const [roadmapRes, stateRes, todosRes] = await Promise.all([
        fetch("/api/roadmap"),
        fetch("/api/state"),
        fetch("/api/todos"),
      ]);

      // 404 means the file doesn't exist yet (fresh project) — treat as null, not an error
      if (!roadmapRes.ok && roadmapRes.status !== 404) {
        throw new Error(`Roadmap fetch failed: ${roadmapRes.status}`);
      }
      if (!stateRes.ok && stateRes.status !== 404) {
        throw new Error(`State fetch failed: ${stateRes.status}`);
      }
      if (!todosRes.ok) {
        throw new Error(`Todos fetch failed: ${todosRes.status}`);
      }

      const roadmapData = roadmapRes.ok ? await roadmapRes.json() as RoadmapAnalysis : null;
      const stateData = stateRes.ok ? await stateRes.json() as ParsedState : null;
      const todosData = todosRes.ok
        ? await todosRes.json() as { pending: TodoItem[]; completed: TodoItem[] }
        : { pending: [], completed: [] };

      setRoadmap(roadmapData);
      setState(stateData);
      setTodos(todosData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(message);
      console.error("[use-dashboard-data]", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (lastChange > 0) {
      fetchAll();
    }
  }, [lastChange, fetchAll]);

  return { roadmap, state, todos, loading, error };
}
