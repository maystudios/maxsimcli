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

      if (!roadmapRes.ok) {
        throw new Error(`Roadmap fetch failed: ${roadmapRes.status}`);
      }
      if (!stateRes.ok) {
        throw new Error(`State fetch failed: ${stateRes.status}`);
      }
      if (!todosRes.ok) {
        throw new Error(`Todos fetch failed: ${todosRes.status}`);
      }

      const [roadmapData, stateData, todosData] = await Promise.all([
        roadmapRes.json() as Promise<RoadmapAnalysis>,
        stateRes.json() as Promise<ParsedState>,
        todosRes.json() as Promise<{ pending: TodoItem[]; completed: TodoItem[] }>,
      ]);

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
