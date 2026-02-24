"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/app/components/providers/websocket-provider";
import type { PlanFile } from "@/lib/types";

interface PhaseDetailData {
  plans: PlanFile[];
  context: string | null;
  research: string | null;
}

interface UsePhaseDetailResult {
  plans: PlanFile[];
  context: string | null;
  research: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook that fetches phase detail and individual plan contents.
 * Re-fetches automatically when files change (via WebSocket lastChange signal).
 */
export function usePhaseDetail(phaseId: string | null): UsePhaseDetailResult {
  const [data, setData] = useState<PhaseDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lastChange } = useWebSocket();

  const fetchPhaseDetail = useCallback(async () => {
    if (!phaseId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/phase/${encodeURIComponent(phaseId)}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ||
            `Failed to fetch phase ${phaseId} (${response.status})`
        );
      }

      const result = (await response.json()) as PhaseDetailData;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [phaseId]);

  // Initial fetch and refetch on phaseId change
  useEffect(() => {
    fetchPhaseDetail();
  }, [fetchPhaseDetail]);

  // Re-fetch when files change via WebSocket
  useEffect(() => {
    if (lastChange > 0) {
      fetchPhaseDetail();
    }
  }, [lastChange, fetchPhaseDetail]);

  return {
    plans: data?.plans ?? [],
    context: data?.context ?? null,
    research: data?.research ?? null,
    loading,
    error,
    refetch: fetchPhaseDetail,
  };
}
